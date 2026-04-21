export interface Pattern {
  id: string;
  name: string;
  group: string;
  groupName: string;
}

export const PATTERN_GROUPS: Record<string, string> = {
  A: "機会の源泉",
  B: "顧客価値創造",
  C: "市場構造変革",
  D: "競争優位構築",
  E: "ビジネスモデル革新",
  F: "テクノロジー活用",
  G: "エコシステム・プラットフォーム",
  H: "日本固有の機会",
  I: "AIネイティブ・次世代",
  J: "グローバル展開",
};

export const PATTERNS: Pattern[] = [
  // A: 機会の源泉パターン
  { id: "A-1", name: "技術S字曲線の変曲点を狙う",                group: "A", groupName: "機会の源泉" },
  { id: "A-2", name: "規制変化の「窓」を捉える",                   group: "A", groupName: "機会の源泉" },
  { id: "A-3", name: "人口動態の必然に乗る",                       group: "A", groupName: "機会の源泉" },
  { id: "A-4", name: "行動変容の「取り残し」を探す",               group: "A", groupName: "機会の源泉" },
  { id: "A-5", name: "地政学リスクが生む構造的国内需要",           group: "A", groupName: "機会の源泉" },
  { id: "A-6", name: "ホワイトスペース探索（競合マップの空白）",   group: "A", groupName: "機会の源泉" },
  { id: "A-7", name: "社会課題の事業機会への変換",                 group: "A", groupName: "機会の源泉" },
  { id: "A-8", name: "新技術の最初の実用化（ファーストペンギン）", group: "A", groupName: "機会の源泉" },

  // B: 顧客価値創造パターン
  { id: "B-1", name: "Jobs-to-be-Done（JTBD）の深掘り",           group: "B", groupName: "顧客価値創造" },
  { id: "B-2", name: "非消費者・非利用者の取り込み",               group: "B", groupName: "顧客価値創造" },
  { id: "B-3", name: "価値の再フレーミング",                       group: "B", groupName: "顧客価値創造" },
  { id: "B-4", name: "摩擦の徹底除去（Friction Removal）",         group: "B", groupName: "顧客価値創造" },
  { id: "B-5", name: "感情・社会的価値の設計",                     group: "B", groupName: "顧客価値創造" },
  { id: "B-6", name: "アウトカム課金（成果連動型）",               group: "B", groupName: "顧客価値創造" },
  { id: "B-7", name: "Outcome-Driven Innovation（ODI）",           group: "B", groupName: "顧客価値創造" },
  { id: "B-8", name: "スイッチトリガー分析（なぜ人は乗り換えるか）", group: "B", groupName: "顧客価値創造" },

  // C: 市場構造変革パターン
  { id: "C-1", name: "Blue Ocean戦略（価値曲線の再設計）",         group: "C", groupName: "市場構造変革" },
  { id: "C-2", name: "カテゴリー創造（Play Bigger）",              group: "C", groupName: "市場構造変革" },
  { id: "C-3", name: "垂直統合による品質・コスト優位",             group: "C", groupName: "市場構造変革" },
  { id: "C-4", name: "アンバンドリング（機能の分解・専業化）",     group: "C", groupName: "市場構造変革" },
  { id: "C-5", name: "アグリゲーション（分散→集約）",             group: "C", groupName: "市場構造変革" },
  { id: "C-6", name: "制約の解放（Constraint Liberation）",        group: "C", groupName: "市場構造変革" },
  { id: "C-7", name: "BtoBtoC・ビジネスモデル変換",               group: "C", groupName: "市場構造変革" },
  { id: "C-8", name: "業界越境移植（クロスインダストリー）",       group: "C", groupName: "市場構造変革" },

  // D: 競争優位構築パターン
  { id: "D-1", name: "データ資産の複利効果（Data Flywheel）",      group: "D", groupName: "競争優位構築" },
  { id: "D-2", name: "ネットワーク効果の精緻な設計",               group: "D", groupName: "競争優位構築" },
  { id: "D-3", name: "スイッチングコストの積み上げ",               group: "D", groupName: "競争優位構築" },
  { id: "D-4", name: "ブランド・信頼資産の構築",                   group: "D", groupName: "競争優位構築" },
  { id: "D-5", name: "規制・ライセンス取得（Regulatory Moat）",    group: "D", groupName: "競争優位構築" },
  { id: "D-6", name: "エコシステムによるロックイン",               group: "D", groupName: "競争優位構築" },

  // E: ビジネスモデル革新パターン
  { id: "E-1", name: "収益モデルの「タイミング」変換",             group: "E", groupName: "ビジネスモデル革新" },
  { id: "E-2", name: "プラットフォーム課税モデル",                 group: "E", groupName: "ビジネスモデル革新" },
  { id: "E-3", name: "データの二次収益化",                         group: "E", groupName: "ビジネスモデル革新" },
  { id: "E-4", name: "エコシステム収益設計",                       group: "E", groupName: "ビジネスモデル革新" },
  { id: "E-5", name: "アセットライト×スケール設計",               group: "E", groupName: "ビジネスモデル革新" },
  { id: "E-6", name: "フリーミアムの逆設計",                       group: "E", groupName: "ビジネスモデル革新" },
  { id: "E-7", name: "オープンコア→商用化（Open Core Model）",     group: "E", groupName: "ビジネスモデル革新" },
  { id: "E-8", name: "廃棄・余剰・無駄の価値化（Waste-to-Value）", group: "E", groupName: "ビジネスモデル革新" },

  // F: テクノロジー活用パターン
  { id: "F-1", name: "バーティカルAI（業界特化型AI）",             group: "F", groupName: "テクノロジー活用" },
  { id: "F-2", name: "AIによる専門家サービスの民主化",             group: "F", groupName: "テクノロジー活用" },
  { id: "F-3", name: "Compound AI System（複合AIシステム）",       group: "F", groupName: "テクノロジー活用" },
  { id: "F-4", name: "AIエージェント×ワークフロー自動化",         group: "F", groupName: "テクノロジー活用" },
  { id: "F-5", name: "予測→処方への昇華（Prescriptive Analytics）", group: "F", groupName: "テクノロジー活用" },
  { id: "F-6", name: "センサー・IoT×未計測領域のデジタル化",      group: "F", groupName: "テクノロジー活用" },
  { id: "F-7", name: "API・インフラ（Picks & Shovels）戦略",       group: "F", groupName: "テクノロジー活用" },
  { id: "F-8", name: "特許・論文→事業化（IP起点のビジネス開発）", group: "F", groupName: "テクノロジー活用" },
  { id: "F-9", name: "合成データビジネス",                         group: "F", groupName: "テクノロジー活用" },

  // G: エコシステム・プラットフォームパターン
  { id: "G-1", name: "ワイドレンズ戦略（エコシステム全体の設計）", group: "G", groupName: "エコシステム・プラットフォーム" },
  { id: "G-2", name: "マルチサイドプラットフォームの非対称設計",   group: "G", groupName: "エコシステム・プラットフォーム" },
  { id: "G-3", name: "コミュニティ先行型成長（Community-Led Growth）", group: "G", groupName: "エコシステム・プラットフォーム" },
  { id: "G-4", name: "オープンイノベーション・ブローカー",         group: "G", groupName: "エコシステム・プラットフォーム" },
  { id: "G-5", name: "Wedge戦略（楔→隣接市場への拡張）",          group: "G", groupName: "エコシステム・プラットフォーム" },
  { id: "G-6", name: "スーパーアプリ戦略",                         group: "G", groupName: "エコシステム・プラットフォーム" },
  { id: "G-7", name: "プラットフォーム上のプラットフォーム",       group: "G", groupName: "エコシステム・プラットフォーム" },

  // H: 日本固有の機会パターン
  { id: "H-1", name: "職人・暗黙知のデジタル資産化",               group: "H", groupName: "日本固有の機会" },
  { id: "H-2", name: "中小企業DX代行（丸ごとアウトソース型）",     group: "H", groupName: "日本固有の機会" },
  { id: "H-3", name: "事業承継×イノベーション（後継者不足の逆転）", group: "H", groupName: "日本固有の機会" },
  { id: "H-4", name: "インバウンド×テクノロジー",                  group: "H", groupName: "日本固有の機会" },
  { id: "H-5", name: "地方創生×デジタル（過疎の逆活用）",          group: "H", groupName: "日本固有の機会" },
  { id: "H-6", name: "日本文化・製品・技術の海外展開（Japan Premium）", group: "H", groupName: "日本固有の機会" },
  { id: "H-7", name: "働き方変容×新サービス（ポストコロナ雇用変化）", group: "H", groupName: "日本固有の機会" },

  // I: AIネイティブ・次世代パターン
  { id: "I-1", name: "AIネイティブSaaS（AI除去不可能設計）",       group: "I", groupName: "AIネイティブ・次世代" },
  { id: "I-2", name: "AIエージェント・アズ・ア・サービス",         group: "I", groupName: "AIネイティブ・次世代" },
  { id: "I-3", name: "AIによるLong Tail市場の開拓",                group: "I", groupName: "AIネイティブ・次世代" },
  { id: "I-4", name: "人間×AIハイブリッドサービス",               group: "I", groupName: "AIネイティブ・次世代" },
  { id: "I-5", name: "マルチエージェント・シミュレーション",        group: "I", groupName: "AIネイティブ・次世代" },
  { id: "I-6", name: "パーソナルAIコンテキスト（長期記憶型AI）",   group: "I", groupName: "AIネイティブ・次世代" },
  { id: "I-7", name: "AIによるバリデーション加速",                 group: "I", groupName: "AIネイティブ・次世代" },
  { id: "I-8", name: "AIによるLong-Context業務の価値化",           group: "I", groupName: "AIネイティブ・次世代" },

  // J: グローバル展開パターン
  { id: "J-1", name: "海外ビジネスモデルのローカライズ（外→日）", group: "J", groupName: "グローバル展開" },
  { id: "J-2", name: "リバースイノベーション（新興国→先進国）",    group: "J", groupName: "グローバル展開" },
  { id: "J-3", name: "日本→アジア新興国展開",                      group: "J", groupName: "グローバル展開" },
  { id: "J-4", name: "グローバルニッチトップ戦略",                  group: "J", groupName: "グローバル展開" },
  { id: "J-5", name: "クロスボーダーEC・コンテンツ流通",           group: "J", groupName: "グローバル展開" },
];

export function getPatternById(id: string): Pattern | undefined {
  return PATTERNS.find((p) => p.id === id);
}

export function formatPatternsForPrompt(): string {
  const groups = Object.entries(PATTERN_GROUPS);
  return groups.map(([groupId, groupName]) => {
    const groupPatterns = PATTERNS.filter((p) => p.group === groupId);
    const lines = groupPatterns.map((p) => `  ${p.id}: ${p.name}`).join("\n");
    return `[${groupId}] ${groupName}\n${lines}`;
  }).join("\n\n");
}
