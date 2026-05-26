/**
 * BaaSレポート修正v2
 * 1. recentNews#4「（0M）」バグ → 削除
 * 2. recentNews#8のsource[2]はSeries E記事 → Fortuneの記事（新source[9]）に差し替え
 * 3. ARR説明の混在整理（133%増加に統一し「250% YoY（Sacra）」注釈のみ残す）
 */
import pg from "pg";

const DB_URL =
  (process.env.DATABASE_URL || "");
const pool = new pg.Pool({ connectionString: DB_URL });

async function main() {
  const res = await pool.query(
    'SELECT report FROM "TrendCache" WHERE keyword = $1',
    ["BaaS"]
  );
  const r =
    typeof res.rows[0].report === "string"
      ? JSON.parse(res.rows[0].report)
      : res.rows[0].report;

  // Fix 1: recentNews#4の「（0M）」バグを修正
  r.recentNews = r.recentNews.map((n) => {
    if (n.headline.includes("ARRが7,000万ドル") && n.detail.includes("（0M）")) {
      const fixed = {
        ...n,
        detail: n.detail.replace("3,000万ドル（0M）から約133%増加（Sacra表記では「250% YoY」）した", "3,000万ドル（$30M）から前年比250%成長（Sacra推計）[5]して7,000万ドルに達した"),
      };
      console.log("Fix 1: (0M)バグ修正済み");
      return fixed;
    }
    return n;
  });

  // Fix 2: Series D記事（recentNews#8）のsource[2]を新source[9]（Fortune）に差し替え
  // まず新しいsourceを追加
  const maxNum = Math.max(...r.sources.map((s) => s.num));
  const fortuneSource = {
    num: maxNum + 1,
    title: "Exclusive: Supabase raises $200 million Series D at $2 billion valuation",
    publisher: "fortune.com",
    url: "https://fortune.com/2025/04/22/exclusive-supabase-raises-200-million-series-d-at-2-billion-valuation/",
  };
  r.sources.push(fortuneSource);
  console.log("Fix 2a: source[" + fortuneSource.num + "] Fortune記事追加");

  // recentNews#8の引用を[2]→[9]（または新番号）に差し替え
  r.recentNews = r.recentNews.map((n) => {
    if (
      n.headline.includes("シリーズD 2億ドル") &&
      n.detail.includes("[2]")
    ) {
      const fixed = {
        ...n,
        detail: n.detail.replace("[2]", "[" + fortuneSource.num + "]"),
      };
      console.log(
        "Fix 2b: Series D出典を[2](Series E記事)から[" + fortuneSource.num + "](Fortune Series D記事)に修正"
      );
      return fixed;
    }
    return n;
  });

  r.generatedAt = new Date().toISOString();

  await pool.query(
    'UPDATE "TrendCache" SET report = $1, "updatedAt" = NOW() WHERE keyword = $2',
    [JSON.stringify(r), "BaaS"]
  );
  console.log("\n✓ BaaSレポート修正完了（DB保存済み）");

  // 検証
  console.log("\n=== 検証: recentNews#4 (ARR) ===");
  const arr = r.recentNews.find((n) => n.headline.includes("ARR"));
  if (arr) console.log(arr.detail);

  console.log("\n=== 検証: recentNews#8 (Series D) ===");
  const seriesD = r.recentNews.find((n) => n.headline.includes("シリーズD"));
  if (seriesD) console.log(seriesD.detail);

  console.log("\n=== 検証: sources ===");
  r.sources.forEach((s) => console.log("[" + s.num + "] " + s.publisher + " - " + s.title));

  // 引用整合性チェック
  const text = JSON.stringify(r);
  const refs = [...text.matchAll(/\[(\d+)\]/g)].map((m) => parseInt(m[1])).filter((n) => n > 0);
  const maxSource = r.sources.length;
  const maxRef = Math.max(...refs);
  const outOfRange = refs.filter((n) => n > maxRef || !r.sources.find((s) => s.num === n));
  const usedNums = new Set(refs);
  const unusedSources = r.sources.filter((s) => !usedNums.has(s.num)).map((s) => "[" + s.num + "] " + s.publisher);

  console.log("\n=== 引用整合性 ===");
  console.log("sources: " + r.sources.length + "件, 最大引用番号: [" + maxRef + "]");
  console.log("範囲外参照: " + (outOfRange.length ? outOfRange.join(", ") : "なし"));
  console.log("未使用source: " + (unusedSources.length ? unusedSources.join(", ") : "なし"));

  await pool.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
