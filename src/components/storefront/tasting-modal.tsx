'use client'

import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, Loader2, MessageCircle, Send } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import type { CatalogProduct } from '@/server/queries/catalog'
import { submitTastingRequest } from '@/server/actions/tasting-requests'
import { MAX_TASTING_ITEMS } from '@/lib/validation/tasting-request'
import { CloseButton, Modal } from '@/components/ui/overlay'
import SmartImage from '@/components/ui/smart-image'

const emptyForm = { cafeName: '', phone: '', city: '', notes: '' }
type Phase = 'form' | 'generating' | 'done'

export default function TastingModal({
  open,
  onClose,
  menu,
}: {
  open: boolean
  onClose: () => void
  menu: CatalogProduct[]
}) {
  const t = useTranslations('Tasting')
  const tv = useTranslations('Validation')
  const locale = useLocale()

  const [selected, setSelected] = useState<string[]>([])
  const [form, setForm] = useState(emptyForm)
  const [website, setWebsite] = useState('') // honeypot: real visitors never see it
  const [phase, setPhase] = useState<Phase>('form')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [result, setResult] = useState<{ ref: string | null; link: string | null }>({ ref: null, link: null })
  const [copied, setCopied] = useState(false)

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < MAX_TASTING_ITEMS ? [...s, id] : s))

  const close = () => {
    onClose()
    setTimeout(() => {
      setSelected([])
      setForm(emptyForm)
      setErrors({})
      setFormError(null)
      setPhase('form')
      setCopied(false)
    }, 300)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selected.length === 0) {
      setErrors({ productIds: ['selectSamples'] })
      return
    }
    const data = new FormData()
    Object.entries(form).forEach(([k, v]) => data.set(k, v))
    selected.forEach((id) => data.append('productIds', id))
    data.set('locale', locale)
    data.set('website', website)

    setPhase('generating')
    setErrors({})
    setFormError(null)
    try {
      const res = await submitTastingRequest(null, data)
      if (res.ok) {
        setResult({
          ref: res.data.requestNumber ? `TST-${res.data.requestNumber}` : null,
          link: res.data.whatsappUrl,
        })
        setPhase('done')
      } else {
        setErrors(res.fieldErrors ?? {})
        setFormError(res.error === 'validation' ? null : res.error)
        setPhase('form')
      }
    } catch {
      setFormError('generic')
      setPhase('form')
    }
  }

  const copy = async () => {
    if (!result.link) return
    try {
      await navigator.clipboard.writeText(result.link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard blocked; the link stays visible to copy manually */
    }
  }

  const set = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))
  const err = (key: string) => errors[key]?.[0] && tv(errors[key]![0] as 'required')

  return (
    <Modal open={open} onClose={close} className="max-w-2xl">
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-ink-2/95 px-6 py-5 backdrop-blur md:px-8">
        <div>
          <p className="eyebrow">{t('modalEyebrow')}</p>
          <h2 className="mt-2 text-2xl font-bold">{t('title')}</h2>
          <p className="text-sm text-muted">{t('modalSubtitle')}</p>
        </div>
        <CloseButton onClick={close} />
      </div>

      <AnimatePresence mode="wait">
        {phase === 'form' && (
          <motion.form key="form" exit={{ opacity: 0, y: -10 }} onSubmit={submit} className="space-y-7 px-6 py-6 md:px-8" noValidate>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold">{t('chooseSamples')}</span>
                <span className="text-xs text-muted" dir="ltr">
                  {selected.length}/{MAX_TASTING_ITEMS}
                </span>
              </div>
              {menu.length === 0 ? (
                <p className="mt-3 rounded-xl border border-dashed border-line p-4 text-sm text-muted">{t('emptyMenu')}</p>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {menu.map((p) => {
                    const on = selected.includes(p.id)
                    const disabled = !on && selected.length >= MAX_TASTING_ITEMS
                    return (
                      <motion.button
                        type="button"
                        key={p.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => toggle(p.id)}
                        disabled={disabled}
                        aria-pressed={on}
                        className={`relative overflow-hidden rounded-2xl border text-start transition ${
                          on ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-line hover:border-muted/50'
                        } ${disabled ? 'opacity-40' : ''}`}
                      >
                        <SmartImage src={p.images[0]?.url} alt="" className="aspect-[4/3]" sizes="200px" />
                        <div className="p-3">
                          <p className="text-[13px] leading-tight font-medium">{p.title}</p>
                          <p className="mt-0.5 text-[11px] text-muted">{p.category.name}</p>
                        </div>
                        <span
                          className={`absolute end-2 top-2 grid h-6 w-6 place-items-center rounded-full border transition ${
                            on ? 'border-rose-500 bg-rose-600 text-white' : 'border-white/60 bg-black/30 text-transparent'
                          }`}
                        >
                          <Check size={13} strokeWidth={3} />
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              )}
              {err('productIds') && <p className="mt-2 text-xs text-rose-500">{err('productIds')}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('cafeName')} error={err('cafeName')}>
                <input className="field" value={form.cafeName} onChange={set('cafeName')} placeholder={t('cafeNamePh')} required maxLength={100} />
              </Field>
              <Field label={t('phone')} error={err('phone')}>
                <input
                  className="field"
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="+966 5X XXX XXXX"
                  required
                  maxLength={20}
                />
              </Field>
              <Field label={t('city')} error={err('city')}>
                <input className="field" value={form.city} onChange={set('city')} placeholder={t('cityPh')} maxLength={60} />
              </Field>
              <Field label={t('notes')} error={err('notes')}>
                <input className="field" value={form.notes} onChange={set('notes')} placeholder={t('notesPh')} maxLength={500} />
              </Field>
            </div>

            {/* Honeypot: hidden from people and assistive tech, bots fill it. */}
            <input
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -start-[9999px] h-0 w-0 opacity-0"
            />

            {formError && <p className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-500">{tv(formError as 'generic')}</p>}

            <button type="submit" className="btn-primary w-full py-4" disabled={menu.length === 0}>
              <MessageCircle size={17} /> {t('submit')}
            </button>
          </motion.form>
        )}

        {phase === 'generating' && (
          <motion.div
            key="gen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 px-8 py-24 text-muted"
          >
            <Loader2 className="animate-spin text-rose-500" size={30} />
            {t('generating')}
          </motion.div>
        )}

        {phase === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-6 py-8 text-center md:px-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
              className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#25D366]/15 text-[#25D366]"
            >
              <Check size={30} strokeWidth={2.5} />
            </motion.div>
            {result.ref && (
              <p className="mt-5 text-xs tracking-[0.3em] text-muted uppercase" dir="ltr">
                {t('reference', { ref: result.ref })}
              </p>
            )}
            <h3 className="mt-2 font-display text-3xl">{t('doneTitle')}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">{t('doneBody')}</p>

            {result.link && (
              <>
                <div className="mt-6 rounded-2xl border border-line bg-ink p-4 text-start">
                  <p className="text-[10px] tracking-[0.25em] text-muted uppercase">{t('generatedLink')}</p>
                  <p className="mt-2 max-h-24 overflow-y-auto font-mono text-xs leading-relaxed break-all text-rose-600 dark:text-rose-200/80" dir="ltr">
                    {result.link}
                  </p>
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <a
                    href={result.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-[#0c0a0b] transition hover:brightness-110"
                  >
                    <Send size={16} className="rtl:-scale-x-100" /> {t('openWhatsapp')}
                  </a>
                  <button type="button" onClick={copy} className="btn-ghost">
                    {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? t('copied') : t('copy')}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}

function Field({ label, error, children }: { label: string; error?: string | false; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-muted">{label}</span>
      {children}
      {error && <span className="mt-1.5 block text-xs text-rose-500">{error}</span>}
    </label>
  )
}
