import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  // Read lazily: `prisma generate` (run on every `npm install`) must work
  // without a database URL; migrate/seed fail clearly if it is missing.
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
})
