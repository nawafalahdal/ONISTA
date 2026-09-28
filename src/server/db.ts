import 'server-only'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'
import { env } from '@/env'

// Prisma 7 talks to Postgres through a driver adapter. All queries are
// parameterised by Prisma; raw SQL is only allowed via the tagged-template
// `$queryRaw` (never `$queryRawUnsafe`), which also parameterises values.
const createClient = () =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

// Reuse one client across hot reloads in development.
const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createClient> }

export const db = globalForPrisma.prisma ?? createClient()
if (env.NODE_ENV !== 'production') globalForPrisma.prisma = db
