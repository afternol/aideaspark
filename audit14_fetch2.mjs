import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:Bcgconsultant347@db.oszprtmhokcqajxvtfnt.supabase.co:5432/postgres' });

const res = await pool.query(`SELECT number, "serviceName", "whyNow", competitors FROM "Idea" WHERE number BETWEEN 141 AND 150 ORDER BY number`);
for (const r of res.rows) {
  console.log(`\n=== #${r.number} ${r.serviceName} ===`);
  console.log('whyNow:', r.whyNow?.substring(0, 400));
  console.log('competitors:', r.competitors?.substring(0, 400));
}
await pool.end();
