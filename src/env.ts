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

  // Optional: distributed rate limiting. Required in production (multi-instance).
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

if (
  parsed.data.NODE_ENV === 'production' &&
  !(parsed.data.UPSTASH_REDIS_REST_URL && parsed.data.UPSTASH_REDIS_REST_TOKEN)
) {
  console.warn('⚠️  UPSTASH_REDIS_* not set: falling back to per-instance in-memory rate limiting.')
}

export const env = parsed.data
