/**
 * import-generated.mjs
 * scripts/generated/ 内の JSON アイデアを src/data/mock/ideas.ts に追記し、
 * Prisma seed を実行して DB に反映する。
 *
 * 使い方: node scripts/import-generated.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const GENERATED_DIR = join(ROOT, "scripts/generated");
const IDEAS_FILE = join(ROOT, "src/data/mock/ideas.ts");

// ── 生成済みJSONを全て読み込む ───────────────────────────────────────
const jsonFiles = readdirSync(GENERATED_DIR)
  .filter(f => f.endsWith(".json"))
  .sort(); // ph1_Aggregator → ph1_API → ... 順

console.log(`📂 生成済みファイル: ${jsonFiles.join(", ")}`);

const allNewIdeas = [];
for (const file of jsonFiles) {
  const ideas = JSON.parse(readFileSync(join(GENERATED_DIR, file), "utf8"));
  console.log(`  ${file}: ${ideas.length}件`);
  allNewIdeas.push(...ideas);
}

console.log(`\n📝 追記対象: ${allNewIdeas.length}件`);

// ── 既存 ideas.ts から現在のIDを取得（重複防止） ──────────────────
const existingSrc = readFileSync(IDEAS_FILE, "utf8");
const existingIds = new Set([...existingSrc.matchAll(/id:\s*["']([^"']+)["']/g)].map(m => m[1]));
console.log(`📋 既存件数: ${existingIds.size}件`);

const newIdeas = allNewIdeas.filter(idea => !existingIds.has(idea.id));
console.log(`✅ 新規追加対象: ${newIdeas.length}件（重複スキップ: ${allNewIdeas.length - newIdeas.length}件）`);

if (newIdeas.length === 0) {
  console.log("⚠️  追加するアイデアがありません。終了します。");
  process.exit(0);
}

// ── アイデアオブジェクトを TypeScript コード文字列に変換 ──────────
function toTS(idea) {
  const indent = "  ";
  const lines = [
    `${indent}{`,
    `${indent}  id: "${idea.id}",`,
    `${indent}  slug: "${idea.slug}",`,
    `${indent}  number: ${idea.number},`,
    `${indent}  serviceName: ${JSON.stringify(idea.serviceName)},`,
    `${indent}  oneLiner: ${JSON.stringify(idea.oneLiner)},`,
    `${indent}  concept: ${JSON.stringify(idea.concept)},`,
    `${indent}  target: ${JSON.stringify(idea.target)},`,
    `${indent}  problem: ${JSON.stringify(idea.problem)},`,
    `${indent}  product: ${JSON.stringify(idea.product)},`,
    `${indent}  revenueModel: ${JSON.stringify(idea.revenueModel)},`,
    `${indent}  competitors: ${JSON.stringify(Array.isArray(idea.competitors) ? idea.competitors.join(", ") : idea.competitors)},`,
    `${indent}  competitiveEdge: ${JSON.stringify(idea.competitiveEdge)},`,
    `${indent}  tags: ${JSON.stringify(idea.tags)},`,
    `${indent}  category: ${JSON.stringify(idea.category)},`,
    `${indent}  targetIndustry: ${JSON.stringify(idea.targetIndustry)},`,
    `${indent}  targetCustomer: ${JSON.stringify(idea.targetCustomer)},`,
    `${indent}  investmentScale: ${JSON.stringify(idea.investmentScale)},`,
    `${indent}  difficulty: ${JSON.stringify(idea.difficulty)},`,
    `${indent}  scores: ${JSON.stringify(idea.scores)},`,
    `${indent}  scoreComments: {`,
    `${indent}    novelty: ${JSON.stringify(idea.scoreComments.novelty)},`,
    `${indent}    marketSize: ${JSON.stringify(idea.scoreComments.marketSize)},`,
    `${indent}    profitability: ${JSON.stringify(idea.scoreComments.profitability)},`,
    `${indent}    growth: ${JSON.stringify(idea.scoreComments.growth)},`,
    `${indent}    feasibility: ${JSON.stringify(idea.scoreComments.feasibility)},`,
    `${indent}    moat: ${JSON.stringify(idea.scoreComments.moat)},`,
    `${indent}  },`,
    `${indent}  trendKeywords: ${JSON.stringify(idea.trendKeywords)},`,
    `${indent}  patterns: ${JSON.stringify(idea.patterns ?? [])},`,
    `${indent}  publishedAt: "${idea.publishedAt}",`,
    `${indent}  views: ${idea.views ?? 0},`,
    `${indent}  bookmarks: ${idea.bookmarks ?? 0},`,
    ...(idea.whyNow      ? [`${indent}  whyNow: ${JSON.stringify(idea.whyNow)},`]      : []),
    ...(idea.noveltyNote ? [`${indent}  noveltyNote: ${JSON.stringify(idea.noveltyNote)},`] : []),
    ...(idea.strengthNote? [`${indent}  strengthNote: ${JSON.stringify(idea.strengthNote)},`] : []),
    `${indent}},`,
  ];
  return lines.join("\n");
}

// ── ideas.ts の末尾 `];` の直前に挿入 ────────────────────────────
const insertBlock = "\n" + newIdeas.map(toTS).join("\n") + "\n";
const updatedSrc = existingSrc.replace(/\n\];\s*$/, insertBlock + "];\n");

if (updatedSrc === existingSrc) {
  console.error("❌ ideas.ts の末尾パターンが見つかりません。手動確認してください。");
  process.exit(1);
}

writeFileSync(IDEAS_FILE, updatedSrc, "utf8");

// 追記したアイデアのID範囲を特定
const newIds = newIdeas.map(i => parseInt(i.id.replace('idea-', '')));
const minId = Math.min(...newIds);
const maxId = Math.max(...newIds);

console.log(`\n✅ ideas.ts に ${newIdeas.length}件を追記しました。`);
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("📋 推奨パイプライン手順（この順番で実行してください）:");
console.log("");
console.log(`  Step 1: ファクトチェック（DB投入前 — 必須）`);
console.log(`  node scripts/factcheck-before-seed.mjs --ts-range ${minId} ${maxId}`);
console.log("");
console.log("  Step 2: DB投入");
console.log("  npx tsx prisma/seed.ts");
console.log("");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
