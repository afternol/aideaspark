import type { TargetIndustry, TargetCustomer } from "./types";

export interface CategoryItem {
  value: string;
  label: string;
  group: string;
}

export const CATEGORY_GROUPS = [
  "ビジネスモデル",
  "AI・データ",
  "金融・決済",
  "ヘルスケア・ウェルネス",
  "教育・人材",
  "生活・消費",
  "産業・インフラ",
  "サステナビリティ",
  "エンタメ・クリエイター",
  "先端テクノロジー",
] as const;

export const CATEGORIES: CategoryItem[] = [
  // ビジネスモデル
  { value: "SaaS", label: "SaaS", group: "ビジネスモデル" },
  { value: "D2C", label: "D2C", group: "ビジネスモデル" },
  { value: "プラットフォーム", label: "プラットフォーム", group: "ビジネスモデル" },
  { value: "マーケットプレイス", label: "マーケットプレイス", group: "ビジネスモデル" },
  { value: "サブスクリプション", label: "サブスクリプション", group: "ビジネスモデル" },
  { value: "シェアリング", label: "シェアリング", group: "ビジネスモデル" },
  { value: "アグリゲーター", label: "アグリゲーター", group: "ビジネスモデル" },
  { value: "API・BaaS", label: "API・BaaS", group: "ビジネスモデル" },
  { value: "バーティカルSaaS", label: "バーティカルSaaS", group: "ビジネスモデル" },
  { value: "コミュニティ", label: "コミュニティ", group: "ビジネスモデル" },

  // AI・データ
  { value: "AI/ML", label: "AI / ML", group: "AI・データ" },
  { value: "生成AI", label: "生成AI", group: "AI・データ" },
  { value: "AIエージェント", label: "AIエージェント", group: "AI・データ" },
  { value: "音声AI", label: "音声AI", group: "AI・データ" },
  { value: "画像・動画AI", label: "画像・動画AI", group: "AI・データ" },
  { value: "データ分析", label: "データ分析", group: "AI・データ" },
  { value: "RPA・自動化", label: "RPA・自動化", group: "AI・データ" },
  { value: "AI SaaS", label: "AI SaaS", group: "AI・データ" },
  { value: "チャットボット", label: "チャットボット", group: "AI・データ" },
  { value: "パーソナライズ", label: "パーソナライズ", group: "AI・データ" },

  // 金融・決済
  { value: "フィンテック", label: "フィンテック", group: "金融・決済" },
  { value: "決済", label: "決済", group: "金融・決済" },
  { value: "インシュアテック", label: "インシュアテック", group: "金融・決済" },
  { value: "資産運用", label: "資産運用", group: "金融・決済" },
  { value: "融資・レンディング", label: "融資・レンディング", group: "金融・決済" },
  { value: "会計・経理DX", label: "会計・経理DX", group: "金融・決済" },
  { value: "Web3・ブロックチェーン", label: "Web3・ブロックチェーン", group: "金融・決済" },
  { value: "暗号資産", label: "暗号資産", group: "金融・決済" },

  // ヘルスケア・ウェルネス
  { value: "ヘルスケア", label: "ヘルスケア", group: "ヘルスケア・ウェルネス" },
  { value: "デジタルヘルス", label: "デジタルヘルス", group: "ヘルスケア・ウェルネス" },
  { value: "メンタルヘルス", label: "メンタルヘルス", group: "ヘルスケア・ウェルネス" },
  { value: "フェムテック", label: "フェムテック", group: "ヘルスケア・ウェルネス" },
  { value: "スリープテック", label: "スリープテック", group: "ヘルスケア・ウェルネス" },
  { value: "フィットネステック", label: "フィットネステック", group: "ヘルスケア・ウェルネス" },
  { value: "介護テック", label: "介護テック", group: "ヘルスケア・ウェルネス" },
  { value: "エイジテック", label: "エイジテック", group: "ヘルスケア・ウェルネス" },
  { value: "予防医療", label: "予防医療", group: "ヘルスケア・ウェルネス" },
  { value: "ペットテック", label: "ペットテック", group: "ヘルスケア・ウェルネス" },

  // 教育・人材
  { value: "教育", label: "教育", group: "教育・人材" },
  { value: "EdTech", label: "EdTech", group: "教育・人材" },
  { value: "リスキリング", label: "リスキリング", group: "教育・人材" },
  { value: "HR Tech", label: "HR Tech", group: "教育・人材" },
  { value: "採用テック", label: "採用テック", group: "教育・人材" },
  { value: "タレントマネジメント", label: "タレントマネジメント", group: "教育・人材" },
  { value: "コーチング・メンタリング", label: "コーチング・メンタリング", group: "教育・人材" },
  { value: "語学学習", label: "語学学習", group: "教育・人材" },
  { value: "資格・試験対策", label: "資格・試験対策", group: "教育・人材" },

  // 生活・消費
  { value: "フードテック", label: "フードテック", group: "生活・消費" },
  { value: "リテールテック", label: "リテールテック", group: "生活・消費" },
  { value: "不動産", label: "不動産", group: "生活・消費" },
  { value: "プロップテック", label: "プロップテック", group: "生活・消費" },
  { value: "トラベルテック", label: "トラベルテック", group: "生活・消費" },
  { value: "ファッションテック", label: "ファッションテック", group: "生活・消費" },
  { value: "ビューティーテック", label: "ビューティーテック", group: "生活・消費" },
  { value: "家事代行・生活支援", label: "家事代行・生活支援", group: "生活・消費" },
  { value: "ローカルビジネス", label: "ローカルビジネス", group: "生活・消費" },
  { value: "ギフト・EC", label: "ギフト・EC", group: "生活・消費" },

  // 産業・インフラ
  { value: "モビリティ", label: "モビリティ", group: "産業・インフラ" },
  { value: "物流テック", label: "物流テック", group: "産業・インフラ" },
  { value: "建設テック", label: "建設テック", group: "産業・インフラ" },
  { value: "製造DX", label: "製造DX", group: "産業・インフラ" },
  { value: "アグリテック", label: "アグリテック", group: "産業・インフラ" },
  { value: "エネルギーテック", label: "エネルギーテック", group: "産業・インフラ" },
  { value: "セキュリティ", label: "セキュリティ", group: "産業・インフラ" },
  { value: "リーガルテック", label: "リーガルテック", group: "産業・インフラ" },
  { value: "GovTech", label: "GovTech（行政DX）", group: "産業・インフラ" },
  { value: "宇宙ビジネス", label: "宇宙ビジネス", group: "産業・インフラ" },

  // サステナビリティ
  { value: "カーボンテック", label: "カーボンテック", group: "サステナビリティ" },
  { value: "サーキュラーエコノミー", label: "サーキュラーエコノミー", group: "サステナビリティ" },
  { value: "クリーンテック", label: "クリーンテック", group: "サステナビリティ" },
  { value: "ESG・インパクト", label: "ESG・インパクト", group: "サステナビリティ" },
  { value: "フードロス", label: "フードロス", group: "サステナビリティ" },

  // エンタメ・クリエイター
  { value: "コンテンツ", label: "コンテンツ", group: "エンタメ・クリエイター" },
  { value: "クリエイターエコノミー", label: "クリエイターエコノミー", group: "エンタメ・クリエイター" },
  { value: "ゲーム・eスポーツ", label: "ゲーム・eスポーツ", group: "エンタメ・クリエイター" },
  { value: "音楽テック", label: "音楽テック", group: "エンタメ・クリエイター" },
  { value: "動画・配信", label: "動画・配信", group: "エンタメ・クリエイター" },
  { value: "ファンコミュニティ", label: "ファンコミュニティ", group: "エンタメ・クリエイター" },
  { value: "メディア・出版", label: "メディア・出版", group: "エンタメ・クリエイター" },
  { value: "ライブコマース", label: "ライブコマース", group: "エンタメ・クリエイター" },

  // 先端テクノロジー
  { value: "XR・メタバース", label: "XR・メタバース", group: "先端テクノロジー" },
  { value: "IoT", label: "IoT", group: "先端テクノロジー" },
  { value: "ロボティクス", label: "ロボティクス", group: "先端テクノロジー" },
  { value: "量子コンピューティング", label: "量子コンピューティング", group: "先端テクノロジー" },
  { value: "ドローン", label: "ドローン", group: "先端テクノロジー" },
  { value: "3Dプリンティング", label: "3Dプリンティング", group: "先端テクノロジー" },
  { value: "デジタルツイン", label: "デジタルツイン", group: "先端テクノロジー" },
  { value: "ノーコード・ローコード", label: "ノーコード・ローコード", group: "先端テクノロジー" },
];

export interface TargetIndustryItem {
  value: string;
  label: string;
  group: string;
}

export const TARGET_INDUSTRY_GROUPS = ["テクノロジー・情報", "製造・建設", "流通・サービス", "金融・専門", "公共・社会", "一次産業・資源"] as const;

export const TARGET_INDUSTRIES: TargetIndustryItem[] = [
  // テクノロジー・情報
  { value: "IT・通信", label: "IT・通信", group: "テクノロジー・情報" },
  { value: "ソフトウェア・SaaS", label: "ソフトウェア・SaaS", group: "テクノロジー・情報" },
  { value: "ゲーム", label: "ゲーム", group: "テクノロジー・情報" },
  { value: "広告・マーケティング", label: "広告・マーケティング", group: "テクノロジー・情報" },
  { value: "メディア・出版", label: "メディア・出版", group: "テクノロジー・情報" },
  { value: "通信・インフラ", label: "通信・インフラ", group: "テクノロジー・情報" },

  // 製造・建設
  { value: "製造", label: "製造", group: "製造・建設" },
  { value: "自動車・モビリティ", label: "自動車・モビリティ", group: "製造・建設" },
  { value: "電機・精密機器", label: "電機・精密機器", group: "製造・建設" },
  { value: "建設・土木", label: "建設・土木", group: "製造・建設" },
  { value: "素材・化学", label: "素材・化学", group: "製造・建設" },
  { value: "アパレル・繊維", label: "アパレル・繊維", group: "製造・建設" },

  // 流通・サービス
  { value: "小売・EC", label: "小売・EC", group: "流通・サービス" },
  { value: "飲食・食品", label: "飲食・食品", group: "流通・サービス" },
  { value: "物流・運輸", label: "物流・運輸", group: "流通・サービス" },
  { value: "旅行・宿泊", label: "旅行・宿泊", group: "流通・サービス" },
  { value: "美容・理容", label: "美容・理容", group: "流通・サービス" },
  { value: "不動産・住宅", label: "不動産・住宅", group: "流通・サービス" },
  { value: "人材・HR", label: "人材・HR", group: "流通・サービス" },
  { value: "外食・フードサービス", label: "外食・フードサービス", group: "流通・サービス" },
  { value: "冠婚葬祭", label: "冠婚葬祭", group: "流通・サービス" },

  // 金融・専門
  { value: "金融・保険", label: "金融・保険", group: "金融・専門" },
  { value: "銀行・証券", label: "銀行・証券", group: "金融・専門" },
  { value: "法務・士業", label: "法務・士業", group: "金融・専門" },
  { value: "会計・税務", label: "会計・税務", group: "金融・専門" },
  { value: "コンサルティング", label: "コンサルティング", group: "金融・専門" },

  // 公共・社会
  { value: "医療・福祉", label: "医療・福祉", group: "公共・社会" },
  { value: "教育・研修", label: "教育・研修", group: "公共・社会" },
  { value: "行政・自治体", label: "行政・自治体", group: "公共・社会" },
  { value: "NPO・社会貢献", label: "NPO・社会貢献", group: "公共・社会" },
  { value: "介護・保育", label: "介護・保育", group: "公共・社会" },
  { value: "スポーツ・フィットネス", label: "スポーツ・フィットネス", group: "公共・社会" },

  // 一次産業・資源
  { value: "農業・一次産業", label: "農業・一次産業", group: "一次産業・資源" },
  { value: "水産・畜産", label: "水産・畜産", group: "一次産業・資源" },
  { value: "エネルギー・電力", label: "エネルギー・電力", group: "一次産業・資源" },
  { value: "環境・リサイクル", label: "環境・リサイクル", group: "一次産業・資源" },

  // 横断
  { value: "全業界", label: "全業界（業界横断）", group: "一次産業・資源" },
];

export const TARGET_CUSTOMER_GROUPS = ["法人", "個人・消費者", "専門職・クリエイター"] as const;

export interface TargetCustomerItem {
  value: string;
  label: string;
  group: string;
}

export const TARGET_CUSTOMERS: TargetCustomerItem[] = [
  // 法人
  { value: "中小企業", label: "中小企業", group: "法人" },
  { value: "大企業", label: "大企業", group: "法人" },
  { value: "スタートアップ", label: "スタートアップ", group: "法人" },
  { value: "個人事業主", label: "個人事業主", group: "法人" },
  { value: "NPO・社団法人", label: "NPO・社団法人", group: "法人" },
  { value: "自治体・行政", label: "自治体・行政", group: "法人" },
  { value: "教育機関", label: "教育機関", group: "法人" },
  { value: "医療機関", label: "医療機関", group: "法人" },
  { value: "飲食店・店舗", label: "飲食店・店舗", group: "法人" },

  // 個人・消費者
  { value: "一般消費者", label: "一般消費者", group: "個人・消費者" },
  { value: "ファミリー層", label: "ファミリー層", group: "個人・消費者" },
  { value: "Z世代・若年層", label: "Z世代・若年層", group: "個人・消費者" },
  { value: "シニア層", label: "シニア層", group: "個人・消費者" },
  { value: "子ども・保護者", label: "子ども・保護者", group: "個人・消費者" },
  { value: "共働き世帯", label: "共働き世帯", group: "個人・消費者" },
  { value: "単身世帯", label: "単身世帯", group: "個人・消費者" },
  { value: "富裕層", label: "富裕層", group: "個人・消費者" },
  { value: "学生", label: "学生", group: "個人・消費者" },
  { value: "就活生・転職者", label: "就活生・転職者", group: "個人・消費者" },

  // 専門職・クリエイター
  { value: "フリーランス・副業", label: "フリーランス・副業", group: "専門職・クリエイター" },
  { value: "クリエイター・配信者", label: "クリエイター・配信者", group: "専門職・クリエイター" },
  { value: "エンジニア・開発者", label: "エンジニア・開発者", group: "専門職・クリエイター" },
  { value: "デザイナー", label: "デザイナー", group: "専門職・クリエイター" },
  { value: "マーケター", label: "マーケター", group: "専門職・クリエイター" },
  { value: "士業（弁護士・税理士等）", label: "士業（弁護士・税理士等）", group: "専門職・クリエイター" },
  { value: "医療従事者", label: "医療従事者", group: "専門職・クリエイター" },
  { value: "農家・生産者", label: "農家・生産者", group: "専門職・クリエイター" },
  { value: "投資家・VC", label: "投資家・VC", group: "専門職・クリエイター" },
];

export const INVESTMENT_SCALES = [
  "〜50万円",
  "50〜200万円",
  "200〜500万円",
  "500万円〜",
] as const;

export const DIFFICULTIES = [
  { value: "低", label: "低", color: "text-green-600" },
  { value: "中", label: "中", color: "text-yellow-600" },
  { value: "高", label: "高", color: "text-red-600" },
] as const;

export const NAV_EXPLORE_ITEMS = [
  { href: "/feed", label: "アイデアフィード", icon: "Lightbulb" },
  { href: "/diagnosis", label: "アイデア診断", icon: "Compass" },
  { href: "/compare", label: "比較", icon: "Columns3" },
] as const;

export const NAV_ITEMS = [
  { href: "/trends", label: "トレンド", icon: "TrendingUp" },
  { href: "/rankings", label: "ランキング", icon: "Trophy" },
  { href: "/my-ideas", label: "マイアイデア", icon: "Lightbulb" },
  { href: "/mypage", label: "マイページ", icon: "UserCircle" },
] as const;

// All items flat (for mobile menu)
export const NAV_ALL_ITEMS = [...NAV_EXPLORE_ITEMS, ...NAV_ITEMS] as const;
