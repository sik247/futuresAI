-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN     "address" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "network" TEXT NOT NULL DEFAULT 'TRC20';
