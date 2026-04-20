-- User: TRX micro-purchase credit counters + auto-refill wallet balance
ALTER TABLE "User" ADD COLUMN "chartCreditsRemaining" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "chatCreditsRemaining" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "trxBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Payment: currency, productType, creditsAdded, trxAdded (non-breaking additions)
ALTER TABLE "Payment" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USDT';
ALTER TABLE "Payment" ADD COLUMN "productType" TEXT;
ALTER TABLE "Payment" ADD COLUMN "creditsAdded" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Payment" ADD COLUMN "trxAdded" DOUBLE PRECISION NOT NULL DEFAULT 0;
