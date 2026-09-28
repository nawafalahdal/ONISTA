'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const t = useTranslations('Nav')
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const dark = !mounted || resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? t('themeLight') : t('themeDark')}
      title={dark ? t('themeLight') : t('themeDark')}
      className={`grid h-10 w-10 place-items-center rounded-full border border-line transition hover:border-rose-500/60 ${className}`}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
