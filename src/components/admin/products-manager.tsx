'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Archive, Coffee, Pencil, Plus, Save } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { AdminCategory, AdminProduct } from '@/server/queries/admin'
import { archiveProduct, createProduct, setProductFlag, updateProduct, updateProductPrice } from '@/server/actions/products'
import { CloseButton, Drawer } from '@/components/ui/overlay'
import SmartImage from '@/components/ui/smart-image'
import Toast from '@/components/ui/toast'
import { useAdminAction } from '@/hooks/use-admin-action'
import { useToast } from '@/hooks/use-toast'
import { halalasToSar } from '@/lib/money'
import { PageHeader, Panel, Tabs, Toggle } from './ui'

type Filter = 'all' | 'tasting' | 'hidden'
type Editing = AdminProduct | 'new' | null

export default function ProductsManager({ products, categories }: { products: AdminProduct[]; categories: AdminCategory[] }) {
  const t = useTranslations('Admin')
  const { toast, notify } = useToast()
  const { run, pending } = useAdminAction(notify)
  const [editing, setEditing] = useState<Editing>(null)
  const [filter, setFilter] = useState<Filter>('all')

  const rows = products.filter((p) => filter === 'all' || (filter === 'tasting' ? p.isTastingMenu : !p.inStock))
  const nameOf = (p: AdminProduct) => p.translations.en.title || p.translations.ar.title

  return (
    <div className="space-y-6">
      <PageHeader title={t('productsTitle')} subtitle={t('productsSub')}>
        <button type="button" onClick={() => setEditing('new')} className="btn-primary py-2.5">
          <Plus size={16} /> {t('newProduct')}
        </button>
      </PageHeader>

      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
          <Tabs<Filter>
            id="products"
            value={filter}
            onChange={setFilter}
            tabs={[
              { id: 'all', label: t('all'), count: products.length },
              { id: 'tasting', label: t('tastingMenu'), count: products.filter((p) => p.isTastingMenu).length },
              { id: 'hidden', label: t('unavailable'), count: products.filter((p) => !p.inStock).length },
            ]}
          />
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Coffee size={13} className="text-rose-500" /> {t('tastingHint')}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-sm">
            <thead className="text-[11px] tracking-[0.12em] text-muted uppercase">
              <tr className="border-b border-line">
                <th className="px-5 py-3 text-start font-medium">{t('colProduct')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('colCategory')}</th>
                <th className="px-5 py-3 text-start font-medium">{t('colPrice')}</th>
                <th className="px-5 py-3 text-center font-medium">{t('colInStock')}</th>
                <th className="px-5 py-3 text-center font-medium">{t('colTasting')}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <AnimatePresence initial={false}>
                {rows.map((p) => (
                  <motion.tr key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="transition hover:bg-ink-3/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <SmartImage src={p.images[0]?.url} alt="" className="h-12 w-12 shrink-0 rounded-xl" sizes="48px" />
                        <div className="min-w-0">
                          <p className="truncate font-medium" dir="ltr">
                            {p.translations.en.title}
                          </p>
                          <p className="truncate text-xs text-muted" dir="rtl">
                            {p.translations.ar.title}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted">{p.categoryName}</td>
                    <td className="px-5 py-3">
                      <PriceInput
                        halalas={p.priceHalalas}
                        disabled={pending}
                        onCommit={(sar) => run(() => updateProductPrice({ id: p.id, priceHalalas: sar }), t('saved', { name: nameOf(p) }))}
                      />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Toggle
                        label={`${nameOf(p)} · ${t('colInStock')}`}
                        checked={p.inStock}
                        disabled={pending}
                        onChange={(value) => run(() => setProductFlag({ id: p.id, flag: 'inStock', value }), t('saved', { name: nameOf(p) }))}
                      />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Toggle
                        label={`${nameOf(p)} · ${t('colTasting')}`}
                        checked={p.isTastingMenu}
                        disabled={pending}
                        onChange={(value) => run(() => setProductFlag({ id: p.id, flag: 'isTastingMenu', value }), t('saved', { name: nameOf(p) }))}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <IconButton label={t('edit')} onClick={() => setEditing(p)}>
                          <Pencil size={15} />
                        </IconButton>
                        <IconButton
                          label={t('archive')}
                          danger
                          onClick={() => {
                            if (window.confirm(t('archiveConfirm', { name: nameOf(p) }))) {
                              run(() => archiveProduct({ id: p.id }), t('archived', { name: nameOf(p) }))
                            }
                          }}
                        >
                          <Archive size={15} />
                        </IconButton>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </Panel>

      <Drawer open={editing !== null} onClose={() => setEditing(null)}>
        {editing !== null && (
          <ProductForm
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? null : editing}
            categories={categories}
            onCancel={() => setEditing(null)}
            onSaved={(name) => {
              notify(t('saved', { name }))
              setEditing(null)
            }}
          />
        )}
      </Drawer>
      <Toast message={toast} />
    </div>
  )
}

/** Inline price editor in SAR: commits on blur / Enter, reverts on Escape or invalid input. */
function PriceInput({ halalas, disabled, onCommit }: { halalas: number; disabled?: boolean; onCommit: (sar: number) => void }) {
  const current = halalasToSar(halalas)
  const [draft, setDraft] = useState(String(current))
  useEffect(() => setDraft(String(halalasToSar(halalas))), [halalas])

  const commit = () => {
    const n = Number(draft)
    if (Number.isFinite(n) && n > 0 && n <= 100_000) {
      if (Math.round(n * 100) !== halalas) onCommit(n)
    } else setDraft(String(current))
  }

  return (
    <input
      type="number"
      min="1"
      step="0.5"
      dir="ltr"
      value={draft}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') setDraft(String(current))
      }}
      className="w-24 rounded-lg border border-transparent bg-transparent px-2 py-1.5 tabular-nums outline-none transition hover:border-line focus:border-rose-500/60 focus:bg-ink"
    />
  )
}

function IconButton({ label, danger, onClick, children }: { label: string; danger?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-ink-3 ${danger ? 'hover:text-rose-500' : 'hover:text-cream'}`}
    >
      {children}
    </button>
  )
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)

function ProductForm({
  initial,
  categories,
  onCancel,
  onSaved,
}: {
  initial: AdminProduct | null
  categories: AdminCategory[]
  onCancel: () => void
  onSaved: (name: string) => void
}) {
  const t = useTranslations('Admin')
  const tv = useTranslations('Validation')
  const { toast, notify } = useToast()
  const { run, pending } = useAdminAction(notify)
  const isNew = initial === null

  const [f, setF] = useState({
    titleEn: initial?.translations.en.title ?? '',
    titleAr: initial?.translations.ar.title ?? '',
    descEn: initial?.translations.en.description ?? '',
    descAr: initial?.translations.ar.description ?? '',
    badgeEn: initial?.translations.en.badge ?? '',
    badgeAr: initial?.translations.ar.badge ?? '',
    slug: initial?.slug ?? '',
    price: initial ? String(halalasToSar(initial.priceHalalas)) : '',
    categoryId: initial?.categoryId ?? categories[0]?.id ?? '',
    image: initial?.images[0]?.url ?? '',
    inStock: initial?.inStock ?? true,
    isTastingMenu: initial?.isTastingMenu ?? false,
  })
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const set = (key: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.value
    setF((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'titleEn' && !slugTouched ? { slug: slugify(value) } : {}),
    }))
  }
  const err = (key: string) => {
    const code = errors[key]?.[0]
    return code ? tv(code as 'invalid') : undefined
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      slug: f.slug,
      categoryId: f.categoryId,
      priceHalalas: f.price, // entered in SAR; the schema converts to halalas
      inStock: f.inStock,
      isTastingMenu: f.isTastingMenu,
      isFeatured: initial?.isFeatured ?? false,
      sortOrder: initial?.sortOrder ?? 0,
      translations: {
        en: { title: f.titleEn, description: f.descEn, badge: f.badgeEn },
        ar: { title: f.titleAr, description: f.descAr, badge: f.badgeAr },
      },
      images: f.image.trim() ? [{ url: f.image.trim(), altEn: f.titleEn, altAr: f.titleAr }] : [],
    }
    setErrors({})
    run(
      () => (isNew ? createProduct(payload) : updateProduct({ ...payload, id: initial.id })),
      undefined,
      (res) => {
        if (res.ok) onSaved(f.titleEn || f.titleAr)
        else setErrors(res.fieldErrors ?? {})
      },
    )
  }

  return (
    <form onSubmit={submit} noValidate className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-6 py-5">
        <div>
          <p className="eyebrow">{isNew ? t('newProduct') : t('editProduct')}</p>
          <h2 className="mt-1 font-display text-2xl">{f.titleEn || f.titleAr || t('untitled')}</h2>
        </div>
        <CloseButton onClick={onCancel} />
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
        <SmartImage key={f.image} src={f.image || null} alt="" className="aspect-[16/10] rounded-2xl border border-line" sizes="448px" />
        <FormField label={t('imageUrl')} error={err('images.0.url')}>
          <input className="field" dir="ltr" value={f.image} onChange={set('image')} placeholder="https://images.unsplash.com/…" />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label={t('nameEn')} error={err('translations.en.title')}>
            <input className="field" dir="ltr" value={f.titleEn} onChange={set('titleEn')} maxLength={120} />
          </FormField>
          <FormField label={t('nameAr')} error={err('translations.ar.title')}>
            <input className="field" dir="rtl" value={f.titleAr} onChange={set('titleAr')} maxLength={120} />
          </FormField>
        </div>
        <FormField label={t('descEn')} error={err('translations.en.description')}>
          <textarea rows={3} className="field resize-none" dir="ltr" value={f.descEn} onChange={set('descEn')} maxLength={1000} />
        </FormField>
        <FormField label={t('descAr')} error={err('translations.ar.description')}>
          <textarea rows={3} className="field resize-none" dir="rtl" value={f.descAr} onChange={set('descAr')} maxLength={1000} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label={t('price')} error={err('priceHalalas')}>
            <input className="field" dir="ltr" type="number" min="1" step="0.5" value={f.price} onChange={set('price')} />
          </FormField>
          <FormField label={t('category')} error={err('categoryId')}>
            <select className="field" value={f.categoryId} onChange={set('categoryId')}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <FormField label={t('slug')} error={err('slug')}>
          <input
            className="field"
            dir="ltr"
            value={f.slug}
            onChange={(e) => {
              setSlugTouched(true)
              set('slug')(e)
            }}
            maxLength={120}
          />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label={t('badgeEn')} error={err('translations.en.badge')}>
            <input className="field" dir="ltr" value={f.badgeEn} onChange={set('badgeEn')} maxLength={32} />
          </FormField>
          <FormField label={t('badgeAr')} error={err('translations.ar.badge')}>
            <input className="field" dir="rtl" value={f.badgeAr} onChange={set('badgeAr')} maxLength={32} />
          </FormField>
        </div>

        <div className="divide-y divide-line rounded-2xl border border-line">
          <SwitchRow
            title={t('availableInStore')}
            text={t('availableInStoreHint')}
            checked={f.inStock}
            onChange={(inStock) => setF((p) => ({ ...p, inStock }))}
          />
          <SwitchRow
            title={t('includeTasting')}
            text={t('includeTastingHint')}
            checked={f.isTastingMenu}
            onChange={(isTastingMenu) => setF((p) => ({ ...p, isTastingMenu }))}
          />
        </div>
      </div>

      <div className="flex gap-3 border-t border-line px-6 py-5">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">
          {t('cancel')}
        </button>
        <button type="submit" className="btn-primary flex-1" disabled={pending}>
          <Save size={16} /> {isNew ? t('addProduct') : t('saveChanges')}
        </button>
      </div>
      <Toast message={toast} />
    </form>
  )
}

function FormField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-muted">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-rose-500">{error}</span>}
    </label>
  )
}

function SwitchRow({ title, text, checked, onChange }: { title: string; text: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted">{text}</p>
      </div>
      <Toggle label={title} checked={checked} onChange={onChange} />
    </div>
  )
}
