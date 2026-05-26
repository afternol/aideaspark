/**
 * 第5回監査（最新性・WebSearch確認）で確認された事実誤記を修正
 *
 * 1. メンタルヘルス: Woebot Health「2025年シリーズC」→存在しない（最終はシリーズB 2021年）
 * 2. ESG・インパクト: インパクト投資残高「11.5兆円(2023年度)」→最新2024年度17.3兆円を追記
 * 3. カーボンテック: EU CBAM「2026年本格適用」→定常フェーズ発効は2026年1月、支払い義務は2027年9月
 * 4. IoT: 日本産業用IoT市場「2025年76億ドル・CAGR 9.12%」→「2024年実績69億ドル・2033年156億ドル・CAGR 9.6%」
 * 5. IoT: 5G IoT「CAGR 69.4%」→信頼性低いソースのため削除
 * 6. リーガルテック: Harvey「500以上の企業法務チーム」→「1,300以上の組織・100,000人超の弁護士」
 * 7. リーガルテック: LegalOn「8,000社」→「8,500社」(2026年3月末)
 * 8. HR Tech: mento recentNews「WiL（リード）、WiL（リード）、Eight Roads（参加）」→「Eight Roads（リード）、WiL（フォローオン）」
 * 9. 物流テック: Mujin調達金額未記載→「総額364億円（2025年12月）」を追記
 * 10. エネルギーテック: Aethon買収「投資総額約75億ドル」→内訳（株式52億+負債23.3億）を補足
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
    console.log(`⚠ 未発見: ${keyword}`);
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
    console.log("⚠ 変更なし:", keyword);
  }
}

async function main() {
  // Fix 1: メンタルヘルス - Woebot Health 存在しないシリーズCを削除
  await fix("メンタルヘルス", (r) => {
    let changed = false;
    const fix1 = (s) =>
      s
        ? s
            .replace(
              /Woebot Health[^。]*2025年[^。]*シリーズC[^。]*。/g,
              "Woebot Health（米国）: 最終調達はシリーズB（$90M、2021年7月）＋Leaps by Bayerからの追加$9.5M（2022年3月）、累計調達額約$114M。2025年6月30日に消費者向けアプリを廃止しB2Bモデルへ完全転換。"
            )
            .replace(
              "2025年にシリーズCを実施",
              "最終調達はシリーズB（$90M、2021年）、累計約$114M"
            )
            .replace("シリーズCで追加調達", "シリーズBが最終調達（2021年）")
        : s;

    if (Array.isArray(r.keyPlayers)) {
      const before = JSON.stringify(r.keyPlayers);
      r.keyPlayers = r.keyPlayers.map((p) =>
        typeof p === "string" ? fix1(p) : p
      );
      if (JSON.stringify(r.keyPlayers) !== before) {
        console.log("  keyPlayers: Woebot Health シリーズC誤記を削除");
        changed = true;
      }
    }
    const fields = ["summary", "investmentTrends", "globalContext", "outlook"];
    for (const f of fields) {
      if (r[f] && (r[f].includes("Woebot") && r[f].includes("シリーズC"))) {
        const before = r[f];
        r[f] = fix1(r[f]);
        if (r[f] !== before) {
          console.log(`  ${f}: Woebot Health シリーズC誤記を修正`);
          changed = true;
        }
      }
    }
    return changed;
  });

  // Fix 2: ESG・インパクト - インパクト投資残高を2024年度最新値に更新
  await fix("ESG・インパクト", (r) => {
    let changed = false;
    const target2023 = "2023年度に前年比197%増の11.5兆円";
    const updated = "2023年度に前年比197%増の11.5兆円、2024年度はさらに前年比150%増の17.3兆円（一般社団法人インパクト投資研究所 2025年3月調査）";
    const fields = ["investmentTrends", "summary", "globalContext", "outlook", "marketSize"];
    for (const f of fields) {
      if (r[f] && r[f].includes(target2023) && !r[f].includes("17.3兆円")) {
        r[f] = r[f].replace(target2023, updated);
        console.log(`  ${f}: インパクト投資残高 2024年度17.3兆円を追記`);
        changed = true;
      }
    }
    if (Array.isArray(r.recentNews)) {
      const before = JSON.stringify(r.recentNews);
      r.recentNews = r.recentNews.map((n) => ({
        ...n,
        detail: n.detail && n.detail.includes(target2023) && !n.detail.includes("17.3兆円")
          ? n.detail.replace(target2023, updated)
          : n.detail,
      }));
      if (JSON.stringify(r.recentNews) !== before) {
        console.log("  recentNews: インパクト投資残高 2024年度17.3兆円を追記");
        changed = true;
      }
    }
    return changed;
  });

  // Fix 3: カーボンテック - EU CBAM 補足追記
  await fix("カーボンテック", (r) => {
    let changed = false;
    const cbamaPatterns = [
      "2026年から本格適用を開始した",
      "2026年から本格適用",
      "2026年に本格適用",
    ];
    const cbamFix = (s) => {
      if (!s) return s;
      let result = s;
      for (const pat of cbamaPatterns) {
        if (result.includes(pat)) {
          result = result.replace(
            pat,
            "2026年1月に定常フェーズ（definitive regime）が発効した（CBAM証書の初回提出・支払い義務は2027年9月、2026年輸入分が対象）"
          );
        }
      }
      return result;
    };

    const fields = ["summary", "globalContext", "investmentTrends", "outlook"];
    for (const f of fields) {
      if (r[f]) {
        const before = r[f];
        r[f] = cbamFix(r[f]);
        if (r[f] !== before) {
          console.log(`  ${f}: EU CBAM 定常フェーズ・支払い義務を補足`);
          changed = true;
        }
      }
    }
    if (Array.isArray(r.recentNews)) {
      const before = JSON.stringify(r.recentNews);
      r.recentNews = r.recentNews.map((n) => ({
        ...n,
        detail: cbamFix(n.detail),
        headline: cbamFix(n.headline),
      }));
      if (JSON.stringify(r.recentNews) !== before) {
        console.log("  recentNews: EU CBAM 補足");
        changed = true;
      }
    }
    return changed;
  });

  // Fix 4 & 5: IoT - 日本産業用IoT市場数値修正、5G CAGR 69.4%削除
  await fix("IoT", (r) => {
    let changed = false;

    // Fix 4: 市場規模 2025年76億ドル → 2024年実績69億ドル
    const iotFix = (s) => {
      if (!s) return s;
      return s
        .replace("2025年に76億米ドル、2034年に166億米ドル予測（CAGR 9.12%）",
          "2024年実績69億ドル、2033年予測156億ドル（CAGR 9.6%）（IMARCグループ）")
        .replace("2025年に76億米ドル",
          "2024年実績69億ドル")
        .replace("CAGR 9.12%", "CAGR 9.6%")
        .replace("2034年に166億米ドル", "2033年に156億ドル");
    };

    const fields4 = ["marketSize", "summary", "globalContext", "investmentTrends", "outlook"];
    for (const f of fields4) {
      if (r[f] && (r[f].includes("76億米ドル") || r[f].includes("9.12%"))) {
        const before = r[f];
        r[f] = iotFix(r[f]);
        if (r[f] !== before) {
          console.log(`  ${f}: 日本産業用IoT市場 2024年実績69億ドルに修正`);
          changed = true;
        }
      }
    }
    if (Array.isArray(r.recentNews)) {
      const before = JSON.stringify(r.recentNews);
      r.recentNews = r.recentNews.map((n) => ({
        ...n,
        detail: iotFix(n.detail),
      }));
      if (JSON.stringify(r.recentNews) !== before) {
        console.log("  recentNews: IoT市場数値修正");
        changed = true;
      }
    }

    // Fix 5: 5G IoT CAGR 69.4% を削除（信頼性が低いソース）
    const iotFix5 = (s) => {
      if (!s) return s;
      return s
        .replace(/CAGR\s*69\.4%[^。]*2031年[^。]*2,849億[^。]*。/g, "")
        .replace(/5G IoT市場[^。]*CAGR\s*69\.4%[^。]*。/g, "")
        .replace(/CAGR\s*69\.4%/g, "")
        .trim();
    };

    const fields5 = ["investmentTrends", "globalContext", "summary", "outlook"];
    for (const f of fields5) {
      if (r[f] && r[f].includes("69.4%")) {
        const before = r[f];
        r[f] = iotFix5(r[f]);
        if (r[f] !== before) {
          console.log(`  ${f}: 5G IoT CAGR 69.4%（低信頼ソース）を削除`);
          changed = true;
        }
      }
    }
    return changed;
  });

  // Fix 6 & 7: リーガルテック - Harvey顧客数・LegalOn導入社数
  await fix("リーガルテック", (r) => {
    let changed = false;

    // Fix 6: Harvey「500以上の企業法務チーム」→「1,300以上の組織・100,000人超の弁護士」
    const harveyFix = (s) =>
      s
        ? s
            .replace(
              "500以上の企業法務チームに展開",
              "1,300以上の組織・100,000人超の弁護士に展開（60カ国以上）"
            )
            .replace(
              "60カ国以上・500以上の企業法務チーム",
              "60カ国以上・1,300以上の組織・100,000人超の弁護士"
            )
            .replace("500社以上の法務チーム", "1,300以上の組織・10万人超の弁護士")
        : s;

    if (Array.isArray(r.keyPlayers)) {
      const before = JSON.stringify(r.keyPlayers);
      r.keyPlayers = r.keyPlayers.map((p) =>
        typeof p === "string" ? harveyFix(p) : p
      );
      if (JSON.stringify(r.keyPlayers) !== before) {
        console.log("  keyPlayers: Harvey 顧客数「500社」→「1,300組織・10万人超」");
        changed = true;
      }
    }
    const fieldsHarvey = ["summary", "globalContext", "investmentTrends", "outlook"];
    for (const f of fieldsHarvey) {
      if (r[f] && r[f].includes("Harvey") && r[f].includes("500")) {
        const before = r[f];
        r[f] = harveyFix(r[f]);
        if (r[f] !== before) {
          console.log(`  ${f}: Harvey 顧客数修正`);
          changed = true;
        }
      }
    }

    // Fix 7: LegalOn「8,000社」→「8,500社」（2026年3月末時点）
    const legalOnFix = (s) =>
      s
        ? s
            .replace("LegalOn Technologies：8,000社を突破", "LegalOn Technologies：8,500社を突破（2026年3月末時点）")
            .replace("LegalOnが8,000社", "LegalOnが8,500社（2026年3月末）")
            .replace(/LegalOn[^。]*8,000社突破[^。]*。/g, (m) =>
              m.replace("8,000社突破", "8,500社突破（2026年3月末時点）")
            )
        : s;

    if (Array.isArray(r.keyPlayers)) {
      const before = JSON.stringify(r.keyPlayers);
      r.keyPlayers = r.keyPlayers.map((p) =>
        typeof p === "string" ? legalOnFix(p) : p
      );
      if (JSON.stringify(r.keyPlayers) !== before) {
        console.log("  keyPlayers: LegalOn 8,000社→8,500社");
        changed = true;
      }
    }
    if (Array.isArray(r.recentNews)) {
      const before = JSON.stringify(r.recentNews);
      r.recentNews = r.recentNews.map((n) => ({
        ...n,
        headline: n.headline ? legalOnFix(n.headline) : n.headline,
        detail: n.detail ? legalOnFix(n.detail) : n.detail,
      }));
      if (JSON.stringify(r.recentNews) !== before) {
        console.log("  recentNews: LegalOn 8,000社→8,500社");
        changed = true;
      }
    }
    const fieldsLegal = ["summary", "investmentTrends", "globalContext", "outlook"];
    for (const f of fieldsLegal) {
      if (r[f] && r[f].includes("LegalOn") && r[f].includes("8,000社")) {
        const before = r[f];
        r[f] = legalOnFix(r[f]);
        if (r[f] !== before) {
          console.log(`  ${f}: LegalOn 8,000社→8,500社`);
          changed = true;
        }
      }
    }
    return changed;
  });

  // Fix 8: HR Tech - mento recentNews リード投資家の重複・逆転を修正
  await fix("HR Tech", (r) => {
    let changed = false;
    if (Array.isArray(r.recentNews)) {
      const before = JSON.stringify(r.recentNews);
      r.recentNews = r.recentNews.map((n) => {
        if (!n.detail) return n;
        let detail = n.detail;
        // 重複「WiL（リード）、WiL（リード）」を修正
        detail = detail.replace(
          /WiL（リード）[、，]\s*WiL（リード）[、，]\s*Eight Roads Ventures Japan（参加）/g,
          "Eight Roads Ventures Japan（リード）、WiL（既存株主フォローオン）、三井住友海上キャピタル、AGキャピタル"
        );
        // 「WiL（リード）、Eight Roads（参加）」パターン（mento文脈のみ）
        if (detail.includes("mento") && detail.includes("WiL（リード）")) {
          detail = detail.replace(
            "WiL（リード）、Eight Roads Ventures Japan（参加）",
            "Eight Roads Ventures Japan（リード）、WiL（既存株主フォローオン）"
          );
        }
        return { ...n, detail };
      });
      if (JSON.stringify(r.recentNews) !== before) {
        console.log("  recentNews: mento リード投資家修正（Eight Roads がリード）");
        changed = true;
      }
    }
    return changed;
  });

  // Fix 9: 物流テック - Mujin調達金額を追記
  await fix("物流テック", (r) => {
    let changed = false;
    const mujinTarget = "NTTグループ、カタール投資庁";
    const mujinFix = (s) => {
      if (!s || !s.includes("Mujin") || !s.includes("NTTグループ")) return s;
      // 既に364億円が記載されていれば skip
      if (s.includes("364億円")) return s;
      return s.replace(
        /Mujin[^。]*NTTグループ[^。]*カタール投資庁[^。]*大型資金調達[^。]*。/g,
        (m) => m.replace("大型資金調達", "シリーズDで総額364億円（株式209億円＋融資155億円）の大型資金調達（2025年12月）、累計596億円に到達")
      ).replace(
        /Mujin[^。]*カタール投資庁[^。]*NTTグループ[^。]*リード[^。]*。/g,
        (m) => {
          if (!m.includes("364億円")) {
            return m.replace("リード、", "リードで総額364億円調達（2025年12月、累計596億円）、");
          }
          return m;
        }
      );
    };

    const fields = ["investmentTrends", "summary", "globalContext", "outlook"];
    for (const f of fields) {
      if (r[f] && r[f].includes("Mujin") && r[f].includes(mujinTarget) && !r[f].includes("364億円")) {
        const before = r[f];
        r[f] = mujinFix(r[f]);
        if (r[f] !== before) {
          console.log(`  ${f}: Mujin調達額「364億円（2025年12月）」を追記`);
          changed = true;
        }
      }
    }
    if (Array.isArray(r.keyPlayers)) {
      const before = JSON.stringify(r.keyPlayers);
      r.keyPlayers = r.keyPlayers.map((p) =>
        typeof p === "string" ? mujinFix(p) : p
      );
      if (JSON.stringify(r.keyPlayers) !== before) {
        console.log("  keyPlayers: Mujin調達額追記");
        changed = true;
      }
    }
    if (Array.isArray(r.recentNews)) {
      const before = JSON.stringify(r.recentNews);
      r.recentNews = r.recentNews.map((n) => {
        if (n.detail && n.detail.includes("Mujin") && n.detail.includes("NTTグループ") && !n.detail.includes("364億円")) {
          return { ...n, detail: mujinFix(n.detail) };
        }
        return n;
      });
      if (JSON.stringify(r.recentNews) !== before) {
        console.log("  recentNews: Mujin調達額追記");
        changed = true;
      }
    }
    return changed;
  });

  // Fix 10: エネルギーテック - Aethon買収金額に内訳を補足
  await fix("エネルギーテック", (r) => {
    let changed = false;
    const aethonFix = (s) => {
      if (!s || !s.includes("Aethon")) return s;
      if (s.includes("株式取得")) return s; // 既に修正済み
      return s
        .replace(
          /三菱商事[^。]*Aethon[^。]*約75億ドル[^。]*。/g,
          (m) => m.replace(
            "約75億ドル",
            "株式取得約52億ドル＋負債引受23.3億ドル＝総額約75億ドル（約1.2兆円）"
          )
        )
        .replace(
          "投資総額約75億ドル（約1兆2,000億円）",
          "株式取得約52億ドル＋負債引受23.3億ドルの総額約75億ドル（約1.2兆円）"
        );
    };

    const fields = ["summary", "investmentTrends", "globalContext", "outlook"];
    for (const f of fields) {
      if (r[f] && r[f].includes("Aethon") && r[f].includes("75億ドル") && !r[f].includes("株式取得")) {
        const before = r[f];
        r[f] = aethonFix(r[f]);
        if (r[f] !== before) {
          console.log(`  ${f}: Aethon買収 株式取得52億ドル＋負債23.3億ドルの内訳を補足`);
          changed = true;
        }
      }
    }
    if (Array.isArray(r.recentNews)) {
      const before = JSON.stringify(r.recentNews);
      r.recentNews = r.recentNews.map((n) => ({
        ...n,
        detail: n.detail && n.detail.includes("Aethon") && n.detail.includes("75億ドル") && !n.detail.includes("株式取得")
          ? aethonFix(n.detail)
          : n.detail,
      }));
      if (JSON.stringify(r.recentNews) !== before) {
        console.log("  recentNews: Aethon買収内訳補足");
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
