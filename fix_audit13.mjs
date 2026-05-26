import pkg from './node_modules/pg/lib/index.js';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://postgres:Bcgconsultant347@db.oszprtmhokcqajxvtfnt.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

await client.connect();

// ============================================================
// FIX 1: HR Tech - [8] references should be [10]
// Sources have num 1,2,3,4,5,6,7,10 - source 8 does not exist.
// Text uses [8] in 2 places (協会けんぽ電子申請 and 労基法改正案見送り).
// These both come from source 10 (mag.smarthr.jp/hr/labor/hrnews_202601/).
// ============================================================

const hrResult = await client.query(`SELECT report FROM "TrendCache" WHERE slug = 'hr-tech'`);
const hrReport = hrResult.rows[0].report;
const hrReportStr = JSON.stringify(hrReport);

// Replace all [8] with [10] in the HR Tech report
const hrReportFixed = JSON.parse(hrReportStr.replace(/\[8\]/g, '[10]'));

await client.query(
  `UPDATE "TrendCache" SET report = $1, "updatedAt" = NOW() WHERE slug = 'hr-tech'`,
  [hrReportFixed]
);
console.log('FIX 1 applied: HR Tech [8] to [10]');

// Verify
const hrVerify = await client.query(`SELECT report FROM "TrendCache" WHERE slug = 'hr-tech'`);
const hrVerifyStr = JSON.stringify(hrVerify.rows[0].report);
const remaining8 = (hrVerifyStr.match(/\[8\]/g) || []).length;
const now10 = (hrVerifyStr.match(/\[10\]/g) || []).length;
console.log('  Remaining [8] refs:', remaining8, '(should be 0)');
console.log('  [10] refs now:', now10);

// ============================================================
// FIX 2: 採用テック - source 7 is unused (B9 issue).
// Remove source 7 from sources array since it is never referenced in text.
// ============================================================

const saiyoSlugResult = await client.query(`SELECT slug, report FROM "TrendCache" WHERE keyword = '採用テック'`);
if (saiyoSlugResult.rows.length > 0) {
  const saiyoSlug = saiyoSlugResult.rows[0].slug;
  const saiyoReport = saiyoSlugResult.rows[0].report;
  const originalSourceCount = saiyoReport.sources.length;
  saiyoReport.sources = saiyoReport.sources.filter(s => s.num !== 7);

  await client.query(
    `UPDATE "TrendCache" SET report = $1, "updatedAt" = NOW() WHERE slug = $2`,
    [saiyoReport, saiyoSlug]
  );
  console.log('\nFIX 2 applied: 採用テック source 7 removed (' + originalSourceCount + ' to ' + saiyoReport.sources.length + ' sources), slug=' + saiyoSlug);
} else {
  console.log('\nFIX 2: 採用テック record not found');
}

await client.end();
console.log('\nAll fixes applied successfully.');
