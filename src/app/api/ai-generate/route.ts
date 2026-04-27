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
以下の5人のターゲットペルソナのうち少なくとも1人が「これ、今すぐ使いたい」と感じるレベルの
具体性・切実さを持つアイデアを生成してください。

【ターゲットペルソナ】
- 田中翔太（32歳・副業SE）: 難易度低〜中・技術スタック明快・初期投資200万円以内の案件を探している
- 鈴木美咲（35歳・大手メーカー新規事業担当）: 市場の客観データ・競合の弱点・スコア根拠が明確なB2B案件
- 山田健一（42歳・連続起業家）: novelty・moatが高く、レッドオーシャンでない成長余地のある領域
- 佐藤あかり（24歳・新卒起業志望）: 社会課題解決・Z世代共感テーマ・理解しやすいコンセプト
- 中村誠（55歳・地方中小経営者）: 既存事業の延長線上・行政連携・低難易度で今期から動ける案件

【有望なアイデアの条件】
1. 課題の切実さ: 「なんとなく不便」ではなく「今すぐ解決しないと損失が出る」レベルの痛み
2. タイミングの必然性: 規制変化・技術転換・行動変容のうち最低2つが今この瞬間に交差している
3. 競合の一点突破: 競合が解決できていない「たった1つの弱点」に完全特化する
4. 収益の単純明快さ: 「誰が・何に・いくら払うか」が3秒で説明できる
5. 参入障壁の具体性: 「データ蓄積」「ネットワーク効果」「規制対応ノウハウ」等の具体的なモートがある

【禁止事項】
- 根拠不明の具体的数値（「〇〇%」「〇〇万人」）の使用。規模感は「数十万社規模」「数千億円規模」等の定性表現で書く
- 全スコアを同一値にする（全部3・全部4はNG。最高値と最低値の差は必ず1ポイント以上）
- 「〇〇市場は拡大中」のみで成長根拠とする（何が・なぜ・いつから・どれくらい変化するかを示す）
- JSON フィールドの値に指示文・説明文をそのまま入れる（実際のコンテンツを書くこと）

必ず JSON のみを返答してください。余分なテキストは一切不要です。`;

    // フィールド説明（JSON外。値に混入させないための分離）
    const fieldGuide = `
## 各フィールドの記述指針

serviceName: 事業タイプ×ターゲットでトーンを選ぶ（B2B→英語, 消費者→日本語, Z世代→造語）
oneLiner: 20〜40文字。「[誰の][何の課題を][どう解決]」の構造。抽象フレーズ禁止
concept: 100〜180文字。①何をするか②仕組み③ユーザーが得る具体的価値の3要素を含む
target: 年齢・職種・会社規模・置かれた状況まで具体的に（例: 従業員20〜200名の建設会社・現場監督）
problem: 80〜150文字。①現状の痛みの具体的状況 ②なぜ今の手段では解決できないか の2点を含む
product: 3〜6項目の改行区切り。各項目は「機能名（具体的な動作説明）」の形式
revenueModel: 2〜4パターン。「誰が・何に・いくら払うか」を明示（例: 月額SaaS 従業員数課金 50人まで2万円〜）
competitors: 実在する3〜5社のサービス名のみ。架空企業・「大手各社」等の一般化禁止
competitiveEdge: 競合名を1社以上名指しし「なぜその競合では解決できないか」を具体的に
scoreComments.novelty: 既存サービスとの差別化の根拠を市場シグナルから引用
scoreComments.marketSize: 対象顧客の規模感を定性表現で（確認できる数値がある場合のみ引用可）
scoreComments.profitability: 単価×想定顧客数の概算試算を含む
scoreComments.growth: 追い風となる規制・技術・行動変容を1つ特定して説明
scoreComments.feasibility: 技術・資金・人材・規制の観点から実現難易度を評価
scoreComments.moat: 具体的な参入障壁（データ蓄積・ネットワーク効果・資格・許認可・スイッチングコスト）
whyNow: 2文の散文。規制変化・技術転換・行動変容のうち最低2つが交差する「今」の必然性を書く
noveltyNote: 2文の散文。「競合〇〇は〜だが、〜という点が存在しない」の対比構造で解法の新規性を書く
strengthNote: 2文の散文。なぜ持続的に競合優位を維持できるか（模倣困難な理由）を収益・データ・関係性の観点で書く
patternRationale: 2文の散文。選択パターンが事業のどの部分を担い、互いにどう補完・増幅するかを書く`;

    const phase2UserPrompt = `## 調査済み市場シグナル
${phase1Text}

## 生成テーマ
${theme}${hintSection}

## 使用可能なパターン一覧（74種類）
${PATTERN_REFERENCE}

${fieldGuide}

## 出力制約（必ず守ること）
- category は以下から必ず1つ:  ${CATEGORY_VALUES}
- targetIndustry は以下から必ず1つ:  ${INDUSTRY_VALUES}
- targetCustomer は以下から必ず1つ:  ${CUSTOMER_VALUES}
- investmentScale は以下から必ず1つ:  ${SCALE_VALUES}
- difficulty: 低 / 中 / 高 のいずれか
- scores: 各値は1〜5の整数、全項目同一値は禁止（最高値－最低値 ≥ 1）
- patterns: 上記パターンIDを2〜3個

## 出力フォーマット（JSONのみ・余分なテキスト禁止）

\`\`\`json
{
  "serviceName": "",
  "oneLiner": "",
  "concept": "",
  "target": "",
  "problem": "",
  "product": "",
  "revenueModel": "",
  "competitors": "",
  "competitiveEdge": "",
  "tags": ["", "", "", ""],
  "category": "",
  "targetIndustry": "",
  "targetCustomer": "",
  "investmentScale": "",
  "difficulty": "",
  "scores": {
    "novelty": 0,
    "marketSize": 0,
    "profitability": 0,
    "growth": 0,
    "feasibility": 0,
    "moat": 0
  },
  "scoreComments": {
    "novelty": "",
    "marketSize": "",
    "profitability": "",
    "growth": "",
    "feasibility": "",
    "moat": ""
  },
  "trendKeywords": ["", "", ""],
  "patterns": ["", ""],
  "whyNow": "",
  "noveltyNote": "",
  "strengthNote": "",
  "patternRationale": ""
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

    // ── Phase 3: ファクトチェック + 修正 ────────────────────────────────────────
    // learnings.md のパターン A〜P に基づきハルシネーションを自動排除する

    const phase3SystemPrompt = `あなたはビジネスアイデアのファクトチェック専門家です。
web_search ツールを使って各事実を確認し、誤りを修正した完全な JSON のみを返してください。
余分なテキストは一切不要です。

## 確認・修正ルール（優先順）
1. **competitors（最優先）**: 記載の全サービスを検索し、廃止・サービス終了済みのものは削除する
2. **具体的数値**（%・万人・億円・件数）: 一次ソースで根拠確認。見つからなければ定性表現に変換（「〇〇%」→「多くの」等）
3. **「義務化」「必須」「唯一」「急増」「最大」「世界初」「業界初」**: 根拠確認。過剰ならトーンダウン（「努力義務」「最有力候補のひとつ」等）
4. **法律・制度の施行年月・適用範囲**: 官公庁の一次情報で確認。任意適用を「義務化」と書いている誤記を修正する
5. **競合の料金・機能の現状**: 公式サイト等で確認。陳腐化していれば更新する
6. **competitors の文脈適合性**: サービスの対象商材・顧客層が本アイデアと一致するか確認。不一致なら除外

## 修正判定
- 根拠確認できた記述 → そのまま維持
- 反証が見つかった記述 → 正しい情報に修正
- 根拠が見つからない具体的数値 → 定性表現に変換
- 廃止済み競合 → competitors から削除（残り競合数が2社未満になる場合は現存の代替競合を1社補完可）
- 「義務化」等の誇張 → 実態に即した表現に修正

検索なしの推測修正は禁止です。必ず web_search で確認してから判断してください。`;

    const phase3UserPrompt = `以下のビジネスアイデアをファクトチェックし、誤りを修正した最終版の完全な JSON を返してください。

## 確認の優先順位
1. competitors の全サービスが現在も稼働中か（各サービスを個別に検索すること）
2. problem・scoreComments・whyNow 内の具体的な数値・統計の根拠
3. 「義務化」「唯一」「急増」等の強い表現の根拠
4. competitiveEdge で言及する競合の現在の料金・機能

## ファクトチェック対象 JSON
\`\`\`json
${JSON.stringify(ideaData, null, 2)}
\`\`\`

修正が不要な場合も、同一 JSON をそのまま返してください。`;

    const phase3 = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 5000,
      system: phase3SystemPrompt,
      tools: [{ type: "web_search_20250305" as const, name: "web_search" }],
      messages: [{ role: "user", content: phase3UserPrompt }],
    });

    const phase3Text = getTextFromContent(phase3.content);
    const checkedIdea = extractJSON(phase3Text) ?? ideaData;

    // レート制限記録
    await recordAiUsage(sessionId, "ai-generate");

    // GenerationLog に記録（学習データ蓄積）
    const genLog = await prisma.generationLog.create({
      data: {
        sessionId,
        theme,
        hint: hint ?? null,
        patterns: checkedIdea.patterns ?? [],
        newsSourceUrls: newsSources.slice(0, 5).map((s) => s.url),
      },
    });

    const result: GeneratedIdea = {
      ...checkedIdea,
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
