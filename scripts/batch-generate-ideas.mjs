/**
 * batch-generate-ideas.mjs
 * 使い方: node scripts/batch-generate-ideas.mjs --category SaaS --count 10 --start-id 21
 *        node scripts/batch-generate-ideas.mjs --phase 1            (Ph.1全カテゴリ)
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── フェーズ定義 ─────────────────────────────────────────────
const PHASES = {
  1: {
    name: "ビジネスモデル全般 + AI・データ",
    categories: [
      "SaaS", "D2C", "プラットフォーム", "マーケットプレイス", "サブスクリプション",
      "シェアリング", "アグリゲーター", "API", "BaaS", "バーティカルSaaS", "コミュニティ",
      "AI/ML", "生成AI", "AIエージェント", "音声AI", "画像・動画AI",
      "データ分析", "RPA・自動化", "AI SaaS", "チャットボット", "パーソナライズ",
    ],
    count: 10,
  },
  2: {
    name: "金融・決済 + 教育・人材",
    categories: [
      "フィンテック", "決済", "インシュアテック", "資産運用", "融資・レンディング",
      "会計・経理DX", "Web3・ブロックチェーン", "暗号資産",
      "EdTech", "リスキリング", "HR Tech", "採用テック",
      "タレントマネジメント", "コーチング・メンタリング", "語学学習", "資格・試験対策",
    ],
    count: 10,
  },
  3: {
    name: "ヘルスケア・ウェルネス + 生活・消費",
    categories: [
      "デジタルヘルス", "メンタルヘルス", "フェムテック", "スリープテック",
      "フィットネステック", "介護テック", "エイジテック", "予防医療", "ペットテック",
      "フードテック", "リテールテック", "プロップテック", "トラベルテック",
      "ファッションテック", "ビューティーテック", "家事代行・生活支援",
      "ローカルビジネス", "ギフト・EC",
    ],
    count: 10,
  },
  4: {
    name: "産業・インフラ + サステナビリティ",
    categories: [
      "モビリティ", "物流テック", "建設テック", "製造DX", "アグリテック",
      "エネルギーテック", "セキュリティ", "リーガルテック", "GovTech", "宇宙ビジネス",
      "カーボンテック", "サーキュラーエコノミー", "クリーンテック", "ESG・インパクト", "フードロス",
    ],
    count: 10,
  },
  5: {
    name: "エンタメ・クリエイター + 先端テクノロジー",
    categories: [
      "コンテンツ", "クリエイターエコノミー", "ゲーム・eスポーツ", "音楽テック",
      "動画・配信", "ファンコミュニティ", "メディア・出版", "ライブコマース",
      "XR・メタバース", "IoT", "ロボティクス", "量子コンピューティング",
      "ドローン", "3Dプリンティング", "デジタルツイン", "ノーコード・ローコード",
    ],
    count: 10,
  },
  6: {
    name: "斬新アイデア100件（多様カテゴリ横断）",
    categories: [
      "AIエージェント", "フィンテック", "EdTech", "デジタルヘルス", "フードテック",
      "アグリテック", "リーガルテック", "クリエイターエコノミー", "XR・メタバース", "ロボティクス",
    ],
    count: 10,
  },
};

// ── 74パターン定義（生成プロンプト用） ───────────────────────
const PATTERNS = [
  "A-1:JTBD分析", "A-2:ノンカスタマー分析", "A-3:アンダーサーブド探索",
  "A-4:破壊的イノベーション", "A-5:カスタマージャーニー最適化", "A-6:エスノグラフィック観察",
  "A-7:ペルソナ×シチュエーション交差", "A-8:スイッチングコスト設計",
  "B-1:先端技術の産業転用", "B-2:AIによるエキスパート代替", "B-3:センサー×IoTデータ化",
  "B-4:ブロックチェーン×トラスト", "B-5:生成AI×ワークフロー自動化",
  "B-6:AR/VR×体験代替", "B-7:アルゴリズム×マッチング最適化", "B-8:ロボティクス×作業自動化",
  "C-1:サブスクリプション転換", "C-2:フリーミアム→プレミアム", "C-3:マーケットプレイス仲介",
  "C-4:従量課金・成果報酬", "C-5:バンドリング×アンバンドリング", "C-6:クロスサブシダイズ",
  "C-7:エコシステム収益化", "C-8:レベニューシェア",
  "D-1:中間業者排除D2C", "D-2:サプライチェーン最適化", "D-3:垂直統合",
  "D-4:アウトソーシング取り込み", "D-5:シェアリング×遊休資産", "D-6:製造業サービス化",
  "D-7:リバースサプライチェーン",
  "E-1:ネットワーク効果設計", "E-2:データフライホイール", "E-3:デベロッパーエコシステム",
  "E-4:オープンイノベーションPF", "E-5:コミュニティ主導成長PLG", "E-6:スーパーアプリ化",
  "E-7:両面市場非対称戦略",
  "F-1:規制変化先取りRegTech", "F-2:サステナビリティビジネス化", "F-3:少子高齢化シルバー市場",
  "F-4:地方創生デジタル行政", "F-5:メンタルヘルスデジタルケア", "F-6:フードテック農業DX",
  "F-7:金融包摂アンバンクト", "F-8:教育スキルアップ民主化", "F-9:感情×消費行動設計",
  "G-1:海外実証済みモデルローカライズ", "G-2:日本発グローバル展開", "G-3:越境EC",
  "G-4:新興国リープフロッグ", "G-5:インバウンド文化輸出", "G-6:標準化×現地化バランス",
  "G-7:知的財産ライセンス輸出",
  "H-1:特許論文軸事業化", "H-2:オルタナティブデータビジネス", "H-3:知識グラフ推薦エンジン",
  "H-4:業界データ標準化SaaS", "H-5:行動データ×予測サービス", "H-6:プライバシー強化技術",
  "H-7:リアルタイムデータ動的価格",
  "I-1:コア技術隣接市場展開", "I-2:顧客基盤追加サービス", "I-3:遊休資産PF化",
  "I-4:ブランド新カテゴリー進出", "I-5:人的ネットワーク事業化", "I-6:M&A統合後価値創出",
  "J-1:メガトレンド起点事業設計", "J-2:シナリオプランニング", "J-3:ホワイトスペース探索",
  "J-4:カテゴリーキング戦略", "J-5:アナログ残存領域デジタル化", "J-6:制度社会設計再構築",
  "J-7:コンバージェンス型産業融合", "J-8:ダークホース産業先行投資",
];

// ── 選択肢リスト（プロンプト用） ─────────────────────────────
const TARGET_INDUSTRIES = [
  "IT・通信","ソフトウェア・SaaS","ゲーム","広告・マーケティング","メディア・出版","通信・インフラ",
  "製造","自動車・モビリティ","電機・精密機器","建設・土木","素材・化学","アパレル・繊維",
  "小売・EC","飲食・食品","物流・運輸","旅行・宿泊","美容・理容","不動産・住宅",
  "人材・HR","外食・フードサービス","冠婚葬祭",
  "金融・保険","銀行・証券","法務・士業","会計・税務","コンサルティング",
  "医療・福祉","教育・研修","行政・自治体","NPO・社会貢献","介護・保育","スポーツ・フィットネス",
  "農業・一次産業","水産・畜産","エネルギー・電力","環境・リサイクル","全業界",
];
const TARGET_CUSTOMERS = [
  "中小企業","大企業","スタートアップ","個人事業主","NPO・社団法人","自治体・行政",
  "教育機関","医療機関","飲食店・店舗",
  "一般消費者","ファミリー層","Z世代・若年層","シニア層","子ども・保護者",
  "共働き世帯","単身世帯","富裕層","学生","就活生・転職者",
  "フリーランス・副業","クリエイター・配信者","エンジニア・開発者","デザイナー",
  "マーケター","士業（弁護士・税理士等）","医療従事者","農家・生産者","投資家・VC",
];
const INVESTMENT_SCALES = ["〜50万円","50〜200万円","200〜500万円","500万円〜"];
const DIFFICULTIES = ["低","中","高"];

// ── システムプロンプト（全バッチ共通） ───────────────────────
const SYSTEM_PROMPT = `あなたは日本市場向け新規事業アイデアの生成エキスパートです。
以下の5人のターゲットペルソナのうち少なくとも1人が「これ、今すぐ使いたい」と感じるレベルの
具体性・切実さを持つアイデアを生成してください。

【ターゲットペルソナ】
- 田中翔太（32歳・副業SE）: 難易度低〜中・技術スタック明快・初期投資200万円以内の案件を探している
- 鈴木美咲（35歳・大手メーカー新規事業担当）: 市場の客観データ・競合の弱点・スコア根拠が明確なB2B案件
- 山田健一（42歳・連続起業家）: novelty・moatが高く、レッドオーシャンでない成長余地のある領域
- 佐藤あかり（24歳・新卒起業志望）: 社会課題解決・Z世代共感テーマ・理解しやすいコンセプト
- 中村誠（55歳・地方中小経営者）: 既存事業の延長線上・行政連携・低難易度で今期から動ける案件

【有望なアイデアの5条件】
1. 課題の切実さ: 「なんとなく不便」ではなく「今すぐ解決しないと損失が出る」レベルの痛み
2. タイミングの必然性: 規制変化・技術転換・行動変容のうち最低2つが今この瞬間に交差している
3. 競合の一点突破: 競合が解決できていない「たった1つの弱点」に完全特化する
4. 収益の単純明快さ: 「誰が・何に・いくら払うか」が3秒で説明できる
5. 参入障壁の具体性: データ蓄積・ネットワーク効果・規制対応ノウハウ等の具体的なモートがある

【絶対禁止】
- 根拠不明の具体的数値（「〇〇%」「〇〇万人」）の使用 → 定性表現（「数十万社規模」「数千億円規模」等）で書く
- 全スコアを同一値にする（全部3・全部4はNG。最高値と最低値の差は必ず1ポイント以上）
- JSON フィールドの値に指示文・説明文をそのまま入れる（実際のコンテンツを書くこと）
- 架空企業・「大手各社」等の一般化を competitors に記載する
- **【最重要】competitiveEdge / noveltyNote に実在企業名・サービス名を記載する**（誹謗中傷リスク・訴訟リスクのため）。実在名は competitors フィールドにのみ記載し、competitiveEdge / noveltyNote では「既存の◯◯」「従来の◯◯」「一般的な◯◯」等の抽象カテゴリで対比すること
- **whyNow に2024年以前の情報のみを記載する**（事前ウェブ検索で取得した2025〜2026年の最新情報を必ず反映すること）
- **oneLiner / concept / whyNow / noveltyNote / strengthNote / patternRationale / revenueModel / product に「SaaS」という語を記載する**（市況が厳しいためユーザー心理に悪影響。代替: 「クラウドサービス」「定額制管理ツール」「Webアプリ」「サブスクリプション」等）。ただし competitors フィールド・competitiveEdge での競合カテゴリ対比表現（「既存の人事SaaS」等）は対象外
- **serviceName を英語のみで統一する**（10件のバッチで英語名は最大3件。残りはカタカナ・日本語混在・ひらがな等を積極活用すること）

JSON 配列のみを返答してください。余分なテキストは一切不要です。`;

// ── フィールド記述指針（JSON外に分離して混入を防ぐ） ─────────
const FIELD_GUIDE = `
## 各フィールドの記述指針（値に指示文をそのまま入れないこと）
serviceName: 事業タイプ×ターゲットでトーンを選ぶ。英語はB2Bテック特化の場合のみ（最大3件/10件）。残りは必ずカタカナ・日本語混在・ひらがなを使うこと。例→ カタカナ:「アシストワーク」「ケアナビ」、日本語:「まかせて帳」「現場レポ」、英日混在:「SmartKojo」「EcoMaru」
oneLiner: 20〜40文字。「[誰の][何の課題を][どう解決]」の構造。抽象フレーズ禁止
concept: 100〜180文字。①何をするか ②仕組み ③ユーザーが得る具体的価値の3要素を含む
target: 年齢・職種・会社規模・置かれた状況まで具体的に（例: 従業員20〜200名の建設会社・現場監督）
problem: 80〜150文字。①現状の痛みの具体的状況 ②なぜ今の手段では解決できないか の2点を含む
product: 3〜6項目の改行区切り。各項目は「機能名（具体的な動作説明）」の形式
revenueModel: 2〜4パターン。「誰が・何に・いくら払うか」を明示（例: 月額SaaS 従業員数課金 50人まで2万円〜）
competitors: 実在する3〜5社のサービス名のみ。架空企業・「大手各社」等の一般化禁止
competitiveEdge: 既存手段カテゴリ（例「既存の人事SaaS」「従来の会計ツール」）と対比し「なぜその領域では解決できないか」を具体的に（60〜120文字）。**実在企業名・サービス名の記載は厳禁**（誹謗中傷リスク回避）
scoreComments.novelty: 既存サービスとの差別化の根拠を具体的に（30〜60文字）
scoreComments.marketSize: 対象顧客の規模感を定性表現で（確認できる数値がある場合のみ引用可）（30〜60文字）
scoreComments.profitability: 単価×想定顧客数の概算試算を含む（30〜60文字）
scoreComments.growth: 追い風となる規制・技術・行動変容を1つ特定して説明（30〜60文字）
scoreComments.feasibility: 技術・資金・人材・規制の観点から実現難易度を評価（30〜60文字）
scoreComments.moat: 具体的な参入障壁（データ蓄積・ネットワーク効果・資格・スイッチングコスト）（30〜60文字）
whyNow: 2文（目安70〜120文字）。ウェブ検索で収集した2025〜2026年の情報（法令名・統計・市場変化）を具体的に引用し「今この瞬間が転換点である理由」を書く。2024年以前のみの引用は禁止。現在進行形で締めること
noveltyNote: 45〜60文字・1文。既存手段カテゴリ（抽象表現）との差分だけを書く。**実在企業名・サービス名の記載は厳禁**（誹謗中傷リスク回避）。「存在しない」「空白地帯」も禁止
strengthNote: 45〜60文字・1文。確認済みの仕組み・データ蓄積・収益構造から説明できる強みだけを書く
patternRationale: 2文の散文。選択パターンが事業のどの部分を担い、互いにどう補完・増幅するかを書く`;

// ── プロンプト生成 ────────────────────────────────────────────
function buildPrompt(category, count, existingServiceNames, startId, searchContext = "") {
  const contextSection = searchContext
    ? `\n## 最新市場調査（ウェブ検索結果・必ず反映すること）\n${searchContext}\n`
    : "";

  return `カテゴリ「${category}」で、面白く斬新なビジネスアイデアを${count}件生成してください。
${contextSection}
## 絶対ルール
1. 以下のサービス名はすでに存在するので使用禁止: ${existingServiceNames.slice(0, 80).join("、")}
2. 各アイデアはターゲット顧客・業界・パターンが互いに重複しないよう多様にすること
3. 日本市場を主対象としたビジネスモデル
4. scores は全項目同一値禁止（最高値－最低値 ≥ 1）
5. 上記の最新市場調査に記載された競合の実在名は competitors フィールドにのみ記載。市場規模・規制動向は whyNow に反映。**competitiveEdge / noveltyNote には実在企業名・サービス名を一切書かず、「既存の◯◯」「従来の◯◯」「一般的な◯◯」等の抽象カテゴリで対比すること（誹謗中傷リスク回避）**
6. whyNow は2文（目安70〜120文字）とし、ウェブ検索で取得した2025〜2026年の法令・統計・市場変化を必ず引用すること。2024年以前の情報のみを使用することは禁止。noveltyNote / strengthNote は各45〜60文字・1文にし、確認できた事実だけを書くこと
7. oneLiner / concept / revenueModel / product / whyNow / noveltyNote / strengthNote / patternRationale に「SaaS」という語を使わないこと。「クラウドサービス」「定額制ツール」「Webアプリ」「サブスクリプション」等に言い換えること
8. 10件のうち serviceName が英語（ラテン文字のみ）のものは最大3件。残り7件以上は必ずカタカナ・日本語・ひらがな・英日混在のいずれかを使うこと

${FIELD_GUIDE}

## パターンIDの選択肢（最も適切な2〜3つを選ぶこと）
${PATTERNS.join("\n")}

## 出力制約
- targetIndustry は以下から1つ: ${TARGET_INDUSTRIES.join(" / ")}
- targetCustomer は以下から1つ: ${TARGET_CUSTOMERS.join(" / ")}
- investmentScale は以下から1つ: 〜50万円 / 50〜200万円 / 200〜500万円 / 500万円〜
- difficulty: 低 / 中 / 高

## 出力フォーマット（JSON配列のみ・余分なテキスト禁止）
[
  {
    "id": "idea-${String(startId).padStart(3,'0')}",
    "slug": "",
    "number": ${startId},
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
    "category": "${category}",
    "targetIndustry": "",
    "targetCustomer": "",
    "investmentScale": "",
    "difficulty": "",
    "scores": { "novelty": 0, "marketSize": 0, "profitability": 0, "growth": 0, "feasibility": 0, "moat": 0 },
    "scoreComments": { "novelty": "", "marketSize": "", "profitability": "", "growth": "", "feasibility": "", "moat": "" },
    "trendKeywords": ["", "", ""],
    "patterns": ["", ""],
    "publishedAt": "2026-04-27",
    "views": 0,
    "bookmarks": 0,
    "whyNow": "",
    "noveltyNote": "",
    "strengthNote": "",
    "patternRationale": ""
  }
]`
;
}

// ── メイン処理 ────────────────────────────────────────────────
async function generateForCategory(category, count, startId, client) {
  // 既存サービス名を読み込み（重複防止）
  const mockPath = join(ROOT, "src/data/mock/ideas.ts");
  const mockSrc = readFileSync(mockPath, "utf8");
  const existingNames = [...mockSrc.matchAll(/serviceName:\s*["']([^"']+)["']/g)]
    .map(m => m[1]);

  // 既存の生成済みファイルからも収集
  const genDir = join(ROOT, "scripts/generated");
  if (existsSync(genDir)) {
    const { readdirSync } = await import("fs");
    for (const f of readdirSync(genDir).filter(f => f.endsWith(".json"))) {
      try {
        const data = JSON.parse(readFileSync(join(genDir, f), "utf8"));
        if (Array.isArray(data)) data.forEach(d => d.serviceName && existingNames.push(d.serviceName));
      } catch {}
    }
  }

  console.log(`\n[${category}] 生成開始 (${count}件, id-${startId}〜)`);

  // Phase 1: カテゴリの最新市場動向をウェブ検索
  console.log(`  → ウェブ検索中...`);
  let searchContext = "";
  try {
    const searchResult = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{
        role: "user",
        content: `日本市場における「${category}」領域について、2025〜2026年の最新情報を中心にビジネスアイデア生成のための調査をしてください。
以下を重点的に収集してください（情報の年月を必ず明記）：
1. 主要プレイヤー・競合サービス（企業名と特徴・料金・弱点）
2. 市場規模・成長率の最新データ（2025〜2026年のものを優先。出典と年月を含む）
3. 2025〜2026年の規制変化・政策動向（施行済みのものと予定のもの）
4. 未解決の課題・ペインポイント（具体的な事例。現在進行中のものを優先）
5. 新規参入の余地がある隙間領域（2025〜2026年時点での空白地帯）`,
      }],
    });
    searchContext = searchResult.content
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("\n");
    console.log(`  → ウェブ検索完了 (${searchContext.length}文字)`);
  } catch (e) {
    console.warn(`  ⚠ ウェブ検索スキップ: ${e.message}`);
  }

  // Phase 2: 検索結果を踏まえてアイデアを生成
  const prompt = buildPrompt(category, count, existingNames, startId, searchContext);

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = msg.content[0].text.trim();

  // JSON抽出（```json ... ``` が含まれる場合の対応）
  const jsonStr = raw.startsWith("[") ? raw : raw.match(/\[[\s\S]*\]/)?.[0];
  if (!jsonStr) throw new Error("JSON配列が見つかりません:\n" + raw.slice(0, 200));

  const ideas = JSON.parse(jsonStr);

  // id・numberを上書き（連番保証）
  ideas.forEach((idea, i) => {
    idea.id = `idea-${String(startId + i).padStart(3, "0")}`;
    idea.number = startId + i;
    idea.publishedAt = idea.publishedAt || "2026-04-23";
    idea.views = 0;
    idea.bookmarks = 0;
  });

  console.log(`  → ${ideas.length}件生成完了`);
  return ideas;
}

async function main() {
  const args = process.argv.slice(2);
  const categoryArg = args.find((_, i) => args[i - 1] === "--category");
  const countArg = parseInt(args.find((_, i) => args[i - 1] === "--count") ?? "10");
  const startIdArg = parseInt(args.find((_, i) => args[i - 1] === "--start-id") ?? "21");
  const phaseArg = args.find((_, i) => args[i - 1] === "--phase");

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const genDir = join(ROOT, "scripts/generated");
  mkdirSync(genDir, { recursive: true });

  if (categoryArg) {
    // 単一カテゴリ生成
    const ideas = await generateForCategory(categoryArg, countArg, startIdArg, client);
    const outPath = join(genDir, `${categoryArg.replace(/[\/\s・]/g, "_")}.json`);
    writeFileSync(outPath, JSON.stringify(ideas, null, 2), "utf8");
    console.log(`\n✅ 保存: ${outPath}`);
    console.log("内容プレビュー:");
    ideas.forEach(i => console.log(`  [${i.id}] ${i.serviceName} (${i.targetCustomer}/${i.targetIndustry})`));
  } else if (phaseArg) {
    // フェーズ全体生成
    const phase = PHASES[phaseArg];
    if (!phase) { console.error("不明なフェーズ:", phaseArg); process.exit(1); }
    console.log(`\n=== Phase ${phaseArg}: ${phase.name} ===`);
    let currentId = startIdArg;
    const allIdeas = [];
    for (const cat of phase.categories) {
      const ideas = await generateForCategory(cat, phase.count, currentId, client);
      allIdeas.push(...ideas);
      const outPath = join(genDir, `ph${phaseArg}_${cat.replace(/[\/\s・]/g, "_")}.json`);
      writeFileSync(outPath, JSON.stringify(ideas, null, 2), "utf8");
      currentId += ideas.length;
      // API レート制限対策（1秒待機）
      await new Promise(r => setTimeout(r, 1000));
    }
    const summaryPath = join(genDir, `phase${phaseArg}_all.json`);
    writeFileSync(summaryPath, JSON.stringify(allIdeas, null, 2), "utf8");
    console.log(`\n✅ Phase ${phaseArg} 完了: ${allIdeas.length}件 → ${summaryPath}`);
  } else {
    console.log("使い方:");
    console.log("  単一: node scripts/batch-generate-ideas.mjs --category SaaS --count 10 --start-id 21");
    console.log("  全体: node scripts/batch-generate-ideas.mjs --phase 1 --start-id 21");
  }
}

main().catch(e => { console.error("エラー:", e.message); process.exit(1); });
