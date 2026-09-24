import NextLink from 'next/link'
import { AtSign, MapPin, Phone } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { LogoMark, Wordmark } from '@/components/ui/logo'

export default function Footer() {
  const t = useTranslations('Footer')
  return (
    <footer className="mx-auto max-w-7xl px-5 pt-20 pb-28 md:px-8">
      <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="text-rose-500">
          <LogoMark className="h-20 w-auto" strokeWidth={3} />
          <Wordmark className="mt-4 text-2xl text-cream" />
          <p className="mt-5 max-w-xs text-sm text-muted">{t('tagline')}</p>
        </div>
        <div className="space-y-3 text-sm text-muted">
          <p className="eyebrow mb-4">{t('visit')}</p>
          <p className="flex items-center gap-2">
            <MapPin size={14} /> {t('address')}
          </p>
          <p className="flex items-center gap-2">
            <Phone size={14} /> <span dir="ltr">+966 55 714 6374</span>
          </p>
          <p className="flex items-center gap-2">
            <AtSign size={14} /> <span dir="ltr">@onista.cakeshop</span>
          </p>
        </div>
        <div className="space-y-3 text-sm text-muted">
          <p className="eyebrow mb-4">{t('hours')}</p>
          <p>{t('satThu')}</p>
          <p>{t('friday')}</p>
          <NextLink href="/admin" className="mt-4 inline-block text-xs underline decoration-line underline-offset-4 hover:text-cream">
            {t('staff')}
          </NextLink>
        </div>
      </div>
      <p className="mt-16 border-t border-line pt-6 text-xs text-muted/70">{t('rights')}</p>
    </footer>
  )
}
