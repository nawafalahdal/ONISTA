import { motion } from 'framer-motion'

/**
 * Vector redraw of the Onista Cake Shop mark: a double arch framing a
 * domed cake stand. Stroke uses currentColor so it can be tinted anywhere.
 *
 * `children` render inside the inner arch (beneath the line art) and
 * `interiorStyle` lets callers animate the cake/stand illustration, which the
 * hero uses to morph the mark into a photo.
 */
export const INNER_ARCH = 'M30 206V100a70 70 0 0 1 140 0v106z'

export function LogoMark({ className = '', strokeWidth = 2.4, interiorStyle, children, ...props }) {
  const kisses = [76, 84, 92, 100, 108, 116, 124]
  const scallops = Array.from({ length: 8 }, () => 'q6.25 6 12.5 0').join(' ')

  return (
    <svg
      viewBox="0 0 200 220"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* double arch frame */}
      <path d="M22 214V100a78 78 0 0 1 156 0v114z" />
      <path d={INNER_ARCH} />
      {children}
      <motion.g style={interiorStyle}>
        {/* glass dome + knob */}
        <path d="M58 150v-22a42 42 0 0 1 84 0v22" />
        <path d="M97 86v-5h6v5" />
        <ellipse cx="100" cy="75" rx="7" ry="5.5" />
        {/* cake */}
        <path d="M72 150v-38q0-4 4-4h48q4 0 4 4v38" />
        <path d="M72 118c4 0 4 10 8 10s4-8 8-8 4 12 8 12 4-12 8-12 4 7 8 7 4-7 8-7 4 9 8 9" />
        {kisses.map((x) => (
          <path key={x} d={`M${x - 3} 108q0-5 3-9q3 4 3 9z`} />
        ))}
        {/* stand */}
        <path d="M48 150h104v5H48z" />
        <path d={`M50 155 ${scallops}`} />
        <path d="M92 161l4 23h8l4-23M100 161v23M96 161l2 23M104 161l-2 23" strokeWidth={strokeWidth * 0.6} />
        <rect x="94" y="184" width="12" height="4" rx="2" />
        <path d="M95 188q-2 7-14 8.5q-3 3.5 2 3.5h34q5 0 2-3.5q-12-1.5-14-8.5" />
      </motion.g>
    </svg>
  )
}

export function Wordmark({ className = '', sub = true }) {
  return (
    <span className={`inline-flex flex-col items-center leading-none ${className}`}>
      <span className="font-display text-[1.35em] font-medium tracking-[0.18em]">ONISTA</span>
      {sub && <span className="mt-1 text-[0.42em] font-medium tracking-[0.42em] opacity-80">CAKE SHOP</span>}
    </span>
  )
}
