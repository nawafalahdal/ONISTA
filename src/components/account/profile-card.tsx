import { Building2, ExternalLink, Mail, MapPin, Phone } from 'lucide-react'
import { getFormatter, getTranslations } from 'next-intl/server'
import type { CafeProfileDetail } from '@/server/queries/cafe'

export default async function ProfileCard({ profile }: { profile: CafeProfileDetail }) {
  const t = await getTranslations('Account.Profile')
  const ta = await getTranslations('Account.Addresses')
  const format = await getFormatter()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-medium">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('subtitle')}</p>
      </div>

      <div className="rounded-2xl border border-line bg-ink-2 p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-rose-600/15 text-rose-500">
            <Building2 size={20} />
          </span>
          <div>
            <p className="font-display text-2xl">{profile.cafeName}</p>
            {profile.contactName && <p className="text-sm text-muted">{profile.contactName}</p>}
          </div>
        </div>

        <dl className="mt-6 grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <Phone size={16} className="shrink-0 text-muted" />
            <dd dir="ltr" className="text-sm">
              {profile.contactPhone}
            </dd>
          </div>
          {profile.contactEmail && (
            <div className="flex items-center gap-3">
              <Mail size={16} className="shrink-0 text-muted" />
              <dd dir="ltr" className="text-sm">
                {profile.contactEmail}
              </dd>
            </div>
          )}
          <div className="flex items-center gap-3 sm:col-span-2">
            <span className="text-sm text-muted">{t('partnerSince')}</span>
            <dd className="text-sm">{format.dateTime(profile.createdAt, { day: '2-digit', month: 'long', year: 'numeric' })}</dd>
          </div>
        </dl>

        {profile.googleMapsUrl && (
          <a
            href={profile.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-line bg-ink p-4 text-sm transition hover:border-rose-500/40"
          >
            <span className="flex items-center gap-2">
              <MapPin size={16} className="text-rose-500" /> {t('googleMapsLink')}
            </span>
            <ExternalLink size={14} className="shrink-0 text-muted" />
          </a>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-ink-2 p-6">
        <h2 className="font-semibold">{ta('title')}</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {profile.addresses.map((a) => (
            <li key={a.id} className="rounded-2xl border border-line bg-ink p-4">
              <p className="flex items-center gap-1.5 font-medium">
                <MapPin size={14} className="text-rose-500" /> {a.label}
              </p>
              <p className="mt-1 text-sm text-muted">
                {a.street}, {a.district}, {a.city}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
