"use client";

import { getSessionId } from "./session";
import type { IdeaWithEngagement, IdeaComment } from "./types";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_PATH}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  ideas: {
    list: (params?: Record<string, string>) => {
      const merged = { sessionId: getSessionId(), ...params };
      const qs = `?${new URLSearchParams(merged)}`;
      return request<IdeaWithEngagement[]>(`/ideas${qs}`);
    },
    get: (id: string) =>
      request<IdeaWithEngagement>(`/ideas/${id}?sessionId=${getSessionId()}`),
    getBySlug: (slug: string) =>
      request<IdeaWithEngagement>(`/ideas/by-slug/${slug}?sessionId=${getSessionId()}`),
  },
  reactions: {
    toggle: (ideaId: string, type: string) =>
      request<{ toggled: boolean }>(`/ideas/${ideaId}/reactions`, {
        method: "POST",
        body: JSON.stringify({ sessionId: getSessionId(), type }),
      }),
  },
  comments: {
    list: (ideaId: string) =>
      request<IdeaComment[]>(`/ideas/${ideaId}/comments`),
    create: (ideaId: string, body: string, nickname?: string, parentId?: string) =>
      request<IdeaComment>(`/ideas/${ideaId}/comments`, {
        method: "POST",
        body: JSON.stringify({ sessionId: getSessionId(), body, nickname, parentId }),
      }),
  },
};
