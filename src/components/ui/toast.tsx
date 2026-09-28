'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

export type ToastMessage = { text: string; key: number } | null

export default function Toast({ message }: { message: ToastMessage }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message.key}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            className="flex items-center gap-3 rounded-full border border-line bg-ink-3/95 px-5 py-3 text-sm shadow-2xl backdrop-blur"
          >
            <CheckCircle2 size={18} className="text-rose-500" />
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
