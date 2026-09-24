import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) })

// The real Onista menu (from the printed flyer). No stock photography: every
// product ships without a ProductImage row, so the storefront renders the
// deliberate "image coming soon" placeholder instead of a stand-in photo.
const categories = [
  { slug: 'signature-cakes', ar: 'الكيك والحلويات المميزة', en: 'Signature Cakes' },
  { slug: 'cookies', ar: 'الكوكيز', en: 'Cookies' },
  { slug: 'traditional-sweets', ar: 'الحلويات التقليدية', en: 'Traditional Sweets' },
] as const

const products = [
  // ── Signature Cakes ───────────────────────────────────────────────────
  { slug: 'date-cake', cat: 'signature-cakes', sar: 36, tasting: true, unit: ['6 حبات', '6 pieces'],
    en: ['Date Cake', 'Moist date sponge layered with caramelised date paste, finished with a light spice glaze.'],
    ar: ['كيك التمر', 'إسفنج تمر رطب مع طبقات من عجينة التمر المكرملة ولمسة بهارات خفيفة.'] },
  { slug: 'san-sebastian', cat: 'signature-cakes', sar: 120, tasting: true, featured: true, unit: ['8 – 10 قطع', '8–10 pieces'],
    en: ['San Sebastián Cheesecake', 'Basque-style burnt cheesecake: a deeply caramelised top over a molten, custardy centre.'],
    ar: ['سان سبستيان', 'تشيز كيك باسكي محروق: قشرة مكرملة عميقة فوق قلب طري كالكاسترد.'] },
  { slug: 'banana-cake', cat: 'signature-cakes', sar: 72, tasting: true, unit: ['10 – 12 قطعة', '10–12 pieces'],
    en: ['Banana Cake', 'Ripe banana sponge, brown-butter crumb and a silky vanilla buttercream.'],
    ar: ['كيك الموز', 'إسفنج الموز الناضج مع كريمة الزبدة والفانيليا الحريرية.'] },
  { slug: 'red-velvet-lemon', cat: 'signature-cakes', sar: 72, tasting: true, unit: ['6 قطع', '6 pieces'],
    en: ['Red Velvet Lemon', 'Cocoa-red velvet sponge brightened with lemon curd and cream-cheese frosting.'],
    ar: ['ريد فلفت ليمون', 'إسفنج الريد فلفت بالكاكاو مع كريمة الليمون وفروستنغ الجبن الكريمي.'] },
  { slug: 'vanilla-berry-cake', cat: 'signature-cakes', sar: 60, tasting: true, unit: ['6 قطع', '6 pieces'],
    en: ['Vanilla & Berry Cake', 'Madagascar vanilla sponge layered with mixed-berry compote and mascarpone cream.'],
    ar: ['فانيليا وتوت', 'إسفنج الفانيليا مع كومبوت التوت المشكل وكريمة الماسكاربوني.'] },
  { slug: 'saffron-cake', cat: 'signature-cakes', sar: 48, tasting: true, unit: ['6 قطع', '6 pieces'],
    en: ['Saffron Cake', 'Saffron- and cardamom-scented sponge with a delicate rosewater cream.'],
    ar: ['كيك الزعفران', 'إسفنج معطر بالزعفران والهيل مع كريمة ماء الورد الرقيقة.'] },
  { slug: 'honey-cake', cat: 'signature-cakes', sar: 90, tasting: true, featured: true, unit: ['8 – 10 قطع', '8–10 pieces'],
    en: ['Honey Cake', 'Thin honey-spice layers built into a tall cake with smetana-style cream between each one.'],
    ar: ['كيك العسل', 'طبقات رقيقة من العسل والبهارات مبنية بكريمة ناعمة بين كل طبقة.'] },
  { slug: 'chocolate-orange-mousse', cat: 'signature-cakes', sar: 72, tasting: true, unit: ['6 قطع', '6 pieces'],
    en: ['Chocolate & Orange Mousse', 'Dark chocolate mousse over an orange-blossom sponge with candied orange.'],
    ar: ['موس شوكولاته وبرتقال', 'موس الشوكولاتة الداكنة فوق إسفنج بزهر البرتقال مع برتقال مسكر.'] },
  { slug: 'english-cake', cat: 'signature-cakes', sar: 72, unit: ['10 – 12 قطعة', '10–12 pieces'],
    en: ['English Cake', 'A classic dense butter pound cake studded with candied fruit and citrus zest.'],
    ar: ['انقلش كيك', 'كيك زبدة كثيف كلاسيكي مع فواكه مسكرة وبرش الحمضيات.'] },
  { slug: 'tiramisu', cat: 'signature-cakes', sar: 72, tasting: true, featured: true, unit: ['6 قطع', '6 pieces'],
    en: ['Tiramisu', 'Espresso-soaked savoiardi layered with mascarpone cream and a dusting of cocoa.'],
    ar: ['تراميسو', 'بسكويت سافوياردي منقوع بالإسبريسو مع كريمة الماسكاربوني ورشة كاكاو.'] },
  { slug: 'brownie', cat: 'signature-cakes', sar: 90, unit: ['24 قطعة', '24 pieces'],
    en: ['Brownie', 'Dense, fudgy dark-chocolate brownie with a crackled top, cut for sharing.'],
    ar: ['براوني', 'براوني شوكولاتة داكنة كثيف مع قشرة متشققة، مقطع للمشاركة.'] },
  { slug: 'creme-caramel', cat: 'signature-cakes', sar: 2, tasting: true, unit: ['الحبة', 'per piece'],
    en: ['Crème Caramel', 'Silky vanilla custard set over a pool of amber caramel.'],
    ar: ['كريم كراميل', 'كاسترد فانيليا حريري فوق طبقة من الكراميل الذهبي.'] },
  { slug: 'swiss-roll', cat: 'signature-cakes', sar: 72, unit: ['10 – 12 قطعة', '10–12 pieces'],
    en: ['Swiss Roll', 'Light sponge rolled around a smooth vanilla cream filling.'],
    ar: ['سويس رول', 'إسفنج خفيف ملفوف حول حشوة كريمة فانيليا ناعمة.'] },

  // ── Cookies ───────────────────────────────────────────────────────────
  { slug: 'classic-chocolate-chip-cookie', cat: 'cookies', sar: 3, tasting: true, unit: ['الحبة', 'per piece'],
    en: ['Classic Chocolate Chip Cookie', 'A soft-centred classic loaded with chocolate chips.'],
    ar: ['كوكيز شوكلت كلاسيك', 'كوكيز كلاسيكي بمركز طري ومحمّل بقطع الشوكولاتة.'] },
  { slug: 'french-cookie', cat: 'cookies', sar: 2.5, tasting: true, unit: ['الحبة', 'per piece'],
    en: ['French Cookie', 'A refined butter cookie with a delicate, sandy crumb.'],
    ar: ['فرنش كوكيز', 'كوكيز زبدة راقي بقوام رملي رقيق.'] },
  { slug: 'butter-cookie', cat: 'cookies', sar: 2.5, tasting: true, unit: ['الحبة', 'per piece'],
    en: ['Butter Cookie', 'A simple, generously buttery shortbread-style cookie.'],
    ar: ['بتر كوكيز', 'كوكيز زبدة بسيط وغني بنكهة الزبدة.'] },

  // ── Traditional Sweets ───────────────────────────────────────────────
  { slug: 'basbousa-tray', cat: 'traditional-sweets', sar: 30, unit: ['2.5 كيلو', '2.5 kg'],
    en: ['Basbousa Tray', 'Semolina cake soaked in sugar syrup, baked to order by the tray.'],
    ar: ['بسبوسه صينيه', 'كيك السميد المنقوع بالقطر، يُخبز حسب الطلب بالصينية.'] },
  { slug: 'cheese-basbousa-tray', cat: 'traditional-sweets', sar: 45, unit: ['2.5 كيلو', '2.5 kg'],
    en: ['Cheese Basbousa Tray', 'Basbousa layered with a creamy cheese filling, soaked in syrup.'],
    ar: ['تشيز بسبوسه صينيه', 'بسبوسة بحشوة الجبن الكريمي، منقوعة بالقطر.'] },
  { slug: 'qishta-basbousa-tray', cat: 'traditional-sweets', sar: 45, unit: ['2.5 كيلو', '2.5 kg'],
    en: ['Qishta Basbousa Tray', 'Basbousa layered with clotted-cream qishta, soaked in syrup.'],
    ar: ['بسبوسه قشطه صينيه', 'بسبوسة بحشوة القشطة، منقوعة بالقطر.'] },
] as const

async function main() {
  await seedCatalog()
  await seedAdmin()
}

async function seedCatalog() {
  for (const [i, c] of categories.entries()) {
    await db.category.upsert({
      where: { slug: c.slug },
      update: { translations: { deleteMany: {}, create: [{ locale: 'ar', name: c.ar }, { locale: 'en', name: c.en }] } },
      create: {
        slug: c.slug,
        sortOrder: i,
        translations: { create: [{ locale: 'ar', name: c.ar }, { locale: 'en', name: c.en }] },
      },
    })
  }
  const catIds = Object.fromEntries((await db.category.findMany()).map((c) => [c.slug, c.id]))
  const currentSlugs = new Set(products.map((p) => p.slug))

  for (const [i, p] of products.entries()) {
    const t = (locale: 'ar' | 'en') => ({
      locale,
      title: p[locale][0],
      description: p[locale][1],
      badge: null,
      unitLabel: locale === 'ar' ? p.unit[0] : p.unit[1],
    })
    await db.product.upsert({
      where: { slug: p.slug },
      update: {
        categoryId: catIds[p.cat]!,
        priceHalalas: Math.round(p.sar * 100),
        inStock: true,
        isTastingMenu: 'tasting' in p ? p.tasting : false,
        isFeatured: 'featured' in p ? p.featured : false,
        archivedAt: null,
        translations: { deleteMany: {}, create: [t('ar'), t('en')] },
      },
      create: {
        slug: p.slug,
        categoryId: catIds[p.cat]!,
        priceHalalas: Math.round(p.sar * 100),
        inStock: true,
        isTastingMenu: 'tasting' in p ? p.tasting : false,
        isFeatured: 'featured' in p ? p.featured : false,
        sortOrder: i,
        translations: { create: [t('ar'), t('en')] },
      },
    })
  }

  // Retire any earlier demo catalog that isn't part of the real menu, rather
  // than hard-deleting (a past order or tasting request may still reference
  // it — archived rows are simply hidden from every storefront/admin list).
  const { count: archived } = await db.product.updateMany({
    where: { slug: { notIn: [...currentSlugs] }, archivedAt: null },
    data: { archivedAt: new Date(), inStock: false },
  })
  if (archived > 0) console.log(`Archived ${archived} product(s) no longer on the menu.`)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function warn(lines: string[]) {
  console.warn(['', ...lines.map((l, i) => (i === 0 ? `⚠️  ${l}` : `    ${l}`)), ''].join('\n'))
}

async function seedAdmin() {
  // First admin account. Credentials come from the environment, never code.
  // Values pasted into dashboards often carry stray spaces or newlines.
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase()
  const rawPassword = process.env.SEED_ADMIN_PASSWORD
  const password = rawPassword?.trim()
  const resetPassword = process.env.SEED_ADMIN_RESET_PASSWORD === 'true'

  if (!email || !password) {
    console.log('SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set: skipped admin user.')
    return
  }
  if (rawPassword !== password) {
    console.warn('ℹ️  SEED_ADMIN_PASSWORD had leading/trailing whitespace; it was trimmed.')
  }
  if (!EMAIL_RE.test(email)) {
    warn(['SEED_ADMIN_EMAIL is not a valid e-mail address: admin account NOT created.'])
    return
  }
  // TODO(before launch): restore the strong password policy (12+ chars,
  // 3 character classes) that was relaxed for the preview phase.

  const existing = await db.user.findUnique({ where: { email }, select: { id: true, role: true } })

  if (!existing) {
    await db.user.create({
      data: { email, name: 'Onista Admin', role: 'ADMIN', passwordHash: await bcrypt.hash(password, 12) },
    })
    console.log(`✓ Admin account created: ${email}`)
    return
  }

  if (resetPassword) {
    // Explicit recovery path: new password, lockout cleared, and every
    // existing session revoked. Remove the flag after the deploy.
    await db.user.update({
      where: { id: existing.id },
      data: {
        passwordHash: await bcrypt.hash(password, 12),
        failedLoginAttempts: 0,
        lockedUntil: null,
        isActive: true,
        sessionVersion: { increment: 1 },
      },
    })
    warn([
      `Admin password RESET for ${email} (all sessions signed out).`,
      'Remove SEED_ADMIN_RESET_PASSWORD from the environment now.',
    ])
    return
  }

  console.log(`✓ Admin account exists: ${email} (unchanged; set SEED_ADMIN_RESET_PASSWORD=true to reset its password)`)
  if (existing.role !== 'ADMIN') {
    warn([`${email} exists with role ${existing.role}, not ADMIN. Its role was not changed.`])
  }
}

// On Vercel a seeding problem must never fail the deploy (the storefront still
// ships and the build log explains what to fix). Locally it fails loudly.
const failBuild = !process.env.VERCEL

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(failBuild ? e : `\n⚠️  Seeding failed (deploy continues): ${e instanceof Error ? e.message : e}\n`)
    await db.$disconnect()
    process.exit(failBuild ? 1 : 0)
  })
