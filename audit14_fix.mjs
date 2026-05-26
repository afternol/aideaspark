import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:Bcgconsultant347@db.oszprtmhokcqajxvtfnt.supabase.co:5432/postgres' });

// 現在の値を取得
const cur = await pool.query(`SELECT number, "serviceName", competitors, "whyNow" FROM "Idea" WHERE number IN (142, 144, 146, 149) ORDER BY number`);
for (const r of cur.rows) {
  console.log(`\n=== #${r.number} ${r.serviceName} ===`);
  console.log('competitors:', r.competitors);
  console.log('whyNow:', r.whyNow?.substring(0, 400));
}
await pool.end();
