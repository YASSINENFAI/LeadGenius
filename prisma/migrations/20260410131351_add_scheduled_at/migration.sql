-- AlterTable
ALTER TABLE "Outreach" ADD COLUMN     "scheduledAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Outreach_scheduledAt_idx" ON "Outreach"("scheduledAt");
