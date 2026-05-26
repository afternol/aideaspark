import pkg from './node_modules/pg/lib/index.js';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://postgres:Bcgconsultant347@db.oszprtmhokcqajxvtfnt.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

await client.connect();

// Fix 1: 建設テック - marketSize の建設投資額を修正
// 誤: 2026年80.8兆円（前年比5.5%増）
// 正: 2026年81兆700億円（前年比5.7%増）（建設経済研究所・建設経済レポート2026年1月版）
const kenRes = await client.query(`SELECT report FROM "TrendCache" WHERE keyword = '建設テック'`);
const kenReport = kenRes.rows[0].report;

// Fix marketSize
kenReport.marketSize = kenReport.marketSize.replace(
  '国内建設投資額：2026年80.8兆円予測（前年比5.5%増）[2]',
  '国内建設投資額：2026年度81兆700億円予測（前年比5.7%増、建設経済研究所2026年1月版）[2]'
);

// Fix recentNews 2026年4月 headline and detail
kenReport.recentNews = kenReport.recentNews.map(n => {
  if (n.date === '2026年4月' && n.headline && n.headline.includes('80.8兆円')) {
    return {
      ...n,
      headline: '建設投資2026年度81兆700億円、5.7%増の見通し',
      detail: n.detail.replace('前年比5.5%増の80.8兆円', '前年比5.7%増の81兆700億円（30年ぶり大台超え）')
    };
  }
  return n;
});

await client.query(
  `UPDATE "TrendCache" SET report = $1 WHERE keyword = '建設テック'`,
  [kenReport]
);
console.log('建設テック updated');

// Fix 2: シェアリング - source[1] のタイトルが2021年調査の旧データを示している
// cehub.jp の記事タイトルは「2.4兆円・2030年14.2兆円」(2021年調査)
// 本文では2024年度3兆1,050億円・2032年15兆1,165億円（2022年版〜2024年度調査）を引用
// source[1]を適切な出典（シェアリングエコノミー協会の最新調査）に更新

const sharingRes = await client.query(`SELECT report FROM "TrendCache" WHERE keyword = 'シェアリング'`);
const sharingReport = sharingRes.rows[0].report;

// Update source[1] to point to a more appropriate URL for 3兆1,050億円 data
sharingReport.sources = sharingReport.sources.map(s => {
  if (s.num === 1) {
    return {
      num: 1,
      url: 'https://sharing-economy.jp/ja/wp-content/uploads/2024/05/2876e7e766032945d310ea54119600b8.pdf',
      title: 'シェアリングエコノミー市場調査2024年版（2024年度3兆1,050億円）シェアリングエコノミー協会',
      publisher: 'sharing-economy.jp'
    };
  }
  return s;
});

await client.query(
  `UPDATE "TrendCache" SET report = $1 WHERE keyword = 'シェアリング'`,
  [sharingReport]
);
console.log('シェアリング updated');

await client.end();
console.log('All updates done');
