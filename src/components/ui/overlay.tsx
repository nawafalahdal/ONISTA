'use client'

import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useDirection } from '@/hooks/use-direction'

function useOverlayBehaviour(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])
}

const Backdrop = ({ onClick }: { onClick: () => void }) => (
  <motion.div
    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClick}
  />
)

export function CloseButton({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  const t = useTranslations('Common')
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('close')}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-muted transition hover:border-rose-500/60 hover:text-cream ${className}`}
    >
      <X size={16} />
    </button>
  )
}

export function Modal({
  open,
  onClose,
  children,
  className = '',
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}) {
  useOverlayBehaviour(open, onClose)
  return (
    <AnimatePresence>
      {open && (
        <>
          <Backdrop onClick={onClose} />
          <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className={`no-scrollbar pointer-events-auto relative max-h-[92vh] w-full overflow-y-auto rounded-3xl border border-line bg-ink-2 shadow-2xl ${className}`}
            >
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

/** Side panel that slides in from the inline end (right in LTR, left in RTL). */
export function Drawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useOverlayBehaviour(open, onClose)
  const { sign } = useDirection()
  return (
    <AnimatePresence>
      {open && (
        <>
          <Backdrop onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            initial={{ x: `${100 * sign}%` }}
            animate={{ x: 0 }}
            exit={{ x: `${100 * sign}%` }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed inset-y-0 end-0 z-50 flex w-full max-w-md flex-col border-s border-line bg-ink-2 shadow-2xl"
          >
            {children}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
