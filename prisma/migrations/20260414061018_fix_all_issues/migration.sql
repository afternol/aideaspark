-- ============================================================
-- Migration: fix_all_issues
-- ① JSON文字列 → JSONB (USING キャストでデータ保持)
-- ② Comment/Reaction/Declaration に userId 追加
-- ③ Comment に deletedAt (ソフトデリート) 追加
-- ④ FK制約を ViewHistory/Notification に追加
-- ⑤ AiUsageLog テーブル新規作成
-- ============================================================

-- AlterTable: Idea (String→JSONB, データ保持)
ALTER TABLE "Idea" ALTER COLUMN "tags" TYPE JSONB USING tags::jsonb;
ALTER TABLE "Idea" ALTER COLUMN "scores" TYPE JSONB USING scores::jsonb;
ALTER TABLE "Idea" ALTER COLUMN "scoreComments" TYPE JSONB USING "scoreComments"::jsonb;
ALTER TABLE "Idea" ALTER COLUMN "trendKeywords" TYPE JSONB USING "trendKeywords"::jsonb;

-- AlterTable: TrendCache (String→JSONB, データ保持)
ALTER TABLE "TrendCache" ALTER COLUMN "relatedIdeaIds" TYPE JSONB USING "relatedIdeaIds"::jsonb;

-- AlterTable: CustomIdea (String→JSONB, データ保持)
ALTER TABLE "CustomIdea" ALTER COLUMN "conditions" TYPE JSONB USING conditions::jsonb;
ALTER TABLE "CustomIdea" ALTER COLUMN "result" TYPE JSONB USING result::jsonb;

-- AlterTable: BusinessPlan (String→JSONB, データ保持)
ALTER TABLE "BusinessPlan" ALTER COLUMN "content" TYPE JSONB USING content::jsonb;

-- AlterTable: Comment (userId + deletedAt 追加)
ALTER TABLE "Comment" ADD COLUMN "userId" TEXT;
ALTER TABLE "Comment" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: Reaction (userId 追加)
ALTER TABLE "Reaction" ADD COLUMN "userId" TEXT;

-- AlterTable: Declaration (userId 追加)
ALTER TABLE "Declaration" ADD COLUMN "userId" TEXT;

-- CreateTable: AiUsageLog
CREATE TABLE "AiUsageLog" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: AiUsageLog
CREATE INDEX "AiUsageLog_identifier_endpoint_createdAt_idx" ON "AiUsageLog"("identifier", "endpoint", "createdAt");

-- AddForeignKey: Reaction → User
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Comment → User
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Declaration → User
ALTER TABLE "Declaration" ADD CONSTRAINT "Declaration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: ViewHistory → User
ALTER TABLE "ViewHistory" ADD CONSTRAINT "ViewHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Notification → User
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
