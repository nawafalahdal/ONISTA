import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, Loader2, MessageCircle, Send } from 'lucide-react'
import { CloseButton, Modal } from '../ui/Overlay.jsx'
import SmartImage from '../ui/SmartImage.jsx'
import { BUSINESS_WHATSAPP } from '../../data/seed.js'
import { buildTastingWhatsAppLink } from '../../lib/format.js'
import { useStore } from '../../store/StoreProvider.jsx'

const MAX_ITEMS = 5
const emptyForm = { cafeName: '', phone: '', city: '', notes: '' }

export default function TastingModal({ open, onClose }) {
  const { state, dispatch } = useStore()
  const menu = state.products.filter((p) => p.tasting && p.available)

  const [selected, setSelected] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [touched, setTouched] = useState(false)
  const [phase, setPhase] = useState('form') // form | generating | done
  const [link, setLink] = useState('')
  const [copied, setCopied] = useState(false)

  const phoneDigits = form.phone.replace(/\D/g, '')
  const errors = {
    items: selected.length === 0 && 'Pick at least one sample.',
    cafeName: !form.cafeName.trim() && 'Cafe name is required.',
    phone: (phoneDigits.length < 9 || phoneDigits.length > 15) && 'Enter a valid phone number.',
  }
  const valid = !errors.items && !errors.cafeName && !errors.phone

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < MAX_ITEMS ? [...s, id] : s))

  const close = () => {
    onClose()
    // reset after the exit animation
    setTimeout(() => {
      setSelected([])
      setForm(emptyForm)
      setTouched(false)
      setPhase('form')
      setCopied(false)
    }, 300)
  }

  const submit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (!valid) return
    const request = {
      cafeName: form.cafeName.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      notes: form.notes.trim(),
      items: menu.filter((p) => selected.includes(p.id)).map((p) => p.name),
    }
    setPhase('generating')
    setTimeout(() => {
      dispatch({ type: 'tasting/submit', request })
      setLink(buildTastingWhatsAppLink(BUSINESS_WHATSAPP, request))
      setPhase('done')
    }, 1100)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard blocked; the link is still visible to select manually */
    }
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  return (
    <Modal open={open} onClose={close} className="max-w-2xl">
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-ink-2/95 px-6 py-5 backdrop-blur md:px-8">
        <div>
          <p className="eyebrow">B2B · For cafés</p>
          <h2 className="mt-2 text-2xl font-bold">
            <span dir="rtl">طلب تجربة للكافيه</span>
          </h2>
          <p className="text-sm text-muted">Request a complimentary tasting box</p>
        </div>
        <CloseButton onClick={close} />
      </div>

      <AnimatePresence mode="wait">
        {phase === 'form' && (
          <motion.form key="form" exit={{ opacity: 0, y: -10 }} onSubmit={submit} className="space-y-7 px-6 py-6 md:px-8" noValidate>
            <div>
              <div className="flex items-baseline justify-between">
                <label className="text-sm font-semibold">
                  Choose samples <span dir="rtl" className="font-normal text-muted">· اختر الأصناف</span>
                </label>
                <span className="text-xs text-muted">
                  {selected.length}/{MAX_ITEMS}
                </span>
              </div>
              {menu.length === 0 ? (
                <p className="mt-3 rounded-xl border border-dashed border-line p-4 text-sm text-muted">
                  The tasting menu is being refreshed. Please check back soon.
                </p>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {menu.map((p) => {
                    const on = selected.includes(p.id)
                    const disabled = !on && selected.length >= MAX_ITEMS
                    return (
                      <motion.button
                        type="button"
                        key={p.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => toggle(p.id)}
                        disabled={disabled}
                        aria-pressed={on}
                        className={`relative overflow-hidden rounded-2xl border text-left transition ${
                          on ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-line hover:border-muted/50'
                        } ${disabled ? 'opacity-40' : ''}`}
                      >
                        <SmartImage src={p.image} alt="" className="aspect-[4/3]" />
                        <div className="p-3">
                          <p className="text-[13px] font-medium leading-tight">{p.name}</p>
                          <p className="mt-0.5 text-[11px] text-muted">{p.category}</p>
                        </div>
                        <span
                          className={`absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full border transition ${
                            on ? 'border-rose-500 bg-rose-600 text-white' : 'border-white/40 bg-ink/50 text-transparent'
                          }`}
                        >
                          <Check size={13} strokeWidth={3} />
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              )}
              {touched && errors.items && <p className="mt-2 text-xs text-rose-400">{errors.items}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cafe name" labelAr="اسم الكافيه" error={touched && errors.cafeName}>
                <input className="field" value={form.cafeName} onChange={set('cafeName')} placeholder="e.g. Brew Theory" />
              </Field>
              <Field label="Phone number" labelAr="رقم الجوال" error={touched && errors.phone}>
                <input
                  className="field"
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="+966 5X XXX XXXX"
                />
              </Field>
              <Field label="City (optional)" labelAr="المدينة">
                <input className="field" value={form.city} onChange={set('city')} placeholder="Riyadh" />
              </Field>
              <Field label="Notes (optional)" labelAr="ملاحظات">
                <input className="field" value={form.notes} onChange={set('notes')} placeholder="Preferred delivery day…" />
              </Field>
            </div>

            <button type="submit" className="btn-primary w-full py-4" disabled={menu.length === 0}>
              <MessageCircle size={17} /> Generate WhatsApp request
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
            <Loader2 className="animate-spin text-rose-400" size={30} />
            Preparing your WhatsApp message…
          </motion.div>
        )}

        {phase === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-8 text-center md:px-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
              className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#25D366]/15 text-[#25D366]"
            >
              <Check size={30} strokeWidth={2.5} />
            </motion.div>
            <h3 className="mt-5 font-display text-3xl">Your request is ready</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              We've logged it for our wholesale team. Send the pre-filled message on WhatsApp to confirm your
              tasting slot.
            </p>

            <div className="mt-6 rounded-2xl border border-line bg-ink p-4 text-left">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted">Generated link</p>
              <p className="mt-2 max-h-24 overflow-y-auto break-all font-mono text-xs leading-relaxed text-rose-200/80">{link}</p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-ink transition hover:brightness-110"
              >
                <Send size={16} /> Open WhatsApp
              </a>
              <button onClick={copy} className="btn-ghost">
                {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}

function Field({ label, labelAr, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex justify-between text-xs text-muted">
        {label} <span dir="rtl">{labelAr}</span>
      </span>
      {children}
      {error && <span className="mt-1.5 block text-xs text-rose-400">{error}</span>}
    </label>
  )
}
