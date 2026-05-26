/**
 * 全86件のsources整合性修正
 * - 本文で参照されていない未使用sourceをsourcesリストから削除
 * - 本文で参照されているがsourcesに存在しない番号（範囲外参照）を報告
 */
import pg from "pg";

const DB_URL =
  (process.env.DATABASE_URL || "");
const pool = new pg.Pool({ connectionString: DB_URL });

function getReferencedNums(r) {
  // report全体のJSONから [数字] パターンを抽出（sourcesフィールド自体は除外）
  const clone = { ...r };
  delete clone.sources;
  const text = JSON.stringify(clone);
  const matches = [...text.matchAll(/\[(\d+)\]/g)];
  return new Set(matches.map((m) => parseInt(m[1])).filter((n) => n > 0));
}

async function main() {
  const res = await pool.query('SELECT keyword, report FROM "TrendCache" ORDER BY keyword');

  let totalFixed = 0;
  let totalProblems = 0;
  const outOfRangeList = [];
  const fixedList = [];

  for (const row of res.rows) {
    const keyword = row.keyword;
    const r = typeof row.report === "string" ? JSON.parse(row.report) : row.report;

    if (!Array.isArray(r.sources) || r.sources.length === 0) continue;

    const referencedNums = getReferencedNums(r);
    const sourceNums = new Set(r.sources.map((s) => s.num));

    // 未使用source（sourcesに定義されているが本文で参照されていない）
    const unusedSources = r.sources.filter((s) => !referencedNums.has(s.num));

    // 範囲外参照（本文で参照されているがsourcesに存在しない）
    const outOfRange = [...referencedNums].filter((n) => !sourceNums.has(n));

    if (unusedSources.length > 0) {
      // 未使用sourceを削除
      const before = r.sources.length;
      r.sources = r.sources.filter((s) => referencedNums.has(s.num));
      const after = r.sources.length;

      r.generatedAt = new Date().toISOString();
      await pool.query(
        'UPDATE "TrendCache" SET report = $1, "updatedAt" = NOW() WHERE keyword = $2',
        [JSON.stringify(r), keyword]
      );

      fixedList.push({
        keyword,
        removed: unusedSources.map((s) => `[${s.num}] ${s.publisher}`),
        before,
        after,
      });
      totalFixed++;
    }

    if (outOfRange.length > 0) {
      outOfRangeList.push({ keyword, nums: outOfRange });
      totalProblems++;
    }
  }

  console.log("\n=== 未使用source削除完了 ===");
  console.log(`修正したレポート数: ${totalFixed}件\n`);
  for (const f of fixedList) {
    console.log(`✓ [${f.keyword}] sources: ${f.before}件 → ${f.after}件`);
    f.removed.forEach((s) => console.log(`   削除: ${s}`));
  }

  if (outOfRangeList.length > 0) {
    console.log(`\n=== 範囲外参照（要注意: sourcesに存在しない番号を参照）===`);
    console.log(`検出数: ${outOfRangeList.length}件\n`);
    for (const p of outOfRangeList) {
      console.log(`⚠ [${p.keyword}] 参照番号 [${p.nums.join("][")}] がsourcesに存在しない`);
    }
  } else {
    console.log("\n範囲外参照: なし ✓");
  }

  await pool.end();
  console.log("\n=== 処理完了 ===");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
