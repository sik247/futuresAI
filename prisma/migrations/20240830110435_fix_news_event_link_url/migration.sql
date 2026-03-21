/*
  Warnings:

  - Added the required column `linkUrl` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `linkUrl` to the `News` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "linkUrl" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "News" ADD COLUMN     "linkUrl" TEXT NOT NULL;
