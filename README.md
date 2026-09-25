# ONISTA: Wholesale Patisserie for Cafés

Full-stack Next.js application for Onista: a closed B2B wholesale kitchen supplying signature cakes and
pastry to partner cafés on a fixed, no-same-day delivery schedule. Bilingual (Arabic/English) storefront,
a café partner portal, and a protected admin back office.

> See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for the structure and security model.
> The original Vite design prototype lives in [`prototype/`](prototype/).

## Getting started

```bash
cp .env.example .env          # fill in DATABASE_URL, AUTH_SECRET, IP_HASH_SECRET, …
npm install                   # also generates the Prisma client
npm run db:migrate            # apply migrations
npm run db:seed               # catalog + first admin (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD)
npm run dev                   # http://localhost:3000/ar · /en · /admin · /account
```

| Script | |
| --- | --- |
| `npm run build` / `start` | production build / server |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run db:deploy` | apply migrations in production |
| `npm run db:studio` | Prisma Studio |

## Three areas

- **Storefront** (`/ar`, `/en`) — public showcase: hero, catalog, "request a tasting box" lead form. No
  cart, no guest checkout — every order requires a café login.
- **Café partner portal** (`/account`) — closed: accounts are created only by an admin (Admin → Clients).
  A café builds a **weekly delivery schedule** (pick products per day, pay once for the week) or places a
  **one-off order**, always for a future date — same-day delivery is never offered.
- **Admin back office** (`/admin`) — orders/deliveries, tasting-request leads (with a one-click "create
  partner account"), the product catalog, café clients, and the scheduling rules (daily order cut-off,
  minimum lead time, delivery weekdays, blackout dates) that enforce "no same-day delivery" storewide.

The original Vite prototype still runs: `cd prototype && npm install && npm run dev`.
