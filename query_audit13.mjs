import pkg from './node_modules/pg/lib/index.js';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://postgres:Bcgconsultant347@db.oszprtmhokcqajxvtfnt.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

await client.connect();

const res = await client.query(`
  SELECT keyword, slug, category, "totalScore", momentum, report
  FROM "TrendCache"
  WHERE report IS NOT NULL
  ORDER BY "totalScore" DESC
  LIMIT 11 OFFSET 22
`);

console.log(JSON.stringify(res.rows, null, 2));
await client.end();
