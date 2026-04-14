import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { mockIdeas } from "../src/data/mock/ideas";
import { mockTrends } from "../src/data/mock/trends";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ── Ideas ──────────────────────────────────────────────────────────────
  let ideaCount = 0;
  for (const idea of mockIdeas) {
    const data = {
      slug:             idea.slug,
      number:           idea.number,
      serviceName:      idea.serviceName,
      concept:          idea.concept,
      target:           idea.target,
      problem:          idea.problem,
      product:          idea.product,
      revenueModel:     idea.revenueModel,
      competitors:      idea.competitors,
      competitiveEdge:  idea.competitiveEdge,
      tags:             idea.tags,           // Json型: 配列をそのまま
      category:         idea.category,
      targetIndustry:   idea.targetIndustry,
      targetCustomer:   idea.targetCustomer,
      investmentScale:  idea.investmentScale,
      difficulty:       idea.difficulty,
      scores:           idea.scores as any,         // Json型: オブジェクトをそのまま
      scoreComments:    idea.scoreComments as any,  // Json型: オブジェクトをそのまま
      trendKeywords:    idea.trendKeywords as any,  // Json型: 配列をそのまま
      oneLiner:         idea.oneLiner,
      publishedAt:      idea.publishedAt,
      views:            idea.views,
      bookmarks:        idea.bookmarks,
      inspirationSource: idea.inspirationSource ?? null,
    };

    await prisma.idea.upsert({
      where:  { id: idea.id },
      create: { id: idea.id, ...data },
      update: data,
    });
    ideaCount++;
  }
  console.log(`✅ Ideas: ${ideaCount} 件`);

  // ── TrendCache ─────────────────────────────────────────────────────────
  let trendCount = 0;
  for (const trend of mockTrends) {
    const data = {
      keyword:        trend.keyword,
      category:       trend.category,
      description:    trend.description,
      relatedIdeaIds: trend.relatedIdeaIds,  // Json型: 配列をそのまま
      platformScore:  trend.score,
      totalScore:     trend.score,
      momentum:       trend.momentum,
      fetchedAt:      new Date(),
    };

    await prisma.trendCache.upsert({
      where:  { id: trend.id },
      create: { id: trend.id, ...data },
      update: data,
    });
    trendCount++;
  }
  console.log(`✅ TrendCache: ${trendCount} 件`);

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
    pool.end();
  });
