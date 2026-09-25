-- Delivery workflow (ready-for-pickup + OTP-confirmed handoff), tiered
-- delivery pricing by schedule length, admin-editable hero tagline, and
-- paid extra tasting samples.

-- AlterEnum
-- New value must be committed before any statement in this file can
-- reference it (matches the pattern used in 20260924233000_driver_role).
ALTER TYPE "DeliveryStatus" ADD VALUE 'READY_FOR_PICKUP';

-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "deliveryFeeHalalas" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "otpCode" VARCHAR(6),
ADD COLUMN     "pickedUpAt" TIMESTAMP(3),
ADD COLUMN     "preparedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SchedulingSettings" DROP COLUMN "deliveryFeeHalalas",
ADD COLUMN     "deliveryFeeBiweekHalalas" INTEGER NOT NULL DEFAULT 350,
ADD COLUMN     "deliveryFeeMonthHalalas" INTEGER NOT NULL DEFAULT 200,
ADD COLUMN     "deliveryFeeOneOffHalalas" INTEGER NOT NULL DEFAULT 700,
ADD COLUMN     "deliveryFeeWeekHalalas" INTEGER NOT NULL DEFAULT 500,
ADD COLUMN     "kitchenGoogleMapsUrl" VARCHAR(500),
ADD COLUMN     "tastingExtraFeeHalalas" INTEGER NOT NULL DEFAULT 500,
ALTER COLUMN "minLeadDays" SET DEFAULT 2;

-- AlterTable
-- DEFAULT provided (unlike the raw prisma diff) because SiteContent
-- already has one seeded row from 20260925120000_site_content.
ALTER TABLE "SiteContent" ADD COLUMN     "heroTaglineAr" VARCHAR(200) NOT NULL DEFAULT 'شريكك الموثوق لتزويد كافيهات جدة يوميًا',
ADD COLUMN     "heroTaglineEn" VARCHAR(200) NOT NULL DEFAULT 'Your trusted daily supplier for Jeddah cafés';

-- AlterTable
ALTER TABLE "TastingRequest" ADD COLUMN     "extraFeeHalalas" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "extraSamplesCount" INTEGER NOT NULL DEFAULT 0;
