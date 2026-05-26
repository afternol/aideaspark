import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:Bcgconsultant347@db.oszprtmhokcqajxvtfnt.supabase.co:5432/postgres'
});

async function main() {
  const client = await pool.connect();

  try {
    // まず現在のデータを確認
    const result = await client.query(
      `SELECT number, "serviceName", "whyNow", competitors FROM "Idea" WHERE number BETWEEN 171 AND 180 ORDER BY number`
    );

    console.log('=== 現在のDB状態 ===');
    for (const row of result.rows) {
      console.log(`\n#${row.number} ${row.serviceName}`);
      console.log(`  whyNow: ${row.whyNow}`);
      console.log(`  competitors: ${row.competitors}`);
    }

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
