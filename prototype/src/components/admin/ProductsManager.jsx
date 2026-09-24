import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Coffee, Pencil, Plus, Save, Trash2 } from 'lucide-react'
import { PageHeader, Panel, Tabs, Toggle } from './ui.jsx'
import { CloseButton, Drawer } from '../ui/Overlay.jsx'
import SmartImage from '../ui/SmartImage.jsx'
import { CATEGORIES } from '../../data/seed.js'
import { useStore } from '../../store/StoreProvider.jsx'

const blankProduct = {
  name: '',
  nameAr: '',
  description: '',
  price: '',
  category: CATEGORIES[0],
  image: '',
  badge: '',
  available: true,
  tasting: false,
}

export default function ProductsManager({ notify }) {
  const { state, dispatch } = useStore()
  const [editing, setEditing] = useState(null) // null | product | blankProduct
  const [filter, setFilter] = useState('all')

  const rows = state.products.filter((p) => filter === 'all' || (filter === 'tasting' ? p.tasting : !p.available))
  const patch = (id, change) => dispatch({ type: 'products/patch', id, patch: change })

  return (
    <div className="space-y-6">
      <PageHeader title="Products" subtitle="Manage the retail catalog and the B2B tasting menu.">
        <button onClick={() => setEditing(blankProduct)} className="btn-primary py-2.5">
          <Plus size={16} /> New product
        </button>
      </PageHeader>

      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
          <Tabs
            id="products"
            value={filter}
            onChange={setFilter}
            tabs={[
              { id: 'all', label: 'All', count: state.products.length },
              { id: 'tasting', label: 'Tasting menu', count: state.products.filter((p) => p.tasting).length },
              { id: 'hidden', label: 'Unavailable', count: state.products.filter((p) => !p.available).length },
            ]}
          />
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Coffee size={13} className="text-rose-400" /> Tasting items appear in the café request form.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="text-left text-[11px] uppercase tracking-[0.15em] text-muted">
              <tr className="border-b border-line">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Price (SAR)</th>
                <th className="px-5 py-3 text-center font-medium">In stock</th>
                <th className="px-5 py-3 text-center font-medium">B2B tasting</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <AnimatePresence initial={false}>
                {rows.map((p) => (
                  <motion.tr
                    key={p.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="transition hover:bg-ink-3/50"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <SmartImage src={p.image} alt="" className="h-12 w-12 shrink-0 rounded-xl" />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{p.name}</p>
                          <p className="truncate text-xs text-muted">
                            <span dir="rtl">{p.nameAr}</span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted">{p.category}</td>
                    <td className="px-5 py-3">
                      <PriceInput value={p.price} onCommit={(price) => patch(p.id, { price })} />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Toggle label={`${p.name} in stock`} checked={p.available} onChange={(available) => patch(p.id, { available })} />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Toggle label={`${p.name} on tasting menu`} checked={p.tasting} onChange={(tasting) => patch(p.id, { tasting })} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <IconButton label="Edit" onClick={() => setEditing(p)}>
                          <Pencil size={15} />
                        </IconButton>
                        <IconButton
                          label="Delete"
                          danger
                          onClick={() => {
                            if (window.confirm(`Delete “${p.name}”?`)) {
                              dispatch({ type: 'products/delete', id: p.id })
                              notify(`${p.name} deleted`)
                            }
                          }}
                        >
                          <Trash2 size={15} />
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

      <Drawer open={!!editing} onClose={() => setEditing(null)}>
        {editing && (
          <ProductForm
            key={editing.id ?? 'new'}
            initial={editing}
            onCancel={() => setEditing(null)}
            onSave={(product) => {
              dispatch({ type: 'products/upsert', product })
              notify(product.id ? `${product.name} updated` : `${product.name} added to the catalog`)
              setEditing(null)
            }}
          />
        )}
      </Drawer>
    </div>
  )
}

/** Inline price editor: commits on blur / Enter, reverts on Escape or invalid input. */
function PriceInput({ value, onCommit }) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])

  const commit = () => {
    const n = Number(draft)
    if (Number.isFinite(n) && n > 0) {
      if (n !== value) onCommit(Math.round(n * 100) / 100)
    } else setDraft(String(value))
  }

  return (
    <input
      type="number"
      min="1"
      step="0.5"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') setDraft(String(value))
      }}
      className="w-24 rounded-lg border border-transparent bg-transparent px-2 py-1.5 tabular-nums outline-none transition hover:border-line focus:border-rose-500/60 focus:bg-ink"
    />
  )
}

function IconButton({ label, danger, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-ink-3 ${
        danger ? 'hover:text-rose-400' : 'hover:text-cream'
      }`}
    >
      {children}
    </button>
  )
}

function ProductForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ ...initial, price: String(initial.price) })
  const [touched, setTouched] = useState(false)
  const isNew = !initial.id

  const errors = {
    name: !form.name.trim() && 'Name is required',
    price: !(Number(form.price) > 0) && 'Enter a price above 0',
    description: !form.description.trim() && 'Add a short description',
  }
  const valid = !Object.values(errors).some(Boolean)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (!valid) return
    onSave({
      ...form,
      name: form.name.trim(),
      nameAr: form.nameAr.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      badge: form.badge?.trim() || undefined,
      price: Math.round(Number(form.price) * 100) / 100,
    })
  }

  return (
    <form onSubmit={submit} noValidate className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-6 py-5">
        <div>
          <p className="eyebrow">{isNew ? 'New product' : 'Edit product'}</p>
          <h2 className="mt-1 font-display text-2xl">{form.name || 'Untitled cake'}</h2>
        </div>
        <CloseButton onClick={onCancel} />
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
        <SmartImage key={form.image} src={form.image} alt="Preview" className="aspect-[16/10] rounded-2xl border border-line" />

        <FormField label="Image URL">
          <input className="field" value={form.image} onChange={set('image')} placeholder="https://…" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name" error={touched && errors.name}>
            <input className="field" value={form.name} onChange={set('name')} placeholder="Rose Pistachio Layer" />
          </FormField>
          <FormField label="Arabic name">
            <input dir="rtl" className="field" value={form.nameAr} onChange={set('nameAr')} placeholder="اسم المنتج" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Price (SAR)" error={touched && errors.price}>
            <input className="field" type="number" min="1" step="0.5" value={form.price} onChange={set('price')} />
          </FormField>
          <FormField label="Category">
            <select className="field" value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </FormField>
        </div>
        <FormField label="Description" error={touched && errors.description}>
          <textarea rows={3} className="field resize-none" value={form.description} onChange={set('description')} />
        </FormField>
        <FormField label="Badge (optional)">
          <input className="field" value={form.badge ?? ''} onChange={set('badge')} placeholder="New, Signature, Seasonal…" />
        </FormField>

        <div className="divide-y divide-line rounded-2xl border border-line">
          <SwitchRow
            title="Available in store"
            text="Show as purchasable on the storefront."
            checked={form.available}
            onChange={(available) => setForm((f) => ({ ...f, available }))}
          />
          <SwitchRow
            title="Include in B2B tasting menu"
            text="Cafés can request this item as a sample."
            checked={form.tasting}
            onChange={(tasting) => setForm((f) => ({ ...f, tasting }))}
          />
        </div>
      </div>

      <div className="flex gap-3 border-t border-line px-6 py-5">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1">
          <Save size={16} /> {isNew ? 'Add product' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

function FormField({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-muted">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-rose-400">{error}</span>}
    </label>
  )
}

function SwitchRow({ title, text, checked, onChange }) {
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
