"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
  group?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  allLabel?: string;
  grouped?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "選択...",
  allLabel = "すべて",
  grouped = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEmpty = value.length === 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = query
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          (o.group && o.group.toLowerCase().includes(query.toLowerCase()))
      )
    : options;

  // Build display label
  const displayLabel = isEmpty
    ? allLabel
    : value.length === 1
      ? (value[0].startsWith("group:") ? value[0].slice(6) : options.find((o) => o.value === value[0])?.label || value[0])
      : `${value.length}件選択中`;

  // Group items
  const allGroups = grouped
    ? Array.from(new Set(options.map((o) => o.group || ""))).filter(Boolean)
    : [];
  const groups = query
    ? allGroups.filter((g) =>
        g.toLowerCase().includes(query.toLowerCase()) ||
        filtered.some((o) => o.group === g)
      )
    : allGroups;

  const isSelected = (v: string) => value.includes(v);

  const toggleValue = (v: string) => {
    if (isSelected(v)) {
      onChange(value.filter((x) => x !== v));
    } else {
      onChange([...value, v]);
    }
  };

  const clearAll = () => onChange([]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm transition-colors",
          "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring/30",
          open && "ring-2 ring-ring/30"
        )}
      >
        <span className={cn("truncate", isEmpty && "text-muted-foreground")}>
          {displayLabel}
        </span>
        <div className="flex items-center gap-1">
          {!isEmpty && (
            <span
              onClick={(e) => { e.stopPropagation(); clearAll(); }}
              className="rounded-full p-0.5 hover:bg-muted"
            >
              <X className="size-3 text-muted-foreground" />
            </span>
          )}
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {/* Selected tags */}
      {value.length > 1 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {value.map((v) => {
            const label = v.startsWith("group:") ? v.slice(6) : options.find((o) => o.value === v)?.label || v;
            return (
              <span
                key={v}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
              >
                {label}
                <button onClick={() => toggleValue(v)}>
                  <X className="size-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-lg">
          {/* Search input */}
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="検索..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button onClick={() => setQuery("")} className="shrink-0">
                <X className="size-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Options */}
          <div className="max-h-60 overflow-y-auto p-1">
            {/* Clear all option */}
            <button
              onClick={() => { clearAll(); setQuery(""); }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                isEmpty ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
              )}
            >
              {isEmpty && <Check className="size-3.5" />}
              <span className={cn(!isEmpty && "ml-5.5")}>{allLabel}</span>
            </button>

            {grouped && groups.length > 0 ? (
              groups.map((group) => {
                const groupKey = `group:${group}`;
                const groupSelected = isSelected(groupKey);
                const children = filtered.filter((o) => o.group === group);
                return (
                  <div key={group}>
                    <button
                      onClick={() => toggleValue(groupKey)}
                      className={cn(
                        "mt-2 mb-0.5 flex w-full items-center gap-1.5 rounded-md border-l-2 px-1.5 py-1.5 text-sm font-bold transition-colors",
                        groupSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-transparent text-foreground hover:border-primary/30 hover:bg-muted"
                      )}
                    >
                      {groupSelected ? <Check className="size-3.5 shrink-0" /> : <span className="w-3.5 shrink-0" />}
                      {group}
                    </button>
                    {children.map((option) => (
                      <OptionItem
                        key={option.value}
                        option={option}
                        selected={isSelected(option.value)}
                        onSelect={() => toggleValue(option.value)}
                        indent
                      />
                    ))}
                  </div>
                );
              })
            ) : (
              filtered.map((option) => (
                <OptionItem
                  key={option.value}
                  option={option}
                  selected={isSelected(option.value)}
                  onSelect={() => toggleValue(option.value)}
                />
              ))
            )}

            {filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                該当する項目がありません
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OptionItem({ option, selected, onSelect, indent }: { option: Option; selected: boolean; onSelect: () => void; indent?: boolean }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2 rounded-md py-1.5 text-sm transition-colors",
        indent ? "pl-6 pr-2.5" : "px-2.5",
        selected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
      )}
    >
      {selected ? <Check className="size-3.5 shrink-0" /> : <span className="w-3.5 shrink-0" />}
      <span className="truncate">{option.label}</span>
    </button>
  );
}
