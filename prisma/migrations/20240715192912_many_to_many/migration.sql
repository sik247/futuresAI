/*
  Warnings:

  - You are about to drop the column `accountId` on the `Withdrawal` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Withdrawal" DROP CONSTRAINT "Withdrawal_accountId_fkey";

-- AlterTable
ALTER TABLE "Withdrawal" DROP COLUMN "accountId";

-- CreateTable
CREATE TABLE "_ExchangeAccountToWithdrawal" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ExchangeAccountToWithdrawal_AB_unique" ON "_ExchangeAccountToWithdrawal"("A", "B");

-- CreateIndex
CREATE INDEX "_ExchangeAccountToWithdrawal_B_index" ON "_ExchangeAccountToWithdrawal"("B");

-- AddForeignKey
ALTER TABLE "_ExchangeAccountToWithdrawal" ADD CONSTRAINT "_ExchangeAccountToWithdrawal_A_fkey" FOREIGN KEY ("A") REFERENCES "ExchangeAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExchangeAccountToWithdrawal" ADD CONSTRAINT "_ExchangeAccountToWithdrawal_B_fkey" FOREIGN KEY ("B") REFERENCES "Withdrawal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
