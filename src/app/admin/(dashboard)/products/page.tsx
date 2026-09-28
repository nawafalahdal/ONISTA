import { getLocale } from 'next-intl/server'
import ProductsManager from '@/components/admin/products-manager'
import type { AppLocale } from '@/i18n/routing'
import { listAdminProducts, listCategories } from '@/server/queries/admin'

export default async function ProductsPage() {
  const locale = (await getLocale()) as AppLocale
  const [products, categories] = await Promise.all([listAdminProducts(locale), listCategories(locale)])
  return <ProductsManager products={products} categories={categories} />
}
