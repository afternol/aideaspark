/**
 * 第6回監査（WebSearch徹底ファクトチェック）で確認された誤記を修正
 *
 * エンタメ:
 *  1. 音楽テック: IFPI「316億ドル」→「317億ドル」
 *  2. 音楽テック: ElevenLabs「NVIDIA主導」→「Sequoia Capital主導」
 *  3. 音楽テック: Suno「月間ユーザー1億人」→「過去2年累計利用者数約1億人」
 *  4. XR・メタバース: Shizuku AI「1,500万ドル（約23億円）」→「調達金額は非開示」
 *  5. ゲーム・eスポーツ: ソニーG「12兆円」→「12兆3,000億円」
 * サステナビリティ:
 *  6. カーボンテック: J-クレジット「約6,000円/2〜3倍」→「約5,600〜6,000円/約2倍」
 *  7. クリーンテック: 「投資額360億ドル」→「VCスタートアップ投資360億ドル」
 *  8. サーキュラーエコノミー: 旧Spiber「清算手続き中」→「特別清算申請予定」
 * 先端テクノロジー:
 *  9. 宇宙ビジネス: H3ロケット8号機失敗（2025年12月22日）を追記
 * リーガルテック:
 * 10. keyPlayers: LegalOn「8,000社超」→「8,500社超（2026年3月末）」
 * 11. marketSize: 電子契約「2025年度295億円」→「2024年度実績295億円・2025年度22%増見込み」
 * AI_データ:
 * 12. 画像・動画AI: Sora「1日約1,500万ドル」→「$1M〜$15M/day（WSJ試算$1M/day）」
 * 13. データ分析: 「Claude Cowork」→「Claude Code」
 * 14. 生成AI: OpenAI「2026年2月250億ドル」→「2026年3月に$25B到達（2025年末ARRは$20B）」
 * 生活_消費:
 * 15. ペットテック: 「2024年約1.8兆円（4.5%増）」→「2023年度実績・2024年度は2.6%増の1.9兆円見込み」
 * 16. トラベルテック: 2026年訪日前年割れ（JTB予測4,140万人）を追記
 * ヘルスケア:
 * 17. フェムテック: 調査機関名「The Business Research Company」を明記
 * 18. スリープテック: Oura Ring 4が2025年7月に日本正式発売を追記
 * ビジネスモデル:
 * 19. D2C Sparty: 「2025年11月の追加調達」→「2022年5月のロレアルBOLD出資時点の数値」に修正
 * 金融_決済:
 * 20. 資産運用 NISA: 「2,696万口座・63兆円（2025年6月末）」→「2,826万口座・71兆円（2025年12月末）」
 * 21. 会計・経理DX 弥生: シェア「55.4%」→「54.0%（2026年3月末）」
 * 22. 融資・レンディング: 「高インフレ・低賃金成長」→「利上げ局面・実質賃金改善傾向」
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
  if (!res.rows.length) { console.log(`⚠ 未発見: ${keyword}`); return; }
  const r = typeof res.rows[0].report === "string"
    ? JSON.parse(res.rows[0].report) : res.rows[0].report;
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

// オブジェクト内の文字列を再帰的に置換するヘルパー
function replaceInValue(val, oldStr, newStr) {
  if (typeof val === "string") {
    return val.includes(oldStr) ? { value: val.replaceAll(oldStr, newStr), changed: true } : { value: val, changed: false };
  }
  if (Array.isArray(val)) {
    let changed = false;
    const result = val.map(item => {
      const r = replaceInValue(item, oldStr, newStr);
      if (r.changed) changed = true;
      return r.value;
    });
    return { value: result, changed };
  }
  if (val && typeof val === "object") {
    let changed = false;
    const result = {};
    for (const k of Object.keys(val)) {
      const r = replaceInValue(val[k], oldStr, newStr);
      if (r.changed) changed = true;
      result[k] = r.value;
    }
    return { value: result, changed };
  }
  return { value: val, changed: false };
}

// 全フィールドのテキストを一括置換するヘルパー
function replaceInAll(r, oldStr, newStr) {
  let changed = false;
  const textFields = ["summary", "investmentTrends", "globalContext", "marketSize", "outlook"];
  for (const f of textFields) {
    if (r[f]) {
      const result = replaceInValue(r[f], oldStr, newStr);
      if (result.changed) {
        r[f] = result.value;
        console.log(`  ${f}: "${oldStr.slice(0,30)}" → "${newStr.slice(0,30)}"`);
        changed = true;
      }
    }
  }
  if (Array.isArray(r.recentNews)) {
    const result = replaceInValue(r.recentNews, oldStr, newStr);
    if (result.changed) {
      r.recentNews = result.value;
      console.log(`  recentNews: 置換完了`); changed = true;
    }
  }
  if (Array.isArray(r.keyPlayers)) {
    const result = replaceInValue(r.keyPlayers, oldStr, newStr);
    if (result.changed) {
      r.keyPlayers = result.value;
      console.log(`  keyPlayers: 置換完了`); changed = true;
    }
  }
  return changed;
}

async function main() {

  // === Fix 1-3: 音楽テック ===
  await fix("音楽テック", (r) => {
    let changed = false;
    // Fix 1: IFPI 316億ドル→317億ドル
    if (replaceInAll(r, "316億ドル", "317億ドル")) changed = true;
    if (replaceInAll(r, "31.6 billion", "31.7 billion")) changed = true;
    // Fix 2: ElevenLabs リード投資家
    if (replaceInAll(r, "NVIDIA主導", "Sequoia Capital主導")) changed = true;
    if (replaceInAll(r, "NVIDIA（リード）", "Sequoia Capital（リード）、NVIDIAは戦略的出資者")) changed = true;
    // Fix 3: Suno 月間ユーザー→累計利用者数
    if (replaceInAll(r, "月間ユーザー数約1億人", "過去2年間の累計利用者数約1億人")) changed = true;
    if (replaceInAll(r, "月間1億人", "累計約1億人（過去2年間）")) changed = true;
    return changed;
  });

  // === Fix 4: XR・メタバース - Shizuku AI調達額 ===
  await fix("XR・メタバース", (r) => {
    let changed = false;
    if (replaceInAll(r, "シード調達1,500万ドル（約23億円）を完了し企業評価額約7,500万ドル（約120億円）",
      "シード調達（金額非開示）を完了し企業評価額約120億円（約7,500万ドル）")) changed = true;
    if (replaceInAll(r, "1,500万ドル（約23億円）", "（調達金額非開示）")) changed = true;
    if (replaceInAll(r, "シード1,500万ドル", "シード（金額非開示）")) changed = true;
    return changed;
  });

  // === Fix 5: ゲーム・eスポーツ - ソニーG売上見通し ===
  await fix("ゲーム・eスポーツ", (r) => {
    let changed = false;
    // keyPlayersの「12兆円に上方修正」を「12兆3,000億円に上方修正（2026年2月）」に
    if (Array.isArray(r.keyPlayers)) {
      const before = JSON.stringify(r.keyPlayers);
      r.keyPlayers = r.keyPlayers.map(p =>
        typeof p === "string"
          ? p.replace("通期売上見通しを12兆円に上方修正", "通期売上見通しを12兆3,000億円に上方修正（2026年2月時点）")
           .replace("売上見通し12兆円", "売上見通し12兆3,000億円（2026年2月修正）")
          : p
      );
      if (JSON.stringify(r.keyPlayers) !== before) {
        console.log("  keyPlayers: ソニーG売上見通し12兆→12兆3,000億円"); changed = true;
      }
    }
    if (replaceInAll(r, "通期売上見通し12兆円", "通期売上見通し12兆3,000億円（2026年2月修正）")) changed = true;
    return changed;
  });

  // === Fix 6: カーボンテック - J-クレジット ===
  await fix("カーボンテック", (r) => {
    let changed = false;
    if (replaceInAll(r, "再生可能エネルギー由来約6,000円/トン、省エネ由来約5,000円/トンと昨年比約2〜3倍",
      "再生可能エネルギー由来約5,600〜6,000円/トン、省エネ由来約5,000〜5,200円/トンと昨年比約2倍")) changed = true;
    if (replaceInAll(r, "昨年比約2〜3倍", "昨年比約2倍")) changed = true;
    if (replaceInAll(r, "再エネ約6,000円", "再エネ約5,600〜6,000円")) changed = true;
    return changed;
  });

  // === Fix 7: クリーンテック - 投資額の定義明確化 ===
  await fix("クリーンテック", (r) => {
    let changed = false;
    if (replaceInAll(r, "2024年には約360億ドルと減少した",
      "2024年にはVC・スタートアップ投資として約360億ドルと減少した（BloombergNEFの広義エネルギー転換投資2.1兆ドルとは定義が異なる）")) changed = true;
    if (replaceInAll(r, "2024年には約360億ドルと減少",
      "2024年にはVC・スタートアップ向け投資として約360億ドルと減少")) changed = true;
    return changed;
  });

  // === Fix 8: サーキュラーエコノミー - 旧Spiberの状況 ===
  await fix("サーキュラーエコノミー", (r) => {
    let changed = false;
    if (replaceInAll(r, "旧Spiberは清算手続きに移行",
      "旧Spiberは米国子会社の清算完了後に特別清算申請予定（申請時期は今後2年程度内）")) changed = true;
    if (replaceInAll(r, "清算手続き中",
      "特別清算申請準備中（米国子会社清算完了後に申請見込み）")) changed = true;
    return changed;
  });

  // === Fix 9: 宇宙ビジネス - H3ロケット8号機失敗を追記 ===
  await fix("宇宙ビジネス", (r) => {
    let changed = false;
    const h3news = {
      date: "2025年12月22日",
      headline: "H3ロケット8号機打上げ失敗・みちびき5号機喪失",
      detail: "JAXAのH3ロケット8号機が2025年12月22日に打上げ失敗し、搭載していた準天頂衛星みちびき5号機を喪失した。原因は衛星搭載アダプタPSSの製造問題が有力視されており、JAXAが調査中。後続の6号機（30形態試験機）の打上げは2026年6月10日に予定されており、信頼性回復が最重要課題となっている。",
    };
    // 既に追記済みでないか確認
    const text = JSON.stringify(r);
    if (!text.includes("H3ロケット8号機") && !text.includes("みちびき5号機喪失")) {
      if (Array.isArray(r.recentNews)) {
        // 新しい順に挿入（先頭近くに追加）
        r.recentNews.unshift(h3news);
        if (r.recentNews.length > 10) r.recentNews = r.recentNews.slice(0, 10);
        console.log("  recentNews: H3ロケット8号機失敗を追記");
        changed = true;
      }
      // outlookにも追記
      if (r.outlook && !r.outlook.includes("H3ロケット")) {
        r.outlook = r.outlook + "なお、2025年12月22日のH3ロケット8号機打上げ失敗（みちびき5号機喪失）を受け、2026年の最重要課題は信頼性の回復と後続機（6号機、2026年6月10日予定）の成功となっている。";
        console.log("  outlook: H3ロケット8号機失敗を追記");
        changed = true;
      }
    } else {
      console.log("  H3ロケット8号機失敗は既に記載済み");
    }
    return changed;
  });

  // === Fix 10 & 11: リーガルテック ===
  await fix("リーガルテック", (r) => {
    let changed = false;
    // Fix 10: LegalOn keyPlayers 8,000社→8,500社
    if (Array.isArray(r.keyPlayers)) {
      const before = JSON.stringify(r.keyPlayers);
      r.keyPlayers = r.keyPlayers.map(p =>
        typeof p === "string"
          ? p.replace("グローバル導入8,000社超", "グローバル導入8,500社超（2026年3月末）")
           .replace("8,000社超", "8,500社超（2026年3月末）")
          : p
      );
      if (JSON.stringify(r.keyPlayers) !== before) {
        console.log("  keyPlayers: LegalOn 8,000→8,500社"); changed = true;
      }
    }
    // Fix 11: marketSize 電子契約の年度修正
    if (r.marketSize && r.marketSize.includes("2025年度") && r.marketSize.includes("295億円")) {
      r.marketSize = r.marketSize.replace(
        /2025年度[^。]*前年比22[^。]*295億円[^。]*。/g,
        "2024年度実績は前年比20.7%増の295億円、2025年度は前年比22%増が見込まれ、2029年度には500億円超（CAGR 11.3%）が予測される（ITRアイ・ティ・アール、2025年10月調査）。"
      );
      console.log("  marketSize: 電子契約の年度修正（2025年度→2024年度実績）");
      changed = true;
    }
    return changed;
  });

  // === Fix 12: 画像・動画AI - Soraの日次コスト ===
  await fix("画像・動画AI", (r) => {
    let changed = false;
    if (replaceInAll(r, "1日約1,500万ドル", "1日$1M〜$15M（WSJ試算は約$1M/day、ピーク時推計最大$15M/day）")) changed = true;
    if (replaceInAll(r, "高い運用コスト（1日約1,500万ドル）", "高い運用コスト（WSJ試算$1M/day、ピーク時最大$15M/dayとも）")) changed = true;
    return changed;
  });

  // === Fix 13: データ分析 - Claude Cowork → Claude Code ===
  await fix("データ分析", (r) => {
    let changed = false;
    if (replaceInAll(r, "Claude Cowork", "Claude Code")) changed = true;
    return changed;
  });

  // === Fix 14: 生成AI - OpenAI年間収益の記述修正 ===
  await fix("生成AI", (r) => {
    let changed = false;
    if (replaceInAll(r, "2026年2月時点で年間収益250億ドル",
      "2026年3月初旬に年間収益（ARR）が250億ドルに到達（2025年末ARRは200億ドル）")) changed = true;
    if (replaceInAll(r, "2025年末の214億ドルから17%増",
      "2025年末の200億ドルから約25%増")) changed = true;
    return changed;
  });

  // === Fix 15: ペットテック - 市場規模の年度修正 ===
  await fix("ペットテック", (r) => {
    let changed = false;
    if (replaceInAll(r, "2024年の日本ペット産業市場規模は約1.8兆円（前年比4.5%増）",
      "2023年度の日本ペット産業市場規模は約1兆8,629億円（前年度比4.5%増）、2024年度は前年度比2.6%増の約1兆9,108億円が見込まれる（矢野経済研究所）")) changed = true;
    if (replaceInAll(r, "日本ペット産業市場：約1.8兆円（2024年、前年比4.5%増）",
      "日本ペット産業市場：2023年度約1.8兆円（前年度比4.5%増）、2024年度は2.6%増の約1.9兆円見込み")) changed = true;
    return changed;
  });

  // === Fix 16: トラベルテック - 2026年訪日前年割れを追記 ===
  await fix("トラベルテック", (r) => {
    let changed = false;
    const addText = "JTBの2026年訪日旅行者数予測は4,140万人（前年比97.2%・前年割れ見込み）で、中国・香港からの需要減が主因となっている。";
    if (r.outlook && !r.outlook.includes("前年割れ") && !r.outlook.includes("4,140万人")) {
      r.outlook = r.outlook + addText;
      console.log("  outlook: 2026年訪日前年割れ予測を追記");
      changed = true;
    }
    return changed;
  });

  // === Fix 17: フェムテック - 調査機関名を明記 ===
  await fix("フェムテック", (r) => {
    let changed = false;
    if (r.marketSize && r.marketSize.includes("464億7,000万米ドル") && !r.marketSize.includes("The Business Research Company")) {
      r.marketSize = r.marketSize.replace(
        "464億7,000万米ドル",
        "464億7,000万米ドル（The Business Research Company調査、広義フェムテック定義）"
      );
      console.log("  marketSize: フェムテック調査機関名を明記");
      changed = true;
    }
    return changed;
  });

  // === Fix 18: スリープテック - Oura Ring 4日本発売を追記 ===
  await fix("スリープテック", (r) => {
    let changed = false;
    const ouraText = "Oura Ring 4が2025年7月17日に日本正式発売（ヨドバシカメラ・ビックカメラ等で52,800円〜）し、2026年2月にはセラミック版も日本展開を開始。";
    const text = JSON.stringify(r);
    if (!text.includes("Oura Ring 4") && !text.includes("Oura Ring")) {
      if (r.globalContext && !r.globalContext.includes("Oura")) {
        r.globalContext = r.globalContext + ouraText;
        console.log("  globalContext: Oura Ring 4日本発売を追記");
        changed = true;
      }
    } else if (text.includes("Oura") && !text.includes("日本") && !text.includes("日本正式発売")) {
      if (r.globalContext) {
        r.globalContext = r.globalContext.replace(
          /Oura[^。]*ウェアラブル[^。]*。/,
          (m) => m + ouraText
        );
        console.log("  globalContext: Oura Ring 4日本発売を追記");
        changed = true;
      }
    }
    return changed;
  });

  // === Fix 19: D2C - Sparty 時制修正 ===
  await fix("D2C", (r) => {
    let changed = false;
    if (replaceInAll(r, "2025年11月にロレアルCVCから追加調達し、累計44.9億円・評価額237.6億円",
      "2022年5月にロレアルBOLD（ロレアルCVC）から出資を受け、累計44.9億円・評価額237.6億円（2022年5月時点）")) changed = true;
    if (replaceInAll(r, "2025年11月にロレアルCVCから",
      "2022年5月にロレアルBOLDファンドから")) changed = true;
    return changed;
  });

  // === Fix 20: 資産運用 - NISA口座数・買付額更新 ===
  await fix("資産運用", (r) => {
    let changed = false;
    if (replaceInAll(r, "2,696万口座", "2,826万口座（2025年12月末）")) changed = true;
    if (replaceInAll(r, "約2,696万口座", "約2,826万口座（2025年12月末）")) changed = true;
    if (replaceInAll(r, "買付額累計63兆円", "買付額累計71兆円（2025年12月末）")) changed = true;
    if (replaceInAll(r, "累計63兆円", "累計71兆円（2025年12月末）")) changed = true;
    if (replaceInAll(r, "2025年6月末時点でNISA口座数は約2,696万口座",
      "2025年12月末時点でNISA口座数は約2,826万口座（金融庁公表、2026年2月）")) changed = true;
    return changed;
  });

  // === Fix 21: 会計・経理DX - 弥生シェア ===
  await fix("会計・経理DX", (r) => {
    let changed = false;
    if (replaceInAll(r, "全体55.4%", "全体54.0%（2026年3月末、MM総研調査）")) changed = true;
    if (replaceInAll(r, "過半数シェア（全体55.4%）", "過半数シェア（54.0%、2026年3月末、MM総研）")) changed = true;
    return changed;
  });

  // === Fix 22: 融資・レンディング - 経済環境の記述修正 ===
  await fix("融資・レンディング", (r) => {
    let changed = false;
    if (replaceInAll(r, "2025年来の高インフレと低賃金成長を背景に",
      "日銀が2024〜2025年に利上げを実施し「金利のある世界」へ移行する中で")) changed = true;
    if (replaceInAll(r, "高インフレと低賃金成長",
      "利上げ局面への移行と実質賃金の改善傾向")) changed = true;
    return changed;
  });

  await pool.end();
  console.log("\n=== 第6回監査 全修正完了 ===");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
