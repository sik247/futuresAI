/*
  Warnings:

  - Made the column `titleImageUrl` on table `Exchange` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Exchange" ALTER COLUMN "titleImageUrl" SET NOT NULL;
