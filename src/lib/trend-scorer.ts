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

// Expert-curated base scores reflecting 2026 market reality
const EXPERT_SCORES: Record<string, { base: number; momentum: "rising" | "stable" | "declining" }> = {
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
  "フィンテック": { base: 68, momentum: "stable" },
  "決済": { base: 70, momentum: "stable" },
  "インシュアテック": { base: 52, momentum: "stable" },
  "資産運用": { base: 65, momentum: "stable" },
  "融資・レンディング": { base: 55, momentum: "stable" },
  "会計・経理DX": { base: 60, momentum: "stable" },
  "Web3・ブロックチェーン": { base: 42, momentum: "declining" },
  "暗号資産": { base: 48, momentum: "stable" },
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
  "教育": { base: 55, momentum: "stable" },
  "EdTech": { base: 58, momentum: "stable" },
  "リスキリング": { base: 72, momentum: "rising" },
  "HR Tech": { base: 68, momentum: "stable" },
  "採用テック": { base: 65, momentum: "stable" },
  "タレントマネジメント": { base: 55, momentum: "stable" },
  "コーチング・メンタリング": { base: 50, momentum: "stable" },
  "語学学習": { base: 52, momentum: "stable" },
  "資格・試験対策": { base: 48, momentum: "stable" },
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
  "カーボンテック": { base: 68, momentum: "rising" },
  "サーキュラーエコノミー": { base: 58, momentum: "rising" },
  "クリーンテック": { base: 62, momentum: "rising" },
  "ESG・インパクト": { base: 55, momentum: "stable" },
  "フードロス": { base: 52, momentum: "stable" },
  "コンテンツ": { base: 60, momentum: "stable" },
  "クリエイターエコノミー": { base: 75, momentum: "rising" },
  "ゲーム・eスポーツ": { base: 62, momentum: "stable" },
  "音楽テック": { base: 48, momentum: "stable" },
  "動画・配信": { base: 68, momentum: "stable" },
  "ファンコミュニティ": { base: 55, momentum: "stable" },
  "メディア・出版": { base: 40, momentum: "declining" },
  "ライブコマース": { base: 58, momentum: "stable" },
  "XR・メタバース": { base: 38, momentum: "declining" },
  "IoT": { base: 58, momentum: "stable" },
  "ロボティクス": { base: 65, momentum: "rising" },
  "量子コンピューティング": { base: 52, momentum: "rising" },
  "ドローン": { base: 55, momentum: "stable" },
  "3Dプリンティング": { base: 42, momentum: "stable" },
  "デジタルツイン": { base: 55, momentum: "rising" },
  "ノーコード・ローコード": { base: 70, momentum: "stable" },
};

// ── ユーザー行動からカテゴリ別スコア算出（0-100）────────────────────────────
// views×1 + bookmarks×10 + declarations×50 + reactions×3 を集計して正規化

export async function computePlatformScores(): Promise<Map<string, number>> {
  const ideas = await prisma.idea.findMany({
    select: {
      category: true,
      views: true,
      bookmarks: true,
      _count: { select: { reactions: true, declarations: true } },
    },
  });

  const raw = new Map<string, number>();
  for (const idea of ideas) {
    const engagement =
      idea.views * 1 +
      idea.bookmarks * 10 +
      idea._count.declarations * 50 +
      idea._count.reactions * 3;
    raw.set(idea.category, (raw.get(idea.category) ?? 0) + engagement);
  }

  const maxVal = Math.max(...raw.values(), 1);
  const normalized = new Map<string, number>();
  for (const [cat, val] of raw) {
    normalized.set(cat, Math.round((val / maxVal) * 100));
  }
  return normalized;
}

// ── 3軸ブレンド: データがある軸だけ使い、ないものに引っ張られない ──────────
// expert 40% + platform 30% + google_trends 30%（データある軸で重みを再正規化）

function blendAllScores(
  expert: number,
  platformScore: number,
  gtData: { interest: number; momentum: number } | null,
): number {
  const gtSignal = gtData ? Math.min(100, gtData.interest * 1.5) : null;
  const gtBonus  = gtData ? Math.max(-10, Math.min(10, gtData.momentum * 0.1)) : 0;

  const sources: { weight: number; value: number }[] = [{ weight: 0.4, value: expert }];
  if (platformScore > 0) sources.push({ weight: 0.3, value: platformScore });
  if (gtSignal !== null) sources.push({ weight: 0.3, value: gtSignal + gtBonus });

  const totalWeight = sources.reduce((s, x) => s + x.weight, 0);
  const score = sources.reduce((s, x) => s + (x.value * x.weight) / totalWeight, 0);
  return Math.max(10, Math.min(100, Math.round(score)));
}

function blendMomentum(
  expert: "rising" | "stable" | "declining",
  gtMomentum: number | null,
): "rising" | "stable" | "declining" {
  if (gtMomentum === null) return expert;
  if (gtMomentum > 50) return "rising";
  if (gtMomentum < -30) return "declining";
  if (gtMomentum > 30 && expert === "declining") return "stable";
  if (gtMomentum < -30 && expert === "rising") return "stable";
  return expert;
}

// ── メイン: キャッシュ1クエリで即返却 ──────────────────────────────────────

export async function scoreAllCategories(): Promise<TrendResult[]> {
  const cached = await prisma.trendCache.findMany();
  const cacheMap = new Map(cached.map((c) => [c.keyword, c]));

  const results: TrendResult[] = CATEGORIES.map((cat, i) => {
    const expert = EXPERT_SCORES[cat.value] ?? { base: 50, momentum: "stable" as const };
    const entry  = cacheMap.get(cat.value);

    const score    = entry ? Math.max(10, entry.totalScore) : expert.base;
    const momentum = (entry?.momentum as TrendResult["momentum"]) ?? expert.momentum;

    return {
      id:          `tc-${String(i + 1).padStart(3, "0")}`,
      keyword:     cat.label,
      label:       cat.label,
      group:       cat.group,
      score,
      momentum,
      gtInterest:  entry?.gtInterest  ?? 0,
      gtMomentum:  entry?.gtMomentum  ?? 0,
      rank:        0,
    };
  });

  results.sort((a, b) => b.score - a.score);
  results.forEach((r, i) => { r.rank = i + 1; });
  return results;
}

// ── キャッシュ更新: Google Trends + ユーザー行動（cron専用） ─────────────────

export async function refreshTrendsCache(): Promise<{ updated: number; skipped: number; errors: number }> {
  const googleTrends = (await import("google-trends-api")).default;

  const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  const now = new Date();

  // ユーザー行動スコアを先に一括取得
  const platformScores = await computePlatformScores();

  let updated = 0;
  let skipped = 0;
  let errors  = 0;

  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat      = CATEGORIES[i];
    const expert   = EXPERT_SCORES[cat.value] ?? { base: 50, momentum: "stable" as const };
    const platform = platformScores.get(cat.value) ?? 0;

    const cached  = await prisma.trendCache.findUnique({ where: { keyword: cat.value } });
    const expired = !cached || (now.getTime() - new Date(cached.fetchedAt).getTime()) > CACHE_TTL_MS;

    if (!expired) {
      // キャッシュ有効 → platformScore だけ更新（行動データは常に最新にする）
      if (platform > 0) {
        const newScore = blendAllScores(expert.base, platform, {
          interest: cached.gtInterest,
          momentum: cached.gtMomentum,
        });
        await prisma.trendCache.update({
          where: { keyword: cat.value },
          data: { platformScore: platform, totalScore: newScore, updatedAt: now },
        });
      }
      skipped++;
      continue;
    }

    // キャッシュ期限切れ → Google Trends を取得して全軸ブレンド
    let gtData: { interest: number; momentum: number } | null = null;
    try {
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const raw      = await googleTrends.interestOverTime({ keyword: cat.label, startTime: sixMonthsAgo, endTime: now, geo: "JP" });
      const timeline = JSON.parse(raw).default?.timelineData ?? [];
      if (timeline.length > 0) {
        const values: number[] = timeline.map((t: any) => t.value[0] as number);
        const recent   = values.slice(-4);
        const weights  = [3, 2.5, 2, 1.5];
        const wSum     = recent.reduce((s, v, j) => s + v * (weights[j] ?? 1), 0);
        const wTotal   = recent.reduce((s, _, j) => s + (weights[j] ?? 1), 0);
        const interest = Math.round(wSum / wTotal);

        const third    = Math.floor(values.length / 3);
        const avgFirst = values.slice(0, third).reduce((a, b) => a + b, 0) / (third || 1);
        const avgLast  = values.slice(-third).reduce((a, b) => a + b, 0)  / (third || 1);
        const momentum = avgFirst > 0 ? Math.round(((avgLast - avgFirst) / avgFirst) * 100) : 0;
        gtData = { interest, momentum };
      }
    } catch { /* Google Trends失敗 → gtData = null のまま続行 */ }

    const score    = blendAllScores(expert.base, platform, gtData);
    const momentum = blendMomentum(expert.momentum, gtData?.momentum ?? null);

    await prisma.trendCache.upsert({
      where:  { keyword: cat.value },
      update: {
        gtInterest:    gtData?.interest  ?? cached?.gtInterest  ?? 0,
        gtMomentum:    gtData?.momentum  ?? cached?.gtMomentum  ?? 0,
        platformScore: platform,
        totalScore:    score,
        momentum,
        fetchedAt:     now,
        updatedAt:     now,
      },
      create: {
        id:            `tc-${String(i + 1).padStart(3, "0")}`,
        keyword:       cat.value,
        category:      cat.group,
        description:   cat.label,
        relatedIdeaIds: "[]",
        gtInterest:    gtData?.interest  ?? 0,
        gtMomentum:    gtData?.momentum  ?? 0,
        platformScore: platform > 0 ? platform : expert.base,
        totalScore:    score,
        momentum,
        fetchedAt:     now,
      },
    });

    updated++;
    if (gtData) {
      await new Promise((r) => setTimeout(r, 3000));
      if ((i + 1) % 10 === 0) await new Promise((r) => setTimeout(r, 10000));
    }
  }

  return { updated, skipped, errors };
}
