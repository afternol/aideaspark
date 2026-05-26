import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:Bcgconsultant347@db.oszprtmhokcqajxvtfnt.supabase.co:5432/postgres' });

const res = await pool.query(`SELECT * FROM "Idea" WHERE number BETWEEN 141 AND 141 LIMIT 1`);
console.log('Columns:', Object.keys(res.rows[0]));
await pool.end();
