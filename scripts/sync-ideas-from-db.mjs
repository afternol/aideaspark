/**
 * Supabase DB（idea-101〜200）を ideas.ts の静的ファイルに同期するスクリプト
 * Usage: node scripts/sync-ideas-from-db.mjs
 */
import pg from "pg";
const { Client } = pg;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATABASE_URL = process.env.DATABASE_URL || (process.env.DATABASE_URL || "");
const client = new Client({ connectionString: DATABASE_URL });

function formatValue(v) {
  if (v === null || v === undefined) return "undefined";
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) {
    const items = v.map(formatValue);
    return `[${items.join(", ")}]`;
  }
  if (typeof v === "object") {
    const entries = Object.entries(v)
      .map(([k, val]) => `${k}: ${formatValue(val)}`)
      .join(", ");
    return `{ ${entries} }`;
  }
  return JSON.stringify(v);
}

function ideaToTs(idea) {
  const lines = [];
  lines.push(`  {`);
  lines.push(`    id: ${JSON.stringify(idea.id)},`);
  lines.push(`    slug: ${JSON.stringify(idea.slug)},`);
  lines.push(`    number: ${idea.number},`);
  lines.push(`    serviceName: ${JSON.stringify(idea.serviceName)},`);
  lines.push(`    concept: ${JSON.stringify(idea.concept)},`);
  lines.push(`    target: ${JSON.stringify(idea.target)},`);
  lines.push(`    problem: ${JSON.stringify(idea.problem)},`);
  lines.push(`    product: ${JSON.stringify(idea.product)},`);
  lines.push(`    revenueModel: ${JSON.stringify(idea.revenueModel)},`);
  lines.push(`    competitors: ${JSON.stringify(idea.competitors)},`);
  lines.push(`    competitiveEdge: ${JSON.stringify(idea.competitiveEdge)},`);
  lines.push(`    tags: ${JSON.stringify(idea.tags)},`);
  lines.push(`    category: ${JSON.stringify(idea.category)},`);
  lines.push(`    targetIndustry: ${JSON.stringify(idea.targetIndustry)},`);
  lines.push(`    targetCustomer: ${JSON.stringify(idea.targetCustomer)},`);
  lines.push(`    investmentScale: ${JSON.stringify(idea.investmentScale)},`);
  lines.push(`    difficulty: ${JSON.stringify(idea.difficulty)},`);
  lines.push(`    scores: ${JSON.stringify(idea.scores)},`);
  lines.push(`    scoreComments: ${JSON.stringify(idea.scoreComments)},`);
  lines.push(`    trendKeywords: ${JSON.stringify(idea.trendKeywords)},`);
  lines.push(`    oneLiner: ${JSON.stringify(idea.oneLiner)},`);
  lines.push(`    publishedAt: ${JSON.stringify(idea.publishedAt)},`);
  lines.push(`    views: ${idea.views},`);
  lines.push(`    bookmarks: ${idea.bookmarks},`);
  if (idea.patterns && Array.isArray(idea.patterns) && idea.patterns.length > 0) {
    lines.push(`    patterns: ${JSON.stringify(idea.patterns)},`);
  }
  if (idea.whyNow) lines.push(`    whyNow: ${JSON.stringify(idea.whyNow)},`);
  if (idea.noveltyNote) lines.push(`    noveltyNote: ${JSON.stringify(idea.noveltyNote)},`);
  if (idea.strengthNote) lines.push(`    strengthNote: ${JSON.stringify(idea.strengthNote)},`);
  if (idea.patternRationale) lines.push(`    patternRationale: ${JSON.stringify(idea.patternRationale)},`);
  lines.push(`  }`);
  return lines.join("\n");
}

async function main() {
  await client.connect();
  console.log("Supabase から idea-101〜200 を取得中...");
  const res = await client.query(
    `SELECT * FROM "Idea" WHERE number >= 101 AND number <= 200 ORDER BY number ASC`
  );
  const ideas = res.rows;
  console.log(`取得件数: ${ideas.length}`);

  if (ideas.length !== 100) {
    console.error(`❌ 取得件数が100件ではありません: ${ideas.length}`);
    process.exit(1);
  }

  // ideas.ts の現在の内容を読み込む
  const ideasTsPath = path.join(__dirname, "../src/data/mock/ideas.ts");
  const content = fs.readFileSync(ideasTsPath, "utf-8");
  const lines = content.split("\n");

  // idea-101の開始行と idea-200の終了行を特定
  let startLine = -1;
  let endLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('"idea-101"') && startLine === -1) {
      // 前の行（`  {`）を含めて開始
      startLine = i - 1;
    }
    if (lines[i] === "];") {
      // idea-200の `  }` の行は endLine - 1
      endLine = i - 1;
      break;
    }
  }

  console.log(`置換範囲: 行${startLine + 1}〜${endLine + 1}`);

  // 新しいidea-101〜200のTS文字列を生成
  const newIdeasTs = ideas.map((idea, idx) => {
    const isLast = idx === ideas.length - 1;
    return ideaToTs(idea) + (isLast ? "" : ",");
  }).join("\n");

  // 置換
  const before = lines.slice(0, startLine).join("\n");
  const after = lines.slice(endLine + 1).join("\n");
  const newContent = before + "\n" + newIdeasTs + "\n" + after;

  fs.writeFileSync(ideasTsPath, newContent, "utf-8");
  console.log("✅ ideas.ts を更新しました");
  console.log(`  行数変化: ${lines.length} → ${newContent.split("\n").length}`);
}

main()
  .catch(console.error)
  .finally(() => client.end());
