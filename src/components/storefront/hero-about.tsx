'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { getImageProps } from 'next/image'
import { motion, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion'
import { ArrowDown, ArrowRight, ArrowLeft, Coffee } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import { INNER_ARCH, LogoMark } from '@/components/ui/logo'
import { useDirection } from '@/hooks/use-direction'
import { useMediaQuery } from '@/hooks/use-media-query'

// Served through /_next/image so the CSP can keep img-src 'self'.
const HERO_PHOTO = getImageProps({
  src: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=900&q=80',
  alt: '',
  width: 640,
  height: 800,
}).props.src

function usePreloadedImage(src: string) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const img = new Image()
    img.onload = () => setReady(true)
    img.src = src
    return () => {
      img.onload = null
    }
  }, [src])
  return ready
}

function useReveal(progress: MotionValue<number>, start: number) {
  return {
    opacity: useTransform(progress, [start, start + 0.14], [0, 1]),
    y: useTransform(progress, [start, start + 0.14], [36, 0]),
  }
}

/**
 * Hero + "About the Bakery" share one tall scroll track with a sticky stage.
 * As the visitor scrolls, the Onista emblem travels downward (and, on desktop,
 * sideways into its column), its line-art cake dissolves into a real
 * photograph, and the About copy reveals beside it — so the logo becomes the
 * About image. Horizontal motion is mirrored for right-to-left layouts.
 */
export default function HeroAbout({ onShop, onTasting }: { onShop: () => void; onTasting: () => void }) {
  const t = useTranslations('Hero')
  const ta = useTranslations('About')
  const { rtl, sign } = useDirection()
  const { resolvedTheme } = useTheme()
  const trackRef = useRef<HTMLElement>(null)
  const clipId = useId()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const photoReady = usePreloadedImage(HERO_PHOTO)
  const textColor = resolvedTheme === 'light' ? '#1d1518' : '#f4ece4'

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] })
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.35 })

  // Hero copy exits upward.
  const heroOpacity = useTransform(p, [0, 0.22], [1, 0])
  const heroY = useTransform(p, [0, 0.3], ['0vh', '-14vh'])
  const heroBlur = useTransform(p, [0, 0.22], ['blur(0px)', 'blur(8px)'])

  // Emblem translates down (and sideways on desktop) into the About layout.
  // (It sits still in the sticky viewport, so in page terms it travels down
  // the full scroll distance and lands inside the About section.)
  const emblemY = useTransform(p, [0, 0.6], isDesktop ? ['17vh', '3vh'] : ['16vh', '17vh'])
  const emblemX = useTransform(p, [0.1, 0.6], isDesktop ? ['0vw', `${-22 * sign}vw`] : ['0vw', '0vw'])
  const emblemScale = useTransform(p, [0, 0.6], isDesktop ? [1, 1.25] : [1, 0.8])
  const emblemRotate = useTransform(p, [0, 0.6], [0, -2 * sign])
  const emblemColor = useTransform(p, [0.35, 0.65], ['#e0337f', textColor])

  // Line-art interior dissolves; photograph fades in inside the arch. If the
  // photo can't load, the illustration simply stays.
  const interiorOpacity = useTransform(p, [0.3, 0.55], photoReady ? [1, 0] : [1, 1])
  const photoOpacity = useTransform(p, [0.35, 0.62], photoReady ? [0, 1] : [0, 0])
  const photoScale = useTransform(p, [0.35, 1], [1.25, 1])
  const ringOpacity = useTransform(p, [0, 0.25], [1, 0])
  const glowScale = useTransform(p, [0, 1], [1, 1.6])

  // About copy reveals in sequence.
  const a1 = useReveal(p, 0.46)
  const a2 = useReveal(p, 0.52)
  const a3 = useReveal(p, 0.58)
  const a4 = useReveal(p, 0.64)
  const aboutPointer = useTransform(p, (v) => (v > 0.5 ? 'auto' : 'none'))
  const cueOpacity = useTransform(p, [0, 0.08], [1, 0])

  const stats = [
    { value: '2019', label: ta('statEst') },
    { value: '40+', label: ta('statCafes') },
    { value: '72h', label: ta('statDough') },
  ]
  const Arrow = rtl ? ArrowLeft : ArrowRight

  return (
    <section ref={trackRef} id="about" className="relative h-[270vh]">
      <div className="grain sticky top-0 h-screen overflow-hidden">
        {/* ambient glows */}
        <motion.div
          style={{ scale: glowScale }}
          className="pointer-events-none absolute left-1/2 top-[55%] h-[70vmax] w-[70vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--c-glow),transparent_62%)]"
        />
        <div className="pointer-events-none absolute -end-40 -top-40 h-[40vmax] w-[40vmax] rounded-full bg-[radial-gradient(circle,rgba(216,185,138,0.1),transparent_65%)]" />

        {/* hero copy */}
        <motion.div
          style={{ opacity: heroOpacity, y: heroY, filter: heroBlur }}
          className="absolute inset-x-0 top-[13vh] z-20 px-5 text-center md:top-[14vh]"
        >
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="eyebrow"
          >
            {t('eyebrow')}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className={`mx-auto mt-4 max-w-4xl font-display font-medium tracking-tight ${
              rtl ? 'text-[clamp(2.3rem,6.5vw,5.2rem)] leading-[1.2]' : 'text-[clamp(2.6rem,7.5vw,6.2rem)] leading-[0.95]'
            }`}
          >
            {t('titleA')} <em className="font-normal text-rose-500 dark:text-rose-400">{t('titleB')}</em>
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-7 flex flex-wrap items-center justify-center gap-3"
          >
            <button type="button" onClick={onShop} className="btn-primary">
              {t('explore')} <Arrow size={16} />
            </button>
            <button type="button" onClick={onTasting} className="btn-ghost">
              <Coffee size={16} /> {t('tasting')}
            </button>
          </motion.div>
        </motion.div>

        {/* the travelling emblem */}
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              style={{ x: emblemX, y: emblemY, scale: emblemScale, rotate: emblemRotate, color: emblemColor }}
              className="relative"
            >
              {/* orbiting type ring */}
              <motion.svg
                style={{ opacity: ringOpacity }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 40, ease: 'linear' }}
                viewBox="0 0 300 300"
                className="absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 text-rose-400/50"
                aria-hidden="true"
              >
                <defs>
                  <path id={`${clipId}-ring`} d="M150 150m-130 0a130 130 0 1 1 260 0a130 130 0 1 1 -260 0" />
                </defs>
                <text
                  fontSize={rtl ? 13 : 11}
                  letterSpacing={rtl ? 0 : 6}
                  fill="currentColor"
                  className={rtl ? 'font-arabic' : 'font-sans uppercase'}
                >
                  <textPath href={`#${clipId}-ring`}>{t('ring')}</textPath>
                </text>
              </motion.svg>

              <LogoMark
                className="relative h-[34vh] max-h-[380px] min-h-[220px] w-auto drop-shadow-[0_0_40px_rgba(224,51,127,0.35)]"
                strokeWidth={2}
                interiorStyle={{ opacity: interiorOpacity }}
              >
                <defs>
                  <clipPath id={`${clipId}-arch`}>
                    <path d={INNER_ARCH} />
                  </clipPath>
                </defs>
                <g clipPath={`url(#${clipId}-arch)`}>
                  <motion.rect
                    x="30"
                    y="30"
                    width="140"
                    height="176"
                    stroke="none"
                    style={{ opacity: photoOpacity, fill: 'var(--c-ink-3)' }}
                  />
                  {photoReady && (
                    <motion.image
                      href={HERO_PHOTO}
                      x="30"
                      y="30"
                      width="140"
                      height="176"
                      preserveAspectRatio="xMidYMid slice"
                      style={{ opacity: photoOpacity, scale: photoScale, transformOrigin: '100px 118px' }}
                    />
                  )}
                </g>
              </LogoMark>
            </motion.div>
          </motion.div>
        </div>

        {/* about copy */}
        <motion.div
          style={{ pointerEvents: aboutPointer }}
          className="absolute inset-x-0 top-[12vh] z-20 px-6 md:inset-y-0 md:start-auto md:end-[6vw] md:top-0 md:flex md:w-[46vw] md:max-w-xl md:items-center md:px-0"
        >
          <div>
            <motion.p style={a1} className="eyebrow">
              {ta('eyebrow')}
            </motion.p>
            <motion.h2
              style={a2}
              className={`mt-4 font-display font-medium ${
                rtl ? 'text-[clamp(1.8rem,3.8vw,3rem)] leading-[1.3]' : 'text-[clamp(2rem,4.4vw,3.6rem)] leading-[1.02]'
              }`}
            >
              {ta('titleA')} <br className="hidden md:block" />
              <em className="text-rose-500 dark:text-rose-300">{ta('titleB')}</em>
            </motion.h2>
            <motion.p style={a3} className="mt-5 max-w-lg text-sm leading-relaxed text-muted md:text-base">
              {ta('body')}
            </motion.p>
            <motion.dl style={a4} className="mt-8 hidden grid-cols-3 gap-6 border-t border-line pt-6 sm:grid">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="font-display text-3xl text-cream" dir="ltr">
                    {s.value}
                  </dt>
                  <dd className="mt-1 text-[11px] tracking-[0.2em] text-muted uppercase">{s.label}</dd>
                </div>
              ))}
            </motion.dl>
          </div>
        </motion.div>

        {/* scroll cue */}
        <motion.div
          style={{ opacity: cueOpacity }}
          className="absolute inset-x-0 bottom-6 z-20 flex flex-col items-center gap-2 text-[10px] tracking-[0.3em] text-muted uppercase"
        >
          {t('scroll')}
          <motion.span animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>
            <ArrowDown size={14} />
          </motion.span>
        </motion.div>
      </div>
    </section>
  )
}
