-- AlterTable
ALTER TABLE "User" ADD COLUMN "isPremium" BOOLEAN NOT NULL DEFAULT false;

-- Migrate existing chatEnabled users to premium
UPDATE "User" SET "isPremium" = true WHERE "chatEnabled" = true;
