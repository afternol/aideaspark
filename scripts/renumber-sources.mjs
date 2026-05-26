/**
 * 全86件のsources番号を1から連番に振り直す
 * - sources定義の番号を [旧] → [1,2,3,...] に整理
 * - 本文中の引用番号も対応して置き換え
 * - 置き換えは一時プレースホルダー経由で衝突を防ぐ
 */
import pg from "pg";

const DB_URL =
  (process.env.DATABASE_URL || "");
const pool = new pg.Pool({ connectionString: DB_URL });

/**
 * report全体（sourcesフィールド以外）の引用番号を置き換える
 * 衝突防止のため: 旧番号 → __TEMP_N__ → 新番号
 */
function remapRefs(text, mapping) {
  // Step1: 旧番号 → プレースホルダー
  let result = text;
  for (const [oldNum, newNum] of Object.entries(mapping)) {
    result = result.replace(
      new RegExp(`\\[${oldNum}\\]`, "g"),
      `[__TEMP_${newNum}__]`
    );
  }
  // Step2: プレースホルダー → 新番号
  for (const newNum of Object.values(mapping)) {
    result = result.replace(
      new RegExp(`\\[__TEMP_${newNum}__\\]`, "g"),
      `[${newNum}]`
    );
  }
  return result;
}

function processReport(r) {
  if (!Array.isArray(r.sources) || r.sources.length === 0) return false;

  // 現在のsources番号をソートして取得
  const sortedNums = [...r.sources.map((s) => s.num)].sort((a, b) => a - b);

  // 既に1から連番になっているか確認
  const isAlreadySequential = sortedNums.every((n, i) => n === i + 1);
  if (isAlreadySequential) return false;

  // 旧番号 → 新番号のマッピングを作成
  const mapping = {};
  sortedNums.forEach((oldNum, i) => {
    mapping[oldNum] = i + 1;
  });

  // sourcesの番号を振り直し
  r.sources = r.sources
    .sort((a, b) => a.num - b.num)
    .map((s, i) => ({ ...s, num: i + 1 }));

  // 各テキストフィールドの引用番号を置き換え
  const textFields = ["summary", "investmentTrends", "globalContext", "marketSize", "outlook"];
  for (const f of textFields) {
    if (r[f]) r[f] = remapRefs(r[f], mapping);
  }

  if (Array.isArray(r.recentNews)) {
    r.recentNews = r.recentNews.map((n) => ({
      ...n,
      headline: n.headline ? remapRefs(n.headline, mapping) : n.headline,
      detail: n.detail ? remapRefs(n.detail, mapping) : n.detail,
    }));
  }

  if (Array.isArray(r.keyPlayers)) {
    r.keyPlayers = r.keyPlayers.map((p) =>
      typeof p === "string" ? remapRefs(p, mapping) : p
    );
  }

  return true; // 変更あり
}

async function main() {
  const res = await pool.query(
    'SELECT keyword, report FROM "TrendCache" ORDER BY keyword'
  );

  let fixedCount = 0;
  const fixedKeywords = [];

  for (const row of res.rows) {
    const keyword = row.keyword;
    const r =
      typeof row.report === "string" ? JSON.parse(row.report) : row.report;

    const changed = processReport(r);

    if (changed) {
      // 変更後の整合性チェック
      const sourceNums = r.sources.map((s) => s.num);
      const text = JSON.stringify({ ...r, sources: undefined });
      const refs = [...text.matchAll(/\[(\d+)\]/g)]
        .map((m) => parseInt(m[1]))
        .filter((n) => n > 0);
      const refSet = new Set(refs);
      const srcSet = new Set(sourceNums);
      const outOfRange = [...refSet].filter((n) => !srcSet.has(n));

      if (outOfRange.length > 0) {
        console.error(
          `❌ [${keyword}] 整合性エラー: 範囲外参照 [${outOfRange.join("][")}] → スキップ`
        );
        continue;
      }

      r.generatedAt = new Date().toISOString();
      await pool.query(
        'UPDATE "TrendCache" SET report = $1, "updatedAt" = NOW() WHERE keyword = $2',
        [JSON.stringify(r), keyword]
      );

      fixedCount++;
      fixedKeywords.push(`${keyword} → [${sourceNums.join(",")}]`);
    }
  }

  console.log(`\n=== sources連番化完了 ===`);
  console.log(`修正件数: ${fixedCount} / ${res.rows.length} レポート\n`);
  fixedKeywords.forEach((k) => console.log("✓", k));

  // 最終確認: 全レポートで連番かつ整合性チェック
  console.log("\n=== 最終整合性チェック ===");
  const res2 = await pool.query(
    'SELECT keyword, report FROM "TrendCache" ORDER BY keyword'
  );
  let allOk = true;
  for (const row of res2.rows) {
    const keyword = row.keyword;
    const r =
      typeof row.report === "string" ? JSON.parse(row.report) : row.report;
    if (!Array.isArray(r.sources)) continue;

    const sourceNums = r.sources.map((s) => s.num).sort((a, b) => a - b);
    const isSeq = sourceNums.every((n, i) => n === i + 1);
    const text = JSON.stringify({ ...r, sources: undefined });
    const refs = [...text.matchAll(/\[(\d+)\]/g)]
      .map((m) => parseInt(m[1]))
      .filter((n) => n > 0);
    const refSet = new Set(refs);
    const srcSet = new Set(sourceNums);
    const outOfRange = [...refSet].filter((n) => !srcSet.has(n));
    const unused = sourceNums.filter((n) => !refSet.has(n));

    if (!isSeq || outOfRange.length > 0 || unused.length > 0) {
      allOk = false;
      console.log(`⚠ [${keyword}]`);
      if (!isSeq) console.log(`   連番でない: [${sourceNums.join(",")}]`);
      if (outOfRange.length) console.log(`   範囲外参照: [${outOfRange.join("][")}]`);
      if (unused.length) console.log(`   未使用source: [${unused.join(",")}]`);
    }
  }
  if (allOk) console.log("全レポート: 連番・整合性 ✓");

  await pool.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
