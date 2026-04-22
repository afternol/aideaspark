/**
 * TrendCache をエキスパートスコアで初期シード
 * node scripts/seed-trends.cjs
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });

const CATEGORIES = [
  { value: "SaaS", label: "SaaS", group: "ビジネスモデル" },
  { value: "D2C", label: "D2C", group: "ビジネスモデル" },
  { value: "プラットフォーム", label: "プラットフォーム", group: "ビジネスモデル" },
  { value: "マーケットプレイス", label: "マーケットプレイス", group: "ビジネスモデル" },
  { value: "サブスクリプション", label: "サブスクリプション", group: "ビジネスモデル" },
  { value: "シェアリング", label: "シェアリング", group: "ビジネスモデル" },
  { value: "アグリゲーター", label: "アグリゲーター", group: "ビジネスモデル" },
  { value: "API・BaaS", label: "API・BaaS", group: "ビジネスモデル" },
  { value: "バーティカルSaaS", label: "バーティカルSaaS", group: "ビジネスモデル" },
  { value: "コミュニティ", label: "コミュニティ", group: "ビジネスモデル" },
  { value: "AI/ML", label: "AI/ML", group: "AI・データ" },
  { value: "生成AI", label: "生成AI", group: "AI・データ" },
  { value: "AIエージェント", label: "AIエージェント", group: "AI・データ" },
  { value: "音声AI", label: "音声AI", group: "AI・データ" },
  { value: "画像・動画AI", label: "画像・動画AI", group: "AI・データ" },
  { value: "データ分析", label: "データ分析", group: "AI・データ" },
  { value: "RPA・自動化", label: "RPA・自動化", group: "AI・データ" },
  { value: "AI SaaS", label: "AI SaaS", group: "AI・データ" },
  { value: "チャットボット", label: "チャットボット", group: "AI・データ" },
  { value: "パーソナライズ", label: "パーソナライズ", group: "AI・データ" },
  { value: "フィンテック", label: "フィンテック", group: "金融・決済" },
  { value: "決済", label: "決済", group: "金融・決済" },
  { value: "インシュアテック", label: "インシュアテック", group: "金融・決済" },
  { value: "資産運用", label: "資産運用", group: "金融・決済" },
  { value: "融資・レンディング", label: "融資・レンディング", group: "金融・決済" },
  { value: "会計・経理DX", label: "会計・経理DX", group: "金融・決済" },
  { value: "Web3・ブロックチェーン", label: "Web3・ブロックチェーン", group: "金融・決済" },
  { value: "暗号資産", label: "暗号資産", group: "金融・決済" },
  { value: "ヘルスケア", label: "ヘルスケア", group: "ヘルスケア・ウェルネス" },
  { value: "デジタルヘルス", label: "デジタルヘルス", group: "ヘルスケア・ウェルネス" },
  { value: "メンタルヘルス", label: "メンタルヘルス", group: "ヘルスケア・ウェルネス" },
  { value: "フェムテック", label: "フェムテック", group: "ヘルスケア・ウェルネス" },
  { value: "スリープテック", label: "スリープテック", group: "ヘルスケア・ウェルネス" },
  { value: "フィットネステック", label: "フィットネステック", group: "ヘルスケア・ウェルネス" },
  { value: "介護テック", label: "介護テック", group: "ヘルスケア・ウェルネス" },
  { value: "エイジテック", label: "エイジテック", group: "ヘルスケア・ウェルネス" },
  { value: "予防医療", label: "予防医療", group: "ヘルスケア・ウェルネス" },
  { value: "ペットテック", label: "ペットテック", group: "ヘルスケア・ウェルネス" },
  { value: "教育", label: "教育", group: "教育・人材" },
  { value: "EdTech", label: "EdTech", group: "教育・人材" },
  { value: "リスキリング", label: "リスキリング", group: "教育・人材" },
  { value: "HR Tech", label: "HR Tech", group: "教育・人材" },
  { value: "採用テック", label: "採用テック", group: "教育・人材" },
  { value: "タレントマネジメント", label: "タレントマネジメント", group: "教育・人材" },
  { value: "コーチング・メンタリング", label: "コーチング・メンタリング", group: "教育・人材" },
  { value: "語学学習", label: "語学学習", group: "教育・人材" },
  { value: "資格・試験対策", label: "資格・試験対策", group: "教育・人材" },
  { value: "フードテック", label: "フードテック", group: "生活・消費" },
  { value: "リテールテック", label: "リテールテック", group: "生活・消費" },
  { value: "不動産", label: "不動産", group: "生活・消費" },
  { value: "プロップテック", label: "プロップテック", group: "生活・消費" },
  { value: "トラベルテック", label: "トラベルテック", group: "生活・消費" },
  { value: "ファッションテック", label: "ファッションテック", group: "生活・消費" },
  { value: "ビューティーテック", label: "ビューティーテック", group: "生活・消費" },
  { value: "家事代行・生活支援", label: "家事代行・生活支援", group: "生活・消費" },
  { value: "ローカルビジネス", label: "ローカルビジネス", group: "生活・消費" },
  { value: "ギフト・EC", label: "ギフト・EC", group: "生活・消費" },
  { value: "モビリティ", label: "モビリティ", group: "産業・インフラ" },
  { value: "物流テック", label: "物流テック", group: "産業・インフラ" },
  { value: "建設テック", label: "建設テック", group: "産業・インフラ" },
  { value: "製造DX", label: "製造DX", group: "産業・インフラ" },
  { value: "アグリテック", label: "アグリテック", group: "産業・インフラ" },
  { value: "エネルギーテック", label: "エネルギーテック", group: "産業・インフラ" },
  { value: "セキュリティ", label: "セキュリティ", group: "産業・インフラ" },
  { value: "リーガルテック", label: "リーガルテック", group: "産業・インフラ" },
  { value: "GovTech", label: "GovTech", group: "産業・インフラ" },
  { value: "宇宙ビジネス", label: "宇宙ビジネス", group: "産業・インフラ" },
  { value: "カーボンテック", label: "カーボンテック", group: "サステナビリティ" },
  { value: "サーキュラーエコノミー", label: "サーキュラーエコノミー", group: "サステナビリティ" },
  { value: "クリーンテック", label: "クリーンテック", group: "サステナビリティ" },
  { value: "ESG・インパクト", label: "ESG・インパクト", group: "サステナビリティ" },
  { value: "フードロス", label: "フードロス", group: "サステナビリティ" },
  { value: "コンテンツ", label: "コンテンツ", group: "エンタメ・クリエイター" },
  { value: "クリエイターエコノミー", label: "クリエイターエコノミー", group: "エンタメ・クリエイター" },
  { value: "ゲーム・eスポーツ", label: "ゲーム・eスポーツ", group: "エンタメ・クリエイター" },
  { value: "音楽テック", label: "音楽テック", group: "エンタメ・クリエイター" },
  { value: "動画・配信", label: "動画・配信", group: "エンタメ・クリエイター" },
  { value: "ファンコミュニティ", label: "ファンコミュニティ", group: "エンタメ・クリエイター" },
  { value: "メディア・出版", label: "メディア・出版", group: "エンタメ・クリエイター" },
  { value: "ライブコマース", label: "ライブコマース", group: "エンタメ・クリエイター" },
  { value: "XR・メタバース", label: "XR・メタバース", group: "先端テクノロジー" },
  { value: "IoT", label: "IoT", group: "先端テクノロジー" },
  { value: "ロボティクス", label: "ロボティクス", group: "先端テクノロジー" },
  { value: "量子コンピューティング", label: "量子コンピューティング", group: "先端テクノロジー" },
  { value: "ドローン", label: "ドローン", group: "先端テクノロジー" },
  { value: "3Dプリンティング", label: "3Dプリンティング", group: "先端テクノロジー" },
  { value: "デジタルツイン", label: "デジタルツイン", group: "先端テクノロジー" },
  { value: "ノーコード・ローコード", label: "ノーコード・ローコード", group: "先端テクノロジー" },
];

const EXPERT_SCORES = {
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

async function main() {
  console.log("TrendCache シード開始...");
  const client = await pool.connect();
  try {
    const now = new Date().toISOString();
    let upserted = 0;

    for (let i = 0; i < CATEGORIES.length; i++) {
      const cat = CATEGORIES[i];
      const expert = EXPERT_SCORES[cat.value] || { base: 50, momentum: "stable" };
      const id = `tc-${String(i + 1).padStart(3, "0")}`;

      await client.query(
        `INSERT INTO "TrendCache" (id, keyword, category, description, "relatedIdeaIds", "gtInterest", "gtMomentum", "platformScore", "totalScore", momentum, "fetchedAt", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, '[]', 0, 0, $5, $5, $6, $7, $7, $7)
         ON CONFLICT (keyword) DO UPDATE SET
           "totalScore" = EXCLUDED."totalScore",
           momentum = EXCLUDED.momentum,
           "platformScore" = EXCLUDED."platformScore",
           category = EXCLUDED.category,
           description = EXCLUDED.description,
           "updatedAt" = EXCLUDED."updatedAt"`,
        [id, cat.value, cat.group, cat.label, expert.base, expert.momentum, now]
      );
      upserted++;
    }

    console.log(`完了: ${upserted}件 upsert`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
