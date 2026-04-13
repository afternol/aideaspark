"use client";

import { GLOSSARY } from "@/lib/glossary";

interface GlossaryTextProps {
  text: string;
  className?: string;
}

export function GlossaryText({ text, className }: GlossaryTextProps) {
  // Split text by glossary terms and wrap matches with tooltips
  const terms = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length); // Longer terms first
  const regex = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");

  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        const definition = GLOSSARY[part];
        if (definition) {
          return (
            <span key={i} className="group/term relative inline">
              <span className="cursor-help border-b border-dashed border-primary/40 text-primary/80 transition-colors hover:text-primary">
                {part}
              </span>
              <span className="pointer-events-none absolute bottom-full left-1/2 z-[100] mb-2 w-64 -translate-x-1/2 rounded-lg border bg-popover px-3 py-2 text-xs leading-relaxed text-popover-foreground opacity-0 shadow-lg transition-opacity group-hover/term:opacity-100">
                <span className="mb-1 block font-bold text-primary">{part}</span>
                {definition}
              </span>
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
