'use client'

import { useState } from 'react'
import Image from 'next/image'
import { LogoMark } from './logo'

/**
 * next/image (served from our own origin, so the CSP stays img-src 'self')
 * that fades in on load and falls back to a branded placeholder on error.
 */
export default function SmartImage({
  src,
  alt,
  className = '',
  sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  priority = false,
}: {
  src?: string | null
  alt: string
  className?: string
  sizes?: string
  priority?: boolean
}) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(src ? 'loading' : 'error')

  return (
    <div className={`relative overflow-hidden bg-ink-3 ${className}`}>
      {src && status !== 'error' && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className={`object-cover transition duration-700 ${status === 'loaded' ? 'scale-100 opacity-100' : 'scale-105 opacity-0'}`}
        />
      )}
      {status !== 'loaded' && (
        <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(224,51,127,0.22),transparent_60%)]">
          <LogoMark className={`h-1/3 w-auto text-rose-500/40 ${status === 'loading' ? 'animate-pulse' : ''}`} />
        </div>
      )}
    </div>
  )
}
