-- Store credit for cafés. A café that cancels before the kitchen starts work
-- is credited here rather than refunded through a payment gateway.

-- AlterTable
ALTER TABLE "CafeProfile" ADD COLUMN     "walletBalanceHalalas" INTEGER NOT NULL DEFAULT 0;

-- A wallet must never go negative: the database is the last line of defence
-- if application logic ever gets a decrement wrong.
ALTER TABLE "CafeProfile" ADD CONSTRAINT "CafeProfile_wallet_non_negative" CHECK ("walletBalanceHalalas" >= 0);
