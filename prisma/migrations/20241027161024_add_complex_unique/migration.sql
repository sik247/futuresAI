/*
  Warnings:

  - A unique constraint covering the columns `[accountId,apiCreatedAt,amount]` on the table `Trade` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Trade_accountId_apiCreatedAt_amount_key" ON "Trade"("accountId", "apiCreatedAt", "amount");
