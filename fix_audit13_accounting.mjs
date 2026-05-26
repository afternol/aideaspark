import pkg from './node_modules/pg/lib/index.js';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://postgres:Bcgconsultant347@db.oszprtmhokcqajxvtfnt.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

await client.connect();

const current = await client.query(`
  SELECT report FROM "TrendCache" WHERE slug = 'accounting-dx'
`);

const report = current.rows[0].report;

console.log('=== Before fix ===');
console.log('summary:', report.summary);
console.log('recentNews[0].detail:', report.recentNews[0].detail);

// 修正1: summaryの「同日発表」→「翌4月16日に発表」
report.summary = report.summary.replace(
  '「freee Agent Hub」は同日発表・2026年5月以降提供開始予定として',
  '「freee Agent Hub」は翌4月16日に発表・2026年5月以降提供開始予定として'
);

// 修正2: recentNews[0].detail の「同日発表（5月以降提供開始予定）」
report.recentNews[0].detail = report.recentNews[0].detail.replace(
  '「freee Agent Hub」も同日発表（5月以降提供開始予定）した[2]。',
  '「freee Agent Hub」は翌4月16日に発表（5月以降提供開始予定）した[2]。'
);

console.log('\n=== After fix ===');
console.log('summary:', report.summary);
console.log('recentNews[0].detail:', report.recentNews[0].detail);

await client.query(`
  UPDATE "TrendCache"
  SET report = $1::jsonb, "updatedAt" = NOW()
  WHERE slug = 'accounting-dx'
`, [JSON.stringify(report)]);

console.log('\nDB updated successfully!');

await client.end();
