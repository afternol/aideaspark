import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://postgres:Bcgconsultant347@db.oszprtmhokcqajxvtfnt.supabase.co:5432/postgres' });
const r = await pool.query('SELECT number, "whyNow", "competitors" FROM "Idea" WHERE number >= 131 AND number <= 140 ORDER BY number');
r.rows.forEach(row => {
  console.log(`\n=== #${row.number} ===`);
  console.log('whyNow:', row.whyNow?.substring(0, 300));
  console.log('competitors:', row.competitors?.substring(0, 200));
});
await pool.end();
