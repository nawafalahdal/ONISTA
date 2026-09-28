-- The About section now shows two figures (partner cafés, turnaround), so the
-- founding-year stat is gone, and the body copy no longer claims a French
-- viennoiserie programme the kitchen does not run.

-- Refresh the seeded copy, but only where it is still the original text, so an
-- admin's own edit is never overwritten.
UPDATE "SiteContent"
SET "aboutBodyAr" = 'أونيستا مطبخ حلويات جملة في جدة: كيك وتشيز كيك وانتريميه، بسبوسة وكوكيز وماكرون — تُنتج بطلب مسبق لكافيهاتنا الشريكة، على جدول توصيل ثابت تحدده مرة واحدة وتعتمد عليه كل أسبوع. لا واجهة بيع مباشر ولا طابور تجزئة: إنتاج حسب جدولك، بجودة ثابتة، وفاتورة أسبوعية واحدة واضحة.'
WHERE "id" = 1 AND "aboutBodyAr" LIKE '%فرنسي%';

UPDATE "SiteContent"
SET "aboutBodyEn" = 'Onista is a wholesale dessert kitchen in Jeddah: cakes, cheesecakes and entremets, basbousa, cookies and macarons — produced to order for our partner cafés on a fixed delivery schedule you set once and rely on every week. No walk-in counter, no retail queue: made to your calendar, consistent every time, and invoiced as one clear weekly order.'
WHERE "id" = 1 AND "aboutBodyEn" LIKE '%French-technique%';

-- AlterTable
ALTER TABLE "SiteContent" DROP COLUMN "statSinceYear";
