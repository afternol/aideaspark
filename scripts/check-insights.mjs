import pg from "pg";
import "dotenv/config";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const { rows } = await pool.query(
  `SELECT id, LEFT("whyNow", 40) as why_preview FROM "Idea" WHERE id IN ('idea-001','idea-050','idea-100') ORDER BY number`
);
for (const r of rows) {
  console.log(`${r.id}: ${r.why_preview ?? "NULL"}...`);
}
await pool.end();
