const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Bcgconsultant347@db.oszprtmhokcqajxvtfnt.supabase.co:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    const r101 = await client.query(
      `SELECT number, competitors FROM "Idea" WHERE number = 101`
    );
    console.log('idea-101 competitors:', r101.rows[0].competitors);

    const r107 = await client.query(
      `SELECT number, competitors, "competitiveEdge", "noveltyNote" FROM "Idea" WHERE number = 107`
    );
    console.log('idea-107 competitors:', r107.rows[0].competitors);
    console.log('idea-107 competitiveEdge:', r107.rows[0].competitiveEdge);
    console.log('idea-107 noveltyNote:', r107.rows[0].noveltyNote);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
