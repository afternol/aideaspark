-- AlterTable
ALTER TABLE "BusinessPlan" ADD COLUMN     "authUserId" TEXT;

-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "authUserId" TEXT;

-- AlterTable
ALTER TABLE "CustomIdea" ADD COLUMN     "authUserId" TEXT;

-- CreateIndex
CREATE INDEX "BusinessPlan_authUserId_idx" ON "BusinessPlan"("authUserId");

-- CreateIndex
CREATE INDEX "Collection_authUserId_idx" ON "Collection"("authUserId");

-- CreateIndex
CREATE INDEX "CustomIdea_authUserId_idx" ON "CustomIdea"("authUserId");

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_authUserId_fkey" FOREIGN KEY ("authUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomIdea" ADD CONSTRAINT "CustomIdea_authUserId_fkey" FOREIGN KEY ("authUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPlan" ADD CONSTRAINT "BusinessPlan_authUserId_fkey" FOREIGN KEY ("authUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
