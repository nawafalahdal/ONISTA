# ONISTA: Cake Shop

Full-stack Next.js application for Onista Cake Shop: a bilingual (Arabic/English) storefront, B2B café
tasting requests, and a protected admin dashboard.

> **Status:** backend foundation (schema, security layer, Server Actions) is in place and tested.
> The UI is being ported from the design prototype in [`prototype/`](prototype/) after architecture sign-off.
> See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for the structure and security model.

## Getting started

```bash
cp .env.example .env          # fill in DATABASE_URL, AUTH_SECRET, IP_HASH_SECRET, …
npm install                   # also generates the Prisma client
npm run db:migrate            # apply migrations
npm run db:seed               # catalog + first admin (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD)
npm run dev                   # http://localhost:3000/ar · /en · /admin
```

| Script | |
| --- | --- |
| `npm run build` / `start` | production build / server |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run db:deploy` | apply migrations in production |
| `npm run db:studio` | Prisma Studio |

The original Vite prototype still runs: `cd prototype && npm install && npm run dev`.
