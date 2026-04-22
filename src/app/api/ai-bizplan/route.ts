import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { serializeIdea } from "@/lib/api-helpers";
import { checkAiRateLimit, recordAiUsage } from "@/lib/ai-rate-limit";
import { auth } from "@/lib/auth";

function extractJSON(text: string): any {
  let cleaned = text.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch {}
  return null;
}

function getTextFromMessage(msg: any): string {
  return msg.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");
}

function extractWebSources(msg: any): { title: string; url: string }[] {
  const sources: { title: string; url: string }[] = [];
  for (const block of msg.content) {
    if (block.type === "web_search_tool_result") {
      for (const result of block.content || []) {
        if (result.type === "web_search_result" && result.url) {
          sources.push({ title: result.title || "", url: result.url });
        }
      }
    }
  }
  return sources;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const authUserId = session?.user?.id ?? null;

    const { ideaId, customIdeaId, customNote, sessionId } = await request.json();
    if (!sessionId) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

    const rateId = authUserId ?? sessionId;
    // レート制限チェック
    const { allowed, remaining, resetIn } = await checkAiRateLimit(rateId, "ai-bizplan");
    if (!allowed) {
      return NextResponse.json(
        { error: `ビジネスプラン生成の利用上限（24時間5回）に達しました。${resetIn}にリセットされます。` },
        { status: 429 }
      );
    }

    const anthropic = new Anthropic();

    let ideaData: any;
    if (customIdeaId) {
      const custom = await prisma.customIdea.findUnique({ where: { id: customIdeaId } });
      if (!custom) return NextResponse.json({ error: "Custom idea not found" }, { status: 404 });
      // Json 型なのでそのままオブジェクト
      ideaData = custom.result as any;
    } else if (ideaId) {
      const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
      if (!idea) return NextResponse.json({ error: "Idea not found" }, { status: 404 });
      ideaData = serializeIdea(idea);
    } else {
      return NextResponse.json({ error: "ideaId or customIdeaId required" }, { status: 400 });
    }

    let trendInfo = "";
    if (ideaData.category) {
      const trend = await prisma.trendCache.findFirst({ where: { description: ideaData.category } });
      if (trend) trendInfo = `トレンドスコア: ${trend.totalScore}点（${trend.momentum}）`;
    }

    const ideaContext = [
      `サービス名: ${ideaData.serviceName}`,
      `コンセプト: ${ideaData.concept}`,
      `ターゲット: ${ideaData.target}`,
      `課題: ${ideaData.problem || "未定義"}`,
      `プロダクト: ${ideaData.product || "未定義"}`,
      `競合: ${ideaData.competitors || "未定義"}`,
      `収益モデル: ${ideaData.revenueModel || "未定義"}`,
      `競合優位性: ${ideaData.competitiveEdge || "未定義"}`,
      trendInfo,
    ].filter(Boolean).join("\n");

    // Step 1: Web検索でリサーチ
    const researchMsg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      tools: [{ type: "web_search_20250305" as any, name: "web_search" }],
      messages: [{
        role: "user",
        content: `以下のビジネスアイデアについて、Web検索でリサーチしてください。

${ideaContext}

以下の3つを調べて、見つかった事実とURLをまとめてください:
1. 市場規模・成長率・関連する統計データ
2. 競合企業の公式サイトURL・サービス内容・料金
3. 類似ビジネスモデルの事例・価格設定

見つからなかった情報は正直に「見つからなかった」と書いてください。`,
      }],
    });
    const research = getTextFromMessage(researchMsg);
    const webSources = extractWebSources(researchMsg);
    const verifiedUrlList = webSources.map((s) => `- ${s.title}: ${s.url}`).join("\n");

    // Step 2: プラン生成
    const planMsg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [{
        role: "user",
        content: `あなたはトップレベルのビジネスコンサルタントです。
以下のアイデアと、Web検索で収集したリサーチ結果をもとに、ビジネスプランを作成してください。

## アイデア
${ideaContext}
${customNote ? `\nカスタマイズ要望: ${customNote}` : ""}

## Web検索リサーチ結果
${research}

## Web検索で取得された実在URL一覧（これ以外のURLは使用禁止）
${verifiedUrlList || "（検索結果からURLが取得できませんでした）"}

## 絶対厳守ルール
1. 出典URLは上記の「実在URL一覧」に含まれるもののみ使用してください。一覧にないURLは絶対に使わないでください。空文字""にしてください。
2. リサーチで見つからなかったデータは「データなし」と正直に書いてください。
3. 出典のurlはリサーチ結果にあったURLのみ。なければ空文字""にしてください。
4. 競合企業のurlはリサーチで見つかった公式サイトURLのみ。

以下のJSON形式のみを返してください:
{
  "serviceName": "${ideaData.serviceName}",
  "leanCanvas": {
    "problem": "課題3つ/区切り",
    "solution": "解決策3つ/区切り",
    "uniqueValue": "独自の価値提案",
    "customerSegments": "顧客セグメント",
    "channels": "チャネル",
    "revenueStreams": "収益の流れ",
    "costStructure": "コスト構造",
    "keyMetrics": "主要指標3つ/区切り",
    "unfairAdvantage": "模倣困難な優位性"
  },
  "executiveSummary": "3-4文で事業概要",
  "marketAnalysis": {
    "overview": "市場概況",
    "tam": "TAM",
    "sam": "SAM",
    "som": "SOM",
    "trends": "トレンド/区切り",
    "sources": [{ "label": "出典名", "url": "リサーチ結果のURLのみ" }]
  },
  "competitorAnalysis": {
    "overview": "競合概要",
    "competitors": [{ "name": "企業名", "strength": "強み", "weakness": "弱み", "url": "リサーチで見つかった公式URL" }],
    "positioning": "ポジショニング",
    "sources": [{ "label": "出典名", "url": "URL" }]
  },
  "businessModel": {
    "revenueModel": "収益モデル",
    "pricing": "価格設定",
    "unitEconomics": "ユニットエコノミクス",
    "sources": [{ "label": "出典名", "url": "URL" }]
  },
  "roadmap": [
    { "phase": "Phase 1（0-3ヶ月）", "goals": "目標", "actions": "アクション/区切り", "kpi": "KPI" },
    { "phase": "Phase 2（3-6ヶ月）", "goals": "目標", "actions": "アクション/区切り", "kpi": "KPI" },
    { "phase": "Phase 3（6-12ヶ月）", "goals": "目標", "actions": "アクション/区切り", "kpi": "KPI" }
  ],
  "risks": [{ "risk": "リスク", "impact": "高/中/低", "mitigation": "対策" }],
  "factCheckNotes": ["リサーチで確認できなかった点や推計値の注記"]
}`,
      }],
    });

    if (planMsg.stop_reason !== "end_turn") {
      return NextResponse.json({ error: "AIの応答が途中で切れました。再度お試しください。" }, { status: 500 });
    }

    const planText = getTextFromMessage(planMsg);
    const plan = extractJSON(planText);
    if (!plan) {
      console.error("AI bizplan: JSON parse failed. Raw:", planText.substring(0, 500));
      return NextResponse.json({ error: "プラン生成の解析に失敗しました。再度お試しください。" }, { status: 500 });
    }

    // 使用記録
    await recordAiUsage(rateId, "ai-bizplan");

    // Save to DB
    const bizPlan = await prisma.businessPlan.create({
      data: {
        userId: sessionId,
        authUserId,
        ideaId: customIdeaId ? null : ideaId,
        customIdeaId: customIdeaId || null,
        content: plan,
      },
    });

    return NextResponse.json({ id: bizPlan.id, ...plan, remaining });
  } catch (error: any) {
    console.error("AI bizplan error:", error?.message, error?.status, error?.error);
    const msg = error?.error?.message || error?.message || "不明なエラー";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
