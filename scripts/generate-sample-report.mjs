/**
 * 生成AI のサンプルレポートを生成してDBに保存
 * node scripts/generate-sample-report.mjs
 */
import Anthropic from "@anthropic-ai/sdk";
import pg from "pg";
import { config } from "dotenv";

config();

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL });
const anthropic = new Anthropic();

function extractJSON(text) {
  const cleaned = text.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch {}
  return null;
}

function extractPublisher(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

async function generateReport(keyword, group, score, momentum) {
  const momentumJa = momentum === "rising" ? "上昇中" : momentum === "declining" ? "下降中" : "横ばい";
  console.log(`Phase1: web_search 開始 (${keyword})...`);

  const phase1 = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 3000,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    messages: [{
      role: "user",
      content: `2025〜2026年の日本市場における「${keyword}」（${group}分野）の最新動向を徹底的に調査してください。

以下の観点で具体的な情報を収集してください：
1. **大きなニュース・出来事**（2024年後半〜2026年、具体的な企業名・数値・日付付き）
2. **主要プレイヤーの動向**（資金調達ラウンド・金額、M&A、新規参入、撤退、製品リリース）
3. **市場規模・成長率**（調査会社のレポート、政府統計など信頼できる数値）
4. **規制・法改正・政策の動き**（施行済み・予定含む）
5. **海外での動向が日本市場に与える影響**
6. **投資・VC動向**（主要ファンド・調達規模・注目スタートアップ）

できる限り具体的な固有名詞・数値・日付を含む情報を収集してください。`,
    }],
  });

  const rawSources = [];
  for (const block of phase1.content) {
    if (block.type === "web_search_tool_result") {
      for (const r of block.content ?? []) {
        if (r.type === "web_search_result" && r.url && rawSources.length < 8) {
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

  console.log(`Phase1完了。参照URL: ${rawSources.length}件`);
  console.log(`Phase2: レポート構造化 開始...`);

  const phase2 = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: `あなたは日本のスタートアップ・ビジネストレンドの専門アナリストです。
調査で収集したファクトのみを使い、推測や一般論は含めないでください。
情報を引用する際は必ず [番号] を文中の該当箇所に付与してください。
必ずJSONのみを返してください。`,
    messages: [{
      role: "user",
      content: `以下の調査結果をもとに、「${keyword}」（スコア: ${score}点・${momentumJa}）の詳細トレンドレポートをJSONで作成してください。

## 調査結果
${phase1Text}

## 参照番号リスト（引用時はこの番号を使うこと）
${sourceListText}

## ルール
- 事実・数値・固有名詞を述べる箇所には必ず [番号] を付与する
- 引用番号は文末ではなく、その情報の直後に置く（例: 「〇〇社は2025年10月に50億円を調達[1]し、」）
- 推測・一般論には引用番号を付けない
- 使用した参照番号だけを sources に含める
- 各フィールドはできるだけ具体的・詳細に記述すること

## 出力フォーマット（JSONのみ）
\`\`\`json
{
  "summary": "3〜4文。数値・企業名・時期を含め、引用箇所に [番号] を付与。トレンドの全体像が伝わるように。",
  "whatIsHappening": [
    "ファクト1（企業名/金額/日付を含む最新動向）[1]",
    "ファクト2 [2]",
    "ファクト3 [3]",
    "ファクト4 [4]",
    "ファクト5 [5]",
    "ファクト6（任意）[6]"
  ],
  "recentNews": [
    {
      "date": "2026年4月",
      "headline": "ニュース見出し（30字以内）",
      "detail": "詳細説明。企業名・金額・影響を含む2〜3文。[番号]を付与。"
    },
    {
      "date": "2026年3月",
      "headline": "ニュース見出し",
      "detail": "詳細説明 [2]"
    },
    {
      "date": "2026年2月",
      "headline": "ニュース見出し",
      "detail": "詳細説明 [3]"
    },
    {
      "date": "2025年12月",
      "headline": "ニュース見出し",
      "detail": "詳細説明 [4]"
    },
    {
      "date": "2025年10月",
      "headline": "ニュース見出し（任意）",
      "detail": "詳細説明 [5]"
    }
  ],
  "investmentTrends": "2024〜2026年の投資・資金調達・M&A動向を3〜4文で。金額・ラウンド・投資家名を含む。[番号]付与。",
  "globalContext": "海外（米国・欧州・中国など）の動向と日本市場への影響を3〜4文で。具体的企業・政策・数値を含む。[番号]付与。",
  "keyPlayers": [
    "企業名A: 具体的な動向（資金調達額・サービス名・ユーザー数など）[1]",
    "企業名B: 動向 [2]",
    "企業名C: 動向 [3]",
    "企業名D: 動向（任意）[4]",
    "企業名E: 動向（任意）[5]"
  ],
  "marketSize": "市場規模・成長率・予測値（調査会社名・発行年を含む）[番号]。なければ '公開データなし'",
  "outlook": "今後12〜18ヶ月の見通しを2〜3文で。具体的なマイルストーンや注目点を含める。",
  "sources": [
    {"num": 1, "title": "記事タイトル", "publisher": "出典元ドメイン", "url": "https://..."},
    {"num": 2, "title": "記事タイトル", "publisher": "出典元ドメイン", "url": "https://..."}
  ]
}
\`\`\``,
    }],
  });

  const rawText = phase2.content.filter(b => b.type === "text").map(b => b.text).join("");
  const data = extractJSON(rawText);
  if (!data) throw new Error("JSON parse failed:\n" + rawText.slice(0, 500));

  const sources = Array.isArray(data.sources)
    ? data.sources.map((s, i) => ({
        num:       typeof s.num === "number" ? s.num : i + 1,
        title:     String(s.title ?? ""),
        publisher: String(s.publisher ?? extractPublisher(s.url ?? "")),
        url:       String(s.url ?? ""),
      })).filter(s => s.url)
    : rawSources;

  const recentNews = Array.isArray(data.recentNews)
    ? data.recentNews.map(n => ({
        date:     String(n.date ?? ""),
        headline: String(n.headline ?? ""),
        detail:   String(n.detail ?? ""),
      }))
    : [];

  return {
    summary:          String(data.summary ?? ""),
    whatIsHappening:  Array.isArray(data.whatIsHappening) ? data.whatIsHappening : [],
    recentNews,
    investmentTrends: String(data.investmentTrends ?? ""),
    globalContext:    String(data.globalContext ?? ""),
    keyPlayers:       Array.isArray(data.keyPlayers) ? data.keyPlayers : [],
    marketSize:       String(data.marketSize ?? "公開データなし"),
    outlook:          String(data.outlook ?? ""),
    sources,
    generatedAt:      new Date().toISOString(),
  };
}

async function main() {
  const keyword = "生成AI";
  const client = await pool.connect();
  try {
    const row = await client.query('SELECT * FROM "TrendCache" WHERE keyword = $1', [keyword]);
    if (!row.rows[0]) throw new Error("TrendCacheに 生成AI が見つかりません");
    const { totalScore, category, momentum } = row.rows[0];

    const report = await generateReport(keyword, category, Math.round(totalScore), momentum);
    console.log("\nレポート生成完了。DB保存中...");

    await client.query(
      'UPDATE "TrendCache" SET report = $1 WHERE keyword = $2',
      [JSON.stringify(report), keyword]
    );
    console.log("✓ 保存完了");
    console.log("\n--- サマリー ---");
    console.log(report.summary);
    console.log(`\n直近ニュース: ${report.recentNews.length}件`);
    report.recentNews.forEach(n => console.log(`  ${n.date} | ${n.headline}`));
    console.log(`\n参考文献: ${report.sources.length}件`);
    report.sources.forEach(s => console.log(`  [${s.num}] ${s.publisher} — ${s.title}`));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
