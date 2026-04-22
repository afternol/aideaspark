import Anthropic from "@anthropic-ai/sdk";
import type { TrendReportData } from "./trend-slugs";

const anthropic = new Anthropic();

function extractJSON(text: string): any {
  const cleaned = text.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch {}
  return null;
}

export async function generateTrendReport(
  keyword: string,
  group: string,
  score: number,
  momentum: string,
): Promise<TrendReportData> {
  const momentumJa = momentum === "rising" ? "上昇中" : momentum === "declining" ? "下降中" : "横ばい";

  // Phase 1: web_search で最新情報を収集
  const phase1 = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 3000,
    tools: [{ type: "web_search_20250305" as any, name: "web_search" }],
    messages: [{
      role: "user",
      content: `2025〜2026年の日本市場における「${keyword}」（${group}分野）の最新動向を徹底的に調査してください。

以下の観点で具体的な情報を収集してください：
1. **大きなニュース・出来事**（2024年後半〜2026年、具体的な企業名・数値・日付付き）
2. **主要プレイヤーの動向**（資金調達ラウンド・金額、M&A、新規参入、撤退、製品リリース）
3. **市場規模・成長率**（調査会社のレポート、政府統計など信頼できる数値）
4. **規制・法改正・政策の動き**（施行済み・予定含む）
5. **海外での動向が日本市場に与える影響**

できる限り具体的な固有名詞・数値・日付を含む情報を収集してください。`,
    }],
  });

  const phase1Text = phase1.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");

  const sources: string[] = [];
  for (const block of phase1.content) {
    if ((block as any).type === "web_search_tool_result") {
      for (const r of (block as any).content ?? []) {
        if (r.type === "web_search_result" && r.url) sources.push(r.url);
      }
    }
  }

  // Phase 2: 収集情報をレポート構造に整理
  const phase2 = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: `あなたは日本のスタートアップ・ビジネストレンドの専門アナリストです。
調査で収集したファクトのみを使い、推測や一般論は含めずにレポートを作成してください。
具体的な企業名・数値・日付が含まれていない記述は避けてください。
必ずJSONのみを返してください。`,
    messages: [{
      role: "user",
      content: `以下の調査結果をもとに、「${keyword}」（現在スコア: ${score}点・${momentumJa}）のトレンドレポートをJSONで作成してください。

## 調査結果
${phase1Text}

## 出力フォーマット（JSONのみ）
\`\`\`json
{
  "summary": "2〜3文のサマリー。具体的な数値・企業名・時期を必ず含める。",
  "whatIsHappening": [
    "ファクト1（企業名/金額/日付を含む最新ニュース）",
    "ファクト2",
    "ファクト3",
    "ファクト4（任意）"
  ],
  "characteristics": "日本市場における${keyword}の構造的特徴・固有の文脈を2文で。",
  "scoreRationale": "${score}点という評価の根拠を、調査で見つかったデータを引用しながら3〜4文で説明。",
  "keyPlayers": [
    "企業名A: 具体的な動向（例: 2025年X月にY億円調達、〇〇を発表）",
    "企業名B: 動向",
    "企業名C: 動向"
  ],
  "marketSize": "市場規模・成長率（調査会社名や出典を含む具体的な数値。不明なら'公開データなし'）",
  "outlook": "調査結果に基づく今後12ヶ月の見通しを1〜2文で。",
  "sources": ${JSON.stringify(sources.slice(0, 5))}
}
\`\`\``,
    }],
  });

  const rawText = phase2.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("");

  const data = extractJSON(rawText);
  if (!data) throw new Error("JSON parse failed");

  return {
    summary:          String(data.summary ?? ""),
    whatIsHappening:  Array.isArray(data.whatIsHappening) ? data.whatIsHappening : [],
    characteristics:  String(data.characteristics ?? ""),
    scoreRationale:   String(data.scoreRationale ?? ""),
    keyPlayers:       Array.isArray(data.keyPlayers) ? data.keyPlayers : [],
    marketSize:       String(data.marketSize ?? "公開データなし"),
    outlook:          String(data.outlook ?? ""),
    sources:          Array.isArray(data.sources) ? data.sources : sources.slice(0, 5),
    generatedAt:      new Date().toISOString(),
  };
}
