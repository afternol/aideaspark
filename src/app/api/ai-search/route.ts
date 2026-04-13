import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { serializeIdea } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    if (!query?.trim()) {
      return NextResponse.json({ results: [], interpretation: "" });
    }

    // Get all ideas for context
    const allIdeas = await prisma.idea.findMany();
    const serialized = allIdeas.map((idea) => {
      const s = serializeIdea(idea);
      return {
        id: s.id,
        slug: s.slug,
        serviceName: s.serviceName,
        oneLiner: s.oneLiner,
        category: s.category,
        targetIndustry: s.targetIndustry,
        targetCustomer: s.targetCustomer,
        difficulty: s.difficulty,
        tags: s.tags,
        scores: s.scores,
      };
    });

    const ideaSummary = serialized
      .map((i) => `[${i.id}] ${i.serviceName} | ${i.oneLiner} | 領域:${i.category} | 業界:${i.targetIndustry} | 顧客:${i.targetCustomer} | 難易度:${i.difficulty} | タグ:${i.tags.join(",")} | スコア:新規性${i.scores.novelty}/市場${i.scores.marketSize}/収益${i.scores.profitability}/成長${i.scores.growth}/実現${i.scores.feasibility}/障壁${i.scores.moat}`)
      .join("\n");

    const anthropic = new Anthropic();
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `あなたは起業・新規事業を検討しているユーザーを支援するビジネスアイデア検索アシスタントです。
ユーザーの曖昧な要望や課題意識から、最適なビジネスアイデアを見つけ出してください。

## アイデアデータベース
${ideaSummary}

## ユーザーの検索クエリ
「${query}」

## 指示
- クエリの意図を深く読み取り、表面的なキーワードマッチだけでなく、ユーザーが本当に求めていそうなアイデアを選んでください
- 最大5件を、マッチ度が高い順に選んでください
- interpretationは、ユーザーの検索意図を具体化した1文にしてください（例: 「〜な課題を持つ方に向けた、〜な特徴のビジネスをお探しですね」）
- reasonは、選んだアイデアに共通するポイントや、クエリとの関連を1-2文で端的に説明してください
- マッチするアイデアがない場合はidsを空配列にし、interpretationで代わりの検索ヒントを提示してください

以下のJSON形式のみを返してください:
{
  "interpretation": "...",
  "ids": ["idea-001", ...],
  "reason": "..."
}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    // Parse AI response
    let parsed: { interpretation: string; ids: string[]; reason: string };
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { interpretation: "", ids: [], reason: "" };
    } catch {
      parsed = { interpretation: "検索結果を解析できませんでした", ids: [], reason: "" };
    }

    // Fetch matched ideas
    const matchedIdeas = parsed.ids.length > 0
      ? await prisma.idea.findMany({ where: { id: { in: parsed.ids } } })
      : [];

    // Preserve AI's ordering
    const orderedResults = parsed.ids
      .map((id) => matchedIdeas.find((i) => i.id === id))
      .filter(Boolean)
      .map((idea) => serializeIdea(idea));

    return NextResponse.json({
      results: orderedResults,
      interpretation: parsed.interpretation,
      reason: parsed.reason,
    });
  } catch (error: any) {
    console.error("AI search error:", error);
    return NextResponse.json(
      { error: error.message || "AI検索に失敗しました", results: [], interpretation: "" },
      { status: 500 }
    );
  }
}
