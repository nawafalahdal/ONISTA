# ONISTA — Cake Shop Prototype

A premium, dark-themed interactive prototype for **Onista Cake Shop**, a B2B/B2C bakery.
Built with **React 19, Vite, Tailwind CSS v4, Framer Motion and Lucide React**.

```bash
npm install
npm run dev      # http://localhost:5173  (append #admin to open the dashboard)
npm run build
```

## Views

### Customer storefront
- **Scroll-linked hero → About.** The Onista arch emblem (a vector redraw of the brand logo) travels
  down the page as you scroll, slides into the About layout, and its line-art cake dissolves into a
  photograph inside the arch while the About copy reveals beside it (`HeroAbout.jsx`).
- **Collection.** Filterable product grid with animated category pills, hover states and add-to-cart feedback.
- **B2B tasting — طلب تجربة للكافيه.** A dedicated section plus a floating button open a modal where a café
  picks up to 5 samples (from items flagged for the tasting menu), enters its name and phone number, and gets
  a generated `wa.me` link with a bilingual, pre-filled message. The request is also logged for the admin.
- **Cart & checkout.** Slide-out cart drawer with quantity controls, then a simulated checkout
  (delivery/pickup, VAT, payment method) that creates an order.

### Admin dashboard
- Sidebar layout (collapses to a top tab bar on mobile) with live badges for new orders/requests.
- **Overview:** KPIs, latest activity and best sellers.
- **Orders** and **Tasting requests:** filterable tables with inline status changes; one-click WhatsApp reply to cafés.
- **Products:** inline price editing, in-stock and B2B-tasting toggles, and a slide-over form to add or edit products.

## State
All data lives in a single reducer (`src/store/StoreProvider.jsx`): products, cart, orders and tasting requests.
Both views share it, so a price change or a tasting-menu toggle in the admin is reflected in the storefront
immediately. State is persisted to `localStorage`; use **Reset demo data** in the sidebar to restore the seed data.

Set the bakery's WhatsApp number in `src/data/seed.js` (`BUSINESS_WHATSAPP`). Product photos are Unsplash
placeholders with a branded fallback if an image fails to load.

```
src/
  App.jsx                    view switching + toasts
  store/StoreProvider.jsx    reducer, persistence, derived cart totals
  data/seed.js               products, sample orders & requests
  lib/                       formatting, WhatsApp link builder, media-query hook
  components/ui/             Logo, Modal/Drawer, SmartImage, Toast
  components/storefront/     Navbar, HeroAbout, ProductsCatalog, TastingSection/Modal, CartDrawer, CheckoutModal
  components/admin/          AdminDashboard, Overview, OrdersTable, TastingTable, ProductsManager
```
