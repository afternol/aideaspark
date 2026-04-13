"use client";

import { useState, useMemo, useEffect } from "react";
import { SlidersHorizontal, X, Loader2, Search, LayoutGrid, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IdeaSummaryCard } from "@/components/ideas/idea-summary-card";
import { WeeklyPicks } from "@/components/ideas/weekly-picks";
import { PersonalPicks } from "@/components/ideas/personal-picks";
import { AISearch } from "@/components/ideas/ai-search";
import { IdeaFilters } from "@/components/ideas/idea-filters";
import { api } from "@/lib/api-client";
import { CATEGORIES, TARGET_INDUSTRIES, TARGET_CUSTOMERS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { IdeaWithEngagement, IdeaScore } from "@/lib/types";

const avg = (scores: IdeaScore) =>
  Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;

function expandSelections(selected: string[], allOptions: { value: string; group?: string }[]): Set<string> | null {
  if (selected.length === 0) return null;
  const expanded = new Set<string>();
  for (const v of selected) {
    if (v.startsWith("group:")) {
      const groupName = v.slice(6);
      allOptions.filter((o) => o.group === groupName).forEach((o) => expanded.add(o.value));
    } else {
      expanded.add(v);
    }
  }
  return expanded;
}

export default function FeedPage() {
  const [ideas, setIdeas] = useState<IdeaWithEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [customers, setCustomers] = useState<string[]>([]);
  const [minScore, setMinScore] = useState(0);
  const [sort, setSort] = useState("新着順");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [pageSize, setPageSize] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    api.ideas.list().then((data) => { setIdeas(data); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    let result = [...ideas];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.serviceName.toLowerCase().includes(q) ||
          i.concept.toLowerCase().includes(q) ||
          i.oneLiner.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    const catSet = expandSelections(categories, CATEGORIES);
    if (catSet) result = result.filter((i) => catSet.has(i.category));

    const indSet = expandSelections(industries, TARGET_INDUSTRIES);
    if (indSet) result = result.filter((i) => indSet.has(i.targetIndustry));

    const custSet = expandSelections(customers, TARGET_CUSTOMERS);
    if (custSet) result = result.filter((i) => custSet.has(i.targetCustomer));

    if (minScore > 0) {
      result = result.filter((i) => avg(i.scores) >= minScore);
    }

    switch (sort) {
      case "総合スコア順":
        result.sort((a, b) => avg(b.scores) - avg(a.scores));
        break;
      case "成長ポテンシャル順":
        result.sort((a, b) => (b.scores.growth + b.scores.marketSize) - (a.scores.growth + a.scores.marketSize));
        break;
      case "始めやすさ順":
        result.sort((a, b) => (b.scores.feasibility + b.scores.profitability) - (a.scores.feasibility + a.scores.profitability));
        break;
      case "新規性順":
        result.sort((a, b) => b.scores.novelty - a.scores.novelty);
        break;
      case "市場規模順":
        result.sort((a, b) => b.scores.marketSize - a.scores.marketSize);
        break;
      default:
        result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }

    return result;
  }, [ideas, search, categories, industries, customers, minScore, sort]);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [filtered.length, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const startIdx = (currentPage - 1) * pageSize;
  const displayed = filtered.slice(startIdx, startIdx + pageSize);

  const filterProps = {
    search, onSearchChange: setSearch,
    categories, onCategoriesChange: setCategories,
    industries, onIndustriesChange: setIndustries,
    customers, onCustomersChange: setCustomers,
    minScore, onMinScoreChange: setMinScore,
    sort, onSortChange: setSort,
  };

  return (
    <div className="-m-4 flex md:-m-6">
      {/* Left sidebar */}
      <aside className="hidden w-72 shrink-0 border-r bg-muted/30 lg:block">
        <div className="sticky top-14 h-[calc(100dvh-3.5rem)] overflow-y-auto px-5 pb-5 pt-3">
          <div className="mb-3 flex items-center gap-2">
            <Search className="size-5 text-primary" />
            <h2 className="text-lg font-bold">検索</h2>
          </div>
          <IdeaFilters {...filterProps} />
        </div>
      </aside>

      {/* Right main */}
      <div className="min-w-0 flex-1 p-5 md:p-6">
        {/* Mobile filter bar */}
        <div className="mb-4 flex items-center gap-2 lg:hidden">
          <Button
            variant={mobileFilterOpen ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
          >
            {mobileFilterOpen ? <X className="size-4" /> : <SlidersHorizontal className="size-4" />}
            絞り込み
            {(categories.length > 0 || industries.length > 0 || customers.length > 0 || minScore > 0 || search) && (
              <span className="flex size-5 items-center justify-center rounded-full bg-primary-foreground/20 text-[10px] font-bold">
                {[categories.length > 0, industries.length > 0, customers.length > 0, minScore > 0, !!search].filter(Boolean).length}
              </span>
            )}
          </Button>
          {/* Quick sort on mobile */}
          <Select value={sort} onValueChange={(v: string | null) => v && setSort(v)}>
            <SelectTrigger className="h-8 w-auto flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="新着順">新着順</SelectItem>
              <SelectItem value="総合スコア順">スコア順</SelectItem>
              <SelectItem value="成長ポテンシャル順">成長性順</SelectItem>
              <SelectItem value="始めやすさ順">始めやすさ順</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {mobileFilterOpen && (
          <div className="mb-4 rounded-lg border bg-card p-4 lg:hidden">
            <IdeaFilters {...filterProps} />
          </div>
        )}

        {/* AI Search */}
        <AISearch />

        {/* Personal recommendations */}
        {!loading && <PersonalPicks />}

        {/* Weekly picks */}
        {!loading && ideas.length > 0 && (
          <WeeklyPicks ideas={ideas} />
        )}

        {/* Idea list header */}
        {!loading && (
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutGrid className="size-5 text-primary" />
              <h2 className="text-lg font-bold">アイデア一覧</h2>
              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5">
                <span className="text-sm font-extrabold text-primary">{filtered.length}</span>
                <span className="text-[10px] font-medium text-primary/70">件</span>
                {filtered.length !== ideas.length && (
                  <span className="text-[10px] text-muted-foreground">/ {ideas.length}</span>
                )}
              </div>
            </div>

            {/* Page size dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">表示件数</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v: string | null) => v && setPageSize(Number(v))}
              >
                <SelectTrigger className="h-8 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12件</SelectItem>
                  <SelectItem value="24">24件</SelectItem>
                  <SelectItem value="48">48件</SelectItem>
                  <SelectItem value="100">100件</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed p-16 text-center">
            <p className="text-lg font-medium text-muted-foreground">条件に合うアイデアが見つかりません</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {displayed.map((idea) => (
                <IdeaSummaryCard key={idea.id} idea={idea} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="size-8 p-0"
                >
                  <ChevronLeft className="size-4" />
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                  .reduce<(number | "...")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] ?? 0) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`dot-${i}`} className="px-1 text-xs text-muted-foreground">...</span>
                    ) : (
                      <Button
                        key={p}
                        variant={currentPage === p ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(p as number)}
                        className="size-8 p-0 text-xs"
                      >
                        {p}
                      </Button>
                    )
                  )}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="size-8 p-0"
                >
                  <ChevronRight className="size-4" />
                </Button>

                <span className="ml-2 text-xs text-muted-foreground">
                  {startIdx + 1}-{Math.min(startIdx + pageSize, filtered.length)} / {filtered.length}件
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
