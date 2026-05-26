/**
 * 第4回監査（最新性・ハルシネーション確認）で確認された事実誤記を修正
 * 1. クリーンテック: Plug and Play Japan Fund「当初目標50億円」→「5億円」
 * 2. Web3・ブロックチェーン: 京都卓球クラブ「2025年9月」→「2025年3月」
 * 3. Web3・ブロックチェーン: 鎌倉インテル「2025年8月」→「2025年3月」
 * 4. メンタルヘルス: Woebot Health 消費者アプリ廃止（2025年6月30日）を追記
 * 5. 生活_消費マーケットプレイス: meuron「2025年年内」→「2023年1月18日」
 * 6. 予防医療: MRワクチン「供給不足」→「供給逼迫」
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
  if (!res.rows.length) {
    console.log(`⚠ キーワード未発見: ${keyword}`);
    return;
  }
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

function replaceAll(r, oldText, newText) {
  let changed = false;
  const fields = ["summary", "investmentTrends", "globalContext", "marketSize", "outlook"];
  for (const f of fields) {
    if (r[f] && r[f].includes(oldText)) {
      r[f] = r[f].replaceAll(oldText, newText);
      console.log(`  ${f}: "${oldText}" → "${newText}"`);
      changed = true;
    }
  }
  if (Array.isArray(r.recentNews)) {
    const before = JSON.stringify(r.recentNews);
    r.recentNews = r.recentNews.map((n) => ({
      ...n,
      headline: n.headline ? n.headline.replaceAll(oldText, newText) : n.headline,
      detail: n.detail ? n.detail.replaceAll(oldText, newText) : n.detail,
      date: n.date ? n.date.replaceAll(oldText, newText) : n.date,
    }));
    if (JSON.stringify(r.recentNews) !== before) {
      console.log(`  recentNews: "${oldText}" → "${newText}"`);
      changed = true;
    }
  }
  if (Array.isArray(r.keyPlayers)) {
    const before = JSON.stringify(r.keyPlayers);
    r.keyPlayers = r.keyPlayers.map((p) =>
      typeof p === "string" ? p.replaceAll(oldText, newText) : p
    );
    if (JSON.stringify(r.keyPlayers) !== before) {
      console.log(`  keyPlayers: "${oldText}" → "${newText}"`);
      changed = true;
    }
  }
  return changed;
}

async function main() {
  // Fix 1: クリーンテック - Plug and Play Japan Fund「当初目標50億円」→「5億円」
  // 根拠: Plug and Play Japan Fund IIは5億円規模ファンド。50億円は桁違いの誤記。
  await fix("クリーンテック", (r) => {
    let changed = false;
    // 「当初目標50億円を上回って」→「当初目標の5億円を大きく上回って」
    if (replaceAll(r, "当初目標50億円を上回って", "当初目標の5億円を大きく上回って")) changed = true;
    if (replaceAll(r, "当初目標の50億円を上回って", "当初目標の5億円を大きく上回って")) changed = true;
    if (replaceAll(r, "目標50億円", "目標5億円")) changed = true;
    return changed;
  });

  // Fix 2 & 3: Web3・ブロックチェーン - デジタル社債の発行日修正
  // 京都卓球クラブ: 「2025年9月」→「2025年3月」
  // 鎌倉インテル: 「2025年8月」→「2025年3月」
  await fix("Web3・ブロックチェーン", (r) => {
    let changed = false;

    // 京都卓球クラブのデジタル社債: 2025年9月→2025年3月
    // 文脈を絞り込むため複数パターンで検索
    const allJson = JSON.stringify(r);
    if (allJson.includes("京都卓球") && allJson.includes("2025年9月")) {
      // recentNewsで京都卓球に関連する項目の日付を修正
      if (Array.isArray(r.recentNews)) {
        const before = JSON.stringify(r.recentNews);
        r.recentNews = r.recentNews.map((n) => {
          const text = JSON.stringify(n);
          if (text.includes("京都卓球") && text.includes("2025年9月")) {
            return {
              ...n,
              date: n.date === "2025年9月" ? "2025年3月" : n.date,
              headline: n.headline ? n.headline.replace("2025年9月", "2025年3月") : n.headline,
              detail: n.detail ? n.detail.replace(/京都卓球.*?2025年9月/s, (m) => m.replace("2025年9月", "2025年3月")) : n.detail,
            };
          }
          return n;
        });
        if (JSON.stringify(r.recentNews) !== before) {
          console.log("  recentNews: 京都卓球クラブ デジタル社債「2025年9月」→「2025年3月」");
          changed = true;
        }
      }
      // テキストフィールドでも京都卓球+2025年9月のパターンを修正
      const fields = ["summary", "investmentTrends", "globalContext", "outlook"];
      for (const f of fields) {
        if (r[f] && r[f].includes("京都卓球") && r[f].includes("2025年9月")) {
          // 京都卓球クラブに関する文脈の2025年9月を2025年3月に変更
          const lines = r[f].split(/(?<=。)/);
          const fixed = lines.map((line) => {
            if (line.includes("京都卓球") && line.includes("2025年9月")) {
              return line.replace("2025年9月", "2025年3月");
            }
            return line;
          }).join("");
          if (fixed !== r[f]) {
            r[f] = fixed;
            console.log(`  ${f}: 京都卓球クラブ「2025年9月」→「2025年3月」`);
            changed = true;
          }
        }
      }
    }

    // 鎌倉インテル: 2025年8月→2025年3月（鎌倉インテルのNFT/デジタル社債文脈）
    const allJson2 = JSON.stringify(r);
    if (allJson2.includes("鎌倉") && allJson2.includes("2025年8月")) {
      if (Array.isArray(r.recentNews)) {
        const before = JSON.stringify(r.recentNews);
        r.recentNews = r.recentNews.map((n) => {
          const text = JSON.stringify(n);
          if (text.includes("鎌倉") && text.includes("2025年8月")) {
            return {
              ...n,
              date: n.date === "2025年8月" ? "2025年3月" : n.date,
              headline: n.headline ? n.headline.replace("2025年8月", "2025年3月") : n.headline,
              detail: n.detail ? n.detail.replace("2025年8月", "2025年3月") : n.detail,
            };
          }
          return n;
        });
        if (JSON.stringify(r.recentNews) !== before) {
          console.log("  recentNews: 鎌倉インテル「2025年8月」→「2025年3月」");
          changed = true;
        }
      }
      const fields = ["summary", "investmentTrends", "globalContext", "outlook"];
      for (const f of fields) {
        if (r[f] && r[f].includes("鎌倉") && r[f].includes("2025年8月")) {
          const lines = r[f].split(/(?<=。)/);
          const fixed = lines.map((line) => {
            if (line.includes("鎌倉") && line.includes("2025年8月")) {
              return line.replace("2025年8月", "2025年3月");
            }
            return line;
          }).join("");
          if (fixed !== r[f]) {
            r[f] = fixed;
            console.log(`  ${f}: 鎌倉インテル「2025年8月」→「2025年3月」`);
            changed = true;
          }
        }
      }
    }

    return changed;
  });

  // Fix 4: メンタルヘルス - Woebot Health消費者アプリ廃止を追記
  // 事実: Woebot Healthは2025年6月30日に消費者向けアプリを廃止し、B2Bに転換
  await fix("メンタルヘルス", (r) => {
    let changed = false;
    const woebotAddition = "2025年6月30日に消費者向けアプリを廃止しB2Bモデルへ完全転換";

    // Woebotに言及している箇所に追記（すでに追記済みなら skip）
    if (!JSON.stringify(r).includes(woebotAddition)) {
      if (Array.isArray(r.recentNews)) {
        // Woebotに関するrecentNews項目のdetailに追記
        const before = JSON.stringify(r.recentNews);
        r.recentNews = r.recentNews.map((n) => {
          const text = JSON.stringify(n);
          if (text.includes("Woebot") && !text.includes(woebotAddition)) {
            return {
              ...n,
              detail: n.detail
                ? n.detail + `（同社は${woebotAddition}）`
                : `Woebot Healthは${woebotAddition}。`,
            };
          }
          return n;
        });
        if (JSON.stringify(r.recentNews) !== before) {
          console.log("  recentNews: Woebot Health消費者アプリ廃止を追記");
          changed = true;
        }
      }

      // summaryまたはoutlookにWoebotがあれば追記
      const fields = ["summary", "globalContext", "outlook"];
      for (const f of fields) {
        if (r[f] && r[f].includes("Woebot") && !r[f].includes(woebotAddition)) {
          // Woebot言及の直後に追記
          r[f] = r[f].replace(
            /Woebot[^。]*。/,
            (m) => m + `なお、Woebot Healthは${woebotAddition}。`
          );
          console.log(`  ${f}: Woebot Health消費者アプリ廃止を追記`);
          changed = true;
          break; // 1箇所のみ追記
        }
      }
    } else {
      console.log("  Woebot廃止情報は既に追記済み");
    }

    return changed;
  });

  // Fix 5: マーケットプレイス - meuron連結子会社化「2025年年内」→「2023年1月18日」
  // 根拠: ウェルスナビは2023年1月18日にmeuron（旧ロボットアドバイザー社）を連結子会社化
  await fix("マーケットプレイス", (r) => {
    let changed = false;
    if (replaceAll(r, "2025年年内に連結子会社化", "2023年1月18日に連結子会社化")) changed = true;
    if (replaceAll(r, "2025年内に連結子会社化", "2023年1月18日に連結子会社化")) changed = true;
    // 「meuron」を「年内」と組み合わせた表現も確認
    const allJson = JSON.stringify(r);
    if (allJson.includes("meuron") && allJson.includes("年内")) {
      const fields2 = ["summary", "investmentTrends", "globalContext", "outlook"];
      for (const f of fields2) {
        if (r[f] && r[f].includes("meuron") && r[f].includes("年内")) {
          const before = r[f];
          r[f] = r[f].replace(
            /meuron[^。]*年内[^。]*。/g,
            (m) => m.replace("年内に連結子会社化", "2023年1月18日に連結子会社化")
               .replace("年内に子会社化", "2023年1月18日に子会社化")
          );
          if (r[f] !== before) {
            console.log(`  ${f}: meuron「年内」→「2023年1月18日」`);
            changed = true;
          }
        }
      }
      if (Array.isArray(r.recentNews)) {
        const before = JSON.stringify(r.recentNews);
        r.recentNews = r.recentNews.map((n) => {
          if (n.detail && n.detail.includes("meuron") && n.detail.includes("年内")) {
            return {
              ...n,
              detail: n.detail
                .replace("年内に連結子会社化", "2023年1月18日に連結子会社化")
                .replace("年内に子会社化", "2023年1月18日に子会社化"),
            };
          }
          return n;
        });
        if (JSON.stringify(r.recentNews) !== before) {
          console.log("  recentNews: meuron「年内」→「2023年1月18日」");
          changed = true;
        }
      }
    }
    return changed;
  });

  // Fix 6: 予防医療 - MRワクチン「供給不足」→「供給逼迫」
  // 根拠: 厚労省・国立感染症研究所の公式見解は「供給逼迫」（shortage ではなくtight supply）
  await fix("予防医療", (r) => {
    let changed = false;
    // MRワクチンに関連する「供給不足」のみ「供給逼迫」に変更
    // 文脈外の「供給不足」は変更しないよう、MR/麻疹/風疹の文脈を確認
    const allJson = JSON.stringify(r);
    if (allJson.includes("MR") || allJson.includes("麻疹") || allJson.includes("風疹")) {
      const fields = ["summary", "recentNews", "globalContext", "investmentTrends", "outlook"];
      for (const f of fields) {
        if (!r[f]) continue;
        if (Array.isArray(r[f])) {
          const before = JSON.stringify(r[f]);
          r[f] = r[f].map((n) => {
            if (typeof n === "string") {
              return (n.includes("MR") || n.includes("麻疹") || n.includes("風疹"))
                ? n.replace(/供給不足/g, "供給逼迫")
                : n;
            }
            const text = JSON.stringify(n);
            if (text.includes("MR") || text.includes("麻疹") || text.includes("風疹")) {
              return {
                ...n,
                headline: n.headline ? n.headline.replace(/供給不足/g, "供給逼迫") : n.headline,
                detail: n.detail ? n.detail.replace(/供給不足/g, "供給逼迫") : n.detail,
              };
            }
            return n;
          });
          if (JSON.stringify(r[f]) !== before) {
            console.log(`  ${f}: MRワクチン「供給不足」→「供給逼迫」`);
            changed = true;
          }
        } else if (r[f].includes("供給不足")) {
          // テキストフィールドでMR/麻疹/風疹を含む文の「供給不足」を置換
          const lines = r[f].split(/(?<=。)/);
          const fixed = lines.map((line) => {
            if ((line.includes("MR") || line.includes("麻疹") || line.includes("風疹")) && line.includes("供給不足")) {
              return line.replace(/供給不足/g, "供給逼迫");
            }
            return line;
          }).join("");
          if (fixed !== r[f]) {
            r[f] = fixed;
            console.log(`  ${f}: MRワクチン「供給不足」→「供給逼迫」`);
            changed = true;
          }
        }
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
