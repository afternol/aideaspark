/**
 * generate-insights.mjs
 * 全アイデアに whyNow / noveltyNote / strengthNote を一括生成して ideas.ts を更新する。
 *
 * 使い方: node scripts/generate-insights.mjs
 *
 * 進捗は scripts/insights-progress.json に保存。中断後の再実行で続きから再開できる。
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const IDEAS_FILE  = join(ROOT, "src/data/mock/ideas.ts");
const PROGRESS_FILE = join(__dirname, "insights-progress.json");
const BATCH_SIZE = 5; // 1回のAPI呼び出しで処理するアイデア数

const client = new Anthropic();

// ── ideas.ts からアイデア配列をパース ────────────────────────────
function parseIdeas() {
  const src = readFileSync(IDEAS_FILE, "utf8");
  const cleaned = src
    .replace(/import type.*?\n/g, "")
    .replace(/import.*?from.*?\n/g, "")
    .replace(/export const mockIdeas:\s*BusinessIdea\[\]\s*=/, "const mockIdeas =");
  return new Function(cleaned + "\nreturn mockIdeas;")();
}

// ── ideas.ts の特定アイデアに insight フィールドを書き込む ────────
function patchIdeasFile(results) {
  let src = readFileSync(IDEAS_FILE, "utf8");

  for (const { id, whyNow, noveltyNote, strengthNote } of results) {
    // id: "idea-XXX", の行の直後に insight フィールドが既にあれば上書き、なければ追記
    // まず既存フィールドを削除（重複防止）
    src = src.replace(new RegExp(`(\\s+whyNow:\\s*"[^"]*",\\n)(?=[^}]*id:\\s*"${id}")`, "g"), "");
    src = src.replace(new RegExp(`(\\s+noveltyNote:\\s*"[^"]*",\\n)(?=[^}]*id:\\s*"${id}")`, "g"), "");
    src = src.replace(new RegExp(`(\\s+strengthNote:\\s*"[^"]*",\\n)(?=[^}]*id:\\s*"${id}")`, "g"), "");

    // bookmarks: N, の行の後に3フィールドを挿入
    const escapedWhyNow     = whyNow.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const escapedNovelty    = noveltyNote.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const escapedStrength   = strengthNote.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

    const insertBlock =
      `    whyNow: "${escapedWhyNow}",\n` +
      `    noveltyNote: "${escapedNovelty}",\n` +
      `    strengthNote: "${escapedStrength}",\n`;

    // id: "idea-XXX" の次の bookmarks 行の後に挿入
    // パターン: `    bookmarks: N,\n` の後（そのアイデアブロック内）
    // ブロックは id: "idea-XXX" から始まり次の {\n id: まで
    const blockPattern = new RegExp(
      `(  \\{[\\s\\S]*?id:\\s*"${id}"[\\s\\S]*?bookmarks:\\s*\\d+,\\n)`,
      "g"
    );
    src = src.replace(blockPattern, (match) => {
      // すでに whyNow が含まれていれば何もしない
      if (match.includes("whyNow:")) return match;
      return match + insertBlock;
    });
  }

  writeFileSync(IDEAS_FILE, src, "utf8");
}

// ── プロンプト生成 ────────────────────────────────────────────────
function buildPrompt(ideas) {
  const ideaList = ideas.map((idea, i) =>
    `### ${i + 1}. id="${idea.id}" serviceName="${idea.serviceName}"
- oneLiner: ${idea.oneLiner}
- category: ${idea.category} / targetCustomer: ${idea.targetCustomer}
- concept: ${idea.concept}
- problem: ${idea.problem}
- competitiveEdge: ${idea.competitiveEdge}
- competitors: ${idea.competitors}`
  ).join("\n\n");

  return `あなたは日本市場に精通した事業アナリストです。以下の${ideas.length}件のビジネスアイデアそれぞれについて、3つのインサイトフィールドを生成してください。

## 生成ルール
- 3項目とも45〜60文字・1文。箇条書き不可。
- **whyNow（なぜ今か）**: WebSearchで確認した最新の法令・統計・市場変化だけで、今の理由を書く。
- **noveltyNote（何が新しいのか）**: 現存競合との確認済み差分だけを書く。「存在しない」「空白地帯」は禁止。
- **strengthNote（何が良いのか）**: 確認済みの仕組み・データ蓄積・収益構造から説明できる強みだけを書く。
- 根拠が確認できない数値・法令名・競合差分・優位性は書かない。

## アイデア一覧
${ideaList}

## 出力形式（JSONのみ、前後の説明文不要）
[
  {
    "id": "idea-XXX",
    "whyNow": "...",
    "noveltyNote": "...",
    "strengthNote": "..."
  },
  ...
]`;
}

// ── メイン処理 ────────────────────────────────────────────────────
async function main() {
  const ideas = parseIdeas();
  console.log(`📋 総アイデア数: ${ideas.length}件`);

  // 進捗の読み込み
  const progress = existsSync(PROGRESS_FILE)
    ? JSON.parse(readFileSync(PROGRESS_FILE, "utf8"))
    : { done: [] };
  const doneIds = new Set(progress.done);
  console.log(`✅ 生成済み: ${doneIds.size}件`);

  // まだ insight がないアイデアのみ対象
  const targets = ideas.filter(
    (idea) => !doneIds.has(idea.id) && (!idea.whyNow || !idea.noveltyNote || !idea.strengthNote)
  );
  console.log(`🎯 生成対象: ${targets.length}件\n`);

  if (targets.length === 0) {
    console.log("✨ 全アイデアのインサイトが揃っています。");
    return;
  }

  let processed = 0;
  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = targets.slice(i, i + BATCH_SIZE);
    const batchIds = batch.map((b) => b.id).join(", ");
    console.log(`\n[${i + 1}〜${Math.min(i + BATCH_SIZE, targets.length)}件目] ${batchIds}`);

    try {
      const msg = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: buildPrompt(batch) }],
      });

      const raw = msg.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim();
      const jsonStr = raw.startsWith("[") ? raw : raw.match(/\[[\s\S]*\]/)?.[0];
      if (!jsonStr) throw new Error("JSON配列が見つかりません:\n" + raw.slice(0, 200));

      const results = JSON.parse(jsonStr);

      // ideas.ts に書き込み
      patchIdeasFile(results);

      // 進捗保存
      for (const r of results) doneIds.add(r.id);
      progress.done = [...doneIds];
      writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));

      processed += results.length;
      console.log(`  → ${results.length}件完了（累計 ${processed}件）`);

      // レート制限対応: バッチ間に少し待機
      if (i + BATCH_SIZE < targets.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (err) {
      console.error(`  ❌ エラー: ${err.message}`);
      console.error("  → このバッチをスキップして続行します");
    }
  }

  console.log(`\n✅ 生成完了: ${processed}件`);
  console.log("🌱 次のコマンドでDBに反映してください:");
  console.log("   npx tsx prisma/seed.ts");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
