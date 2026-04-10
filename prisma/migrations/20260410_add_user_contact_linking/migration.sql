-- Add contact linking fields for invite/post program (first 100 founding members)
ALTER TABLE "User" ADD COLUMN "telegramId" TEXT;
ALTER TABLE "User" ADD COLUMN "telegramUsername" TEXT;
ALTER TABLE "User" ADD COLUMN "realEmail" TEXT;
ALTER TABLE "User" ADD COLUMN "inviteNumber" INTEGER;
ALTER TABLE "User" ADD COLUMN "isFounding100" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
CREATE UNIQUE INDEX "User_inviteNumber_key" ON "User"("inviteNumber");
