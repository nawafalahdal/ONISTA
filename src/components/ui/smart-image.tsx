'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { LogoMark } from './logo'

/**
 * next/image (served from our own origin, so the CSP stays img-src 'self')
 * that fades in on load and falls back to a deliberate dark placeholder — a
 * luxury "coming soon" treatment, never a broken image or stock photo.
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
  const t = useTranslations('Common')
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
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_30%_20%,rgba(224,51,127,0.16),transparent_60%)]">
          <LogoMark className={`h-1/4 w-auto text-rose-500/40 ${status === 'loading' ? 'animate-pulse' : ''}`} />
          {status === 'error' && <span className="px-2 text-center text-[10px] tracking-[0.15em] text-cream/40 uppercase">{t('imageComingSoon')}</span>}
        </div>
      )}
    </div>
  )
}
