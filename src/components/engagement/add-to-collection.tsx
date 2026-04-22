"use client";

import { useState, useEffect } from "react";
import { FolderHeart, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getSessionId } from "@/lib/session";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

interface Collection {
  id: string;
  name: string;
  items: { ideaId: string }[];
}

interface AddToCollectionProps {
  ideaId: string;
  compact?: boolean;
}

export function AddToCollection({ ideaId, compact = false }: AddToCollectionProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const load = async () => {
    const res = await fetch(`${BASE_PATH}/api/collections?sessionId=${getSessionId()}`);
    setCollections(await res.json());
  };

  useEffect(() => { load(); }, []);

  const isInCollection = (col: Collection) =>
    col.items.some((i) => i.ideaId === ideaId);

  const toggleItem = async (col: Collection) => {
    const inCol = isInCollection(col);
    await fetch(`${BASE_PATH}/api/collections/items`, {
      method: inCol ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectionId: col.id, ideaId }),
    });
    await load();
  };

  const createAndAdd = async () => {
    if (!newName.trim()) return;
    const res = await fetch(`${BASE_PATH}/api/collections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: getSessionId(), name: newName }),
    });
    const col = await res.json();
    if (col.id) {
      await fetch(`${BASE_PATH}/api/collections/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId: col.id, ideaId }),
      });
    }
    setNewName("");
    await load();
  };

  const savedCount = collections.filter((c) => isInCollection(c)).length;

  return (
    <div className="relative">
      {compact ? (
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "shrink-0 rounded-full p-1.5 transition-colors",
            savedCount > 0
              ? "text-primary"
              : "text-muted-foreground/40 hover:text-primary"
          )}
        >
          <FolderHeart className="size-4" fill={savedCount > 0 ? "currentColor" : "none"} />
        </button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(!open)}
          className={cn("gap-1.5", savedCount > 0 && "border-primary/40 text-primary")}
        >
          <FolderHeart className="size-3.5" />
          コレクション
          {savedCount > 0 && (
            <span className="rounded-full bg-primary/10 px-1.5 text-[10px] font-bold">{savedCount}</span>
          )}
        </Button>
      )}

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border bg-popover p-2 shadow-lg">
          {collections.length > 0 ? (
            <div className="mb-2 space-y-1">
              {collections.map((col) => {
                const inCol = isInCollection(col);
                return (
                  <button
                    key={col.id}
                    onClick={() => toggleItem(col)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                      inCol ? "bg-primary/10 text-primary" : "hover:bg-muted"
                    )}
                  >
                    {inCol ? <Check className="size-3.5" /> : <FolderHeart className="size-3.5 text-muted-foreground" />}
                    <span className="truncate">{col.name}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mb-2 px-2 text-xs text-muted-foreground">コレクションがありません</p>
          )}
          <div className="flex gap-1.5 border-t pt-2">
            <Input
              placeholder="新規作成..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createAndAdd()}
              className="h-7 text-xs"
            />
            <Button size="sm" className="h-7 px-2" onClick={createAndAdd} disabled={!newName.trim()}>
              <Plus className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
