/**
 * BaaSレポート 7件修正スクリプト
 * 監査で指摘された誤情報・根拠なし情報を削除・修正する
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

  // ===== Fix 1: summary =====
  // 削除: "Firebase（Google）の新規登録が前年比15%減速する一方で..."
  // 削除: "Supabaseのシェアは2025年の12%から2026年第1四半期に28%に拡大しており[6][7]"
  // 修正: ARR表記の整理（133%増 vs 250% YoYの混在解消）
  r.summary = r.summary
    // Firebase 15%減速 → 削除
    .replace(
      "Firebase（Google）の新規登録が前年比15%減速する一方でSupabaseのBaaS市場シェアは2025年の12%から2026年第1四半期に28%に拡大しており[6][7]、オープンソースBaaSへの構造的シフトが鮮明になっている",
      "AI開発ツールの普及を背景にオープンソースBaaSへの構造的シフトが鮮明になっている"
    )
    // ARR表記の整理：「2024年末比約133%増（Sacra: 250% YoY）」→ 「（Sacra: 前年比250%成長）」
    .replace(
      "ARRは2025年に7,000万ドル（2024年末比約133%増（Sacra: 250% YoY））に到達した[5]",
      "ARRは2025年に7,000万ドルに到達し、前年比250%成長（Sacra推計）[5]"
    );

  console.log("Fix 1 summary 適用済み");

  // ===== Fix 2: recentNews#2 削除（"Supabase migration 240%増加"は根拠なし） =====
  // ===== Fix 3: recentNews#3 削除（CompTIA 28%は根拠なし） =====
  r.recentNews = r.recentNews.filter((n, i) => {
    if (n.headline.includes("Supabase対Firebase") && n.detail.includes("240%")) {
      console.log("Fix 2 recentNews削除:", n.headline);
      return false;
    }
    if (n.headline.includes("市場シェアが28%") || n.detail.includes("CompTIA")) {
      console.log("Fix 3 recentNews削除:", n.headline);
      return false;
    }
    return true;
  });

  // ===== Fix 4: recentNews#5（旧#5→新#3）「約6ヶ月前」→「約4ヶ月前」 =====
  r.recentNews = r.recentNews.map((n) => {
    if (n.headline.includes("シリーズE 1億ドル調達")) {
      const fixed = {
        ...n,
        detail: n.detail.replace("約6ヶ月前のシリーズD", "約4ヶ月前のシリーズD"),
      };
      if (fixed.detail !== n.detail)
        console.log("Fix 4 recentNews#5 約6ヶ月→約4ヶ月 修正済み");
      return fixed;
    }
    return n;
  });

  // ===== Fix 5: recentNews#6（旧#6→新#4）開発者数「120万人」→「400万人以上」 =====
  r.recentNews = r.recentNews.map((n) => {
    if (n.headline.includes("ARRが7,000万ドル")) {
      const fixed = {
        ...n,
        detail: n.detail.replace(
          "世界120万人以上の開発者が利用しており",
          "世界400万人以上の開発者（2025年10月シリーズE時点）が利用しており"
        ),
      };
      if (fixed.detail !== n.detail)
        console.log("Fix 5 recentNews#6 開発者数 120万→400万 修正済み");
      return fixed;
    }
    return n;
  });

  // ===== Fix 6: recentNews#8（旧#8→新#6）「新規登録の前年比15%減速につながっている」削除 =====
  r.recentNews = r.recentNews.map((n) => {
    if (n.headline.includes("Firebase") && n.detail.includes("15%減速")) {
      const fixed = {
        ...n,
        detail: n.detail.replace(
          "、新規登録の前年比15%減速につながっている。",
          "。"
        ).replace(
          "新規登録の前年比15%減速につながっている",
          "積極的な機能追加は縮小傾向にある"
        ),
      };
      if (fixed.detail !== n.detail)
        console.log("Fix 6 recentNews#8 Firebase 15%減速 削除済み");
      return fixed;
    }
    return n;
  });

  // ===== Fix 7: keyPlayers修正 =====
  r.keyPlayers = r.keyPlayers.map((p) => {
    // #1 Supabase: 120万人→400万人、市場シェア28%削除
    if (p.startsWith("Supabase:")) {
      return p
        .replace("世界120万人開発者", "世界400万人以上の開発者（2025年10月）")
        .replace("。2026年Q1にBaaS市場シェア28%を獲得[7]", "");
    }
    // #2 Firebase: 前年比15%減速 削除
    if (p.startsWith("Firebase（Google）:")) {
      return p.replace(
        "ただし新規登録は前年比15%減速し、レガシーメンテ用途への特化が進む[6]",
        "バックエンドインフラとしての積極展開は縮小傾向にある[6]"
      );
    }
    return p;
  });
  console.log("Fix 7 keyPlayers 修正済み");

  // ===== Fix 8: globalContext「120万人」→「400万人以上」 =====
  r.globalContext = r.globalContext.replace(
    "ARR 7,000万ドル・世界120万人以上の開発者を獲得した[5]",
    "ARR 7,000万ドル・世界400万人以上の開発者（2025年10月時点）を獲得した[5]"
  );
  console.log("Fix 8 globalContext 開発者数 修正済み");

  // ===== Fix 9: investmentTrends Series D/E の投資家整理 =====
  r.investmentTrends = r.investmentTrends.replace(
    "主要投資家はAccel、Peak XV（旧Sequoia India）、Figma Venturesで、バイブコーディング・AI開発ツールの急拡大を背景に開発者インフラへの投資マネーが集中している[3]",
    "Series EはAccelとPeak XV（旧Sequoia India）が共同リードし、Figma Venturesも参加[3][4]。バイブコーディング・AI開発ツールの急拡大を背景に開発者インフラへの投資マネーが集中している"
  );
  console.log("Fix 9 investmentTrends Series D/E 投資家整理 修正済み");

  // updatedAt 更新
  r.generatedAt = new Date().toISOString();

  // DB保存
  await pool.query(
    'UPDATE "TrendCache" SET report = $1, "updatedAt" = NOW() WHERE keyword = $2',
    [JSON.stringify(r), "BaaS"]
  );
  console.log("\n✓ BaaSレポート修正完了（DB保存済み）");

  // 検証出力
  console.log("\n=== 検証: summary ===");
  console.log(r.summary);
  console.log("\n=== 検証: recentNews（件数 = " + r.recentNews.length + "）===");
  r.recentNews.forEach((n, i) =>
    console.log("#" + (i + 1) + " [" + n.date + "] " + n.headline)
  );
  console.log("\n=== 検証: keyPlayers ===");
  r.keyPlayers.forEach((p, i) => console.log("#" + (i + 1) + " " + p));
  console.log("\n=== 検証: globalContext ===");
  console.log(r.globalContext);
  console.log("\n=== 検証: investmentTrends ===");
  console.log(r.investmentTrends);

  await pool.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
