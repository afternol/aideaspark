import Anthropic from "@anthropic-ai/sdk";
import type { TrendReportData, TrendSource, RecentNewsItem } from "./trend-slugs";

const anthropic = new Anthropic();

function extractJSON(text: string): any {
  const cleaned = text.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch {}
  return null;
}

function extractPublisher(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
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

export async function generateTrendReport(
  keyword: string,
  group: string,
  score: number,
  momentum: string,
): Promise<TrendReportData> {
  const momentumJa = momentum === "rising" ? "上昇中" : momentum === "declining" ? "下降中" : "横ばい";
  const { today, threeMonths, cutoff } = dateRange();

  // ── Phase 1: web_search ──────────────────────────────────
  const phase1 = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    tools: [{ type: "web_search_20250305" as any, name: "web_search" }],
    messages: [{
      role: "user",
      content: `本日は${today}です。日本市場における「${keyword}」（${group}分野）について、**直近3ヶ月（${threeMonths}）を中心**とした最新情報を徹底的に調査してください。

## 優先して収集する情報（${threeMonths}のもの）
1. **直近ニュース・出来事**（企業名・金額・日付を必ず含める。古いものより新しいものを優先）
2. **主要プレイヤーの最新動向**（資金調達・製品リリース・M&A・提携など、できるだけ直近のもの）
3. **市場規模・成長率**（最新の調査レポートや統計、発行年月を明記）
4. **規制・政策の最新動向**（直近の法改正・施行・発表など）
5. **海外最新動向と日本への影響**（直近3ヶ月の海外主要プレイヤーの動き）
6. **投資・VC動向**（直近の大型調達・ファンド組成・EXIT）

古い情報（1年以上前）は除外し、できる限り${threeMonths}の情報を中心に収集してください。`,
    }],
  });

  // Phase 1 から URL・タイトルを取得して番号付きリストを作成
  const rawSources: { num: number; title: string; publisher: string; url: string }[] = [];
  for (const block of phase1.content) {
    if ((block as any).type === "web_search_tool_result") {
      for (const r of (block as any).content ?? []) {
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

  const sourceListText = rawSources
    .map((s) => `[${s.num}] ${s.publisher} — ${s.title} (${s.url})`)
    .join("\n");

  const phase1Text = phase1.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");

  // ── Phase 2: 構造化レポート生成（引用番号付き）──────────
  const phase2 = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
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

## 重要ルール
- **recentNewsは${threeMonths}の期間内のニュースのみ掲載**。${cutoff}より前のニュースは含めない
- 事実・数値・固有名詞を述べる箇所には必ず [番号] を付与する
- 引用番号は情報の直後に置く（例:「〇〇社が50億円を調達[1]し、」）
- 推測・一般論には引用番号を付けない
- 全セクションで最新情報（直近のもの）を優先する
- 使用した参照番号だけを sources に含める

## 出力フォーマット（JSONのみ）
\`\`\`json
{
  "summary": "3〜4文。${today}時点の最新状況を中心に、数値・企業名・時期を含め [番号] を付与。",
  "recentNews": [
    {
      "date": "${today}（または直近の正確な年月）",
      "headline": "見出し（30字以内・具体的な企業名や数値を含む）",
      "detail": "詳細2〜3文。企業名・金額・影響を含む。[番号]付与。"
    }
  ],
  "investmentTrends": "直近の投資・資金調達・M&A動向を3〜4文で。金額・ラウンド・投資家名・日付を含む。[番号]付与。",
  "globalContext": "海外（米国・欧州・中国など）の直近動向と日本市場への影響を3〜4文で。具体的企業・政策・数値を含む。[番号]付与。",
  "keyPlayers": [
    "企業名A: 直近の動向（資金調達額・サービス名・ユーザー数・日付）[1]",
    "企業名B: 直近の動向 [2]",
    "企業名C: 動向 [3]",
    "企業名D: 動向（任意）[4]",
    "企業名E: 動向（任意）[5]"
  ],
  "marketSize": "最新の市場規模・成長率・予測値（調査会社名・発行年月を必ず含む）[番号]。なければ '公開データなし'",
  "outlook": "今後12〜18ヶ月の見通しを2〜3文で。具体的なマイルストーンや注目点を含める。",
  "sources": [
    {"num": 1, "title": "記事タイトル", "publisher": "出典元ドメイン", "url": "https://..."}
  ]
}
\`\`\`
※ recentNewsは${threeMonths}のものだけ。件数は調査で見つかった分だけ（最大10件）。古いニュースは絶対に含めない。`,
    }],
  });

  const rawText = phase2.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("");

  const data = extractJSON(rawText);
  if (!data) throw new Error("JSON parse failed");

  const sources: TrendSource[] = Array.isArray(data.sources)
    ? data.sources.map((s: any, i: number) => ({
        num:       typeof s.num === "number" ? s.num : i + 1,
        title:     String(s.title ?? ""),
        publisher: String(s.publisher ?? extractPublisher(s.url ?? "")),
        url:       String(s.url ?? ""),
      })).filter((s: TrendSource) => s.url)
    : rawSources;

  const recentNews: RecentNewsItem[] = Array.isArray(data.recentNews)
    ? data.recentNews.map((n: any) => ({
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
