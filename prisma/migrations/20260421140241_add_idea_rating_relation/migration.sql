-- AddForeignKey
ALTER TABLE "IdeaRating" ADD CONSTRAINT "IdeaRating_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
