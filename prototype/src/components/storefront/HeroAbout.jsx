import { useEffect, useId, useRef, useState } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowDown, ArrowRight, Coffee } from 'lucide-react'
import { INNER_ARCH, LogoMark } from '../ui/Logo.jsx'
import useMediaQuery from '../../lib/useMediaQuery.js'

const HERO_PHOTO =
  'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=900&q=80'

const STATS = [
  { value: '2019', label: 'Est. in Riyadh' },
  { value: '40+', label: 'Partner cafés' },
  { value: '72h', label: 'Slow-proofed dough' },
]

function usePreloadedImage(src) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const img = new Image()
    img.onload = () => setReady(true)
    img.src = src
    return () => (img.onload = null)
  }, [src])
  return ready
}

function useReveal(progress, start) {
  return {
    opacity: useTransform(progress, [start, start + 0.14], [0, 1]),
    y: useTransform(progress, [start, start + 0.14], [36, 0]),
  }
}

/**
 * Hero + "About the Bakery" share one tall scroll track with a sticky stage.
 * As the visitor scrolls, the Onista emblem travels downward (and, on desktop,
 * into the left column), its line-art cake dissolves into a real photograph,
 * and the About copy reveals beside it — so the logo becomes the About image.
 */
export default function HeroAbout({ onShop, onTasting }) {
  const trackRef = useRef(null)
  const clipId = useId()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const photoReady = usePreloadedImage(HERO_PHOTO)

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] })
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.35 })

  // Hero copy exits upward.
  const heroOpacity = useTransform(p, [0, 0.22], [1, 0])
  const heroY = useTransform(p, [0, 0.3], ['0vh', '-14vh'])
  const heroBlur = useTransform(p, [0, 0.22], ['blur(0px)', 'blur(8px)'])

  // Emblem translates down (and left on desktop) into the About layout.
  // (It sits still in the sticky viewport, so in page terms it travels down
  // the full scroll distance and lands inside the About section.)
  const emblemY = useTransform(p, [0, 0.6], isDesktop ? ['17vh', '3vh'] : ['16vh', '17vh'])
  const emblemX = useTransform(p, [0.1, 0.6], isDesktop ? ['0vw', '-22vw'] : ['0vw', '0vw'])
  const emblemScale = useTransform(p, [0, 0.6], isDesktop ? [1, 1.25] : [1, 0.8])
  const emblemRotate = useTransform(p, [0, 0.6], [0, -2])
  const emblemColor = useTransform(p, [0.35, 0.65], ['#e0337f', '#f4ece4'])

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

  return (
    <section ref={trackRef} id="about" className="relative h-[270vh]">
      <div className="grain sticky top-0 h-screen overflow-hidden">
        {/* ambient glows */}
        <motion.div
          style={{ scale: glowScale }}
          className="pointer-events-none absolute left-1/2 top-[55%] h-[70vmax] w-[70vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(200,16,110,0.22),transparent_62%)]"
        />
        <div className="pointer-events-none absolute -right-40 -top-40 h-[40vmax] w-[40vmax] rounded-full bg-[radial-gradient(circle,rgba(216,185,138,0.08),transparent_65%)]" />

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
            Onista · Cake Shop · Riyadh
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-4 max-w-4xl font-display text-[clamp(2.6rem,7.5vw,6.2rem)] font-medium leading-[0.95] tracking-tight"
          >
            Cakes worth <em className="font-normal text-rose-400">remembering.</em>
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-7 flex flex-wrap items-center justify-center gap-3"
          >
            <button onClick={onShop} className="btn-primary">
              Explore the collection <ArrowRight size={16} />
            </button>
            <button onClick={onTasting} className="btn-ghost">
              <Coffee size={16} /> <span dir="rtl">طلب تجربة للكافيه</span>
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
              >
                <defs>
                  <path id={`${clipId}-ring`} d="M150 150m-130 0a130 130 0 1 1 260 0a130 130 0 1 1 -260 0" />
                </defs>
                <text fontSize="11" letterSpacing="6" fill="currentColor" className="font-sans uppercase">
                  <textPath href={`#${clipId}-ring`}>
                    Handcrafted daily · Patisserie · Riyadh · مخبز أونيستا · Est. 2019 ·
                  </textPath>
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
                  <motion.rect x="30" y="30" width="140" height="176" fill="#1c181a" stroke="none" style={{ opacity: photoOpacity }} />
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
          className="absolute inset-x-0 top-[12vh] z-20 px-6 md:inset-y-0 md:left-auto md:right-[6vw] md:top-0 md:flex md:w-[46vw] md:max-w-xl md:items-center md:px-0"
        >
          <div>
            <motion.p style={a1} className="eyebrow flex items-center gap-3">
              About the bakery <span className="h-px w-8 bg-rose-400/50" /> <span dir="rtl">عن المخبز</span>
            </motion.p>
            <motion.h2
              style={a2}
              className="mt-4 font-display text-[clamp(2rem,4.4vw,3.6rem)] font-medium leading-[1.02]"
            >
              Baked slowly. <br className="hidden md:block" />
              <em className="text-rose-300">Finished by hand.</em>
            </motion.h2>
            <motion.p style={a3} className="mt-5 max-w-lg text-sm leading-relaxed text-muted md:text-base">
              Onista began as a single oven and a stubborn belief: that a cake should taste as good as it looks.
              Today our pastry team laminates, tempers and pipes every piece in-house, using French butter,
              single-origin chocolate and saffron sourced from the souq down the road.
            </motion.p>
            <motion.dl style={a4} className="mt-8 hidden grid-cols-3 gap-6 border-t border-line pt-6 sm:grid">
              {STATS.map((s) => (
                <div key={s.label}>
                  <dt className="font-display text-3xl text-cream">{s.value}</dt>
                  <dd className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted">{s.label}</dd>
                </div>
              ))}
            </motion.dl>
          </div>
        </motion.div>

        {/* scroll cue */}
        <motion.div
          style={{ opacity: cueOpacity }}
          className="absolute inset-x-0 bottom-6 z-20 flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted"
        >
          Scroll
          <motion.span animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>
            <ArrowDown size={14} />
          </motion.span>
        </motion.div>
      </div>
    </section>
  )
}
