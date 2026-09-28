import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { seedOrders, seedProducts, seedTastingRequests } from '../data/seed.js'
import { nextId } from '../lib/format.js'

const STORAGE_KEY = 'onista-store-v1'

const initialState = {
  products: seedProducts,
  cart: [], // [{ id, qty }]
  orders: seedOrders,
  tastingRequests: seedTastingRequests,
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...initialState, ...JSON.parse(raw) } : initialState
  } catch {
    return initialState
  }
}

function reducer(state, action) {
  switch (action.type) {
    /* ---------- Cart ---------- */
    case 'cart/add': {
      const existing = state.cart.find((l) => l.id === action.id)
      const cart = existing
        ? state.cart.map((l) => (l.id === action.id ? { ...l, qty: l.qty + (action.qty ?? 1) } : l))
        : [...state.cart, { id: action.id, qty: action.qty ?? 1 }]
      return { ...state, cart }
    }
    case 'cart/setQty': {
      const cart =
        action.qty <= 0
          ? state.cart.filter((l) => l.id !== action.id)
          : state.cart.map((l) => (l.id === action.id ? { ...l, qty: action.qty } : l))
      return { ...state, cart }
    }
    case 'cart/remove':
      return { ...state, cart: state.cart.filter((l) => l.id !== action.id) }
    case 'cart/clear':
      return { ...state, cart: [] }

    /* ---------- Orders ---------- */
    case 'orders/place': {
      const order = { ...action.order, id: nextId('ORD', state.orders), status: 'New', createdAt: new Date().toISOString() }
      return { ...state, orders: [order, ...state.orders], cart: [] }
    }
    case 'orders/setStatus':
      return { ...state, orders: state.orders.map((o) => (o.id === action.id ? { ...o, status: action.status } : o)) }

    /* ---------- B2B tasting requests ---------- */
    case 'tasting/submit': {
      const request = {
        ...action.request,
        id: nextId('TST', state.tastingRequests),
        status: 'New',
        createdAt: new Date().toISOString(),
      }
      return { ...state, tastingRequests: [request, ...state.tastingRequests] }
    }
    case 'tasting/setStatus':
      return {
        ...state,
        tastingRequests: state.tastingRequests.map((r) => (r.id === action.id ? { ...r, status: action.status } : r)),
      }

    /* ---------- Products ---------- */
    case 'products/upsert': {
      const exists = state.products.some((p) => p.id === action.product.id)
      const products = exists
        ? state.products.map((p) => (p.id === action.product.id ? action.product : p))
        : [...state.products, { ...action.product, id: `p-${Date.now().toString(36)}` }]
      return { ...state, products }
    }
    case 'products/patch':
      return { ...state, products: state.products.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)) }
    case 'products/delete':
      return {
        ...state,
        products: state.products.filter((p) => p.id !== action.id),
        cart: state.cart.filter((l) => l.id !== action.id),
      }

    case 'reset':
      return initialState
    default:
      return state
  }
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* storage unavailable (private mode) — the prototype still works in memory */
    }
  }, [state])

  // Derived cart data, joined against the live product catalog so price edits
  // made in the admin dashboard are reflected immediately.
  const derived = useMemo(() => {
    const cartLines = state.cart
      .map((l) => ({ ...l, product: state.products.find((p) => p.id === l.id) }))
      .filter((l) => l.product)
    const cartCount = cartLines.reduce((n, l) => n + l.qty, 0)
    const cartTotal = cartLines.reduce((n, l) => n + l.qty * l.product.price, 0)
    return { cartLines, cartCount, cartTotal }
  }, [state.cart, state.products])

  const value = useMemo(() => ({ state, dispatch, ...derived }), [state, derived])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
