/**
 * audit-insights.mjs v2
 * インサイトパネル全件監査スクリプト（精度改善版）
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createRequire } from "module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const fs = require("fs");

// ideas.ts からアイデア情報を読み込む
const src = fs.readFileSync(join(__dirname, "../src/data/mock/ideas.ts"), "utf8");
const cleaned = src
  .replace(/import type.*?\n/g, "")
  .replace(/import.*?from.*?\n/g, "")
  .replace(/export const mockIdeas:\s*BusinessIdea\[\]\s*=/, "const mockIdeas =");
const mockIdeas = new Function(cleaned + "\nreturn mockIdeas;")();

// competitorMap: id -> 競合名リスト（括弧内qualifier除去・短縮形も含む）
const competitorMap = {};
for (const idea of mockIdeas) {
  const raw = idea.competitors || "";
  // 括弧内のカンマを一時プレースホルダーに置換してから分割（誤分割防止）
  const sanitized = raw.replace(/（[^）]*）/g, s => s.replace(/[、，,]/g, "⦙"));
  const names = sanitized.split(/[、，,]/).map(s => {
    const base = s.replace(/⦙/g, ",")
      .replace(/（[^）]*）/g, "").replace(/\([^)]*\)/g, "").trim();
    return base;
  }).filter(s => s.length >= 2);
  competitorMap[idea.id] = { raw, names };
}

// JSON読み込み
const data1 = JSON.parse(readFileSync(join(__dirname, "insights-data.json"), "utf8"));
const data2 = JSON.parse(readFileSync(join(__dirname, "insights-data-2.json"), "utf8"));
const data3 = JSON.parse(readFileSync(join(__dirname, "insights-data-3.json"), "utf8"));
const allInsights = [...data1, ...data2, ...data3];

// ── ヘルパー ──────────────────────────────────────────
function countSentences(text) {
  return (text.match(/。/g) || []).length;
}

// 箇条書き検出: 行頭が「・•\-*」のみ（数字は除外＝年号の誤検知を防ぐ）
function hasBullet(text) {
  return /(?:^|\n)[・•\-\*]/.test(text);
}

// 数値・年号・数量表現を含むか
function hasNumber(text) {
  return /\d{4}年|\d+[%％倍万億兆件人社院校割]|\d+%/.test(text);
}

// タイミング根拠キーワード（規制・技術転換・行動変容）
function hasTimingKeyword(text) {
  const kws = [
    "義務", "施行", "改正", "解禁", "規制", "義務化",
    "普及", "低下", "向上", "技術", "転換点", "整った",
    "迎えている", "高まり", "高まって", "急増", "拡大",
    "背景", "追い風", "最高水準", "最多", "過去最", "最短",
    "認証", "承認", "許可", "対応", "法整備", "法改正",
  ];
  return kws.some(k => text.includes(k));
}

// 競合名チェック（括弧除去済み名リストで部分マッチ）
function hasCompetitorName(text, competitorInfo) {
  if (!competitorInfo) return false;
  // 大文字小文字無視で部分マッチ（英語競合名対応）
  const lowerText = text.toLowerCase();
  return competitorInfo.names.some(name => {
    if (name.length < 2) return false;
    return lowerText.includes(name.toLowerCase()) || text.includes(name);
  });
}

// 対比構造キーワード
function hasContrastStructure(text) {
  return /存在しない|はない|が弱い|できない|に不向き|不対応|対応していない|非対応|に限定|のみで|だけで|のみ掲載|のみ提供|に特化しておらず|が主体で/.test(text);
}

// 強みキーワード
function hasStrengthKeyword(text) {
  const kws = [
    "収益", "手数料", "月額", "サブスク", "LTV", "ARPU",
    "スイッチング", "堀", "ネットワーク効果", "参入障壁", "データ",
    "蓄積", "精度", "粘着", "継続", "解約率", "スケール", "学習",
    "複合", "二層", "三層", "二軸", "長期", "安定",
  ];
  return kws.some(k => text.includes(k));
}

// ── 監査実行 ──────────────────────────────────────────
const violations = [];
let passCount = 0;

for (const item of allInsights) {
  const { id, whyNow, noveltyNote, strengthNote } = item;
  const competitorInfo = competitorMap[id];
  const errors = [];

  // === whyNow ===
  const wnSentences = countSentences(whyNow);
  const wnLen = whyNow.length;
  if (wnSentences < 2) errors.push(`whyNow: ${wnSentences}文（要2文）`);
  if (wnSentences > 3) errors.push(`whyNow: ${wnSentences}文（3文以上・要約必要）`);
  if (wnLen < 60)  errors.push(`whyNow: ${wnLen}文字（60文字未満・内容薄い）`);
  if (wnLen > 160) errors.push(`whyNow: ${wnLen}文字（160文字超・長すぎ）`);
  if (!hasNumber(whyNow))         errors.push(`whyNow: 年号/数値/数量なし`);
  if (!hasTimingKeyword(whyNow))  errors.push(`whyNow: タイミング根拠キーワードなし（規制/技術転換/行動変容）`);
  if (hasBullet(whyNow))          errors.push(`whyNow: 箇条書き記号を検出（・•-*）`);

  // === noveltyNote ===
  const nnSentences = countSentences(noveltyNote);
  const nnLen = noveltyNote.length;
  if (nnSentences < 2) errors.push(`noveltyNote: ${nnSentences}文（要2文）`);
  if (nnSentences > 3) errors.push(`noveltyNote: ${nnSentences}文（3文以上・要約必要）`);
  if (nnLen < 60)  errors.push(`noveltyNote: ${nnLen}文字（60文字未満・内容薄い）`);
  if (nnLen > 220) errors.push(`noveltyNote: ${nnLen}文字（220文字超・長すぎ）`);
  if (!hasCompetitorName(noveltyNote, competitorInfo))
    errors.push(`noveltyNote: 競合名を含まない（競合: ${competitorInfo?.raw}）`);
  if (!hasContrastStructure(noveltyNote))
    errors.push(`noveltyNote: 対比構造なし（「〜は存在しない/不向き」等が必要）`);
  if (hasBullet(noveltyNote)) errors.push(`noveltyNote: 箇条書き記号を検出`);

  // === strengthNote ===
  const snSentences = countSentences(strengthNote);
  const snLen = strengthNote.length;
  if (snSentences < 2) errors.push(`strengthNote: ${snSentences}文（要2文）`);
  if (snSentences > 3) errors.push(`strengthNote: ${snSentences}文（3文以上・要約必要）`);
  if (snLen < 60)  errors.push(`strengthNote: ${snLen}文字（60文字未満・内容薄い）`);
  if (snLen > 220) errors.push(`strengthNote: ${snLen}文字（220文字超・長すぎ）`);
  if (!hasStrengthKeyword(strengthNote)) errors.push(`strengthNote: 強みキーワードなし（収益/障壁/データ蓄積等）`);
  if (hasBullet(strengthNote)) errors.push(`strengthNote: 箇条書き記号を検出`);

  if (errors.length > 0) {
    violations.push({ id, errors, whyNow, noveltyNote, strengthNote });
  } else {
    passCount++;
  }
}

// ── 結果出力 ──────────────────────────────────────────
console.log("=".repeat(60));
console.log("インサイトパネル監査レポート（v2）");
console.log("=".repeat(60));
console.log(`総件数  : ${allInsights.length}件`);
console.log(`✅ 合格 : ${passCount}件`);
console.log(`❌ 違反 : ${violations.length}件`);
console.log("=".repeat(60));

// 違反カテゴリ別集計
const categoryCounts = {};
for (const v of violations) {
  for (const e of v.errors) {
    const cat = e.split(":")[0];
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }
}
console.log("\n【違反カテゴリ別集計】");
for (const [cat, cnt] of Object.entries(categoryCounts).sort((a,b)=>b[1]-a[1])) {
  console.log(`  ${cat}: ${cnt}件`);
}

if (violations.length > 0) {
  console.log("\n【違反一覧】\n");
  for (const v of violations) {
    console.log(`▼ ${v.id}`);
    for (const e of v.errors) {
      console.log(`   ✗ ${e}`);
    }
    console.log();
  }
}

// JSON保存
const report = {
  generatedAt: new Date().toISOString(),
  total: allInsights.length,
  pass: passCount,
  violations: violations.length,
  categoryBreakdown: categoryCounts,
  violationList: violations.map(v => ({ id: v.id, errors: v.errors })),
};
writeFileSync(join(__dirname, "audit-insights-report.json"), JSON.stringify(report, null, 2));
console.log("\n📄 監査レポートを scripts/audit-insights-report.json に保存しました");
