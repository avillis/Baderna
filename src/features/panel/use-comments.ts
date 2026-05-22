"use client";

import { useCallback, useEffect, useState } from "react";

import { authToken } from "@/features/panel/use-auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

const CACHE_PREFIX = "baderna:comments-cache:";
const UPDATE_EVENT = "baderna:comments-updated";

export type Comment = {
  id: string;
  authorId?: number;
  author: string;
  authorAvatar?: string;
  body: string;
  createdAt: number;
};

function cacheKey(memberId: string) {
  return CACHE_PREFIX + memberId;
}

function readCache(memberId: string): Comment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(cacheKey(memberId));
    return raw ? (JSON.parse(raw) as Comment[]) : [];
  } catch {
    return [];
  }
}

function writeCache(memberId: string, list: Comment[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(cacheKey(memberId), JSON.stringify(list));
  queueMicrotask(() => window.dispatchEvent(new Event(UPDATE_EVENT)));
}

async function fetchFromApi(memberId: string): Promise<Comment[] | null> {
  const res = await fetch(
    `${API_BASE}/members/${encodeURIComponent(memberId)}/comments`,
    { headers: { Accept: "application/json" } },
  );
  if (!res.ok) return null;
  return (await res.json()) as Comment[];
}

async function postToApi(
  memberId: string,
  body: string,
): Promise<Comment | null> {
  const token = authToken();
  if (!token) return null;
  const res = await fetch(
    `${API_BASE}/members/${encodeURIComponent(memberId)}/comments`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ body }),
    },
  );
  if (!res.ok) return null;
  return (await res.json()) as Comment;
}

async function deleteFromApi(memberId: string, commentId: string): Promise<boolean> {
  const token = authToken();
  if (!token) return false;
  const res = await fetch(
    `${API_BASE}/members/${encodeURIComponent(memberId)}/comments/${encodeURIComponent(commentId)}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return res.ok;
}

export function useComments(memberId: string) {
  const [comments, setComments] = useState<Comment[]>(() => readCache(memberId));

  useEffect(() => {
    setComments(readCache(memberId));
    let cancelled = false;
    fetchFromApi(memberId)
      .then((fresh) => {
        if (cancelled || !fresh) return;
        setComments(fresh);
        writeCache(memberId, fresh);
      })
      .catch(() => {});

    function refresh() {
      setComments(readCache(memberId));
    }
    window.addEventListener(UPDATE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(UPDATE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [memberId]);

  const addComment = useCallback(
    async (body: string, _author: string, _authorAvatar?: string) => {
      const trimmed = body.trim();
      if (!trimmed) return;
      const fresh = await postToApi(memberId, trimmed);
      if (!fresh) return;
      const next = [fresh, ...comments];
      setComments(next);
      writeCache(memberId, next);
    },
    [memberId, comments],
  );

  const removeComment = useCallback(
    async (id: string) => {
      const ok = await deleteFromApi(memberId, id);
      if (!ok) return;
      const next = comments.filter((c) => c.id !== id);
      setComments(next);
      writeCache(memberId, next);
    },
    [memberId, comments],
  );

  return { comments, addComment, removeComment };
}

export function formatCommentDate(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Agora";
  if (m < 60) return `Há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Há ${d}d`;
  return new Date(ts).toLocaleDateString("pt-BR");
}
