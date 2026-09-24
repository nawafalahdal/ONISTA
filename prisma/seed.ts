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

  // First admin account. Credentials come from the environment, never code.
  const email = process.env.SEED_ADMIN_EMAIL?.toLowerCase()
  const password = process.env.SEED_ADMIN_PASSWORD
  if (email && password) {
    if (password.length < 12) throw new Error('SEED_ADMIN_PASSWORD must be at least 12 characters')
    await db.user.upsert({
      where: { email },
      update: {},
      create: { email, name: 'Onista Admin', role: 'ADMIN', passwordHash: await bcrypt.hash(password, 12) },
    })
    console.log(`Admin user ready: ${email}`)
  } else {
    console.log('SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set: skipped admin user.')
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })
