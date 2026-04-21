-- CreateTable
CREATE TABLE "GenerationLog" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "hint" TEXT,
    "patterns" JSONB NOT NULL DEFAULT '[]',
    "newsSourceUrls" JSONB NOT NULL DEFAULT '[]',
    "ideaId" TEXT,
    "userRating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GenerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdeaRating" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "isNovel" BOOLEAN,
    "isTimely" BOOLEAN,
    "isFeasible" BOOLEAN,
    "isExisting" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdeaRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GenerationLog_sessionId_createdAt_idx" ON "GenerationLog"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "GenerationLog_ideaId_idx" ON "GenerationLog"("ideaId");

-- CreateIndex
CREATE INDEX "IdeaRating_ideaId_idx" ON "IdeaRating"("ideaId");

-- CreateIndex
CREATE UNIQUE INDEX "IdeaRating_ideaId_sessionId_key" ON "IdeaRating"("ideaId", "sessionId");
