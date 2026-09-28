import 'server-only'
import { createHmac } from 'node:crypto'
import { headers } from 'next/headers'
import { env } from '@/env'

/**
 * Best-effort client IP. Relies on the deployment's edge (Vercel, Cloudflare,
 * nginx) overwriting these headers; never expose the app server directly or a
 * client could spoof them to dodge rate limits.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers()
  const ip =
    h.get('x-real-ip')?.trim() ||
    h.get('cf-connecting-ip')?.trim() ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim()
  return ip && ip.length <= 45 ? ip : 'unknown'
}

/** Keyed hash so stored IPs can be correlated for abuse but not reversed. */
export const hashIp = (ip: string) => createHmac('sha256', env.IP_HASH_SECRET).update(ip).digest('hex')
