/**
 * 第3回監査で確認された事実誤記を修正
 * 1. デジタルヘルス: marketSize 10倍誤記 (4,916.2億ドル→491.62億ドル)
 * 2. コーチング・メンタリング: 米国市場「1兆6,000億円」→「約3,700億円（24億ドル）」
 * 3. コーチング・メンタリング: 障害者雇用対象「37.5人以上」→「40.0人以上」
 * 4. HR Tech: mentoリード投資家「Eight Roads（リード）」→「WiL（リード）、Eight Roads（参加）」
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
  const changed = fn(r);
  if (changed) {
    r.generatedAt = new Date().toISOString();
    await pool.query(
      'UPDATE "TrendCache" SET report = $1, "updatedAt" = NOW() WHERE keyword = $2',
      [JSON.stringify(r), keyword]
    );
    console.log("✓ 修正完了:", keyword);
  } else {
    console.log("⚠ 変更なし:", keyword);
  }
}

async function main() {
  // Fix 1: デジタルヘルス - marketSize 10倍誤記
  // Fortune Business Insights実際値: 2026年$49.16B・2034年$235.1B
  // 日本語表記: 491.62億ドル・2,351.24億ドル
  await fix("デジタルヘルス", (r) => {
    let changed = false;
    if (r.marketSize && r.marketSize.includes("4,916.2億ドル")) {
      r.marketSize = r.marketSize
        .replace("4,916.2億ドル", "491.62億ドル")
        .replace("23,512.4億ドル", "2,351.24億ドル");
      console.log("  marketSize: 10倍誤記を修正（4,916.2億→491.62億ドル）");
      changed = true;
    }
    // summaryにも同様の記述があれば修正
    if (r.summary && r.summary.includes("4,916.2億ドル")) {
      r.summary = r.summary
        .replace("4,916.2億ドル", "491.62億ドル")
        .replace("23,512.4億ドル", "2,351.24億ドル");
      console.log("  summary: 10倍誤記を修正");
      changed = true;
    }
    return changed;
  });

  // Fix 2 & 3: コーチング・メンタリング
  await fix("コーチング・メンタリング", (r) => {
    let changed = false;

    // Fix 2: 米国コーチング市場規模（globalContext）
    // 実際: 約24億ドル（約3,700億円）
    const fields2 = ["globalContext", "summary", "marketSize", "outlook"];
    for (const f of fields2) {
      if (r[f] && r[f].includes("1兆6,000億円")) {
        r[f] = r[f].replace(
          /1兆6,000億円に対し/g,
          "約3,700億円（約24億ドル）に対し"
        );
        console.log(`  ${f}: 米国市場「1兆6,000億円」→「約3,700億円（約24億ドル）」`);
        changed = true;
      }
    }

    // Fix 3: 障害者雇用 対象規模
    // 正しい: 40.0人以上（法定雇用率2.7%引き上げ対象）
    const allText = JSON.stringify(r);
    if (allText.includes("37.5人以上")) {
      const fix3 = (s) =>
        s ? s.replace(/37\.5人以上/g, "40.0人以上") : s;
      const fields3 = ["summary", "recentNews", "globalContext", "investmentTrends", "outlook", "keyPlayers"];
      for (const f of fields3) {
        if (Array.isArray(r[f])) {
          const before = JSON.stringify(r[f]);
          r[f] = r[f].map((item) =>
            typeof item === "string"
              ? fix3(item)
              : { ...item, detail: fix3(item.detail), headline: fix3(item.headline) }
          );
          if (JSON.stringify(r[f]) !== before) {
            console.log(`  ${f}: 障害者雇用「37.5人以上」→「40.0人以上」`);
            changed = true;
          }
        } else if (r[f] && r[f].includes("37.5人以上")) {
          r[f] = fix3(r[f]);
          console.log(`  ${f}: 障害者雇用「37.5人以上」→「40.0人以上」`);
          changed = true;
        }
      }
    }

    return changed;
  });

  // Fix 4: HR Tech - mentoのリード投資家修正
  // 正しい: WiLがリード、Eight Roads Ventures Japanは参加投資家
  await fix("HR Tech", (r) => {
    let changed = false;
    const fix4 = (s) =>
      s
        ? s
            .replace(
              "Eight Roads Ventures Japan（リード）をはじめ複数の投資家が参加し、シリーズBラウンドで",
              "WiL（リード）、Eight Roads Ventures Japanなどが参加し、シリーズBラウンドで"
            )
            .replace(
              "Eight Roads Ventures Japan（リード）、WiL（フォローオン）",
              "WiL（リード）、Eight Roads Ventures Japan（参加）"
            )
        : s;

    const fields = ["investmentTrends", "summary", "keyPlayers", "globalContext"];
    for (const f of fields) {
      if (Array.isArray(r[f])) {
        const before = JSON.stringify(r[f]);
        r[f] = r[f].map((item) =>
          typeof item === "string" ? fix4(item) : item
        );
        if (JSON.stringify(r[f]) !== before) {
          console.log(`  ${f}: mentoリード投資家 Eight Roads→WiL に修正`);
          changed = true;
        }
      } else if (r[f] && r[f].includes("Eight Roads Ventures Japan（リード）")) {
        r[f] = fix4(r[f]);
        console.log(`  ${f}: mentoリード投資家 Eight Roads→WiL に修正`);
        changed = true;
      }
    }
    if (r.recentNews) {
      const before = JSON.stringify(r.recentNews);
      r.recentNews = r.recentNews.map((n) => ({
        ...n,
        detail: fix4(n.detail),
      }));
      if (JSON.stringify(r.recentNews) !== before) {
        console.log("  recentNews: mentoリード投資家修正");
        changed = true;
      }
    }
    return changed;
  });

  await pool.end();
  console.log("\n=== 全修正完了 ===");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
