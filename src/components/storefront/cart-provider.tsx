'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CatalogProduct } from '@/server/queries/catalog'

type Line = { id: string; qty: number }
type CartLine = Line & { product: CatalogProduct }

type CartContextValue = {
  lines: CartLine[]
  count: number
  subtotalHalalas: number
  add: (id: string) => void
  setQty: (id: string, qty: number) => void
  remove: (id: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'onista-cart-v1'
const MAX_QTY = 50

/**
 * The cart lives in the visitor's browser (a per-device convenience). It only
 * stores product IDs and quantities; names and prices always come from the
 * live catalog, and the server recomputes everything at checkout.
 */
export function CartProvider({ products, children }: { products: CatalogProduct[]; children: ReactNode }) {
  const [raw, setRaw] = useState<Line[]>([])

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
      if (Array.isArray(saved)) {
        setRaw(saved.filter((l) => typeof l?.id === 'string' && Number.isInteger(l?.qty) && l.qty > 0))
      }
    } catch {
      /* storage unavailable: start empty */
    }
  }, [])

  const persist = useCallback((next: Line[]) => {
    setRaw(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo<CartContextValue>(() => {
    const byId = new Map(products.map((p) => [p.id, p]))
    // Drop items that were removed from the catalog or sold out since.
    const lines = raw.flatMap((l) => {
      const product = byId.get(l.id)
      return product && product.inStock ? [{ ...l, product }] : []
    })
    return {
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotalHalalas: lines.reduce((n, l) => n + l.qty * l.product.priceHalalas, 0),
      add: (id) => {
        const existing = raw.find((l) => l.id === id)
        persist(
          existing
            ? raw.map((l) => (l.id === id ? { ...l, qty: Math.min(MAX_QTY, l.qty + 1) } : l))
            : [...raw, { id, qty: 1 }],
        )
      },
      setQty: (id, qty) =>
        persist(
          qty <= 0 ? raw.filter((l) => l.id !== id) : raw.map((l) => (l.id === id ? { ...l, qty: Math.min(MAX_QTY, qty) } : l)),
        ),
      remove: (id) => persist(raw.filter((l) => l.id !== id)),
      clear: () => persist([]),
    }
  }, [raw, products, persist])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
