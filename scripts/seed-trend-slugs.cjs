const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DIRECT_URL });

const SLUG_MAP = {
  "SaaS":"saas","D2C":"d2c","プラットフォーム":"platform","マーケットプレイス":"marketplace",
  "サブスクリプション":"subscription","シェアリング":"sharing-economy","アグリゲーター":"aggregator",
  "API・BaaS":"api-baas","バーティカルSaaS":"vertical-saas","コミュニティ":"community",
  "AI/ML":"ai-ml","生成AI":"generative-ai","AIエージェント":"ai-agents","音声AI":"voice-ai",
  "画像・動画AI":"image-video-ai","データ分析":"data-analytics","RPA・自動化":"rpa-automation",
  "AI SaaS":"ai-saas","チャットボット":"chatbot","パーソナライズ":"personalization",
  "フィンテック":"fintech","決済":"payments","インシュアテック":"insurtech",
  "資産運用":"asset-management","融資・レンディング":"lending","会計・経理DX":"accounting-dx",
  "Web3・ブロックチェーン":"web3-blockchain","暗号資産":"crypto",
  "ヘルスケア":"healthcare","デジタルヘルス":"digital-health","メンタルヘルス":"mental-health",
  "フェムテック":"femtech","スリープテック":"sleep-tech","フィットネステック":"fitness-tech",
  "介護テック":"caregiving-tech","エイジテック":"age-tech","予防医療":"preventive-medicine",
  "ペットテック":"pet-tech","教育":"education","EdTech":"edtech","リスキリング":"reskilling",
  "HR Tech":"hr-tech","採用テック":"recruitment-tech","タレントマネジメント":"talent-management",
  "コーチング・メンタリング":"coaching-mentoring","語学学習":"language-learning",
  "資格・試験対策":"certification-exam","フードテック":"food-tech","リテールテック":"retail-tech",
  "不動産":"real-estate","プロップテック":"proptech","トラベルテック":"travel-tech",
  "ファッションテック":"fashion-tech","ビューティーテック":"beauty-tech",
  "家事代行・生活支援":"home-services","ローカルビジネス":"local-business","ギフト・EC":"gift-ec",
  "モビリティ":"mobility","物流テック":"logistics-tech","建設テック":"construction-tech",
  "製造DX":"manufacturing-dx","アグリテック":"agritech","エネルギーテック":"energy-tech",
  "セキュリティ":"security","リーガルテック":"legaltech","GovTech":"govtech",
  "宇宙ビジネス":"space-business","カーボンテック":"carbon-tech",
  "サーキュラーエコノミー":"circular-economy","クリーンテック":"cleantech",
  "ESG・インパクト":"esg-impact","フードロス":"food-loss","コンテンツ":"content",
  "クリエイターエコノミー":"creator-economy","ゲーム・eスポーツ":"gaming-esports",
  "音楽テック":"music-tech","動画・配信":"video-streaming","ファンコミュニティ":"fan-community",
  "メディア・出版":"media-publishing","ライブコマース":"live-commerce",
  "XR・メタバース":"xr-metaverse","IoT":"iot","ロボティクス":"robotics",
  "量子コンピューティング":"quantum-computing","ドローン":"drone",
  "3Dプリンティング":"3d-printing","デジタルツイン":"digital-twin",
  "ノーコード・ローコード":"nocode-lowcode",
};

async function main() {
  const client = await pool.connect();
  try {
    let updated = 0;
    for (const [keyword, slug] of Object.entries(SLUG_MAP)) {
      const res = await client.query(
        'UPDATE "TrendCache" SET slug = $1 WHERE keyword = $2',
        [slug, keyword]
      );
      if (res.rowCount > 0) updated++;
    }
    console.log(`スラッグ登録完了: ${updated}件`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
