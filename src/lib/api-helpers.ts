import type { BusinessIdea } from "./types";

// Convert DB row (JSON strings) to BusinessIdea
export function serializeIdea(row: any): BusinessIdea {
  const { _count, createdAt, updatedAt, ...rest } = row;
  return {
    ...rest,
    tags: typeof rest.tags === "string" ? JSON.parse(rest.tags) : rest.tags,
    scores: typeof rest.scores === "string" ? JSON.parse(rest.scores) : rest.scores,
    scoreComments: typeof rest.scoreComments === "string" ? JSON.parse(rest.scoreComments) : rest.scoreComments,
    trendKeywords: typeof rest.trendKeywords === "string" ? JSON.parse(rest.trendKeywords) : rest.trendKeywords,
  };
}
