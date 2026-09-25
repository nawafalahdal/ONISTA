-- Admin-editable storefront marketing copy (About paragraph + stat numbers),
-- so these no longer require a code change to update.

-- CreateTable
CREATE TABLE "SiteContent" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "aboutBodyAr" VARCHAR(2000) NOT NULL,
    "aboutBodyEn" VARCHAR(2000) NOT NULL,
    "statSinceYear" VARCHAR(20) NOT NULL,
    "statPartnerCafes" VARCHAR(20) NOT NULL,
    "statOnTimeRate" VARCHAR(20) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SiteContent" ADD CONSTRAINT "SiteContent_single_row" CHECK ("id" = 1);
