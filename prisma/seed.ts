import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) })
const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`

const categories = [
  { slug: 'signature-cakes', ar: 'الكيك المميز', en: 'Signature Cakes' },
  { slug: 'entremets', ar: 'انتريميه', en: 'Entremets' },
  { slug: 'viennoiserie', ar: 'المخبوزات الفرنسية', en: 'Viennoiserie' },
  { slug: 'petits-fours', ar: 'حلويات صغيرة', en: 'Petits Fours' },
]

const products = [
  { slug: 'rose-pistachio-layer', cat: 'signature-cakes', sar: 185, tasting: true, featured: true, image: 'photo-1578985545062-69928b1d9587',
    en: ['Rose Pistachio Layer', 'Pistachio sponge, rose-water crémeux and raspberry confit under a velvet glaze.', 'Signature'],
    ar: ['كيكة الورد والفستق', 'إسفنج الفستق مع كريمو ماء الورد وكونفي التوت تحت طبقة لامعة.', 'مميز'] },
  { slug: 'noir-70-chocolate', cat: 'signature-cakes', sar: 210, tasting: true, featured: true, image: 'photo-1606313564200-e75d5e30476c',
    en: ['Noir 70% Chocolate', 'Single-origin dark chocolate ganache, cocoa nib praline and salted caramel core.', 'Bestseller'],
    ar: ['كيكة الشوكولاتة الداكنة ٧٠٪', 'غاناش شوكولاتة داكنة أحادية المصدر مع برالين الكاكاو وقلب من الكراميل المملح.', 'الأكثر مبيعًا'] },
  { slug: 'saffron-milk-cake', cat: 'signature-cakes', sar: 160, tasting: true, image: 'photo-1565958011703-44f9829ba187',
    en: ['Saffron Milk Cake', 'Tres leches soaked in saffron and cardamom milk, crowned with torched meringue.'],
    ar: ['كيكة الحليب بالزعفران', 'تريس ليتشيز منقوعة بحليب الزعفران والهيل ومتوجة بالميرنغ المحمص.'] },
  { slug: 'berry-chantilly-entremet', cat: 'entremets', sar: 42, tasting: true, image: 'photo-1488477181946-6428a0291777',
    en: ['Berry Chantilly Entremet', 'Vanilla bean mousse, mixed-berry insert and almond sablé base.'],
    ar: ['انتريميه التوت', 'موس الفانيليا مع حشوة التوت المشكل وقاعدة سابليه اللوز.'] },
  { slug: 'lotus-cheesecake-slice', cat: 'entremets', sar: 32, image: 'photo-1533134242443-d4fd215305ad',
    en: ['Lotus Cheesecake Slice', 'Baked New York cheesecake on a speculoos crust with Lotus butter ripple.'],
    ar: ['تشيز كيك اللوتس', 'تشيز كيك نيويورك مخبوز على قاعدة سبيكولوس مع زبدة اللوتس.'] },
  { slug: 'butter-croissant', cat: 'viennoiserie', sar: 14, tasting: true, image: 'photo-1555507036-ab1f4038808a',
    en: ['Butter Croissant', '72-hour laminated dough with French AOP butter. Shatteringly crisp.'],
    ar: ['كرواسون بالزبدة', 'عجينة مرققة لمدة ٧٢ ساعة بالزبدة الفرنسية. مقرمش بشكل استثنائي.'] },
  { slug: 'date-tahini-babka', cat: 'viennoiserie', sar: 58, image: 'photo-1509440159596-0249088772ff',
    en: ['Date & Tahini Babka', 'Brioche swirled with Medjool date paste, tahini and toasted sesame.', 'New'],
    ar: ['بابكا التمر والطحينة', 'بريوش ملفوف بعجينة تمر المجهول والطحينة والسمسم المحمص.', 'جديد'] },
  { slug: 'macaron-collection', cat: 'petits-fours', sar: 78, tasting: true, image: 'photo-1569864358642-9d1684040f43',
    en: ['Macaron Collection', 'Box of twelve: rose-lychee, pistachio, salted caramel, yuzu and more.'],
    ar: ['تشكيلة الماكرون', 'علبة من اثنتي عشرة قطعة: ورد وليتشي، فستق، كراميل مملح، يوزو والمزيد.'] },
  { slug: 'brown-butter-cookies', cat: 'petits-fours', sar: 36, inStock: false, image: 'photo-1558961363-fa8fdf82db35',
    en: ['Brown Butter Cookies', 'Six chewy cookies with brown butter, Valrhona chunks and flaky salt.'],
    ar: ['كوكيز الزبدة البنية', 'ست قطع كوكيز طرية بالزبدة البنية وقطع شوكولاتة فالرونا وملح البحر.'] },
] as const

async function main() {
  // Safe to run on every deploy: the sample catalog is only inserted into an
  // empty database, and an existing admin account is never modified unless
  // SEED_ADMIN_RESET_PASSWORD=true is set explicitly.
  if ((await db.category.count()) === 0) await seedCatalog()
  else console.log('Catalog exists: skipped sample data.')
  await seedAdmin()
}

async function seedCatalog() {
  for (const [i, c] of categories.entries()) {
    await db.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        slug: c.slug,
        sortOrder: i,
        translations: { create: [{ locale: 'ar', name: c.ar }, { locale: 'en', name: c.en }] },
      },
    })
  }
  const catIds = Object.fromEntries((await db.category.findMany()).map((c) => [c.slug, c.id]))

  for (const [i, p] of products.entries()) {
    const t = (locale: 'ar' | 'en') => ({ locale, title: p[locale][0], description: p[locale][1], badge: p[locale][2] ?? null })
    await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        categoryId: catIds[p.cat]!,
        priceHalalas: p.sar * 100,
        inStock: 'inStock' in p ? p.inStock : true,
        isTastingMenu: 'tasting' in p ? p.tasting : false,
        isFeatured: 'featured' in p ? p.featured : false,
        sortOrder: i,
        translations: { create: [t('ar'), t('en')] },
        images: { create: [{ url: img(p.image), altAr: p.ar[0], altEn: p.en[0] }] },
      },
    })
  }
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
