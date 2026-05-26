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

    // ── Phase 1: 最新ニュース・シグナルと国産競合を検索 ─────────────────────

    const phase1 = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [
        {
          role: "user",
          content: `以下のテーマについて、日本市場の最新動向と既存サービスを調査してください。

テーマ: ${theme}

【調査1】市場動向（日本語の最新記事2024〜2026年を3件以上検索）
1. 関連する規制変化・法改正（2024〜2026年）とその施行日・適用範囲
2. 市場規模データや成長率（出典機関・調査年を明記）
3. 新技術・サービスの台頭
4. 消費者・企業の行動変容
5. 海外での成功事例（日本未上陸のもの）

【調査2】国産競合の徹底調査（日本語で検索すること）
「${theme} サービス 日本 スタートアップ」「${theme} SaaS 国産 2024 2025」で検索し、
すでに存在する日本国内の類似サービスを5社以上リストアップしてください。
英語圏情報だけでは国産SaaSが見落とされるため、必ず日本語で検索してください。

【重要】以下のことを報告してください：
- 国産競合の社名・サービス名・URL・特徴・料金（分かる範囲で）
- 各競合がどのニーズをどう解決しているか
- 既存プレイヤーが解決できていない「空白領域」があるか`,
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

【新規性創出の思考フレーム（JSON生成前に必ずこのプロセスを実行すること）】

ステップ1：競合の「共通仮定」を特定する
調査済み競合各社が全員採用している前提を以下の4軸で確認する：
- 誰に売るか（顧客セグメント：患者・医師・企業担当者・農家、など）
- 何を売るか（価値提供の形：情報提供・ツール・代行・マッチング、など）
- どう課金するか（収益モデル：月額SaaS・従量課金・手数料・広告、など）
- どこで届けるか（流通チャネル：自社営業・プラットフォーム・代理店・行政、など）

ステップ2：最も逆転余地のある仮定を1つ選んで崩す
たとえば：
- 「医師・施設向け」→ 「患者・生活者向け」または逆
- 「月額SaaS（道具売り）」→ 「成果報酬・従量課金（結果売り）」
- 「汎用ツール」→ 「特定疾患・特定職種への超特化」
- 「B2B直販」→ 「B2B2C（顧客の顧客へ届ける）」
- 「デジタル完結」→ 「専門家の人的サービス×デジタル支援のハイブリッド」

ステップ3：異業界アナロジーを一つ適用する（必須）
別業界で成功したモデルを、このテーマに転用して差別化を生む：
- 例：「Stripe（開発者APIファースト）× 医療費精算 → 医師向けAPIで電子カルテ会社が組み込める決済」
- 例：「Duolingo（ゲーミフィケーション×継続）× 服薬管理 → 習慣形成ゲームで服薬率を高める」
- 例：「Airbnb（遊休資産の流通）× 農機シェア → 農繁期だけ機械を借りられる農家向けマーケット」
- 例：「Slack（チャンネル型コミュニケーション）× 農産物産地情報 → バイヤー×農家のリアルタイム取引チャンネル」

このフレームで生み出したアイデアは、競合とは「誰に・何を・どう」の少なくとも1つが根本的に異なるはず。
その差異を必ず competitors・competitiveEdge・noveltyNote に明示すること。

【有望なアイデアの条件】
1. 課題の切実さ: 「なんとなく不便」ではなく「今すぐ解決しないと損失が出る」レベルの痛み
2. タイミングの必然性: 規制変化・技術転換・行動変容のうち最低2つが今この瞬間に交差している
3. 競合の一点突破: 競合が解決できていない「たった1つの弱点」に完全特化する
4. 収益の単純明快さ: 「誰が・何に・いくら払うか」が3秒で説明できる
5. 参入障壁の具体性: 「データ蓄積」「ネットワーク効果」「規制対応ノウハウ」等の具体的なモートがある

【スコアリングの厳格な基準（必ず守ること）】
novelty（新規性）の採点ルール:
- 「AIを使う」「〇〇×DX」という組み合わせだけで、顧客・提供形式・収益モデルが競合と同じ → 最大2点
- 競合と同じテーマでも、上記ステップ2の仮定逆転や異業界アナロジーが反映されている → 3〜4点
- 顧客・提供形式・収益モデルの2軸以上で既存競合と明確に異なる → 4〜5点
moat（参入障壁）の採点ルール:
- 公的データ・汎用API中心の設計 → 最大3点（競合が同じデータを使えるため）
- 固有データ蓄積＋ネットワーク効果＋規制対応ノウハウのうち2つ以上 → 4点以上可
- 「電子カルテ連携」「自治体導入実績」等の構造的ロックインがある → 4〜5点
feasibility（実現可能性）の採点ルール:
- 医療・介護・金融・教育など規制産業で法的リスクが未解決 → 最大3点
- 薬機法・個人情報保護法・金商法等の適用可能性がある場合は必ずコメントに記載

【未確認情報の表現ルール（断定的表現の抑制）】
whyNow・noveltyNote・competitiveEdge・scoreComments に書く情報は2種類に分かれる：
- Phase 1のWebSearch結果で確認できた情報 → 断定形で書いてよい（「〇〇法が〇〇年に施行された」等）
- 確認できていない仮説・推測 → 必ず「〜と考えられる」「〜の可能性がある」「〜が期待される」等の不確実性表現を使う
競合の料金・機能情報は「公開情報として確認した範囲では」を前置きする。

【インサイトカード3項目の最重要ルール】
- whyNow / noveltyNote / strengthNote は各45〜60字・1文のみ
- WebSearchで確認した最新の公開情報・現存競合・実際の仕組みに基づく事実だけを書く
- 根拠が確認できない数値・法令名・競合差分・優位性は書かない
- 「存在しない」「空白地帯」「国内初」「唯一」「急増」などの未検証断定は禁止

【絶対禁止表現】
- 「国内初」「業界初」「世界初」（事実確認できないため）
- 「〇〇はほぼ存在しない」「この領域は空白地帯」（調査不足の断言）
- 「担任負担ゼロ」「完全自動化」「100%対応」（実現不可能な誇張）
- 「〇〇補助金の対象」「補助金を活用できる」（要件未確認の断言）
- 実在する競合サービス・企業へのネガティブな表現（関係悪化・訴訟リスクのため）
  NG例: 「●●の提供に留まる」「●●止まり」「●●が不足」「●●では解決できない」「●●には制約がある」「●●が劣る」
  OK例: 「●●が●●を中心としているのに対し、本サービスは●●という異なるアプローチを採用」

【パターンタグの整合性ルール】
- 選択するパターンIDはアイデアの収益構造・価値提供の核心に一致させる
- 収益モデルが月額SaaSなのに「アウトカム課金」タグは禁止
- 国内向けBtoBなのに「クロスボーダーEC」タグは禁止
- patternRationaleに「パターンXはこのアイデアの○○を担い、パターンYは○○を強化する」と具体的に書く

【収益モデルの現実的単価設定】
- 競合の公開料金帯と比較し、初回参入時の単価は競合と同等〜やや安めを基本とする
- B2G（学校・自治体・医療機関）向けは購買プロセス（入札・年度予算）を考慮した表現にする
- B2C月額料金は3,000〜5,000円が国内実績バンドの中央値。根拠なく1万円超を設定しない

【禁止事項】
- 根拠不明の具体的数値（「〇〇%」「〇〇万人」）→ 定性表現で書く
- 全スコアを同一値にする（最高値と最低値の差は必ず1ポイント以上）
- 「〇〇市場は拡大中」のみで成長根拠とする
- JSON フィールドの値に指示文・説明文をそのまま入れる

必ず JSON のみを返答してください。余分なテキストは一切不要です。`;

    // フィールド説明（JSON外。値に混入させないための分離）
    const fieldGuide = `
## 各フィールドの記述指針と字数上限（必ず守ること）

serviceName: 事業タイプ×ターゲットでトーンを選ぶ（B2B→英語, 消費者→日本語, Z世代→造語）
oneLiner: 20〜40字。「[誰の][何の課題を][どう解決]」の構造。抽象フレーズ禁止
concept: 60〜80字以内。①何をするか②仕組み③ユーザーが得る具体的価値の3要素を1〜2文で
target: 40〜60字以内。年齢・職種・会社規模・置かれた状況まで具体的に
problem: 60〜80字以内。①現状の痛みの状況 ②なぜ今の手段では解決できないか の2点を含む
product: 3〜5項目の箇条書き（改行区切り）。各項目は「機能名（動作説明）」の形式・各行30字以内
revenueModel: 2〜3パターン（改行区切り）。各行「誰が・何に・いくら払うか」を40字以内で
competitors: 実在する3〜5社のサービス名のみ。架空企業・「大手各社」等の一般化禁止。Phase1で調査した国産競合を必ず含める
competitiveEdge: 80字以内。競合名を1社挙げ「●●が●●を中心としているのに対し、本サービスは●●という異なるアプローチ」の構造で
scoreComments.novelty: 50字以内。国産サービス名を1社挙げ、具体的な差別化軸を述べる
scoreComments.marketSize: 50字以内。対象顧客の規模感を定性表現で（出典付き数値がある場合のみ使用可）
scoreComments.profitability: 50字以内。単価と想定顧客数の概算を含む
scoreComments.growth: 50字以内。追い風となる規制・技術・行動変容を1つ特定して説明
scoreComments.feasibility: 50字以内。技術・規制の観点から評価。規制産業は適用リスクを言及
scoreComments.moat: 50字以内。具体的な参入障壁。公的データ中心なら「模倣可能性あり」と記載
whyNow: 45〜60字・1文。WebSearchで確認した最新の法令・統計・市場変化だけで「今」の理由を書く
noveltyNote: 45〜60字・1文。現存競合との確認済み差分だけを書く。「存在しない」「空白地帯」は禁止
strengthNote: 45〜60字・1文。確認済みの仕組み・データ蓄積・収益構造から説明できる強みだけを書く
patternRationale: 80字以内・2文。選択したパターンIDがこのアイデアのどの仕組みに対応しているかを具体的に`;

    const phase2UserPrompt = `## 生成テーマ
${theme}${hintSection}

## 調査済み市場シグナルと国産競合情報
${phase1Text}

## アイデア生成の手順（この順番で行うこと）

### 手順1: 競合の共通仮定を分析する
上記の競合情報から、既存サービスが「全員採用している前提」を特定する：
- 全員が同じ顧客層を対象にしているか？
- 全員が同じ価値提供形式（ツール提供 or 代行 or マッチング）か？
- 全員が同じ課金方法（月額SaaS or 手数料 or 従量課金）か？

### 手順2: 逆転できる仮定を1つ選ぶ
最も逆転余地がある仮定を選び、それを崩したらどんなサービスになるかを考える。
この「仮定の逆転」が noveltyNote の核心になる。

### 手順3: 異業界アナロジーを1つ適用する
別業界の成功モデルをこのテーマに転用して差別化軸を生む。

### 手順4: 手順2・3から得た着想でJSONを生成する
競合と明確に異なる「誰に・何を・どう」を持つアイデアを構築する。
noveltyNote には「〇〇（競合名）が〜を中心としているのに対し、本サービスは〜という異なるアプローチを採用している」と書く。

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
- patterns: 上記パターン一覧から **ID形式**（例: "A-2", "B-6"）を2〜3個。パターン名（日本語）を入れるのは禁止

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
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: phase2SystemPrompt,
      messages: [{ role: "user", content: phase2UserPrompt }],
    });

    const rawText = getTextFromContent(phase2.content);
    const ideaData = extractJSON(rawText);

    if (!ideaData) {
      return NextResponse.json({ error: "アイデア生成に失敗しました。再度お試しください。" }, { status: 500 });
    }

    // ── Phase 3: ファクトチェック + スコア校正 + パターン整合性確認 ──────────────
    // 評価フィードバックに基づく強化版（2026-04-28）

    const phase3SystemPrompt = `あなたはビジネスアイデアのファクトチェック・品質校正の専門家です。
web_search ツールを使って各事実を確認し、誤りを修正した完全な JSON のみを返してください。
余分なテキストは一切不要です。

## 確認・修正ルール（優先順）

### グループ1: 競合・サービス情報（最優先）
1. **competitors（最優先）**: 記載の全サービスを検索し、廃止・サービス終了済みのものは削除する
2. **国産競合の追加調査**: 「{serviceName類似} 日本 サービス 2024 2025」を日本語で検索し、competitors に載っていない重要な国産競合が存在する場合は追記する（最大5社）
3. **competitors の文脈適合性**: サービスの対象商材・顧客層がこのアイデアと一致するか確認。業種・顧客層が異なる場合は除外する

### グループ2: 数値・統計
4. **具体的数値**（%・万人・億円・件数）: 一次ソースで根拠確認。見つからなければ定性表現に変換（「〇〇%」→「多くの」等）
5. **市場規模・統計**: 「○○年○○調査」という出典形式で確認。調査年と対象年のずれがないか確認する

### グループ3: 法令・制度
6. **「義務化」「必須」「唯一」「急増」「最大」「世界初」「業界初」「国内初」**: 必ずWebSearchで根拠確認。反証が見つかれば「努力義務」「最有力候補のひとつ」等にトーンダウン
7. **法律・制度の施行年月・適用範囲**: 官公庁の一次情報で確認。成立日と施行日・適用開始日は別物（特に税制・医療・食品規制）
8. **「〇〇補助金の対象」**: 補助金の正式名称・要件をWebSearchで確認。要件が不明な場合は「補助金活用の可能性がある」に修正

### グループ4: スコア・評価の適正化
9. **novelty スコアの検証**: 「{serviceName} 類似 国内 競合」を検索し、類似サービスが3社以上見つかれば novelty を3以下に修正する。「既存にない」「空白地帯」という記述もあわせて修正する
10. **moat スコアの検証**: 競合優位性が「公的データ活用」「汎用API連携」が中心であれば moat を3以下に修正する（競合も同じデータを使えるため）
11. **feasibility スコアの検証**: 医療・介護・金融・教育等の規制産業でリスクが未解消であれば feasibility を3以下に維持する
12. **スコア平均の確認**: 全6スコアの平均が4.0を超えている場合、最も楽観的なスコアを1点下げて現実的な水準（平均3〜3.5）に調整する

### グループ5: パターンタグ整合性
13. **patterns の内容整合性**: 選択されたパターンIDが以下の誤用パターンに該当しないか確認する
    - 月額SaaS収益なのに「アウトカム課金」→ 削除し適切なパターンに変更
    - 国内向けBtoBなのに「クロスボーダーEC・コンテンツ流通」→ 削除
    - 規制変化がすでに数年前に施行済みなのに「規制変化の窓」→ 削除
    不整合パターンを削除し、アイデアの本質（収益構造・価値提供・競合優位性）に合致するパターンIDを補充する

### グループ6: インサイトカードの短文化・事実性
14. **whyNow / noveltyNote / strengthNote**: 各45〜60字・1文に圧縮する
15. **最新ファクト限定**: WebSearchで確認できた最新公開情報、現存競合、実際の仕組みに基づく記述だけ残す
16. **未確認断定の削除**: 根拠が取れない数値・法令名・競合差分・優位性は削除または定性表現に修正する

## 修正判定基準
- 根拠確認できた記述 → そのまま維持
- 反証が見つかった記述 → 正しい情報に修正
- 根拠が見つからない具体的数値 → 定性表現に変換
- 廃止済み競合 → competitors から削除（残り競合数が2社未満の場合は現存の代替競合を1社補充可）
- 「義務化」等の誇張 → 実態に即した表現に修正
- novelty・moat・feasibility が楽観的すぎる → 証拠に基づき引き下げ
- パターン不整合 → 削除して適切なIDに差し替え

検索なしの推測修正は禁止です。必ず web_search で確認してから判断してください。`;

    const phase3UserPrompt = `以下のビジネスアイデアをファクトチェックし、誤りを修正した最終版の完全な JSON を返してください。

## 確認の優先順位（この順番で実施すること）
1. competitors の全サービスを個別に検索 → 稼働中か・業種が合っているか確認
2. 「{serviceName}類似 日本 サービス」を日本語で検索 → 未記載の国産競合を発見したら追記
3. noveltyNote の「〇〇は存在しない」「空白地帯」という表現 → WebSearchで反証を探し、見つかれば表現を修正してnoveltyスコアを引き下げ
4. problem・scoreComments・whyNow 内の具体的な数値・統計 → 出典確認
5. 「義務化」「国内初」「補助金対象」等の強い表現 → WebSearchで根拠確認、反証があれば修正
6. competitiveEdge で言及する競合の現在の料金・機能 → 公式サイトで確認
7. patterns の内容がアイデアの収益構造・価値提供と一致するか → 不整合なら差し替え
8. whyNow / noveltyNote / strengthNote → 各45〜60字・1文、最新ファクトのみの短文に修正
9. 全スコアの平均 → 4.0超の場合は最も楽観的な1項目を1点引き下げ

## ファクトチェック対象 JSON
\`\`\`json
${JSON.stringify(ideaData, null, 2)}
\`\`\`

修正が不要な場合も、同一 JSON をそのまま返してください。`;

    const phase3 = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
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
