/**
 * 第2回監査で確認された事実誤記を修正
 * 1. バーティカルSaaS: 電子帳簿保存法「2026年1月完全義務化」→「2024年1月完全義務化」
 * 2. セキュリティ: RISS登録者数「約24,000人」→「約26,500人」
 * 3. サーキュラーエコノミー: Spiberの2025年12月期438億円赤字を追記
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
    console.log("⚠ 変更なし:", keyword, "（対象テキストが見つかりませんでした）");
  }
}

async function main() {
  // Fix 1: バーティカルSaaS - 電子帳簿保存法の施行日
  // 実際: 2024年1月1日に完全義務化（宥恕期間終了）
  // 誤記: 2026年1月から完全義務化
  await fix("バーティカルSaaS", (r) => {
    let changed = false;
    const before_news = JSON.stringify(r.recentNews);
    r.recentNews = r.recentNews.map((n) => {
      if (n.headline && n.headline.includes("電子帳簿保存法完全義務化施行")) {
        const fixed = {
          ...n,
          date: n.date.replace("2026年1月", "2024年1月"),
          headline: n.headline.replace("電子帳簿保存法完全義務化施行", "電子帳簿保存法完全義務化（宥恕期間終了）"),
          detail: n.detail
            ? n.detail.replace("2026年1月から完全義務化", "2024年1月から完全義務化（宥恕期間終了）")
            : n.detail,
        };
        console.log("  recentNews: 電子帳簿保存法施行日修正");
        return fixed;
      }
      return n;
    });
    if (JSON.stringify(r.recentNews) !== before_news) changed = true;

    // summary・investmentTrendsの「2026年1月から完全義務化」も修正
    if (r.summary && r.summary.includes("電子帳簿保存法が2026年1月から完全義務化")) {
      r.summary = r.summary.replace(
        "電子帳簿保存法が2026年1月から完全義務化",
        "電子帳簿保存法が2024年1月から完全義務化（宥恕期間終了）"
      );
      console.log("  summary: 電子帳簿保存法施行日修正");
      changed = true;
    }
    // globalContextの「2026年1月から完全義務化」も修正
    if (r.globalContext && r.globalContext.includes("2026年1月から完全義務化")) {
      r.globalContext = r.globalContext.replace(/2026年1月から完全義務化/g, "2024年1月から完全義務化（宥恕期間終了）");
      console.log("  globalContext: 電子帳簿保存法施行日修正");
      changed = true;
    }
    // outlookの修正
    if (r.outlook && r.outlook.includes("2026年1月から完全義務化")) {
      r.outlook = r.outlook.replace(/2026年1月から完全義務化/g, "2024年1月から完全義務化（宥恕期間終了）");
      changed = true;
    }
    return changed;
  });

  // Fix 2: セキュリティ - RISS登録者数
  // IPA公式: 2026年4月1日時点で26,453人
  await fix("セキュリティ", (r) => {
    let changed = false;
    const fields = ["summary", "outlook", "globalContext", "investmentTrends"];
    for (const f of fields) {
      if (r[f] && r[f].includes("約24,000人")) {
        r[f] = r[f].replace(/約24,000人/g, "約26,500人");
        console.log(`  ${f}: RISS 約24,000人 → 約26,500人`);
        changed = true;
      }
    }
    if (r.keyPlayers) {
      r.keyPlayers = r.keyPlayers.map((p) => {
        if (p.includes("約24,000人")) {
          console.log("  keyPlayers: RISS 約24,000人 → 約26,500人");
          return p.replace(/約24,000人/g, "約26,500人");
        }
        return p;
      });
    }
    return changed;
  });

  // Fix 3: サーキュラーエコノミー - Spiber 2025年12月期438億円赤字を追記
  // 現在の記述: 「2024年12月期に最終赤字295億円を計上し、2025年末に約362億円の借入返済問題が表面化」
  // 正確な記述: 2024年12月期295億円赤字、2025年12月期438億円赤字も計上
  await fix("サーキュラーエコノミー", (r) => {
    let changed = false;
    const target = "2024年12月期に最終赤字295億円を計上し、2025年末に約362億円の借入返済問題が表面化";
    const replacement = "2024年12月期に最終赤字295億円、2025年12月期に最終赤字438億円を計上し、2025年末に約362億円の借入返済期限到来";
    const fields = ["summary", "globalContext", "investmentTrends", "outlook"];
    for (const f of fields) {
      if (r[f] && r[f].includes(target)) {
        r[f] = r[f].replace(target, replacement);
        console.log(`  ${f}: Spiber 2025年12月期438億円赤字を追記`);
        changed = true;
      }
    }
    // recentNewsにも同様の記述がある場合
    if (r.recentNews) {
      const before = JSON.stringify(r.recentNews);
      r.recentNews = r.recentNews.map((n) => {
        if (n.detail && n.detail.includes("2024年12月期に最終赤字295億円を計上し、2025年末に約362億円の借入返済問題が表面化")) {
          return {
            ...n,
            detail: n.detail.replace(target, replacement),
          };
        }
        return n;
      });
      if (JSON.stringify(r.recentNews) !== before) {
        console.log("  recentNews: Spiber 2025年12月期438億円赤字を追記");
        changed = true;
      }
    }
    // keyPlayersの修正
    if (r.keyPlayers) {
      const before = JSON.stringify(r.keyPlayers);
      r.keyPlayers = r.keyPlayers.map((p) => {
        if (p.includes("2024年12月期に最終赤字295億円を計上し、2025年末に約362億円の借入返済問題が表面化")) {
          return p.replace(target, replacement);
        }
        return p;
      });
      if (JSON.stringify(r.keyPlayers) !== before) {
        console.log("  keyPlayers: Spiber 2025年12月期438億円赤字を追記");
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
