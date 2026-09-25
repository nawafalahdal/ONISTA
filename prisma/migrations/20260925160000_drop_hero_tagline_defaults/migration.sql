-- The defaults in 20260925130000 existed only to backfill the single
-- pre-existing SiteContent row when the columns were added NOT NULL.
-- Dropping them now matches schema.prisma, which declares no default:
-- every insert supplies the text (see SITE_CONTENT_DEFAULTS).

-- AlterTable
ALTER TABLE "SiteContent" ALTER COLUMN "heroTaglineAr" DROP DEFAULT,
ALTER COLUMN "heroTaglineEn" DROP DEFAULT;
