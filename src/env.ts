import 'server-only'
import { z } from 'zod'

/**
 * Validated server environment. Importing this module fails fast at boot if a
 * required secret is missing or malformed, instead of failing on first use.
 * Never import from client components (`server-only` enforces this).
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.url().refine((u) => u.startsWith('postgres'), 'DATABASE_URL must be a PostgreSQL URL'),

  // NextAuth v5 reads AUTH_SECRET / AUTH_URL / AUTH_TRUST_HOST itself; we
  // validate the secret's strength here. Generate with `npx auth secret`.
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  // Canonical public URL. Auth.js rejects untrusted hosts in production unless
  // AUTH_URL is set (or AUTH_TRUST_HOST=true behind a trusted proxy/Vercel).
  AUTH_URL: z.url().optional(),

  // Salt for hashing client IPs before they are stored (audit / abuse logs).
  IP_HASH_SECRET: z.string().min(16),

  // Distributed rate limiting. Optional locally (a single process makes the
  // in-memory limiter accurate), REQUIRED in production: serverless runs many
  // instances, so an in-memory limiter is per-instance and an attacker
  // spreading requests across them is barely limited at all. That matters
  // most for the login route and the 6-digit proof-of-delivery code.
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  // Business WhatsApp number in international format without "+", e.g. 9665XXXXXXXX
  BUSINESS_WHATSAPP_NUMBER: z.string().regex(/^[1-9]\d{7,14}$/, 'Digits only, with country code'),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  console.error('❌ Invalid environment variables:', z.flattenError(parsed.error).fieldErrors)
  throw new Error('Invalid environment variables')
}

if (parsed.data.NODE_ENV === 'production' && !parsed.data.AUTH_URL && process.env.AUTH_TRUST_HOST !== 'true') {
  throw new Error('Set AUTH_URL (or AUTH_TRUST_HOST=true behind a trusted proxy) in production')
}

// Refuse to run rather than silently degrade: a rate limiter that quietly
// stops limiting is worse than one that refuses to start.
//
// Keyed off VERCEL_ENV, not NODE_ENV: `next build` always sets NODE_ENV to
// production, so using that would demand live Redis credentials just to
// compile on a laptop. VERCEL_ENV is set only on a real deployment, which is
// where a per-instance limiter is actually dangerous. scripts/check-env.mjs
// enforces the same pair for every Vercel build, preview included.
if (
  process.env.VERCEL_ENV === 'production' &&
  !(parsed.data.UPSTASH_REDIS_REST_URL && parsed.data.UPSTASH_REDIS_REST_TOKEN)
) {
  throw new Error(
    'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production. ' +
      'Without them rate limiting is per-instance, which on serverless leaves login and ' +
      'the delivery confirmation code effectively unprotected.',
  )
}

export const env = parsed.data
