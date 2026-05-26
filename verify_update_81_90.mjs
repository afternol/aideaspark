import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://postgres:Bcgconsultant347@db.oszprtmhokcqajxvtfnt.supabase.co:5432/postgres' });

const res = await pool.query(`
  SELECT number, "serviceName", "revenueModel"
  FROM "Idea"
  WHERE number = 82
`);

console.log('=== #82 現在のrevenueModel ===');
console.log(JSON.stringify(res.rows, null, 2));
await pool.end();
