const { Pool } = require('pg');
require('dotenv').config();

// 既存20アイデアへのパターン紐付け
// 複数パターンに該当する場合は複数IDを設定
const PATTERN_MAP = {
  1:  ['B-1', 'F-1'],        // TASQ: JTBD深掘り + バーティカルAI
  2:  ['A-2', 'F-1'],        // GreenNote: 規制変化の窓 + バーティカルAI
  3:  ['A-3', 'B-5'],        // みまもりペット: 人口動態 + 感情・社会的価値の設計
  4:  ['H-1', 'C-2'],        // つくりてBOX: 職人暗黙知デジタル化 + カテゴリー創造
  5:  ['F-1', 'D-1'],        // MeetScore: バーティカルAI + データフライホイール
  6:  ['B-2', 'G-2'],        // おうちレストラン: 非消費者の取り込み + マルチサイドプラットフォーム
  7:  ['B-3', 'B-5'],        // なぜなぜラボ: 価値の再フレーミング + 感情・社会的価値
  8:  ['A-6', 'E-5'],        // SpacePort: ホワイトスペース探索 + アセットライト×スケール
  9:  ['I-6', 'F-2'],        // Sleepy: パーソナルAIコンテキスト + AI専門家民主化
  10: ['F-2', 'C-4'],        // LegalEye: AI専門家民主化 + アンバンドリング
  11: ['C-5', 'G-2'],        // 産直キッチン: アグリゲーション + マルチサイドプラットフォーム
  12: ['B-3', 'I-3'],        // マネクエ: 価値の再フレーミング + Long Tail市場の開拓
  13: ['E-8', 'A-7'],        // リペアマッチ: 廃棄・余剰の価値化 + 社会課題の事業機会化
  14: ['A-8', 'F-9'],        // VoiceLab: ファーストペンギン + 合成データビジネス
  15: ['B-2', 'B-4'],        // フリ申告: 非消費者の取り込み + 摩擦の徹底除去
  16: ['F-5', 'C-7'],        // ケアFit: 予測→処方への昇華 + BtoBtoC変換
  17: ['G-3', 'E-3'],        // PromptStore: コミュニティ先行型成長 + データ二次収益化
  18: ['F-5', 'A-7'],        // RouteGreen: 予測→処方への昇華 + 社会課題の事業機会化
  19: ['I-4', 'B-1'],        // Narrativ: 人間×AIハイブリッド + JTBD深掘り
  20: ['G-3', 'D-2'],        // おとなりさん: コミュニティ先行型成長 + ネットワーク効果
};

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let updated = 0;
  for (const [number, patterns] of Object.entries(PATTERN_MAP)) {
    const result = await pool.query(
      'UPDATE "Idea" SET patterns = $1 WHERE number = $2',
      [JSON.stringify(patterns), parseInt(number)]
    );
    if (result.rowCount > 0) updated++;
    console.log(`#${number} → ${patterns.join(', ')}`);
  }
  console.log(`\n✅ ${updated}件更新完了`);
  await pool.end();
}

main().catch(console.error);
