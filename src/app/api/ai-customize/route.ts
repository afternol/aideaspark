import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { serializeIdea } from "@/lib/api-helpers";
import { checkAiRateLimit, recordAiUsage } from "@/lib/ai-rate-limit";

function extractJSON(text: string): any {
  let cleaned = text.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {}
  return null;
}

export async function POST(request: Request) {
  try {
    const { ideaId, customIdeaId, conditions, sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }
    if (!conditions) {
      return NextResponse.json({ error: "conditions required" }, { status: 400 });
    }

    // レート制限チェック
    const { allowed, remaining, resetIn } = await checkAiRateLimit(sessionId, "ai-customize");
    if (!allowed) {
      return NextResponse.json(
        { error: `カスタマイズの利用上限（24時間10回）に達しました。${resetIn}にリセットされます。` },
        { status: 429 }
      );
    }

    let sourceData: any;
    let baseIdeaId: string;
    let baseInfo: { serviceName: string; slug: string };

    if (customIdeaId) {
      const custom = await prisma.customIdea.findUnique({ where: { id: customIdeaId } });
      if (!custom) return NextResponse.json({ error: "Custom idea not found" }, { status: 404 });
      // conditions/result は Json 型 → すでにオブジェクト
      sourceData = custom.result as any;
      baseIdeaId = custom.baseIdeaId;
      const originalIdea = await prisma.idea.findUnique({ where: { id: custom.baseIdeaId } });
      baseInfo = originalIdea
        ? { serviceName: originalIdea.serviceName, slug: originalIdea.slug }
        : { serviceName: (sourceData as any).serviceName, slug: "" };
    } else if (ideaId) {
      const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
      if (!idea) return NextResponse.json({ error: "Idea not found" }, { status: 404 });
      const s = serializeIdea(idea);
      sourceData = s;
      baseIdeaId = ideaId;
      baseInfo = { serviceName: s.serviceName, slug: s.slug };
    } else {
      return NextResponse.json({ error: "ideaId or customIdeaId required" }, { status: 400 });
    }

    const anthropic = new Anthropic();

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: `あなたはビジネスアイデアのカスタマイズ専門家です。

## ベースとなるアイデア
- サービス名: ${sourceData.serviceName}
- コンセプト: ${sourceData.concept}
- ターゲット: ${sourceData.target}
- 解決する課題: ${sourceData.problem || "未定義"}
- プロダクト: ${sourceData.product || "未定義"}
- 収益モデル: ${sourceData.revenueModel || "未定義"}
- 競合: ${sourceData.competitors || "未定義"}
- 競合優位性: ${sourceData.competitiveEdge || "未定義"}
- カテゴリ: ${sourceData.category || "未定義"}
- 6軸スコア: 新規性${sourceData.scores?.novelty}/市場規模${sourceData.scores?.marketSize}/収益性${sourceData.scores?.profitability}/成長性${sourceData.scores?.growth}/実現可能性${sourceData.scores?.feasibility}/参入障壁${sourceData.scores?.moat}

## ユーザーのカスタマイズ要望
${conditions.notes || "特になし"}

## 出力ルール
- **必ず以下のJSON形式のみを返してください。説明文やマークダウンは不要です。**
- 各フィールドは簡潔に（各100文字以内を目安）。

{
  "serviceName": "カスタマイズ後のサービス名",
  "oneLiner": "1行の説明",
  "concept": "カスタマイズ後のコンセプト",
  "target": "絞り込んだターゲット",
  "problem": "フォーカスする課題",
  "product": "条件に合わせたプロダクト構成（/区切り）",
  "revenueModel": "条件に合わせた収益モデル（/区切り）",
  "competitors": "競合",
  "competitiveEdge": "条件を踏まえた競合優位性",
  "scores": { "novelty": 1-5, "marketSize": 1-5, "profitability": 1-5, "growth": 1-5, "feasibility": 1-5, "moat": 1-5 },
  "changes": ["変更点1", "変更点2", "変更点3"]
}`,
      }],
    });

    if (message.stop_reason !== "end_turn") {
      return NextResponse.json({ error: "AIの応答が途中で切れました。再度お試しください。" }, { status: 500 });
    }

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const result = extractJSON(text);
    if (!result) {
      console.error("AI customize: JSON parse failed. Raw:", text.substring(0, 500));
      return NextResponse.json({ error: "AI応答の解析に失敗しました。再度お試しください。" }, { status: 500 });
    }

    // 使用記録
    await recordAiUsage(sessionId, "ai-customize");

    // Save to DB (Json 型なのでオブジェクトをそのまま渡す)
    const customIdea = await prisma.customIdea.create({
      data: {
        userId: sessionId,
        baseIdeaId: baseIdeaId,
        conditions: conditions,
        result: result,
      },
    });

    return NextResponse.json({
      id: customIdea.id,
      baseIdea: baseInfo,
      ...result,
      remaining,
    });
  } catch (error: any) {
    console.error("AI customize error:", error?.message, error?.status, error?.error);
    const msg = error?.error?.message || error?.message || "不明なエラー";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
