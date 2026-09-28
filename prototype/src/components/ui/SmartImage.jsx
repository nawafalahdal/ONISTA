import { useState } from 'react'
import { LogoMark } from './Logo.jsx'

/** Image that fades in on load and falls back to a branded placeholder on error. */
export default function SmartImage({ src, alt, className = '' }) {
  const [status, setStatus] = useState(src ? 'loading' : 'error')

  return (
    <div className={`relative overflow-hidden bg-ink-3 ${className}`}>
      {status !== 'error' && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className={`h-full w-full object-cover transition duration-700 ${
            status === 'loaded' ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
          }`}
        />
      )}
      {status !== 'loaded' && (
        <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(224,51,127,0.25),transparent_60%),linear-gradient(135deg,#1c181a,#0c0a0b)]">
          <LogoMark className={`h-1/3 text-rose-500/40 ${status === 'loading' ? 'animate-pulse' : ''}`} />
        </div>
      )}
    </div>
  )
}
