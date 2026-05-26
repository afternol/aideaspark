/**
 * 監査で確認された真の誤りを修正
 * 1. バーティカルSaaS: summary の "カイポケARR61.6億円" → "ARR113億円（2024年度）"
 * 2. モビリティ: summary から インターステラテクノロジズ（宇宙企業）の言及を削除
 * 3. フードロス: marketSize から "フードテック世界市場 280兆円" を削除
 */
import pg from "pg";

const DB_URL =
  (process.env.DATABASE_URL || "");
const pool = new pg.Pool({ connectionString: DB_URL });

async function fix(keyword, fn) {
  const res = await pool.query(
    'SELECT report FROM "TrendCache" WHERE keyword = $1',
    [keyword]
  );
  const r =
    typeof res.rows[0].report === "string"
      ? JSON.parse(res.rows[0].report)
      : res.rows[0].report;
  fn(r);
  r.generatedAt = new Date().toISOString();
  await pool.query(
    'UPDATE "TrendCache" SET report = $1, "updatedAt" = NOW() WHERE keyword = $2',
    [JSON.stringify(r), keyword]
  );
  console.log("✓ 修正完了:", keyword);
}

async function main() {
  // Fix 1: バーティカルSaaS
  // summary で "ARR61.6億円[5]" → keyPlayers の正確な値 "ARR113億円（2024年度）" に修正
  await fix("バーティカルSaaS", (r) => {
    const before = r.summary;
    r.summary = r.summary.replace(
      "カイポケ（SMS）がARR61.6億円[5]",
      "カイポケ（SMS）がARR113億円（2024年度）[5]"
    );
    if (r.summary !== before) {
      console.log("  summary: ARR61.6億円 → ARR113億円（2024年度）");
    }
  });

  // Fix 2: モビリティ
  // summary から "インターステラテクノロジズが201億円の大型調達を完了[4]し、" を削除
  // 宇宙ロケット企業は地上モビリティの動向として不適切
  await fix("モビリティ", (r) => {
    const before = r.summary;
    r.summary = r.summary.replace(
      "インターステラテクノロジズが201億円の大型調達を完了[4]し、Lean Mobilityが4.5億円を調達[4]した一方、",
      "Lean Mobilityが4.5億円を調達[4]する一方、"
    );
    if (r.summary !== before) {
      console.log(
        "  summary: インターステラテクノロジズ（宇宙企業）の言及を削除"
      );
    }
  });

  // Fix 3: フードロス
  // marketSize から "フードテック世界市場：2050年に280兆円予測（三菱総合研究所、2024年2月）" を削除
  // フードロス専用市場ではなくフードテック全体市場の数値であり対象範囲が異なる
  await fix("フードロス", (r) => {
    const before = r.marketSize;
    r.marketSize = r.marketSize.replace(
      "フードテック世界市場：2050年に280兆円予測（三菱総合研究所、2024年2月）。",
      ""
    ).replace(
      "フードテック世界市場：2050年に280兆円予測（三菱総合研究所、2024年2月）",
      ""
    );
    if (r.marketSize !== before) {
      console.log(
        "  marketSize: フードテック280兆円（フードテック全体・対象範囲違い）を削除"
      );
    }
    console.log("  修正後 marketSize:", r.marketSize);
  });

  await pool.end();
  console.log("\n=== 全修正完了 ===");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
