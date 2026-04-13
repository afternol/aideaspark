"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { CATEGORIES, TARGET_INDUSTRIES, TARGET_CUSTOMERS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface IdeaFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  categories: string[];
  onCategoriesChange: (v: string[]) => void;
  industries: string[];
  onIndustriesChange: (v: string[]) => void;
  customers: string[];
  onCustomersChange: (v: string[]) => void;
  minScore: number;
  onMinScoreChange: (v: number) => void;
  sort: string;
  onSortChange: (v: string) => void;
}

const SCORE_OPTIONS = [
  { value: 0, label: "すべて" },
  { value: 2.5, label: "2.5+" },
  { value: 3.0, label: "3.0+" },
  { value: 3.5, label: "3.5+" },
  { value: 4.0, label: "4.0+" },
];

export function IdeaFilters({
  search,
  onSearchChange,
  categories,
  onCategoriesChange,
  industries,
  onIndustriesChange,
  customers,
  onCustomersChange,
  minScore,
  onMinScoreChange,
  sort,
  onSortChange,
}: IdeaFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">キーワード検索</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="キーワードで検索..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Category (領域) */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">領域</label>
        <SearchableSelect
          options={CATEGORIES}
          value={categories}
          onChange={onCategoriesChange}
          placeholder="領域を選択..."
          allLabel="すべての領域"
          grouped
        />
      </div>

      {/* Target Industry (対象業界) */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">対象業界</label>
        <SearchableSelect
          options={TARGET_INDUSTRIES}
          value={industries}
          onChange={onIndustriesChange}
          placeholder="対象業界を選択..."
          allLabel="すべての業界"
          grouped
        />
      </div>

      {/* Target Customer (対象顧客) */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">対象顧客</label>
        <SearchableSelect
          options={TARGET_CUSTOMERS}
          value={customers}
          onChange={onCustomersChange}
          placeholder="対象顧客を選択..."
          allLabel="すべての顧客"
          grouped
        />
      </div>

      {/* Score range */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">総合スコア</label>
        <div className="flex gap-1">
          {SCORE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onMinScoreChange(opt.value)}
              className={cn(
                "flex-1 rounded-md py-1.5 text-center text-xs font-medium transition-colors",
                minScore === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">並び替え</label>
        <Select value={sort} onValueChange={(v: string | null) => v && onSortChange(v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="並び替え" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="新着順">新着順</SelectItem>
            <SelectItem value="総合スコア順">総合スコア順</SelectItem>
            <SelectItem value="成長ポテンシャル順">成長ポテンシャル順</SelectItem>
            <SelectItem value="始めやすさ順">始めやすさ順</SelectItem>
            <SelectItem value="新規性順">新規性順</SelectItem>
            <SelectItem value="市場規模順">市場規模順</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
