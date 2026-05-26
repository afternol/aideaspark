/**
 * APIレポート修正v2
 * 1. recentNews#5 headline「29兆円」→「約4.4兆円」（$29.25B × ¥150/$）
 * 2. recentNews日付順（降順）に並び替え
 * 3. recentNews#10（AWS）を削除（2025年4月の根拠不明確）
 * 4. recentNews#6（MuleSoft）に[6]を追加
 * 5. keyPlayers#3（Salesforce）に[6]を追加
 * 6. keyPlayers#5（Zuplo）に[6]を追加
 */
import pg from "pg";

const DB_URL =
  (process.env.DATABASE_URL || "");
const pool = new pg.Pool({ connectionString: DB_URL });

function dateToSortKey(dateStr) {
  // "2026年4月" → 202604, "2025年10月" → 202510
  const m = dateStr.match(/(\d{4})年(\d+)月/);
  if (!m) return 0;
  return parseInt(m[1]) * 100 + parseInt(m[2]);
}

async function main() {
  const res = await pool.query(
    'SELECT report FROM "TrendCache" WHERE keyword = $1',
    ["API"]
  );
  const r =
    typeof res.rows[0].report === "string"
      ? JSON.parse(res.rows[0].report)
      : res.rows[0].report;

  // Fix 1: 29兆円 → 約4.4兆円
  r.recentNews = r.recentNews.map((n) => {
    if (n.headline.includes("29兆円")) {
      const fixed = { ...n, headline: n.headline.replace("29兆円", "約4.4兆円") };
      console.log("Fix 1: headline修正:", n.headline, "→", fixed.headline);
      return fixed;
    }
    return n;
  });

  // Fix 2: AWS Gateway（根拠不明確）を削除
  r.recentNews = r.recentNews.filter((n) => {
    if (n.headline.includes("AWS API Gateway")) {
      console.log("Fix 2: 削除:", n.headline);
      return false;
    }
    return true;
  });

  // Fix 3: MuleSoftに[6]を追加
  r.recentNews = r.recentNews.map((n) => {
    if (n.headline.includes("MuleSoft") && !n.detail.includes("[6]")) {
      const fixed = { ...n, detail: n.detail + "[6]" };
      console.log("Fix 3: MuleSoft に[6]追加");
      return fixed;
    }
    return n;
  });

  // Fix 4: 日付順（降順）に並び替え
  r.recentNews.sort((a, b) => dateToSortKey(b.date) - dateToSortKey(a.date));
  console.log("Fix 4: recentNews日付順に並び替え完了");

  // Fix 5: keyPlayers Salesforce に[6]を追加
  r.keyPlayers = r.keyPlayers.map((p) => {
    if (p.startsWith("Salesforce") && !p.includes("[6]") && !p.includes("[")) {
      const fixed = p + "[6]";
      console.log("Fix 5: Salesforce keyPlayer に[6]追加");
      return fixed;
    }
    return p;
  });

  // Fix 6: keyPlayers Zuplo に[6]を追加
  r.keyPlayers = r.keyPlayers.map((p) => {
    if (p.startsWith("Zuplo") && !p.includes("[6]")) {
      const fixed = p + "[6]";
      console.log("Fix 6: Zuplo keyPlayer に[6]追加");
      return fixed;
    }
    return p;
  });

  r.generatedAt = new Date().toISOString();

  await pool.query(
    'UPDATE "TrendCache" SET report = $1, "updatedAt" = NOW() WHERE keyword = $2',
    [JSON.stringify(r), "API"]
  );
  console.log("\n✓ APIレポート修正完了（DB保存済み）");

  console.log("\n=== 検証: recentNews一覧 ===");
  r.recentNews.forEach((n, i) =>
    console.log("#" + (i + 1) + " [" + n.date + "] " + n.headline)
  );
  console.log("\n=== 検証: keyPlayers ===");
  r.keyPlayers.forEach((p, i) => console.log("#" + (i + 1) + " " + p));

  await pool.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
