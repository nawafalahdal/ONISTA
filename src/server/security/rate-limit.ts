import 'server-only'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { env } from '@/env'

type Policy = { limit: number; windowSeconds: number }

/** Central policy table: tune limits in one place. */
export const RATE_LIMITS = {
  /** Per IP + e-mail: slows credential stuffing against a single account. */
  login: { limit: 5, windowSeconds: 15 * 60 },
  /** Per IP: caps login attempts spread across many accounts. */
  loginIp: { limit: 20, windowSeconds: 15 * 60 },
  /** Public B2B form. Per IP counts every attempt (checked before
   *  validation); per phone counts only valid submissions. */
  tastingRequest: { limit: 10, windowSeconds: 60 * 60 },
  tastingRequestPhone: { limit: 2, windowSeconds: 24 * 60 * 60 },
  /** Public checkout, per IP. */
  placeOrder: { limit: 10, windowSeconds: 60 * 60 },
  /** Authenticated staff mutations, per user. */
  adminMutation: { limit: 120, windowSeconds: 60 },
} satisfies Record<string, Policy>

export type RateLimitPolicy = keyof typeof RATE_LIMITS
export type RateLimitResult = { success: boolean; remaining: number; resetAt: number }

// ── Distributed limiter (production): Upstash Redis sliding window ──────────
const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN })
    : null

const upstashLimiters = new Map<RateLimitPolicy, Ratelimit>()
function upstashLimiter(policy: RateLimitPolicy) {
  let limiter = upstashLimiters.get(policy)
  if (!limiter && redis) {
    const { limit, windowSeconds } = RATE_LIMITS[policy]
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: `onista:rl:${policy}`,
    })
    upstashLimiters.set(policy, limiter)
  }
  return limiter
}

// ── Fallback limiter (dev / single instance): in-memory sliding log ─────────
const memory = new Map<string, number[]>()
const MAX_MEMORY_KEYS = 10_000

function memoryLimit(policy: RateLimitPolicy, key: string): RateLimitResult {
  const { limit, windowSeconds } = RATE_LIMITS[policy]
  const now = Date.now()
  const windowStart = now - windowSeconds * 1000
  const bucketKey = `${policy}:${key}`
  const hits = (memory.get(bucketKey) ?? []).filter((t) => t > windowStart)

  if (!memory.has(bucketKey) && memory.size >= MAX_MEMORY_KEYS) {
    // Bound memory under attack: evict the oldest bucket.
    const oldest = memory.keys().next().value
    if (oldest) memory.delete(oldest)
  }

  const success = hits.length < limit
  if (success) hits.push(now)
  memory.set(bucketKey, hits)
  return { success, remaining: Math.max(0, limit - hits.length), resetAt: (hits[0] ?? now) + windowSeconds * 1000 }
}

/**
 * Consume one token for `key` under `policy`. Fails closed: if the limiter
 * backend errors, the request is rejected rather than let through unlimited.
 */
export async function rateLimit(policy: RateLimitPolicy, key: string): Promise<RateLimitResult> {
  const limiter = upstashLimiter(policy)
  if (!limiter) return memoryLimit(policy, key)
  try {
    const r = await limiter.limit(key)
    return { success: r.success, remaining: r.remaining, resetAt: r.reset }
  } catch (error) {
    console.error('[rate-limit] backend error, failing closed', error)
    return { success: false, remaining: 0, resetAt: Date.now() + 60_000 }
  }
}
