/**
 * API・BaaS のトレンドレポートを生成してDBに保存
 * node scripts/generate-api-baas-reports.mjs
 *
 * 品質チェックリスト準拠:
 * - 数値・金額の桁確認
 * - recentNews はそのトレンドに直接関連するニュースのみ
 * - keyPlayers はAPI/BaaS分野の主要事業者のみ（VC・政府機関は除外）
 * - sources URLは実在のページに対応するもののみ
 * - 引用番号の欠番・範囲外参照を防止
 */
import Anthropic from "@anthropic-ai/sdk";
import pg from "pg";
import { config } from "dotenv";

config();

const DB_URL = (process.env.DATABASE_URL || "");
const pool = new pg.Pool({ connectionString: DB_URL });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function extractJSON(text) {
  const cleaned = text.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch {}
  return null;
}

function extractPublisher(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

function dateRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const from = new Date(now);
  from.setMonth(from.getMonth() - 3);
  const fy = from.getFullYear();
  const fm = from.getMonth() + 1;
  return {
    today:       `${y}年${m}月`,
    threeMonths: `${fy}年${fm}月〜${y}年${m}月`,
    cutoff:      `${fy}年${fm}月`,
  };
}

async function generateReport(keyword, group, score, momentum) {
  const momentumJa = momentum === "rising" ? "上昇中" : momentum === "declining" ? "下降中" : "横ばい";
  const { today, threeMonths, cutoff } = dateRange();

  console.log(`\n=== [${keyword}] Phase1: web_search 開始 ===`);
  console.log(`対象期間: ${threeMonths}`);

  // API向けとBaaS向けで検索クエリを最適化
  const searchContext = keyword === "API"
    ? "日本のAPI市場・API経済圏・APIマネジメント・API公開・連携サービス"
    : "日本のBaaS（Backend as a Service）市場・mBaaS・クラウドバックエンド・Firebase競合";

  const phase1 = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    messages: [{
      role: "user",
      content: `本日は${today}です。日本市場における「${keyword}」（${group}分野・${searchContext}）について、**直近3ヶ月（${threeMonths}）を中心**とした最新情報を徹底的に調査してください。

## 優先して収集する情報（${threeMonths}のもの）
1. **直近ニュース・出来事**（企業名・金額・日付を必ず含める。古いものより新しいものを優先）
2. **主要プレイヤーの最新動向**（資金調達・製品リリース・M&A・提携など、できるだけ直近のもの）
   - ${keyword === "API" ? "APIゲートウェイ・APIマネジメント・API公開プラットフォームの事業者" : "BaaSプロバイダー・mBaaS・モバイルバックエンドサービスの事業者"}
3. **市場規模・成長率**（最新の調査レポートや統計、発行年月を明記）
4. **規制・政策の最新動向**（直近の法改正・施行・発表など）
5. **海外最新動向と日本への影響**（直近3ヶ月の海外主要プレイヤーの動き）
6. **投資・VC動向**（直近の大型調達・ファンド組成・EXIT）

古い情報（1年以上前）は除外し、できる限り${threeMonths}の情報を中心に収集してください。
VC・政府機関・無関係業種の企業情報は収集不要です。`,
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

  console.log(`Phase1完了。参照URL: ${rawSources.length}件`);
  console.log(`Phase2: レポート構造化 開始...`);

  const phase2 = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: `あなたは日本のスタートアップ・ビジネストレンドの専門アナリストです。
本日は${today}です。
調査で収集したファクトのみを使い、推測や一般論は絶対に含めないでください。
情報を引用する際は必ず [番号] を文中の該当箇所に付与してください。
古い情報（1年以上前）は使用しないでください。
必ずJSONのみを返してください。`,
    messages: [{
      role: "user",
      content: `以下の調査結果をもとに、「${keyword}」（スコア: ${score}点・${momentumJa}）のトレンドレポートをJSONで作成してください。

## 調査結果
${phase1Text}

## 参照番号リスト（引用時はこの番号を使うこと）
${sourceListText}

## 重要ルール（品質チェックリスト準拠）
- **recentNewsは${threeMonths}の期間内のニュースのみ掲載**。${cutoff}より前のニュースは含めない
- 事実・数値・固有名詞を述べる箇所には必ず [番号] を付与する
- 引用番号は情報の直後に置く（例:「〇〇社が50億円を調達[1]し、」）
- 推測・一般論には引用番号を付けない
- 全セクションで最新情報（直近のもの）を優先する
- **使用した参照番号だけをsourcesに含める**（未使用番号を含めない）
- **本文中の引用番号がsourcesの最大番号を超えないこと**（範囲外参照禁止）
- keyPlayersには**${keyword === "API" ? "APIマネジメント・API公開・API連携の主要事業者" : "BaaSプロバイダー・mBaaSの主要事業者"}のみ**を記載（VC・政府機関・無関係業種は含めない）
- recentNewsには**${keyword}ビジネスに直接関連するニュースのみ**を記載（別分野の調達情報等を混入させない）
- 市場規模は「グローバル市場」か「日本市場」か「細分市場」かを明示する
- CAGR記載時は始点・終点・年数を明記し、数学的に正確な値を使う（(終点/始点)^(1/年数)-1）
- 数値の桁（億 vs 兆、million vs billion）に特に注意する
- 「世界初」「業界初」は根拠がある場合のみ記載する

## 出力フォーマット（JSONのみ）
\`\`\`json
{
  "summary": "3〜4文。${today}時点の最新状況を中心に、数値・企業名・時期を含め [番号] を付与。",
  "recentNews": [
    {
      "date": "直近の正確な年月（例: 2026年3月）",
      "headline": "見出し（30字以内・具体的な企業名や数値を含む）",
      "detail": "詳細2〜3文。企業名・金額・影響を含む。[番号]付与。"
    }
  ],
  "investmentTrends": "直近の投資・資金調達・M&A動向を3〜4文で。金額・ラウンド・投資家名・日付を含む。[番号]付与。",
  "globalContext": "海外（米国・欧州・アジアなど）の直近動向と日本市場への影響を3〜4文で。具体的企業・政策・数値を含む。[番号]付与。",
  "keyPlayers": [
    "企業名A: 直近の動向（資金調達額・サービス名・ユーザー数・日付）[1]",
    "企業名B: 直近の動向 [2]",
    "企業名C: 動向 [3]",
    "企業名D: 動向（任意）[4]",
    "企業名E: 動向（任意）[5]"
  ],
  "marketSize": "最新の市場規模・成長率・予測値（調査会社名・発行年月・グローバル/日本を明示）[番号]。なければ '公開データなし'",
  "outlook": "今後12〜18ヶ月の見通しを2〜3文で。具体的なマイルストーンや注目イベントを含める。",
  "sources": [
    {"num": 1, "title": "記事タイトル", "publisher": "出典元ドメイン", "url": "https://..."}
  ]
}
\`\`\`
※ recentNewsは新しい順に必ず10件記載すること。直近3ヶ月（${threeMonths}）を優先し、足りない場合は直近1年以内まで遡って補完する。必ず10件揃えること。`,
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
    whatIsHappening:  [],
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

const SLUG_MAP = { API: "api", BaaS: "baas" };

async function main() {
  const targets = [
    { keyword: "API",  group: "ビジネスモデル", score: 68, momentum: "rising" },
    { keyword: "BaaS", group: "ビジネスモデル", score: 62, momentum: "rising" },
  ];

  for (const t of targets) {
    try {
      const report = await generateReport(t.keyword, t.group, t.score, t.momentum);

      console.log(`\nDB保存中... [${t.keyword}]`);
      const slug = SLUG_MAP[t.keyword];
      await pool.query(
        `UPDATE "TrendCache" SET report = $1, slug = $2, "updatedAt" = NOW() WHERE keyword = $3`,
        [JSON.stringify(report), slug, t.keyword]
      );
      console.log(`✓ 保存完了 (slug: ${slug})`);

      console.log("\n--- サマリー ---");
      console.log(report.summary);
      console.log(`\n直近ニュース: ${report.recentNews.length}件`);
      report.recentNews.forEach(n => console.log(`  ${n.date} | ${n.headline}`));
      console.log(`keyPlayers: ${report.keyPlayers.length}件`);
      report.keyPlayers.forEach(p => console.log(`  ${p}`));
      console.log(`\n参考文献: ${report.sources.length}件`);
      report.sources.forEach(s => console.log(`  [${s.num}] ${s.publisher} — ${s.title}`));
    } catch (e) {
      console.error(`[ERROR] ${t.keyword}:`, e.message);
    }
  }

  await pool.end();
  console.log("\n=== 全処理完了 ===");
}

main().catch(e => { console.error(e); process.exit(1); });
