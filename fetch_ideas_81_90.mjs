import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://postgres:Bcgconsultant347@db.oszprtmhokcqajxvtfnt.supabase.co:5432/postgres' });

const res = await pool.query(`
  SELECT number, "serviceName", concept, target, problem, product, "revenueModel", competitors, "competitiveEdge", "whyNow", "strengthNote"
  FROM "Idea"
  WHERE number BETWEEN 81 AND 90
  ORDER BY number
`);

console.log(JSON.stringify(res.rows, null, 2));
await pool.end();
