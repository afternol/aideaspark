-- AlterTable
ALTER TABLE "TrendCache" ADD COLUMN "slug" TEXT;
ALTER TABLE "TrendCache" ADD COLUMN "report" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "TrendCache_slug_key" ON "TrendCache"("slug");
