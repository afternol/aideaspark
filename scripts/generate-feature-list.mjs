import * as XLSX from "xlsx";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================
// 機能リストデータ
// ============================================================

const FEATURES = [
  // フェーズ①：発見・機会探索
  { phase: "①発見・機会探索", feature: "ビジネスアイデアライブラリ", description: "厳選アイデアのキュレーション・配信", technology: "—", priority: "★★★", difficulty: "低", revenue: "サブスク", status: "稼働中（AideaSpark）" },
  { phase: "①発見・機会探索", feature: "トレンドスキャナー", description: "市場シグナルの早期検知・可視化", technology: "LLM + Web検索", priority: "★★★", difficulty: "低〜中", revenue: "サブスク", status: "未着手" },
  { phase: "①発見・機会探索", feature: "海外事例ローカライザー", description: "海外成功事例→日本市場への翻案提案", technology: "LLM + RAG", priority: "★★☆", difficulty: "中", revenue: "サブスク", status: "未着手" },
  { phase: "①発見・機会探索", feature: "ホワイトスペース分析", description: "競合マップ上の空白領域を自動抽出", technology: "LLM + データ分析", priority: "★★☆", difficulty: "中", revenue: "サブスク", status: "未着手" },
  { phase: "①発見・機会探索", feature: "自社アセット×機会マッチング", description: "自社の強み・資産を入力→最適な事業機会を提案", technology: "LLM + ベクトル検索", priority: "★★☆", difficulty: "中〜高", revenue: "エンタープライズ", status: "未着手" },
  { phase: "①発見・機会探索", feature: "特許・論文アイデア抽出", description: "最新特許・論文からビジネス機会を発掘", technology: "LLM + 特許API", priority: "★☆☆", difficulty: "高", revenue: "サブスク", status: "未着手" },
  { phase: "①発見・機会探索", feature: "社会課題→機会変換", description: "SDGs・社会課題をビジネス機会に変換", technology: "LLM", priority: "★★☆", difficulty: "低", revenue: "サブスク", status: "未着手" },

  // フェーズ②：リサーチ・調査
  { phase: "②リサーチ・調査", feature: "AI市場調査レポート", description: "自然言語で依頼→市場レポート自動生成", technology: "LLM + Web検索 + RAG", priority: "★★★", difficulty: "中", revenue: "従量 or サブスク", status: "未着手" },
  { phase: "②リサーチ・調査", feature: "競合分析ダッシュボード", description: "競合の動向・戦略を継続モニタリング", technology: "LLM + スクレイピング", priority: "★★★", difficulty: "中", revenue: "サブスク", status: "未着手" },
  { phase: "②リサーチ・調査", feature: "市場規模算出（TAM/SAM/SOM）", description: "数値根拠付きで市場規模を自動算出", technology: "LLM + 統計データAPI", priority: "★★★", difficulty: "中", revenue: "サブスク", status: "未着手" },
  { phase: "②リサーチ・調査", feature: "顧客インタビュー設計AI", description: "ペルソナ設定→質問設計→分析まで支援", technology: "LLM", priority: "★★☆", difficulty: "低", revenue: "サブスク", status: "未着手" },
  { phase: "②リサーチ・調査", feature: "SNS・口コミ分析", description: "X/Reddit等のリアルタイム顧客声抽出", technology: "NLP + API", priority: "★★☆", difficulty: "中", revenue: "サブスク", status: "未着手" },
  { phase: "②リサーチ・調査", feature: "業界レポートサマライザー", description: "長文レポートを要点・示唆に圧縮", technology: "LLM + RAG", priority: "★★★", difficulty: "低", revenue: "サブスク", status: "未着手" },
  { phase: "②リサーチ・調査", feature: "アーリーシグナル検知", description: "兆しの段階でトレンドを発見しアラート", technology: "LLM + ニュースAPI", priority: "★★☆", difficulty: "中〜高", revenue: "サブスク", status: "未着手" },

  // フェーズ③：事業設計・計画
  { phase: "③事業設計・計画", feature: "ビジネスプラン生成", description: "リサーチ結果を使い事業計画を自動生成", technology: "LLM", priority: "★★★", difficulty: "低", revenue: "サブスク", status: "稼働中（AideaSpark）" },
  { phase: "③事業設計・計画", feature: "リーンキャンバス自動生成", description: "アイデア入力→9セル自動埋め→改善提案", technology: "LLM", priority: "★★★", difficulty: "低", revenue: "サブスク", status: "未着手" },
  { phase: "③事業設計・計画", feature: "財務モデル・収益シミュレーター", description: "変数を動かして収益・費用・回収期間を可視化", technology: "計算エンジン + UI", priority: "★★★", difficulty: "中", revenue: "サブスク", status: "未着手" },
  { phase: "③事業設計・計画", feature: "KPIツリー設計", description: "事業目標→KPI→指標の木構造を自動設計", technology: "LLM", priority: "★★☆", difficulty: "低", revenue: "サブスク", status: "未着手" },
  { phase: "③事業設計・計画", feature: "リスク分析・シナリオ設計", description: "最良・中庸・最悪シナリオの自動生成", technology: "LLM", priority: "★★☆", difficulty: "低〜中", revenue: "サブスク", status: "未着手" },
  { phase: "③事業設計・計画", feature: "事業計画書生成", description: "経営層・投資家向け提案書をワンクリック出力", technology: "LLM + PDF生成", priority: "★★★", difficulty: "中", revenue: "サブスク", status: "未着手" },
  { phase: "③事業設計・計画", feature: "補助金・助成金レコメンド", description: "事業内容から活用可能な公的支援を自動提案", technology: "LLM + 補助金DB", priority: "★★☆", difficulty: "中", revenue: "サブスク", status: "未着手" },

  // フェーズ④：バリデーション・検証
  { phase: "④バリデーション・検証", feature: "仮説検証フレームワーク", description: "検証すべき仮説を整理・優先順位付け", technology: "LLM", priority: "★★★", difficulty: "低", revenue: "サブスク", status: "未着手" },
  { phase: "④バリデーション・検証", feature: "LP自動生成", description: "アイデアから検証用LPを即時生成", technology: "LLM + コード生成", priority: "★★☆", difficulty: "高", revenue: "従量", status: "未着手" },
  { phase: "④バリデーション・検証", feature: "アンケート自動設計・分析", description: "検証目的に合わせた質問設計・集計・分析", technology: "LLM", priority: "★★☆", difficulty: "低〜中", revenue: "サブスク", status: "未着手" },
  { phase: "④バリデーション・検証", feature: "ユーザーインタビュー分析", description: "録音・テキストからインサイト自動抽出", technology: "音声認識 + LLM", priority: "★★☆", difficulty: "中", revenue: "従量", status: "未着手" },
  { phase: "④バリデーション・検証", feature: "PMF判定スコアリング", description: "収集データからPMF度合いを定量評価", technology: "LLM + 分析", priority: "★★☆", difficulty: "中", revenue: "サブスク", status: "未着手" },

  // フェーズ⑤：調達・マッチング
  { phase: "⑤調達・マッチング", feature: "事業開発人材マッチング", description: "PM・事業開発者・デザイナー等の人材探索", technology: "マッチングアルゴリズム", priority: "★★☆", difficulty: "高", revenue: "成功報酬", status: "未着手" },
  { phase: "⑤調達・マッチング", feature: "顧問・メンターマッチング", description: "業界知見・経験を持つ顧問の紹介", technology: "ベクトル検索 + LLM", priority: "★★☆", difficulty: "高", revenue: "成功報酬 or 月額", status: "未着手" },
  { phase: "⑤調達・マッチング", feature: "ベンダー・開発会社マッチング", description: "要件→最適な開発パートナーを提案", technology: "LLM + DB", priority: "★★☆", difficulty: "高", revenue: "成功報酬 or 掲載料", status: "未着手" },
  { phase: "⑤調達・マッチング", feature: "専門家マッチング", description: "弁護士・会計士・特許事務所等", technology: "DB + 検索", priority: "★☆☆", difficulty: "高", revenue: "成功報酬", status: "未着手" },
  { phase: "⑤調達・マッチング", feature: "製造・OEMパートナー探索", description: "ハードウェア・製造系の協力会社探索", technology: "DB + マッチング", priority: "★☆☆", difficulty: "高", revenue: "成功報酬", status: "未着手" },
  { phase: "⑤調達・マッチング", feature: "投資家マッチング", description: "VC・CVC・エンジェル投資家への接続", technology: "マッチングアルゴリズム", priority: "★☆☆", difficulty: "最高", revenue: "成功報酬", status: "未着手" },
  { phase: "⑤調達・マッチング", feature: "大企業×スタートアップ連携", description: "オープンイノベーション案件マッチング", technology: "双方向マッチング", priority: "★☆☆", difficulty: "最高", revenue: "エンタープライズ", status: "未着手" },

  // フェーズ⑥：実行支援
  { phase: "⑥実行支援", feature: "新規事業ロードマップ管理", description: "マイルストーン・タスク・KPI管理", technology: "DB + UI", priority: "★★☆", difficulty: "中", revenue: "サブスク", status: "未着手" },
  { phase: "⑥実行支援", feature: "ステークホルダーレポート自動生成", description: "経営会議向け進捗レポートを自動作成", technology: "LLM", priority: "★★★", difficulty: "低〜中", revenue: "サブスク", status: "未着手" },
  { phase: "⑥実行支援", feature: "ピッチデック生成", description: "投資家向けピッチ資料をAIが構成・文章化", technology: "LLM + デザイン", priority: "★★★", difficulty: "中", revenue: "従量 or サブスク", status: "未着手" },
  { phase: "⑥実行支援", feature: "チームコラボレーション", description: "事業開発チームの共同作業スペース", technology: "リアルタイムDB", priority: "★★☆", difficulty: "中〜高", revenue: "サブスク（チーム課金）", status: "未着手" },
  { phase: "⑥実行支援", feature: "意思決定ログ", description: "判断根拠・経緯をAIが自動記録", technology: "LLM + DB", priority: "★★☆", difficulty: "低", revenue: "サブスク", status: "未着手" },

  // フェーズ⑦：成長・エコシステム
  { phase: "⑦成長・エコシステム", feature: "事例・失敗データベース", description: "成功・失敗事例の体系的な蓄積と検索", technology: "RAG + DB", priority: "★★★", difficulty: "中", revenue: "サブスク", status: "未着手" },
  { phase: "⑦成長・エコシステム", feature: "パーソナライズインサイト配信", description: "ユーザーの事業フェーズ×業界に合わせた情報", technology: "LLM + レコメンド", priority: "★★★", difficulty: "中", revenue: "サブスク", status: "未着手" },
  { phase: "⑦成長・エコシステム", feature: "コミュニティ・ピア学習", description: "事業開発者同士の知見共有・壁打ち", technology: "コミュニティ機能", priority: "★★☆", difficulty: "中〜高", revenue: "サブスク", status: "未着手" },
  { phase: "⑦成長・エコシステム", feature: "ベンチマーク分析", description: "同業他社・類似事業との比較分析", technology: "データ集計 + LLM", priority: "★★☆", difficulty: "中", revenue: "サブスク", status: "未着手" },
  { phase: "⑦成長・エコシステム", feature: "AI個別コーチング", description: "事業の現状を入力→次の打ち手を提案", technology: "LLM + 文脈管理", priority: "★★★", difficulty: "中", revenue: "サブスク or 従量", status: "未着手" },

  // AIエージェント層
  { phase: "🤖 AIエージェント層（横断）", feature: "事業開発AIエージェント", description: "「〇〇業界で新規事業を考えたい」→全工程を自律実行", technology: "Multi-Agent + LLM", priority: "★★★", difficulty: "最高", revenue: "プレミアム", status: "未着手" },
  { phase: "🤖 AIエージェント層（横断）", feature: "マルチ視点評価エージェント", description: "CFO・CMO・法務等の複数AIが事業を議論・評価", technology: "Multi-Agent", priority: "★★★", difficulty: "高", revenue: "プレミアム", status: "未着手" },
  { phase: "🤖 AIエージェント層（横断）", feature: "継続モニタリングエージェント", description: "市場変化・競合動向を監視し自動でアラート・提案", technology: "Agent + Scheduler", priority: "★★★", difficulty: "高", revenue: "サブスク", status: "未着手" },
  { phase: "🤖 AIエージェント層（横断）", feature: "パーソナルビジネスメンターAI", description: "ユーザーの事業履歴を蓄積し長期的にアドバイス", technology: "LLM + 長期メモリ", priority: "★★★", difficulty: "高", revenue: "プレミアム", status: "未着手" },
  { phase: "🤖 AIエージェント層（横断）", feature: "自動リサーチ→計画実行", description: "調査→計画→文書化までをノーコードで実行", technology: "Agent Workflow", priority: "★★★", difficulty: "最高", revenue: "プレミアム", status: "未着手" },
];

// ============================================================
// シート①：機能一覧（全体）
// ============================================================
function createMainSheet() {
  const headers = ["フェーズ", "機能名", "概要", "技術", "優先度", "難易度", "収益モデル", "ステータス"];
  const rows = FEATURES.map((f) => [
    f.phase, f.feature, f.description, f.technology,
    f.priority, f.difficulty, f.revenue, f.status,
  ]);
  return [headers, ...rows];
}

// ============================================================
// シート②：フェーズ別サマリー
// ============================================================
function createSummarySheet() {
  const phases = [...new Set(FEATURES.map((f) => f.phase))];
  const headers = ["フェーズ", "機能数", "稼働中", "未着手", "高優先（★★★）"];
  const rows = phases.map((phase) => {
    const items = FEATURES.filter((f) => f.phase === phase);
    return [
      phase,
      items.length,
      items.filter((f) => f.status.includes("稼働中")).length,
      items.filter((f) => f.status === "未着手").length,
      items.filter((f) => f.priority === "★★★").length,
    ];
  });
  return [headers, ...rows];
}

// ============================================================
// シート③：優先度別
// ============================================================
function createPrioritySheet() {
  const high = FEATURES.filter((f) => f.priority === "★★★");
  const headers = ["フェーズ", "機能名", "難易度", "収益モデル", "ステータス"];
  const rows = high.map((f) => [f.phase, f.feature, f.difficulty, f.revenue, f.status]);
  return [headers, ...rows];
}

// ============================================================
// Excel生成
// ============================================================
const wb = XLSX.utils.book_new();

// シート①：全機能一覧
const ws1 = XLSX.utils.aoa_to_sheet(createMainSheet());
ws1["!cols"] = [
  { wch: 22 }, { wch: 28 }, { wch: 42 }, { wch: 28 },
  { wch: 10 }, { wch: 10 }, { wch: 22 }, { wch: 22 },
];
XLSX.utils.book_append_sheet(wb, ws1, "全機能一覧");

// シート②：フェーズ別サマリー
const ws2 = XLSX.utils.aoa_to_sheet(createSummarySheet());
ws2["!cols"] = [{ wch: 28 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 16 }];
XLSX.utils.book_append_sheet(wb, ws2, "フェーズ別サマリー");

// シート③：高優先機能
const ws3 = XLSX.utils.aoa_to_sheet(createPrioritySheet());
ws3["!cols"] = [{ wch: 22 }, { wch: 28 }, { wch: 12 }, { wch: 22 }, { wch: 22 }];
XLSX.utils.book_append_sheet(wb, ws3, "高優先機能（★★★）");

// 保存
const outputPath = join(__dirname, "..", "docs", "platform-feature-list.xlsx");
import { mkdirSync } from "fs";
try { mkdirSync(join(__dirname, "..", "docs"), { recursive: true }); } catch {}

XLSX.writeFile(wb, outputPath);
console.log(`✅ Excel生成完了: ${outputPath}`);
console.log(`   総機能数: ${FEATURES.length}`);
console.log(`   フェーズ数: ${new Set(FEATURES.map((f) => f.phase)).size}`);
console.log(`   高優先（★★★）: ${FEATURES.filter((f) => f.priority === "★★★").length}件`);
