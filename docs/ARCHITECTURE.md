# Onista: architecture & security design

Status: **backend foundation for review.** Schema, security layer and Server Actions are implemented and
tested; UI routes are placeholders until the architecture is approved. The original Vite prototype lives in
`prototype/` and is the design source for the UI phase.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Cache Components, `proxy.ts`) |
| Database | PostgreSQL + Prisma 7 (`prisma-client` generator, `@prisma/adapter-pg`) |
| Auth | Auth.js / NextAuth v5 (Credentials, JWT sessions) + database-backed checks in a data-access layer |
| Validation | Zod 4 (shared by client forms and server) |
| i18n | next-intl 4: `/ar` (RTL, default) and `/en` (LTR) |
| Styling | Tailwind CSS 4, class-based dark mode (`next-themes`) |
| Rate limiting | Upstash Redis sliding window (in-memory fallback for dev) |

## Directory structure

```
prisma/
  schema.prisma              models, enums, indexes
  migrations/                SQL migrations (+ CHECK constraints)
  seed.ts                    categories, products (ar/en), first admin from env
prisma.config.ts             Prisma 7 config (datasource URL, seed)
next.config.ts               static CSP + security headers, images, next-intl plugin
src/
  proxy.ts                   locale routing + optimistic /admin gate + Origin enforcement
  env.ts                     Zod-validated environment (fails fast at boot)
  app/
    [locale]/                STOREFRONT (statically prerendered per locale)
      layout.tsx             <html lang dir>, providers
      page.tsx               home: hero → about → catalog → café tasting
      checkout/  order/…     (UI phase)
    admin/                   BACK OFFICE, own root layouts, no shared bundle
      (auth)/login/          public: sign-in
      (dashboard)/           protected: root layout runs the DAL check first
        page.tsx             overview
        orders/ tasting-requests/ products/   (UI phase)
    api/auth/[...nextauth]/  Auth.js route handlers
  auth/
    config.ts                proxy-safe config (no DB imports)
    index.ts                 NextAuth instance + Credentials provider
    password.ts              bcrypt (cost 12) + timing-safe dummy compare
  config/security.ts         shared constants: roles, admin paths, image hosts, safe redirects
  i18n/                      routing.ts, request.ts, navigation.ts
  messages/                  ar.json, en.json
  lib/                       isomorphic, no secrets
    validation/              common.ts (sanitised text, phone, email), product.ts, tasting-request.ts, auth.ts
    action-result.ts         { ok, data } | { ok: false, error, fieldErrors } with i18n keys
    money.ts  whatsapp.ts
  server/                    server-only
    db.ts                    Prisma client singleton
    dal/session.ts           getSessionUser / requireStaffPage / getStaffUser
    dal/guard.ts             guardStaffAction: auth + role + per-user rate limit
    actions/                 'use server' modules ONLY (every export is an endpoint)
      products.ts  tasting-requests.ts  auth.ts
    queries/                 catalog.ts ('use cache' + tags), admin.ts (uncached, DAL-guarded)
    security/                rate-limit.ts, request.ts (client IP, HMAC hash), audit.ts
  components/                ui/, storefront/, admin/   (UI phase; ported from prototype/)
  styles/globals.css         Tailwind + dark variant
  types/next-auth.d.ts       Session/JWT augmentation
```

Rules that keep it clean:
- `lib/` is safe to import anywhere; `server/` starts with `import 'server-only'`.
- Only `server/actions/*` use `'use server'`. Helpers live in `server/dal` or `server/security`, because
  anything exported from a `'use server'` file becomes a publicly callable endpoint.
- Server Components read through `server/queries`; mutations go through `server/actions`.

## Data model highlights

- **Money** is stored as integer **halalas** (`priceHalalas`, `totalHalalas`), so there's no floating-point rounding.
- **Translations** live in `ProductTranslation` / `CategoryTranslation` keyed by `(entity, locale)`, so adding a language needs no migration.
- **History is immutable:** `OrderItem` and `TastingRequestItem` snapshot the title and price. Products are archived (`archivedAt`), never hard-deleted.
- **Totals are computed server-side** from database prices; the client never supplies a price.
- **Integrity at the DB level:** CHECK constraints (positive prices, quantity 1–50, delivery needs an address, lower-case email) back up Zod.
- **Audit:** `AuditLog` records every privileged mutation (actor, action, entity, hashed IP).

## Security model

### Admin separation & access control (defence in depth)
1. **Proxy (optimistic):** decodes the encrypted session cookie only (no DB, per Next.js guidance).
   - No session → 307 to `/admin/login?callbackUrl=…`.
   - Non-staff role → plain 404, so the admin area doesn't reveal it exists.
   - Admin responses get `Cache-Control: private, no-store` and `X-Robots-Tag: noindex`.
2. **DAL (authoritative):** `getSessionUser()` re-reads the user from the DB once per request.
   - It checks `isActive` and compares `sessionVersion` with the token, so bumping the version, deactivating or changing a role revokes a still-valid JWT immediately.
   - The dashboard root layout runs this before rendering any markup, and admin queries and actions run it again. Layouts don't re-run on client navigation, so the layout check alone isn't enough.
3. **Actions:** every privileged action starts with `guardStaffAction(minRole)` (STAFF vs ADMIN), then Zod, then Prisma, then the audit log.
4. **Roles:** `CUSTOMER` can never sign in at `/admin/login`. It gets the same generic error as a wrong password, so the admin login can't be used to probe customer accounts.

### Authentication hardening
- bcrypt cost 12. Passwords are capped at 128 characters to prevent bcrypt DoS.
- An unknown email still runs a dummy compare, so response timing doesn't reveal which accounts exist.
- Rate limits: 5 attempts per IP+email and 20 per IP per 15 min. Separately, the account locks for 15 min after 5 failures (catches IP rotation).
- JWT sessions last 8 h (sliding 30 min). The cookie is httpOnly and SameSite=Lax, and `__Secure-`/Secure over HTTPS.
- `callbackUrl` only accepts paths inside `/admin` (no open redirect).

### Input validation & injection
- Every action takes `unknown` and parses it with Zod. TypeScript types are not a trust boundary.
- Free text is sanitised:
  - NFC-normalised, with control characters, zero-width characters and bidi overrides stripped;
  - whitespace collapsed and `<`/`>` rejected;
  - lengths bounded, matching the DB column sizes.
- Phone numbers are normalised to E.164. Image URLs must be HTTPS from allow-listed hosts.
- **SQL injection:** all access goes through Prisma's parameterised queries. `$queryRawUnsafe` is banned; the tagged `$queryRaw` is fine if ever needed.
- **XSS:** React escapes all output, and user input is never rendered as HTML.
- Public-form IDs are re-verified in the DB. Tasting items must currently be in stock, on the tasting menu and not archived.

### Abuse protection (public forms)
- Honeypot field: bots get a fake success and nothing is stored.
- Rate limits: 10 per IP per hour (counted before validation) and 2 per phone per day (valid submissions only). The limiter fails closed if Redis errors.
- IPs are stored only as HMAC-SHA256 with a server secret.

### CSRF / Server Actions
- Next.js rejects cross-origin action calls by comparing the `Origin` and `Host` headers. It only *warns* when `Origin` is missing; the proxy returns 403 in that case.
- `serverActions.bodySizeLimit` is `256kb`.

### Headers (static CSP)
Next.js's recommended **static CSP (without nonces)** is set in `next.config.ts`. It keeps pages statically
prerenderable (the storefront is served from cache). The directives are:
`default-src 'self'`, `script-src 'self' 'unsafe-inline'`, `style-src 'self' 'unsafe-inline'`,
`img-src 'self' blob: data:`, `font-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`,
`frame-ancestors 'none'` and `upgrade-insecure-requests`. Alongside it: HSTS (2 years, preload), `nosniff`,
`X-Frame-Options: DENY`, `Referrer-Policy`, `COOP: same-origin` and a restrictive `Permissions-Policy`.

Trade-off: a static policy needs `'unsafe-inline'` for scripts, because Next.js and the theme script use
inline bootstrap code. Removing it requires nonces, which force every page to render dynamically. Images go
through `next/image` and fonts through `next/font`, so no third-party origins are needed.

## Verified behaviour
Tested against a production build (`next build && next start`) on PostgreSQL 16:

| Scenario | Result |
| --- | --- |
| `/admin` without session | 307 to login with `callbackUrl` |
| Encoded, upper-case or `..` path tricks | never reach admin routes |
| Wrong password / unknown email / customer account | same generic `invalidCredentials` |
| `callbackUrl=https://evil.example` | lands on `/admin` |
| Anonymous call to `updateProductPrice` | `unauthorized` |
| STAFF calling ADMIN-only `archiveProduct` | `unauthorized` |
| `sessionVersion` bump / deactivation with a valid JWT | sent to login, no admin data in response |
| Negative price / `x' OR 1=1 --` as ID | Zod `validation` error |
| Action POST without `Origin` | 403 |
| Tasting: `<script>` name, bad phone, tampered product ID | rejected with field errors |
| Tasting: bidi override + NUL byte in input | stripped before storage |
| Honeypot / repeated submissions | fake success / `rateLimited` |
| Price edit → public page | new price visible immediately (`updateTag`) |

## Open decisions for the UI phase
1. **Default locale:** Arabic at `/ar` (current), or no prefix for Arabic?
2. **Customer accounts:** guest checkout only (current), or customer sign-in? The schema already supports `Role.CUSTOMER` and `Order.userId`.
3. **Image storage:** Cloudinary or S3 for admin uploads (sets `IMAGE_HOSTS`).
4. **Payments:** Moyasar / Tap / HyperPay (`paymentStatus` is ready for webhooks).
5. **Admin 2FA (TOTP):** recommended before launch.
