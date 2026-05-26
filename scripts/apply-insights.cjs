/**
 * apply-insights.cjs
 * insights-data*.json の whyNow/noveltyNote/strengthNote を SQLite DB に適用する
 */
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const scriptsDir = __dirname;
const dbPath = path.join(scriptsDir, "..", "dev.db");

const data1 = JSON.parse(fs.readFileSync(path.join(scriptsDir, "insights-data.json"), "utf8"));
const data2 = JSON.parse(fs.readFileSync(path.join(scriptsDir, "insights-data-2.json"), "utf8"));
const data3 = JSON.parse(fs.readFileSync(path.join(scriptsDir, "insights-data-3.json"), "utf8"));
const all = [...data1, ...data2, ...data3];

const db = new Database(dbPath);

const stmt = db.prepare(`
  UPDATE Idea
  SET whyNow = @whyNow,
      noveltyNote = @noveltyNote,
      strengthNote = @strengthNote,
      updatedAt = datetime('now')
  WHERE id = @id
`);

const tx = db.transaction(() => {
  let updated = 0;
  let skipped = 0;
  for (const item of all) {
    const result = stmt.run({
      id: item.id,
      whyNow: item.whyNow ?? null,
      noveltyNote: item.noveltyNote ?? null,
      strengthNote: item.strengthNote ?? null,
    });
    if (result.changes > 0) {
      updated++;
    } else {
      skipped++;
      console.warn(`  [SKIP] ${item.id} — DB に該当レコードなし`);
    }
  }
  console.log(`✅ 更新: ${updated} 件 / スキップ: ${skipped} 件`);
});

tx();
db.close();
console.log("完了: インサイトデータを DB に適用しました");
