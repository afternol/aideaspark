"use client";

import { create } from "zustand";

interface BookmarkStore {
  bookmarkedIds: Set<string>;
  toggle: (id: string) => void;
  isBookmarked: (id: string) => boolean;
  getCount: () => number;
}

const loadBookmarks = (): Set<string> => {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem("bizidea-bookmarks");
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const saveBookmarks = (ids: Set<string>) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("bizidea-bookmarks", JSON.stringify([...ids]));
};

export const useBookmarkStore = create<BookmarkStore>((set, get) => ({
  bookmarkedIds: loadBookmarks(),
  toggle: (id: string) => {
    const next = new Set(get().bookmarkedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    saveBookmarks(next);
    set({ bookmarkedIds: next });
  },
  isBookmarked: (id: string) => get().bookmarkedIds.has(id),
  getCount: () => get().bookmarkedIds.size,
}));
