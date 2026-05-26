import pkg from './node_modules/pg/lib/index.js';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://postgres:Bcgconsultant347@db.oszprtmhokcqajxvtfnt.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

await client.connect();

// Fix 3: リーガルテック - marketSizeの矢野経済研究所相当のデータが[10](Mordor Intelligence)に帰属している
// ITR調査のデータ（前年比22%増、2029年度500億円超）をより正確に表記し、出典を明示する
const legalRes = await client.query(`SELECT report FROM "TrendCache" WHERE keyword = 'リーガルテック'`);
const legalReport = legalRes.rows[0].report;

// Fix marketSize - separate the ITR data citation from Mordor Intelligence
legalReport.marketSize = legalReport.marketSize.replace(
  '日本国内の電子契約市場は2025年度に前年比22%増、2029年度500億円超（矢野経済研究所相当、2025年）[10]',
  '日本国内の電子契約市場は2025年度に前年比22%増（295億円）、2029年度500億円超・CAGR11.3%（ITRアイ・ティ・アール調査、2025年10月）[10]'
);

await client.query(
  `UPDATE "TrendCache" SET report = $1 WHERE keyword = 'リーガルテック'`,
  [legalReport]
);
console.log('リーガルテック marketSize updated (ITR attribution clarified)');

// Verify the updates
const verRes = await client.query(`
  SELECT keyword, report->'marketSize' as marketSize
  FROM "TrendCache" 
  WHERE keyword IN ('建設テック', 'シェアリング', 'リーガルテック')
`);
verRes.rows.forEach(r => {
  console.log('\n=== ' + r.keyword + ' ===');
  console.log(r.marketSize?.substring ? r.marketSize.substring(0,200) : JSON.stringify(r.marketSize).substring(0,200));
});

await client.end();
