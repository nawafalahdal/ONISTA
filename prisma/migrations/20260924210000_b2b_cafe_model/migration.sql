-- Onista: switch to a closed B2B café model.
--
-- This is a pre-launch prototype: the only existing rows are seed/test data
-- (a handful of sample orders and test accounts), so this migration clears
-- the tables whose shape changes incompatibly (Order/OrderItem → Order/
-- Delivery/DeliveryItem, and non-admin Users) instead of attempting a
-- row-by-row data transform. Catalog, categories and tasting requests are
-- preserved.

-- ── 1. Drop data that cannot survive the new shape ─────────────────────────
DELETE FROM "OrderItem";
DELETE FROM "Order";
DELETE FROM "User" WHERE "role" != 'ADMIN';

-- ── 2. User: drop the old CUSTOMER role, add café-account columns ──────────
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "email" TYPE VARCHAR(254);
ALTER TABLE "User" ALTER COLUMN "name" TYPE VARCHAR(100);
ALTER TABLE "User" ADD COLUMN "phone" VARCHAR(20);
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "createdById" TEXT;
ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;

CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
DROP INDEX "User_role_idx";
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");

ALTER TYPE "Role" RENAME TO "Role_old";
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF', 'CAFE');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING ("role"::text::"Role");
DROP TYPE "Role_old";

ALTER TABLE "User" ADD CONSTRAINT "User_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Exactly one sign-in identifier, matching the role.
ALTER TABLE "User" ADD CONSTRAINT "User_identifier_matches_role"
  CHECK (
    (role IN ('ADMIN', 'STAFF') AND email IS NOT NULL AND phone IS NULL) OR
    (role = 'CAFE' AND phone IS NOT NULL AND email IS NULL)
  );

-- ── 3. Order / OrderItem → Order / Delivery / DeliveryItem ─────────────────
DROP TABLE "OrderItem";
DROP TABLE "Order";

ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
DROP TYPE "OrderStatus_old";

ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'APPLE_PAY', 'BANK_TRANSFER');
DROP TYPE "PaymentMethod_old";

ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
DROP TYPE "PaymentStatus_old";

DROP TYPE "FulfillmentMethod"; -- every café order is delivered; no pickup option

CREATE TYPE "OrderType" AS ENUM ('ONE_OFF', 'WEEKLY_SCHEDULE');
CREATE TYPE "DeliveryStatus" AS ENUM ('SCHEDULED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');

-- ── 4. Café identity tables ─────────────────────────────────────────────────
CREATE TABLE "CafeProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cafeName" VARCHAR(120) NOT NULL,
    "legalName" VARCHAR(160),
    "contactName" VARCHAR(100),
    "contactPhone" VARCHAR(20) NOT NULL,
    "contactEmail" VARCHAR(254),
    "vatNumber" VARCHAR(15),
    "crNumber" VARCHAR(20),
    "internalNotes" VARCHAR(1000),
    "preferredLocale" "Locale" NOT NULL DEFAULT 'ar',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CafeProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CafeProfile_userId_key" ON "CafeProfile"("userId");
ALTER TABLE "CafeProfile" ADD CONSTRAINT "CafeProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CafeAddress" (
    "id" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "label" VARCHAR(60) NOT NULL,
    "city" VARCHAR(60) NOT NULL,
    "district" VARCHAR(80) NOT NULL,
    "street" VARCHAR(120) NOT NULL,
    "buildingNumber" VARCHAR(10),
    "additionalNumber" VARCHAR(10),
    "postalCode" VARCHAR(10),
    "deliveryNotes" VARCHAR(300),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CafeAddress_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CafeAddress_cafeId_idx" ON "CafeAddress"("cafeId");
ALTER TABLE "CafeAddress" ADD CONSTRAINT "CafeAddress_cafeId_fkey"
  FOREIGN KEY ("cafeId") REFERENCES "CafeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── 5. Product: schedulable flag, drop unused ───────────────────────────────
ALTER TABLE "Product" ADD COLUMN "isSchedulable" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX "Product_archivedAt_isSchedulable_idx" ON "Product"("archivedAt", "isSchedulable");

-- ── 6. New Order / Delivery / DeliveryItem ─────────────────────────────────
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" SERIAL NOT NULL,
    "type" "OrderType" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "cafeId" TEXT NOT NULL,
    "weekStartDate" DATE,
    "notes" VARCHAR(500),
    "locale" "Locale" NOT NULL DEFAULT 'ar',
    "subtotalHalalas" INTEGER NOT NULL,
    "deliveryFeeHalalas" INTEGER NOT NULL DEFAULT 0,
    "vatHalalas" INTEGER NOT NULL,
    "totalHalalas" INTEGER NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX "Order_cafeId_createdAt_idx" ON "Order"("cafeId", "createdAt");
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
CREATE INDEX "Order_type_weekStartDate_idx" ON "Order"("type", "weekStartDate");
ALTER TABLE "Order" ADD CONSTRAINT "Order_cafeId_fkey"
  FOREIGN KEY ("cafeId") REFERENCES "CafeProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_weekly_needs_weekStart"
  CHECK (type != 'WEEKLY_SCHEDULE' OR "weekStartDate" IS NOT NULL);
ALTER TABLE "Order" ADD CONSTRAINT "Order_amounts_nonneg"
  CHECK ("subtotalHalalas" >= 0 AND "deliveryFeeHalalas" >= 0 AND "vatHalalas" >= 0 AND "totalHalalas" >= 0);

CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "deliveryDate" DATE NOT NULL,
    "timeWindow" VARCHAR(20),
    "status" "DeliveryStatus" NOT NULL DEFAULT 'SCHEDULED',
    "addressId" TEXT,
    "addressSnapshot" VARCHAR(600) NOT NULL,
    "recipientName" VARCHAR(100),
    "recipientPhone" VARCHAR(20),
    "subtotalHalalas" INTEGER NOT NULL,
    "deliveredAt" TIMESTAMP(3),
    "staffNotes" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Delivery_orderId_deliveryDate_key" ON "Delivery"("orderId", "deliveryDate");
CREATE INDEX "Delivery_deliveryDate_status_idx" ON "Delivery"("deliveryDate", "status");
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_addressId_fkey"
  FOREIGN KEY ("addressId") REFERENCES "CafeAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_subtotal_nonneg" CHECK ("subtotalHalalas" >= 0);
-- No same-day delivery: the date must be strictly after the day the row was created.
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_future_date"
  CHECK ("deliveryDate" > "createdAt"::date);

CREATE TABLE "DeliveryItem" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "productId" TEXT,
    "titleSnapshot" VARCHAR(120) NOT NULL,
    "unitPriceHalalas" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lineTotalHalalas" INTEGER NOT NULL,
    CONSTRAINT "DeliveryItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DeliveryItem_deliveryId_productId_key" ON "DeliveryItem"("deliveryId", "productId");
CREATE INDEX "DeliveryItem_productId_idx" ON "DeliveryItem"("productId");
ALTER TABLE "DeliveryItem" ADD CONSTRAINT "DeliveryItem_deliveryId_fkey"
  FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeliveryItem" ADD CONSTRAINT "DeliveryItem_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DeliveryItem" ADD CONSTRAINT "DeliveryItem_quantity_range" CHECK ("quantity" BETWEEN 1 AND 200);
ALTER TABLE "DeliveryItem" ADD CONSTRAINT "DeliveryItem_amounts_nonneg"
  CHECK ("unitPriceHalalas" >= 0 AND "lineTotalHalalas" >= 0);

-- ── 7. Kitchen calendar ──────────────────────────────────────────────────────
CREATE TABLE "SchedulingSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "cutoffHour" INTEGER NOT NULL DEFAULT 22,
    "minLeadDays" INTEGER NOT NULL DEFAULT 1,
    "maxAdvanceDays" INTEGER NOT NULL DEFAULT 60,
    "deliveryWeekdays" INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6]::INTEGER[],
    "deliveryFeeHalalas" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SchedulingSettings_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "SchedulingSettings" ADD CONSTRAINT "SchedulingSettings_minLeadDays_positive" CHECK ("minLeadDays" >= 1);
ALTER TABLE "SchedulingSettings" ADD CONSTRAINT "SchedulingSettings_single_row" CHECK ("id" = 1);
INSERT INTO "SchedulingSettings" ("id", "updatedAt") VALUES (1, CURRENT_TIMESTAMP);

CREATE TABLE "BlackoutDate" (
    "date" DATE NOT NULL,
    "reasonAr" VARCHAR(120),
    "reasonEn" VARCHAR(120),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BlackoutDate_pkey" PRIMARY KEY ("date")
);

-- ── 8. Tasting requests: link to a converted café account ──────────────────
ALTER TABLE "TastingRequest" ADD COLUMN "convertedCafeId" TEXT;
ALTER TABLE "TastingRequest" ADD CONSTRAINT "TastingRequest_convertedCafeId_fkey"
  FOREIGN KEY ("convertedCafeId") REFERENCES "CafeProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
