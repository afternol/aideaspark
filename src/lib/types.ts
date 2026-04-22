export interface IdeaScore {
  novelty: number;
  marketSize: number;
  profitability: number;
  growth: number;
  feasibility: number;
  moat: number;
}

export interface IdeaScoreComment {
  novelty: string;
  marketSize: string;
  profitability: string;
  growth: string;
  feasibility: string;
  moat: string;
}

export type IdeaCategory = string;

export type InvestmentScale = "〜50万円" | "50〜200万円" | "200〜500万円" | "500万円〜";

export type Difficulty = "低" | "中" | "高";

export type TargetIndustry = string;

export type TargetCustomer = string;

export interface BusinessIdea {
  id: string;
  slug: string;
  number: number;
  serviceName: string;
  concept: string;
  target: string;
  problem: string;
  product: string;
  revenueModel: string;
  competitors: string;
  competitiveEdge: string;
  tags: string[];
  category: IdeaCategory;
  targetIndustry: TargetIndustry;
  targetCustomer: TargetCustomer;
  investmentScale: InvestmentScale;
  difficulty: Difficulty;
  scores: IdeaScore;
  scoreComments: IdeaScoreComment;
  trendKeywords: string[];
  publishedAt: string;
  views: number;
  bookmarks: number;
  oneLiner: string;
  inspirationSource?: string;
  patterns?: string[];
  whyNow?: string;
  noveltyNote?: string;
  strengthNote?: string;
  patternRationale?: string;
}

export interface TrendItem {
  id: string;
  keyword: string;
  category: string;
  momentum: "rising" | "stable" | "declining";
  score: number;
  relatedIdeaIds: string[];
  description: string;
}

export const SCORE_LABELS: Record<keyof IdeaScore, string> = {
  novelty: "新規性",
  marketSize: "市場規模",
  profitability: "収益性",
  growth: "成長性",
  feasibility: "実現可能性",
  moat: "参入障壁",
};

export const SCORE_VIEWPOINTS: Record<keyof IdeaScore, string> = {
  novelty: "既存にない独自の価値",
  marketSize: "対象市場の大きさ",
  profitability: "利益を生む力",
  growth: "中長期の伸びしろ",
  feasibility: "技術・コストの現実度",
  moat: "模倣されにくさ",
};

// Engagement types
export type ReactionType = "like" | "interested" | "helpful";

export const REACTION_TYPES: { key: ReactionType; label: string; emoji: string }[] = [
  { key: "like", label: "いいね", emoji: "👍" },
  { key: "interested", label: "気になる", emoji: "👀" },
  { key: "helpful", label: "参考になった", emoji: "💡" },
];

export interface IdeaComment {
  id: string;
  ideaId: string;
  sessionId: string;
  nickname: string;
  body: string;
  parentId: string | null;
  createdAt: string;
}

export interface IdeaWithEngagement extends BusinessIdea {
  reactionCount: number;
  commentCount: number;
  declarationCount: number;
  reactionCounts?: Record<string, number>;
  userReactions?: ReactionType[];
}
