# Onista: architecture & security design

A closed B2B wholesale platform: cafés place orders (a weekly delivery schedule or a one-off order) only
after signing in to an account created by an admin. There is no public checkout and no self-service
sign-up. Same-day delivery is never offered — every delivery date is validated server-side against
storewide scheduling rules.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Cache Components, `proxy.ts`) |
| Database | PostgreSQL + Prisma 7 (`prisma-client` generator, `@prisma/adapter-pg`) |
| Auth | Auth.js / NextAuth v5 (Credentials, JWT sessions) + database-backed checks in a data-access layer |
| Validation | Zod 4 (shared by client forms and server) |
| i18n | next-intl 4: `/ar` (RTL, default) and `/en` (LTR) for the storefront; `/admin` and `/account` follow a cookie (no URL prefix) |
| Styling | Tailwind CSS 4, class-based dark mode (`next-themes`) |
| Rate limiting | Upstash Redis sliding window (in-memory fallback for dev) |

## The three areas

1. **Storefront** (`/[locale]`) — public, statically prerendered per locale. Shows the catalog and the
   "request a tasting box" lead-gen form (`TastingRequest`, unauthenticated). No cart, no checkout: the
   only calls to action are "sign in to order" (→ `/account`) and the tasting request.
2. **Café partner portal** (`/account`) — role `CAFE`. Accounts are created exclusively by an admin
   (`createCafeAccount`); there is no sign-up route. A café can:
   - build a **weekly schedule**: up to 7 dated deliveries in one `Order` (`type: WEEKLY_SCHEDULE`),
     paid for as a single order at checkout;
   - place a **one-off order**: a single dated delivery (`type: ONE_OFF`);
   - manage its saved delivery addresses (`CafeAddress`).
   Every delivery date must satisfy `src/server/scheduling.ts` (see below). First sign-in with an
   admin-issued password forces a password change (`mustChangePassword`) before anything else.
3. **Admin back office** (`/admin`) — roles `ADMIN` (full) and `STAFF` (operations, no account/settings
   admin). Manages the catalog, café accounts ("Clients"), orders/deliveries (status per delivery day),
   tasting-request leads (with a one-click "create partner account" that prefills the client form), and
   the scheduling rules themselves (`/admin/settings`).

Both `/admin` and `/account` are **not locale-prefixed**; visiting either as the wrong kind of account (or
signed out) returns a redirect to that area's own login page, or a plain 404 if signed in as the wrong
role — neither area acknowledges the other exists. The public storefront carries no link to `/admin`
anywhere; its only account entry point is the café portal.

## Data model (see `prisma/schema.prisma`)

- **Money** is stored as integer halalas (1 SAR = 100 halalas).
- **`User`**: `ADMIN`/`STAFF` sign in with e-mail; `CAFE` accounts sign in with a phone number (exactly one
  identifier per role, enforced by a CHECK constraint). `sessionVersion` revokes every JWT on password
  reset or deactivation; `mustChangePassword` forces the first-login password change.
- **`CafeProfile`** (1:1 with a `CAFE` user) holds the business details; **`CafeAddress`** holds its saved
  delivery addresses.
- **`Order` → `Delivery` → `DeliveryItem`**: an order is one payment covering one or more dated
  deliveries. `Delivery.deliveryDate` always lands in the future (CHECK constraint, backed up by
  server-side validation). Line items snapshot title and price so catalog edits never rewrite history.
- **`SchedulingSettings`** (single row) and **`BlackoutDate`** hold the rules an admin tunes: the daily
  order cut-off hour, minimum lead time (never 0 — no same-day delivery), how far ahead scheduling is
  allowed, which weekdays deliver, the per-delivery-day fee, and dates the kitchen is closed.
- **`TastingRequest`**: the only public write. A lead an admin can convert into a `CafeProfile`.

## No-same-day-delivery, precisely

`src/server/scheduling.ts` is the single source of truth:

- `earliestAllowedDate()`: today + `minLeadDays`, pushed one more day if the current Riyadh hour is past
  `cutoffHour`, then rolled forward over non-delivery weekdays and blackout dates.
- `isDateAllowed(date)`: re-run by `src/server/order-builder.ts` for every delivery date in every order,
  on the server — never trusted from the client, which only uses the same rules to render the date picker.
- A CHECK constraint on `Delivery` (`deliveryDate > createdAt::date`) is a second line of defence at the
  database level.

## Security model (unchanged principles from the original review)

- **Defence in depth on `/admin` and `/account`:** the proxy does an optimistic cookie-only check (no DB);
  every layout, query and Server Action in each area re-checks against the database
  (`requireStaffPage` / `requireCafePage`, `guardStaffAction` / `guardCafeAction`), so a proxy bypass
  grants nothing.
- **Closed accounts:** no sign-up endpoint exists for `CAFE`. Every account is created by an `ADMIN`
  (`guardStaffAction('ADMIN')`), with a temporary password the admin hands over out of band.
- **Input validation:** every Server Action parses `unknown` input with Zod (`lib/validation/*`); text is
  sanitised (control/bidi-override stripping, length limits); phone numbers are normalised to E.164.
- **Rate limiting:** login (per IP+identifier and per IP), order placement (per café), and general
  mutations (per user) — see `server/security/rate-limit.ts`.
- **Audit log:** every privileged mutation (account creation, password reset, price change, status
  update, scheduling-rule change) is recorded in `AuditLog`.
- **Static CSP** and standard security headers (`next.config.ts`); admin/account responses are
  `Cache-Control: private, no-store` and `X-Robots-Tag: noindex`.

## Open items for a production launch

1. **Password policy** was relaxed for the preview phase (see `TODO(before launch)` in
   `lib/validation/auth.ts`, `lib/validation/cafe.ts`, `prisma/seed.ts`) — restore the 12+/3-class rule.
2. **Payment** is simulated: orders are created already `PAID`/`CONFIRMED`. Wire a real gateway
   (Moyasar/Tap) before launch; the schema has `paymentMethod`/`paymentStatus`/`paidAt` ready.
3. **Saved-template reuse** ("repeat last week's schedule") is not built — cafés rebuild the week each
   time from scratch. Would use the same `order-builder.ts` with a template's items pre-filled.
4. **Admin 2FA (TOTP)** recommended before launch.
