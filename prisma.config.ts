import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  // Used by the CLI only (migrate, seed, studio). Migrations take a Postgres
  // advisory lock, which is unreliable through a connection pooler, so prefer
  // the direct connection Neon exposes as DATABASE_URL_UNPOOLED. The app
  // itself keeps using the pooled DATABASE_URL (src/server/db.ts).
  // Read lazily: `prisma generate` (run on every install) needs no URL.
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || '',
  },
})
