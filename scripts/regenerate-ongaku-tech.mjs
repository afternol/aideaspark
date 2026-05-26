/**
 * 音楽テックレポートを再生成（データ破損のため）
 * 実行方法: node scripts/regenerate-ongaku-tech.mjs
 * ANTHROPIC_API_KEY 環境変数が必要
 */
import Anthropic from "@anthropic-ai/sdk";
import pg from "pg";

const DB_URL =
  (process.env.DATABASE_URL || "");
const pool = new pg.Pool({ connectionString: DB_URL });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const KEYWORD = "音楽テック";
const GROUP = "エンタメ・クリエイター";
const SCORE = 85;
const MOMENTUM = "rising";

function extractPublisher(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

function extractJSON(text) {
  const cleaned = text.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch {}
  return null;
}

async function main() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const from = new Date(now); from.setMonth(from.getMonth() - 3);
  const fy = from.getFullYear(); const fm = from.getMonth() + 1;
  const today = `${y}年${m}月`;
  const threeMonths = `${fy}年${fm}月〜${y}年${m}月`;

  console.log(`[再生成開始] ${KEYWORD} (${today})`);

  // Phase 1: web検索
  const phase1 = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    messages: [{
      role: "user",
      content: `本日は${today}です。日本市場における「${KEYWORD}」（${GROUP}分野）について、**直近3ヶ月（${threeMonths}）を中心**とした最新情報を徹底的に調査してください。

## 優先して収集する情報
1. **直近ニュース・出来事**（企業名・金額・日付を必ず含める）
2. **主要プレイヤーの最新動向**（資金調達・製品リリース・M&A・提携など）
3. **市場規模・成長率**（最新の調査レポートや統計）
4. **規制・政策の最新動向**（著作権法・AI音楽規制など）
5. **海外最新動向と日本への影響**
6. **投資・VC動向**

古い情報（1年以上前）は除外してください。`,
    }],
  });

  const rawSources = [];
  for (const block of phase1.content) {
    if (block.type === "web_search_tool_result") {
      for (const r of block.content ?? []) {
        if (r.type === "web_search_result" && r.url && rawSources.length < 10) {
          rawSources.push({
            num: rawSources.length + 1,
            title: r.title || "記事",
            publisher: extractPublisher(r.url),
            url: r.url,
          });
        }
      }
    }
  }

  const phase1Text = phase1.content.filter(b => b.type === "text").map(b => b.text).join("\n");
  const sourceListText = rawSources.map(s => `[${s.num}] ${s.publisher} — ${s.title} (${s.url})`).join("\n");

  console.log(`  Phase1完了: ${rawSources.length}件のソース収集`);

  // Phase 2: 構造化レポート生成
  const phase2 = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: `あなたは日本のスタートアップ・ビジネストレンドの専門アナリストです。
本日は${today}です。
調査で収集したファクトのみを使い、推測・一般論・ハルシネーションは絶対に含めないでください。
情報を引用する際は必ず [番号] を文中の該当箇所に付与してください。
必ず有効なJSONのみを返してください。マークダウンのコードブロック（\`\`\`json）は使わず、JSONオブジェクトをそのまま出力してください。`,
    messages: [{
      role: "user",
      content: `以下の調査結果をもとに、「${KEYWORD}」（スコア: ${SCORE}点・上昇中）のトレンドレポートをJSONで作成してください。

## 調査結果
${phase1Text}

## 参照番号リスト（引用時はこの番号を使うこと）
${sourceListText}

## 重要ルール
- 事実・数値・固有名詞を述べる箇所には必ず [番号] を付与する
- 推測・一般論・ハルシネーションは絶対に含めない
- recentNewsは新しい順に必ず10件記載
- 使用した参照番号だけを sources に含める

## 出力フォーマット（JSONのみ）
{
  "summary": "3〜4文。${today}時点の最新状況を中心に、数値・企業名・時期を含め [番号] を付与。",
  "recentNews": [
    {
      "date": "年月（正確なもの）",
      "headline": "見出し（30字以内・具体的な企業名や数値を含む）",
      "detail": "詳細2〜3文。企業名・金額・影響を含む。[番号]付与。"
    }
  ],
  "investmentTrends": "直近の投資・資金調達・M&A動向を3〜4文で。[番号]付与。",
  "globalContext": "海外の直近動向と日本市場への影響を3〜4文で。[番号]付与。",
  "keyPlayers": [
    "企業名A: 直近の動向 [1]",
    "企業名B: 直近の動向 [2]"
  ],
  "marketSize": "最新の市場規模・成長率（調査会社名・発行年月を必ず含む）[番号]。",
  "outlook": "今後12〜18ヶ月の見通しを2〜3文で。",
  "sources": [
    {"num": 1, "title": "記事タイトル", "publisher": "出典元ドメイン", "url": "https://..."}
  ]
}
※ recentNewsは必ず10件揃えること。`,
    }],
  });

  const rawText = phase2.content.filter(b => b.type === "text").map(b => b.text).join("");
  const data = extractJSON(rawText);
  if (!data) {
    console.error("JSON parse failed:", rawText.slice(0, 500));
    process.exit(1);
  }

  const sources = Array.isArray(data.sources)
    ? data.sources.map((s, i) => ({
        num: typeof s.num === "number" ? s.num : i + 1,
        title: String(s.title ?? ""),
        publisher: String(s.publisher ?? extractPublisher(s.url ?? "")),
        url: String(s.url ?? ""),
      })).filter(s => s.url)
    : rawSources;

  const report = {
    summary: String(data.summary ?? ""),
    whatIsHappening: [],
    recentNews: Array.isArray(data.recentNews)
      ? data.recentNews.map(n => ({
          date: String(n.date ?? ""),
          headline: String(n.headline ?? ""),
          detail: String(n.detail ?? ""),
        }))
      : [],
    investmentTrends: String(data.investmentTrends ?? ""),
    globalContext: String(data.globalContext ?? ""),
    keyPlayers: Array.isArray(data.keyPlayers) ? data.keyPlayers : [],
    marketSize: String(data.marketSize ?? "公開データなし"),
    outlook: String(data.outlook ?? ""),
    sources,
    generatedAt: new Date().toISOString(),
  };

  await pool.query(
    'UPDATE "TrendCache" SET report = $1, "updatedAt" = NOW() WHERE keyword = $2',
    [JSON.stringify(report), KEYWORD]
  );

  console.log(`✓ ${KEYWORD} レポート再生成・DB更新完了`);
  console.log(`  recentNews: ${report.recentNews.length}件`);
  console.log(`  sources: ${report.sources.length}件`);
  console.log(`  summary先頭: ${report.summary.slice(0, 80)}...`);

  await pool.end();
}

main().catch((e) => {
  console.error("エラー:", e.message);
  process.exit(1);
});
