import { getLocale } from 'next-intl/server'
import ScheduleBuilder from '@/components/account/schedule-builder'
import type { AppLocale } from '@/i18n/routing'
import { getSchedulableCatalog } from '@/server/queries/catalog'
import { getCafeAddresses, getSchedulingWindow } from '@/server/queries/cafe'

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams
  const locale = (await getLocale()) as AppLocale
  const [products, addresses, window_] = await Promise.all([getSchedulableCatalog(locale), getCafeAddresses(), getSchedulingWindow()])

  return (
    <ScheduleBuilder
      initialMode={mode === 'one-off' ? 'one-off' : 'weekly'}
      products={products}
      addresses={addresses}
      earliestDate={window_.earliestDate}
      allowedDates={window_.allowedDates}
      deliveryFeeHalalas={window_.deliveryFeeHalalas}
    />
  )
}
