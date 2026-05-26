import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:Bcgconsultant347@db.oszprtmhokcqajxvtfnt.supabase.co:5432/postgres' });

// #142 メシパス: competitors から「Reduce Go」削除（2021年1月29日にサービス終了済み）
// Reduce Go → TABETE、フードバンク各団体 + Too Good To Go（国内展開中の代替）を追加
const r142 = await pool.query(
  `UPDATE "Idea" SET competitors = $1, "updatedAt" = NOW() WHERE number = 142`,
  ['TABETE（食品ロスマッチングアプリ）、Too Good To Go（フードロス削減アプリ、国内展開中）、フードバンク各団体']
);
console.log('#142 updated:', r142.rowCount);

// #144 MeatlessMatch: whyNowの「開示義務化」の主語を修正
// 「外食大手によるサステナビリティ目標の開示義務化」→ 上場企業全般への有価証券報告書開示義務（2023年3月期から）が正確
const r144 = await pool.query(
  `UPDATE "Idea" SET "whyNow" = $1, "updatedAt" = NOW() WHERE number = 144`,
  ['2023年3月期以降の有価証券報告書でのサステナビリティ情報開示義務化（金融庁・内閣府令改正）により上場企業全般がESG取組開示を求められ、外食チェーンも植物性メニュー拡充や代替タンパク活用のサプライチェーン整備を急いでいる。さらに代替タンパクスタートアップへの国内投資急増が同時進行しており、両者をつなぐマーケットプレイスの空白が顕在化している。EU規制のグローバル波及でも植物性メニュー需要が拡大している。']
);
console.log('#144 updated:', r144.rowCount);

// #146 KitchenAI OS: competitors の「MarketBoard（食材発注）」を実在サービスに修正
// MarketBoardは検索で実在確認できず → クロスマート（CrossMart）のクロスオーダーが実際の競合
const r146 = await pool.query(
  `UPDATE "Idea" SET competitors = $1, "updatedAt" = NOW() WHERE number = 146`,
  ['テンポスターズ（原価管理）、クロスオーダー（クロスマート・食材発注SaaS）、Foodist（飲食店向けSaaS）']
);
console.log('#146 updated:', r146.rowCount);

// #149 クラフト酒クラブ: competitors の「ビアジャパン（クラフトビール定期便）」を実在サービスに修正
// ビアジャパンは検索で実在確認できず → よなよなエール定期便やOtomoniが実際の競合
const r149 = await pool.query(
  `UPDATE "Idea" SET competitors = $1, "updatedAt" = NOW() WHERE number = 149`,
  ['KURAND（日本酒サブスク）、よなよなエール定期便（ヤッホーブルーイング・クラフトビール定期便）、Amazonプライム（酒類EC）']
);
console.log('#149 updated:', r149.rowCount);

await pool.end();
console.log('\nAll updates completed.');
