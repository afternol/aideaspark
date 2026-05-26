/**
 * ロボティクスレポート修正
 * 問題: 本文中に「[調査結果]」という非番号型引用が31箇所
 *       sourcesは[3][4]のみ存在（[1][2]が欠落）
 * 対応: 「[調査結果]」を全て削除（引用なし状態にする）
 */
import pg from "pg";

const DB_URL =
  (process.env.DATABASE_URL || "");
const pool = new pg.Pool({ connectionString: DB_URL });

async function main() {
  const res = await pool.query(
    'SELECT report FROM "TrendCache" WHERE keyword = $1',
    ["ロボティクス"]
  );
  const r =
    typeof res.rows[0].report === "string"
      ? JSON.parse(res.rows[0].report)
      : res.rows[0].report;

  const before = JSON.stringify(r).match(/\[調査結果\]/g)?.length ?? 0;
  console.log("修正前の[調査結果]出現数:", before);

  // 全フィールドから「[調査結果]」を削除
  const cleanStr = (s) => (s ? s.replace(/\[調査結果\]/g, "") : s);

  r.summary = cleanStr(r.summary);
  r.investmentTrends = cleanStr(r.investmentTrends);
  r.globalContext = cleanStr(r.globalContext);
  r.marketSize = cleanStr(r.marketSize);
  r.outlook = cleanStr(r.outlook);

  if (Array.isArray(r.recentNews)) {
    r.recentNews = r.recentNews.map((n) => ({
      ...n,
      detail: cleanStr(n.detail),
      headline: cleanStr(n.headline),
    }));
  }

  if (Array.isArray(r.keyPlayers)) {
    r.keyPlayers = r.keyPlayers.map(cleanStr);
  }

  const after = JSON.stringify(r).match(/\[調査結果\]/g)?.length ?? 0;
  console.log("修正後の[調査結果]出現数:", after);

  r.generatedAt = new Date().toISOString();
  await pool.query(
    'UPDATE "TrendCache" SET report = $1, "updatedAt" = NOW() WHERE keyword = $2',
    [JSON.stringify(r), "ロボティクス"]
  );
  console.log("✓ ロボティクスレポート修正完了");

  // 検証
  console.log("\n=== summary (修正後) ===");
  console.log(r.summary);
  console.log("\n=== sources ===");
  r.sources.forEach((s) => console.log(`[${s.num}] ${s.publisher}`));

  await pool.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
