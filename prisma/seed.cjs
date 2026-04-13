const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

// Parse ideas from TS source file
const ideasPath = path.join(__dirname, "..", "src", "data", "mock", "ideas.ts");
const raw = fs.readFileSync(ideasPath, "utf-8");
const cleaned = raw
  .replace(/import type.*?\n/g, "")
  .replace(/import.*?from.*?\n/g, "")
  .replace(/export const mockIdeas:\s*BusinessIdea\[\]\s*=/, "const mockIdeas =");
const mockIdeas = new Function(cleaned + "\nreturn mockIdeas;")();

// Open SQLite DB directly
const dbPath = path.join(__dirname, "..", "dev.db");
const db = new Database(dbPath);

const insert = db.prepare(`
  INSERT OR REPLACE INTO Idea (
    id, slug, number, serviceName, concept, target, problem, product, revenueModel,
    competitors, competitiveEdge, tags, category, targetIndustry, targetCustomer, investmentScale,
    difficulty, scores, scoreComments, trendKeywords, oneLiner, publishedAt,
    views, bookmarks, inspirationSource, createdAt, updatedAt
  ) VALUES (
    @id, @slug, @number, @serviceName, @concept, @target, @problem, @product, @revenueModel,
    @competitors, @competitiveEdge, @tags, @category, @targetIndustry, @targetCustomer, @investmentScale,
    @difficulty, @scores, @scoreComments, @trendKeywords, @oneLiner, @publishedAt,
    @views, @bookmarks, @inspirationSource, @createdAt, @updatedAt
  )
`);

const now = new Date().toISOString();
const tx = db.transaction(() => {
  for (const idea of mockIdeas) {
    insert.run({
      id: idea.id,
      slug: idea.slug,
      number: idea.number,
      serviceName: idea.serviceName,
      concept: idea.concept,
      target: idea.target,
      problem: idea.problem,
      product: idea.product,
      revenueModel: idea.revenueModel,
      competitors: idea.competitors,
      competitiveEdge: idea.competitiveEdge,
      tags: JSON.stringify(idea.tags),
      category: idea.category,
      targetIndustry: idea.targetIndustry,
      targetCustomer: idea.targetCustomer,
      investmentScale: idea.investmentScale,
      difficulty: idea.difficulty,
      scores: JSON.stringify(idea.scores),
      scoreComments: JSON.stringify(idea.scoreComments),
      trendKeywords: JSON.stringify(idea.trendKeywords),
      oneLiner: idea.oneLiner,
      publishedAt: idea.publishedAt,
      views: idea.views,
      bookmarks: idea.bookmarks,
      inspirationSource: idea.inspirationSource ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }
});

tx();
db.close();
console.log(`Seeded ${mockIdeas.length} ideas into ${dbPath}`);
