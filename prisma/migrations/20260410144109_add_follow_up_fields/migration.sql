-- AlterTable
ALTER TABLE "Outreach" ADD COLUMN     "followUpCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "followUpSent" TIMESTAMP(3);
