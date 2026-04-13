import googleTrends from "google-trends-api";
import { prisma } from "./prisma";
import { CATEGORIES } from "./constants";

export interface TrendResult {
  id: string;
  keyword: string;
  label: string;
  group: string;
  score: number;
  momentum: "rising" | "stable" | "declining";
  gtInterest: number;
  gtMomentum: number;
  rank: number;
}

const CACHE_TTL_HOURS = 24;

// Expert-curated base scores reflecting 2026 market reality
// These serve as the baseline; Google Trends data refines them when available
const EXPERT_SCORES: Record<string, { base: number; momentum: "rising" | "stable" | "declining" }> = {
  // AI・データ — hottest sector
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

  // ビジネスモデル
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

  // 金融・決済
  "フィンテック": { base: 68, momentum: "stable" },
  "決済": { base: 70, momentum: "stable" },
  "インシュアテック": { base: 52, momentum: "stable" },
  "資産運用": { base: 65, momentum: "stable" },
  "融資・レンディング": { base: 55, momentum: "stable" },
  "会計・経理DX": { base: 60, momentum: "stable" },
  "Web3・ブロックチェーン": { base: 42, momentum: "declining" },
  "暗号資産": { base: 48, momentum: "stable" },

  // ヘルスケア・ウェルネス
  "ヘルスケア": { base: 72, momentum: "rising" },
  "デジタルヘルス": { base: 75, momentum: "rising" },
  "メンタルヘルス": { base: 78, momentum: "rising" },
  "フェムテック": { base: 65, momentum: "rising" },
  "スリープテック": { base: 58, momentum: "rising" },
  "フィットネステック": { base: 52, momentum: "stable" },
  "介護テック": { base: 70, momentum: "rising" },
  "エイジテック": { base: 62, momentum: "rising" },
  "予防医療": { base: 68, momentum: "rising" },
  "ペットテック": { base: 60, momentum: "stable" },

  // 教育・人材
  "教育": { base: 55, momentum: "stable" },
  "EdTech": { base: 58, momentum: "stable" },
  "リスキリング": { base: 72, momentum: "rising" },
  "HR Tech": { base: 68, momentum: "stable" },
  "採用テック": { base: 65, momentum: "stable" },
  "タレントマネジメント": { base: 55, momentum: "stable" },
  "コーチング・メンタリング": { base: 50, momentum: "stable" },
  "語学学習": { base: 52, momentum: "stable" },
  "資格・試験対策": { base: 48, momentum: "stable" },

  // 生活・消費
  "フードテック": { base: 62, momentum: "stable" },
  "リテールテック": { base: 60, momentum: "stable" },
  "不動産": { base: 55, momentum: "stable" },
  "プロップテック": { base: 52, momentum: "stable" },
  "トラベルテック": { base: 65, momentum: "rising" },
  "ファッションテック": { base: 48, momentum: "stable" },
  "ビューティーテック": { base: 50, momentum: "stable" },
  "家事代行・生活支援": { base: 55, momentum: "stable" },
  "ローカルビジネス": { base: 45, momentum: "stable" },
  "ギフト・EC": { base: 50, momentum: "stable" },

  // 産業・インフラ
  "モビリティ": { base: 65, momentum: "stable" },
  "物流テック": { base: 72, momentum: "rising" },
  "建設テック": { base: 60, momentum: "rising" },
  "製造DX": { base: 68, momentum: "rising" },
  "アグリテック": { base: 55, momentum: "stable" },
  "エネルギーテック": { base: 70, momentum: "rising" },
  "セキュリティ": { base: 80, momentum: "rising" },
  "リーガルテック": { base: 58, momentum: "stable" },
  "GovTech": { base: 55, momentum: "stable" },
  "宇宙ビジネス": { base: 48, momentum: "rising" },

  // サステナビリティ
  "カーボンテック": { base: 68, momentum: "rising" },
  "サーキュラーエコノミー": { base: 58, momentum: "rising" },
  "クリーンテック": { base: 62, momentum: "rising" },
  "ESG・インパクト": { base: 55, momentum: "stable" },
  "フードロス": { base: 52, momentum: "stable" },

  // エンタメ・クリエイター
  "コンテンツ": { base: 60, momentum: "stable" },
  "クリエイターエコノミー": { base: 75, momentum: "rising" },
  "ゲーム・eスポーツ": { base: 62, momentum: "stable" },
  "音楽テック": { base: 48, momentum: "stable" },
  "動画・配信": { base: 68, momentum: "stable" },
  "ファンコミュニティ": { base: 55, momentum: "stable" },
  "メディア・出版": { base: 40, momentum: "declining" },
  "ライブコマース": { base: 58, momentum: "stable" },

  // 先端テクノロジー
  "XR・メタバース": { base: 38, momentum: "declining" },
  "IoT": { base: 58, momentum: "stable" },
  "ロボティクス": { base: 65, momentum: "rising" },
  "量子コンピューティング": { base: 52, momentum: "rising" },
  "ドローン": { base: 55, momentum: "stable" },
  "3Dプリンティング": { base: 42, momentum: "stable" },
  "デジタルツイン": { base: 55, momentum: "rising" },
  "ノーコード・ローコード": { base: 70, momentum: "stable" },
};

async function fetchGoogleTrends(keyword: string): Promise<{ interest: number; momentum: number } | null> {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const result = await googleTrends.interestOverTime({
      keyword,
      startTime: sixMonthsAgo,
      endTime: now,
      geo: "JP",
    });

    const parsed = JSON.parse(result);
    const timeline = parsed.default?.timelineData || [];
    if (timeline.length === 0) return null;

    const values: number[] = timeline.map((t: any) => t.value[0] as number);
    const weights = [3, 2.5, 2, 1.5];
    const recent = values.slice(-4);
    const wSum = recent.reduce((s, v, i) => s + v * (weights[i] || 1), 0);
    const wTotal = recent.reduce((s, _, i) => s + (weights[i] || 1), 0);
    const interest = Math.round(wSum / wTotal);

    const third = Math.floor(values.length / 3);
    const first = values.slice(0, third);
    const last = values.slice(-third);
    const avgFirst = first.reduce((a, b) => a + b, 0) / (first.length || 1);
    const avgLast = last.reduce((a, b) => a + b, 0) / (last.length || 1);
    const momentum = avgFirst > 0 ? Math.round(((avgLast - avgFirst) / avgFirst) * 100) : 0;

    return { interest, momentum };
  } catch {
    return null; // Silently fail, use expert score
  }
}

function blendScore(expert: number, gtData: { interest: number; momentum: number } | null): number {
  if (!gtData) return expert;

  // Blend: 60% expert + 40% Google Trends signal
  const gtSignal = Math.min(100, gtData.interest * 1.5);
  const momentumBonus = Math.max(-10, Math.min(10, gtData.momentum * 0.1));

  return Math.round(expert * 0.6 + gtSignal * 0.4 + momentumBonus);
}

function blendMomentum(
  expert: "rising" | "stable" | "declining",
  gtMomentum: number | null
): "rising" | "stable" | "declining" {
  if (gtMomentum === null) return expert;
  // If Google Trends strongly disagrees, override
  if (gtMomentum > 30 && expert === "declining") return "stable";
  if (gtMomentum < -30 && expert === "rising") return "stable";
  if (gtMomentum > 50) return "rising";
  if (gtMomentum < -30) return "declining";
  return expert;
}

export async function scoreAllCategories(): Promise<TrendResult[]> {
  const results: TrendResult[] = [];

  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    const expert = EXPERT_SCORES[cat.value] || { base: 50, momentum: "stable" as const };

    const cached = await prisma.trendCache.findUnique({ where: { keyword: cat.value } });
    const now = new Date();
    const cacheExpired = !cached ||
      (now.getTime() - new Date(cached.fetchedAt).getTime()) > CACHE_TTL_HOURS * 60 * 60 * 1000;

    let gtInterest = cached?.gtInterest ?? 0;
    let gtMomentum = cached?.gtMomentum ?? 0;
    let score = expert.base;
    let momentum = expert.momentum;

    if (cacheExpired) {
      const gtData = await fetchGoogleTrends(cat.label);

      if (gtData) {
        gtInterest = gtData.interest;
        gtMomentum = gtData.momentum;
        score = blendScore(expert.base, gtData);
        momentum = blendMomentum(expert.momentum, gtData.momentum);
      }

      score = Math.max(10, Math.min(100, score));

      await prisma.trendCache.upsert({
        where: { keyword: cat.value },
        update: { gtInterest, gtMomentum, totalScore: score, momentum, fetchedAt: now, platformScore: expert.base, category: cat.group, description: cat.label, relatedIdeaIds: "[]" },
        create: { id: `tc-${String(i + 1).padStart(3, "0")}`, keyword: cat.value, category: cat.group, description: cat.label, relatedIdeaIds: "[]", gtInterest, gtMomentum, platformScore: expert.base, totalScore: score, momentum, fetchedAt: now },
      });

      // Rate limit
      if (gtInterest > 0) {
        await new Promise((r) => setTimeout(r, 3000));
        if ((i + 1) % 10 === 0) await new Promise((r) => setTimeout(r, 10000));
      }
    } else {
      score = Math.max(10, cached.totalScore);
      momentum = cached.momentum as typeof momentum;
      gtInterest = cached.gtInterest;
      gtMomentum = cached.gtMomentum;
    }

    results.push({
      id: `tc-${String(i + 1).padStart(3, "0")}`,
      keyword: cat.label,
      label: cat.label,
      group: cat.group,
      score,
      momentum,
      gtInterest,
      gtMomentum,
      rank: 0,
    });
  }

  results.sort((a, b) => b.score - a.score);
  results.forEach((r, i) => { r.rank = i + 1; });
  return results;
}
