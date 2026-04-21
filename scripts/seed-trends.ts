import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { CATEGORIES } from "../src/lib/constants.js";

const EXPERT_SCORES: Record<string, { base: number; momentum: string }> = {
  "AI/ML": { base: 88, momentum: "rising" },
  "生成AI": { base: 95, momentum: "rising" },
  "AIエージェント": { base: 93, momentum: "rising" },
  "音声AI": { base: 82, momentum: "rising" },
  "画像・動画AI": { base: 85, momentum: "rising" },
  "データ分析": { base: 72, momentum: "stable" },
  "RPA・自動化": { base: 68, momentum: "stable" },
  "AI SaaS": { base: 87, momentum: "rising" },
  "チャットボット": { base: 70, momentum: "stable" },
  "パーソナライズ": { base: 65, momentum: "stable" },
  "SaaS": { base: 75, momentum: "stable" },
  "D2C": { base: 55, momentum: "declining" },
  "プラットフォーム": { base: 70, momentum: "stable" },
  "マーケットプレイス": { base: 65, momentum: "stable" },
  "サブスクリプション": { base: 72, momentum: "stable" },
  "シェアリング": { base: 58, momentum: "stable" },
  "アグリゲーター": { base: 45, momentum: "stable" },
  "API・BaaS": { base: 62, momentum: "rising" },
  "バーティカルSaaS": { base: 78, momentum: "rising" },
  "コミュニティ": { base: 60, momentum: "stable" },
};

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as any);

  const now = new Date();
  let count = 0;

  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i]!;
    const expert = EXPERT_SCORES[cat.value] ?? { base: 50, momentum: "stable" };

    await prisma.trendCache.upsert({
      where: { keyword: cat.value },
      update: {
        totalScore: expert.base,
        momentum: expert.momentum,
        fetchedAt: now,
        category: cat.group,
        description: cat.label,
        relatedIdeaIds: [],
        gtInterest: 0,
        gtMomentum: 0,
        platformScore: expert.base,
      },
      create: {
        id: `tc-${String(i + 1).padStart(3, "0")}`,
        keyword: cat.value,
        category: cat.group,
        description: cat.label,
        relatedIdeaIds: [],
        gtInterest: 0,
        gtMomentum: 0,
        platformScore: expert.base,
        totalScore: expert.base,
        momentum: expert.momentum,
        fetchedAt: now,
      },
    });
    count++;
  }

  console.log(`✅ TrendCache: ${count}件投入完了`);
  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
