'use client'

import NextLink from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight, Building2, Cake, Coffee, Wallet } from 'lucide-react'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import type { DashboardData } from '@/server/queries/admin'
import { formatSar } from '@/lib/money'
import { PageHeader, Panel } from './ui'

export default function Overview({ data }: { data: DashboardData }) {
  const t = useTranslations('Admin')
  const format = useFormatter()
  const locale = useLocale() as 'ar' | 'en'
  const when = (d: Date) => format.dateTime(d, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  const stats = [
    { label: t('revenue'), value: formatSar(data.revenueHalalas, locale), icon: Wallet, hint: t('ordersCount', { count: data.orderCount }) },
    { label: t('openOrders'), value: data.openOrders, icon: Cake, hint: t('awaitingFulfilment'), href: '/admin/orders' },
    { label: t('newRequests'), value: data.newRequests, icon: Coffee, hint: t('totalCount', { count: data.totalRequests }), href: '/admin/tasting-requests' },
    { label: t('cafeCount'), value: data.cafeCount, icon: Building2, hint: t('productsLive', { count: data.liveProducts }), href: '/admin/clients' },
  ]
  const maxQty = data.bestSellers[0]?.qty ?? 1

  return (
    <div className="space-y-8">
      <PageHeader title={t('greeting')} subtitle={t('greetingSub')} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => {
          const body = (
            <>
              <div className="flex items-center justify-between text-muted">
                <span className="text-xs tracking-[0.12em] uppercase">{s.label}</span>
                <s.icon size={16} className="text-rose-500" />
              </div>
              <p className="mt-4 font-display text-4xl">{s.value}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                {s.hint}
                {s.href && <ArrowUpRight size={12} className="opacity-0 transition group-hover:opacity-100 rtl:-scale-x-100" />}
              </p>
            </>
          )
          const cls = 'group block rounded-2xl border border-line bg-ink-2 p-5 text-start transition hover:border-rose-500/40'
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              {s.href ? (
                <NextLink href={s.href} className={cls}>
                  {body}
                </NextLink>
              ) : (
                <div className={cls}>{body}</div>
              )}
            </motion.div>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t('latestActivity')}</h2>
            <NextLink href="/admin/orders" className="text-xs text-muted hover:text-cream">
              {t('viewAll')}
            </NextLink>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {data.activity.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-3">
                <span
                  className={`grid h-9 w-9 place-items-center rounded-full ${
                    e.kind === 'delivery' ? 'bg-rose-600/15 text-rose-600 dark:text-rose-300' : 'bg-amber-400/15 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {e.kind === 'delivery' ? <Cake size={15} /> : <Coffee size={15} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{e.who}</p>
                  <p className="text-xs text-muted">
                    {e.kind === 'delivery' ? t('retailOrder') : t('tastingRequest')} · <span dir="ltr">{e.ref}</span>
                  </p>
                </div>
                <div className="text-end">
                  <p className="text-sm">{e.kind === 'delivery' ? formatSar(e.amountHalalas, locale) : t('samplesCount', { count: e.samples })}</p>
                  <p className="text-xs text-muted">{when(e.at)}</p>
                </div>
              </li>
            ))}
            {data.activity.length === 0 && <li className="py-8 text-center text-sm text-muted">{t('noOrders')}</li>}
          </ul>
        </Panel>

        <Panel className="p-5">
          <h2 className="font-semibold">{t('bestSellers')}</h2>
          <ul className="mt-5 space-y-4">
            {data.bestSellers.map((b, i) => (
              <li key={b.title}>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="truncate">{b.title}</span>
                  <span className="shrink-0 text-muted tabular-nums">{t('sold', { count: b.qty })}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(b.qty / maxQty) * 100}%` }}
                    transition={{ delay: 0.2 + i * 0.07, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full bg-rose-500"
                  />
                </div>
              </li>
            ))}
            {data.bestSellers.length === 0 && <p className="text-sm text-muted">{t('noSales')}</p>}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
