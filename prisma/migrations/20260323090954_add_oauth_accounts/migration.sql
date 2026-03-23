-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "TradeDirection" AS ENUM ('LONG', 'SHORT');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'APPROVED', 'CHARGED', 'REFUNDED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "credits" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER',
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "phoneNumber" SET DEFAULT '',
ALTER COLUMN "nickname" SET DEFAULT '';

-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN     "adminNote" TEXT,
ADD COLUMN     "paidAt" TIMESTAMPTZ,
ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaybackCalculation" (
    "id" TEXT NOT NULL,
    "exchangeName" TEXT NOT NULL,
    "tradeType" TEXT NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "leverage" INTEGER NOT NULL DEFAULT 1,
    "makerPct" INTEGER NOT NULL DEFAULT 30,
    "monthlyFees" DOUBLE PRECISION NOT NULL,
    "payback" DOUBLE PRECISION NOT NULL,
    "yearlySavings" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaybackCalculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChartIdea" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "direction" "TradeDirection" NOT NULL,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "stopLoss" DOUBLE PRECISION NOT NULL,
    "takeProfit" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ChartIdea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChartAnalysis" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "pair" TEXT,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "summary" TEXT NOT NULL,
    "trend" TEXT NOT NULL,
    "patterns" TEXT NOT NULL,
    "supportLevels" TEXT NOT NULL,
    "resistanceLevels" TEXT NOT NULL,
    "indicators" TEXT NOT NULL,
    "tradeSetup" TEXT NOT NULL,
    "analysisData" TEXT,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "chargedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ChartAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagedContent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleKo" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL,
    "descriptionKo" TEXT NOT NULL DEFAULT '',
    "thumbnailUrl" TEXT,
    "sourceName" TEXT NOT NULL,
    "sourceCategory" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManagedContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentBotLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentBotLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "ManagedContent_sourceUrl_key" ON "ManagedContent"("sourceUrl");

-- CreateIndex
CREATE INDEX "ManagedContent_type_idx" ON "ManagedContent"("type");

-- CreateIndex
CREATE INDEX "ManagedContent_status_idx" ON "ManagedContent"("status");

-- CreateIndex
CREATE INDEX "ManagedContent_publishedAt_idx" ON "ManagedContent"("publishedAt");

-- CreateIndex
CREATE INDEX "ManagedContent_type_status_idx" ON "ManagedContent"("type", "status");

-- CreateIndex
CREATE INDEX "ContentBotLog_action_idx" ON "ContentBotLog"("action");

-- CreateIndex
CREATE INDEX "ContentBotLog_createdAt_idx" ON "ContentBotLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChartIdea" ADD CONSTRAINT "ChartIdea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChartAnalysis" ADD CONSTRAINT "ChartAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
