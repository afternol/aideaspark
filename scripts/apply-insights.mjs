/**
 * apply-insights.mjs
 * 生成済みインサイトJSONをSupabase PostgreSQLに直接書き込む
 * 使い方: node scripts/apply-insights.mjs
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

const data1 = JSON.parse(readFileSync(join(__dirname, "insights-data.json"), "utf8"));
const data2 = JSON.parse(readFileSync(join(__dirname, "insights-data-2.json"), "utf8"));
const data3 = JSON.parse(readFileSync(join(__dirname, "insights-data-3.json"), "utf8"));
const allInsights = [...data1, ...data2, ...data3];

console.log(`📋 インサイト件数: ${allInsights.length}件`);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

let updated = 0;
let skipped = 0;

for (const item of allInsights) {
  const result = await pool.query(
    `UPDATE "Idea" SET "whyNow" = $1, "noveltyNote" = $2, "strengthNote" = $3 WHERE id = $4`,
    [item.whyNow, item.noveltyNote, item.strengthNote, item.id]
  );
  if (result.rowCount > 0) {
    updated++;
    process.stdout.write(`\r  ✅ ${updated}件更新中...`);
  } else {
    console.warn(`\n  ⚠️  ${item.id} — DBに見つかりません`);
    skipped++;
  }
}

await pool.end();

console.log(`\n\n✅ 更新完了: ${updated}件`);
if (skipped > 0) console.log(`⚠️  スキップ: ${skipped}件`);
