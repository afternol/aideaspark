import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkAiRateLimit, recordAiUsage } from "@/lib/ai-rate-limit";
import { formatPatternsForPrompt } from "@/lib/patterns";
import { CATEGORIES, TARGET_INDUSTRIES, TARGET_CUSTOMERS, INVESTMENT_SCALES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

// ── 型 ───────────────────────────────────────────────────────────────────────

export interface GeneratedIdea {
  serviceName: string;
  oneLiner: string;
  concept: string;
  target: string;
  problem: string;
  product: string;
  revenueModel: string;
  competitors: string;
  competitiveEdge: string;
  tags: string[];
  category: string;
  targetIndustry: string;
  targetCustomer: string;
  investmentScale: string;
  difficulty: "低" | "中" | "高";
  scores: {
    novelty: number;
    marketSize: number;
    profitability: number;
    growth: number;
    feasibility: number;
    moat: number;
  };
  scoreComments: {
    novelty: string;
    marketSize: string;
    profitability: string;
    growth: string;
    feasibility: string;
    moat: string;
  };
  trendKeywords: string[];
  patterns: string[];
  // ── 4つの新規インサイトフィールド ──
  whyNow: string;
  noveltyNote: string;
  strengthNote: string;
  patternRationale: string;
  // ── 生成メタ情報 ──
  newsSources: { title: string; url: string; summary: string }[];
}

// ── ユーティリティ ────────────────────────────────────────────────────────────

function extractJSON(text: string): any {
  const cleaned = text.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch {}
  return null;
}

function getTextFromContent(content: any[]): string {
  return content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");
}

function extractNewsSources(content: any[]): { title: string; url: string; summary: string }[] {
  const sources: { title: string; url: string; summary: string }[] = [];
  for (const block of content) {
    if (block.type === "web_search_tool_result") {
      for (const result of block.content || []) {
        if (result.type === "web_search_result" && result.url) {
          sources.push({
            title: result.title || "",
            url: result.url,
            summary: (result.encrypted_content ?? result.content ?? "").slice(0, 200),
          });
        }
      }
    }
  }
  return sources;
}

// ── 定数リスト（プロンプト用） ───────────────────────────────────────────────

const CATEGORY_VALUES   = CATEGORIES.map((c) => c.value).join(" / ");
const INDUSTRY_VALUES   = TARGET_INDUSTRIES.map((i) => i.value).join(" / ");
const CUSTOMER_VALUES   = TARGET_CUSTOMERS.map((c) => c.value).join(" / ");
const SCALE_VALUES      = INVESTMENT_SCALES.join(" / ");
const PATTERN_REFERENCE = formatPatternsForPrompt();

// ── ハンドラ ─────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const { theme, sessionId, hint } = await request.json() as {
      theme: string;       // 生成テーマ・方向性（必須）
      sessionId: string;   // レート制限用（必須）
      hint?: string;       // 追加ヒント（category/industry/customer/patternなど任意）
    };

    if (!theme?.trim())    return NextResponse.json({ error: "theme は必須です" }, { status: 400 });
    if (!sessionId?.trim()) return NextResponse.json({ error: "sessionId は必須です" }, { status: 400 });

    // レート制限チェック
    const { allowed, remaining, resetIn } = await checkAiRateLimit(sessionId, "ai-generate");
    if (!allowed) {
      return NextResponse.json(
        { error: `アイデア生成の利用上限（24時間3回）に達しました。${resetIn}にリセットされます。` },
        { status: 429 }
      );
    }

    const anthropic = new Anthropic();

    // ── Phase 1: 最新ニュース・シグナルを検索 ────────────────────────────────

    const searchQuery = `${theme} 日本 市場 トレンド 2025 2026 ニュース 規制 新興`;

    const phase1 = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [
        {
          role: "user",
          content: `以下のテーマについて、日本市場の最新動向を調査してください。

テーマ: ${theme}

以下の情報を優先的に収集してください：
1. 関連する規制変化・法改正（2024〜2026年）
2. 市場規模データや成長率
3. 新技術・サービスの台頭
4. 消費者・企業の行動変容
5. 海外での成功事例（日本未上陸のもの）

必ず日本語の最新記事（2024〜2026年）を3件以上検索してください。`,
        },
      ],
    });

    const newsSources = extractNewsSources(phase1.content);
    const phase1Text = getTextFromContent(phase1.content);

    // ── Phase 2: アイデア生成 ────────────────────────────────────────────────

    const hintSection = hint ? `\n追加ヒント（可能な限り反映）: ${hint}` : "";

    const phase2SystemPrompt = `あなたは日本市場向け新規事業アイデアの生成エキスパートです。
調査した市場シグナルを根拠に、具体性・新規性・実現可能性を兼ね備えたビジネスアイデアを生成します。
必ず指定された JSON フォーマットのみを返答してください。余分なテキストは一切不要です。`;

    const phase2UserPrompt = `## 調査済み市場シグナル
${phase1Text}

## 生成テーマ
${theme}${hintSection}

## 使用可能なパターン一覧（74種類）
${PATTERN_REFERENCE}

## 制約（必ず守ること）
- category は以下から必ず1つ選ぶ:
  ${CATEGORY_VALUES}
- targetIndustry は以下から必ず1つ選ぶ:
  ${INDUSTRY_VALUES}
- targetCustomer は以下から必ず1つ選ぶ:
  ${CUSTOMER_VALUES}
- investmentScale は以下から必ず1つ選ぶ:
  ${SCALE_VALUES}
- difficulty は 低 / 中 / 高 のいずれか
- scores の各値は 1〜5 の整数
- patterns は上記パターン一覧のIDを2〜3個（例: ["A-2", "F-1"]）

## 出力フォーマット（JSONのみ）

\`\`\`json
{
  "serviceName": "サービス名（英数字・カタカナ混在可）",
  "oneLiner": "20字以内の一言説明",
  "concept": "200字以内のコンセプト",
  "target": "具体的なターゲットペルソナ（年齢・職種・規模など）",
  "problem": "解決する課題（痛みの深さ・頻度・現状の代替手段とその限界）",
  "product": "プロダクト・機能一覧（改行区切り）",
  "revenueModel": "収益モデル一覧（改行区切り、金額・料率を含む）",
  "competitors": "競合サービス名（カンマ区切り）",
  "competitiveEdge": "競合優位性（なぜ既存サービスではダメか）",
  "tags": ["タグ1", "タグ2", "タグ3", "タグ4"],
  "category": "上記リストから選択",
  "targetIndustry": "上記リストから選択",
  "targetCustomer": "上記リストから選択",
  "investmentScale": "上記リストから選択",
  "difficulty": "低 or 中 or 高",
  "scores": {
    "novelty": 4,
    "marketSize": 3,
    "profitability": 4,
    "growth": 5,
    "feasibility": 3,
    "moat": 3
  },
  "scoreComments": {
    "novelty": "新規性の根拠（市場シグナルを引用して説明）",
    "marketSize": "市場規模の根拠（具体的な数値・データを含む）",
    "profitability": "収益性の説明（単価・利益率の試算）",
    "growth": "成長性の根拠（規制・技術・行動変容のうち何が追い風か）",
    "feasibility": "実現可能性の評価（技術・人材・資金の観点）",
    "moat": "参入障壁の説明（どのようにして競合を寄せ付けないか）"
  },
  "trendKeywords": ["キーワード1", "キーワード2", "キーワード3"],
  "patterns": ["X-N", "Y-M"],

  "whyNow": "なぜ今このビジネスが成立するのか、2文の文章で説明する。具体的な規制変化・技術転換点・行動変容を1つ引用し、数値や事実を文中に織り込む。箇条書き不可。",

  "noveltyNote": "既存サービスと何が根本的に違うのか、2文で説明する。「〇〇は存在するが△△という点が存在しない」という構造で、解法の新規性を端的に述べる。箇条書き不可。",

  "strengthNote": "このビジネスの最大の強みを2文で説明する。収益構造・参入障壁・ネットワーク効果など具体的な強みを述べる。箇条書き不可。",

  "patternRationale": "選択したパターンをなぜこの組み合わせにしたか。各パターンが事業のどの部分を担い互いに補完・増幅するかを2文で説明する。"
}
\`\`\``;

    const phase2 = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: phase2SystemPrompt,
      messages: [{ role: "user", content: phase2UserPrompt }],
    });

    const rawText = getTextFromContent(phase2.content);
    const ideaData = extractJSON(rawText);

    if (!ideaData) {
      return NextResponse.json({ error: "アイデア生成に失敗しました。再度お試しください。" }, { status: 500 });
    }

    // レート制限記録
    await recordAiUsage(sessionId, "ai-generate");

    // GenerationLog に記録（学習データ蓄積）
    const genLog = await prisma.generationLog.create({
      data: {
        sessionId,
        theme,
        hint: hint ?? null,
        patterns: ideaData.patterns ?? [],
        newsSourceUrls: newsSources.slice(0, 5).map((s) => s.url),
      },
    });

    const result: GeneratedIdea = {
      ...ideaData,
      newsSources: newsSources.slice(0, 5),
    };

    return NextResponse.json({
      idea: result,
      generationLogId: genLog.id,
      remaining: remaining - 1,
    });

  } catch (err) {
    console.error("[ai-generate]", err);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
