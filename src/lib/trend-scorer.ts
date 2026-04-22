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
  // AI・データ
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

// ── メイン: キャッシュ優先、なければエキスパートスコアで即時返却 ──────────

export async function scoreAllCategories(): Promise<TrendResult[]> {
  // 全キャッシュを1クエリで取得
  const cached = await prisma.trendCache.findMany();
  const cacheMap = new Map(cached.map((c) => [c.keyword, c]));

  const results: TrendResult[] = CATEGORIES.map((cat, i) => {
    const expert = EXPERT_SCORES[cat.value] ?? { base: 50, momentum: "stable" as const };
    const entry = cacheMap.get(cat.value);

    const score = entry ? Math.max(10, entry.totalScore) : expert.base;
    const momentum = (entry?.momentum as TrendResult["momentum"]) ?? expert.momentum;

    return {
      id: `tc-${String(i + 1).padStart(3, "0")}`,
      keyword: cat.label,
      label: cat.label,
      group: cat.group,
      score,
      momentum,
      gtInterest: entry?.gtInterest ?? 0,
      gtMomentum: entry?.gtMomentum ?? 0,
      rank: 0,
    };
  });

  results.sort((a, b) => b.score - a.score);
  results.forEach((r, i) => { r.rank = i + 1; });
  return results;
}

// ── キャッシュ更新: Google Trends APIを叩く（cron専用） ──────────────────

export async function refreshTrendsCache(): Promise<{ updated: number; errors: number }> {
  // Dynamic import to avoid bundling google-trends-api into edge runtime
  const googleTrends = (await import("google-trends-api")).default;

  const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  const now = new Date();
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    const expert = EXPERT_SCORES[cat.value] ?? { base: 50, momentum: "stable" as const };

    const cached = await prisma.trendCache.findUnique({ where: { keyword: cat.value } });
    const expired = !cached || (now.getTime() - new Date(cached.fetchedAt).getTime()) > CACHE_TTL_MS;
    if (!expired) continue;

    try {
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const raw = await googleTrends.interestOverTime({
        keyword: cat.label,
        startTime: sixMonthsAgo,
        endTime: now,
        geo: "JP",
      });

      const timeline = JSON.parse(raw).default?.timelineData ?? [];
      if (timeline.length === 0) throw new Error("empty timeline");

      const values: number[] = timeline.map((t: any) => t.value[0] as number);
      const recent = values.slice(-4);
      const weights = [3, 2.5, 2, 1.5];
      const wSum = recent.reduce((s, v, j) => s + v * (weights[j] ?? 1), 0);
      const wTotal = recent.reduce((s, _, j) => s + (weights[j] ?? 1), 0);
      const gtInterest = Math.round(wSum / wTotal);

      const third = Math.floor(values.length / 3);
      const avgFirst = values.slice(0, third).reduce((a, b) => a + b, 0) / (third || 1);
      const avgLast = values.slice(-third).reduce((a, b) => a + b, 0) / (third || 1);
      const gtMomentumVal = avgFirst > 0 ? Math.round(((avgLast - avgFirst) / avgFirst) * 100) : 0;

      const gtSignal = Math.min(100, gtInterest * 1.5);
      const bonus = Math.max(-10, Math.min(10, gtMomentumVal * 0.1));
      const score = Math.max(10, Math.min(100, Math.round(expert.base * 0.6 + gtSignal * 0.4 + bonus)));

      let momentum: "rising" | "stable" | "declining" = expert.momentum;
      if (gtMomentumVal > 50) momentum = "rising";
      else if (gtMomentumVal < -30) momentum = "declining";
      else if (gtMomentumVal > 30 && expert.momentum === "declining") momentum = "stable";
      else if (gtMomentumVal < -30 && expert.momentum === "rising") momentum = "stable";

      await prisma.trendCache.upsert({
        where: { keyword: cat.value },
        update: { gtInterest, gtMomentum: gtMomentumVal, totalScore: score, momentum, fetchedAt: now, platformScore: expert.base, category: cat.group, description: cat.label, relatedIdeaIds: "[]" },
        create: { id: `tc-${String(i + 1).padStart(3, "0")}`, keyword: cat.value, category: cat.group, description: cat.label, relatedIdeaIds: "[]", gtInterest, gtMomentum: gtMomentumVal, platformScore: expert.base, totalScore: score, momentum, fetchedAt: now },
      });

      updated++;
      // Rate limit: 3秒待機、10件ごとに追加10秒
      await new Promise((r) => setTimeout(r, 3000));
      if ((i + 1) % 10 === 0) await new Promise((r) => setTimeout(r, 10000));
    } catch {
      // Google Trends失敗時はエキスパートスコアで上書き保存
      await prisma.trendCache.upsert({
        where: { keyword: cat.value },
        update: { totalScore: expert.base, momentum: expert.momentum, fetchedAt: now, platformScore: expert.base, category: cat.group, description: cat.label, relatedIdeaIds: "[]" },
        create: { id: `tc-${String(i + 1).padStart(3, "0")}`, keyword: cat.value, category: cat.group, description: cat.label, relatedIdeaIds: "[]", gtInterest: 0, gtMomentum: 0, platformScore: expert.base, totalScore: expert.base, momentum: expert.momentum, fetchedAt: now },
      });
      errors++;
    }
  }

  return { updated, errors };
}
