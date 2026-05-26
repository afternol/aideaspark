import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://postgres:Bcgconsultant347@db.oszprtmhokcqajxvtfnt.supabase.co:5432/postgres' });

// #82 revenueModel: 継続手数料 1〜5% → 5〜20%（業界実態に基づく修正）
const update82 = await pool.query(`
  UPDATE "Idea"
  SET "revenueModel" = $1
  WHERE number = 82
  RETURNING number, "revenueModel"
`, [
  `保険契約成立時の代理店手数料（初年度保険料の30〜100%程度、継続手数料は5〜20%）\nFP相談マッチング 成約時紹介料\nユーザーデータを活用した保険会社へのリード販売`
]);

console.log('=== UPDATE #82 revenueModel ===');
console.log(JSON.stringify(update82.rows, null, 2));

await pool.end();
console.log('Done.');
