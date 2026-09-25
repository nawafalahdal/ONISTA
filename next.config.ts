import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import { IMAGE_HOSTS } from './src/config/security'

const isDev = process.env.NODE_ENV === 'development'

/**
 * Static Content Security Policy, the Next.js-recommended variant without
 * nonces. It keeps pages statically renderable and cacheable. Because the
 * policy is static, inline scripts (Next.js bootstrap, theme script) need
 * 'unsafe-inline'; the other directives still block third-party script
 * origins, plugins, framing, <base> hijacking and off-site form posts.
 * Images go through next/image (served from 'self'), fonts via next/font.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'", // Framer Motion writes inline styles
  "img-src 'self' blob: data:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? ' ws:' : ''}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(self)' },
]

const nextConfig: NextConfig = {
  cacheComponents: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: IMAGE_HOSTS.map((hostname) => ({ protocol: 'https' as const, hostname })),
  },
  experimental: {
    serverActions: {
      // Small payloads only; image uploads will go direct-to-storage.
      bodySizeLimit: '256kb',
    },
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        source: '/admin/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ]
  },
}

export default createNextIntlPlugin('./src/i18n/request.ts')(nextConfig)
