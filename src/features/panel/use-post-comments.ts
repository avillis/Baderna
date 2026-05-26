"use client";

import { useCallback, useEffect, useState } from "react";

import { authToken } from "@/features/panel/use-auth";
import type { Comment } from "@/features/panel/use-comments";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

const CACHE_PREFIX = "baderna:post-comments-cache:";
const UPDATE_EVENT = "baderna:post-comments-updated";

function cacheKey(postId: number) {
  return CACHE_PREFIX + postId;
}

function readCache(postId: number): Comment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(cacheKey(postId));
    return raw ? (JSON.parse(raw) as Comment[]) : [];
  } catch {
    return [];
  }
}

function writeCache(postId: number, list: Comment[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(cacheKey(postId), JSON.stringify(list));
  queueMicrotask(() => window.dispatchEvent(new Event(UPDATE_EVENT)));
}

function authHeaders(): Record<string, string> {
  const token = authToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchFromApi(postId: number): Promise<Comment[] | null> {
  const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
    headers: { Accept: "application/json", ...authHeaders() },
  });
  if (!res.ok) return null;
  return (await res.json()) as Comment[];
}

async function postToApi(
  postId: number,
  body: string,
  imageUrl?: string | null,
  gifUrl?: string | null,
  parentId?: string | null,
): Promise<Comment | null> {
  const token = authToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/posts/${postId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      body,
      image_url: imageUrl ?? null,
      gif_url: gifUrl ?? null,
      parent_id: parentId ?? null,
    }),
  });
  if (!res.ok) return null;
  return (await res.json()) as Comment;
}

async function deleteFromApi(postId: number, commentId: string): Promise<boolean> {
  const token = authToken();
  if (!token) return false;
  const res = await fetch(
    `${API_BASE}/posts/${postId}/comments/${encodeURIComponent(commentId)}`,
    {
      method: "DELETE",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    },
  );
  return res.ok;
}

async function likeFromApi(
  postId: number,
  commentId: string,
): Promise<{ likesCount: number; likedByMe: boolean } | null> {
  const token = authToken();
  if (!token) return null;
  const res = await fetch(
    `${API_BASE}/posts/${postId}/comments/${encodeURIComponent(commentId)}/like`,
    {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    },
  );
  if (!res.ok) return null;
  return (await res.json()) as { likesCount: number; likedByMe: boolean };
}

export function usePostComments(postId: number) {
  const [comments, setComments] = useState<Comment[]>(() => readCache(postId));

  useEffect(() => {
    setComments(readCache(postId));
    let cancelled = false;
    fetchFromApi(postId)
      .then((fresh) => {
        if (cancelled || !fresh) return;
        setComments(fresh);
        writeCache(postId, fresh);
      })
      .catch(() => {});

    function refresh() {
      setComments(readCache(postId));
    }
    window.addEventListener(UPDATE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(UPDATE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [postId]);

  const addComment = useCallback(
    async (body: string, imageUrl?: string | null, gifUrl?: string | null) => {
      const trimmed = body.trim();
      if (!trimmed && !imageUrl && !gifUrl) return null;
      const fresh = await postToApi(postId, trimmed, imageUrl ?? null, gifUrl ?? null, null);
      if (!fresh) return null;
      const next = [{ ...fresh, replies: [] }, ...comments];
      setComments(next);
      writeCache(postId, next);
      return fresh;
    },
    [postId, comments],
  );

  const addReply = useCallback(
    async (
      parentId: string,
      body: string,
      imageUrl?: string | null,
      gifUrl?: string | null,
    ) => {
      const trimmed = body.trim();
      if (!trimmed && !imageUrl && !gifUrl) return null;
      const fresh = await postToApi(postId, trimmed, imageUrl ?? null, gifUrl ?? null, parentId);
      if (!fresh) return null;
      const next = comments.map((c) => {
        if (c.id !== parentId) return c;
        return { ...c, replies: [...(c.replies ?? []), fresh] };
      });
      setComments(next);
      writeCache(postId, next);
      return fresh;
    },
    [postId, comments],
  );

  const removeComment = useCallback(
    async (id: string) => {
      const ok = await deleteFromApi(postId, id);
      if (!ok) return false;
      // Remove top-level or reply
      const next = comments
        .filter((c) => c.id !== id)
        .map((c) => ({
          ...c,
          replies: (c.replies ?? []).filter((r) => r.id !== id),
        }));
      setComments(next);
      writeCache(postId, next);
      return true;
    },
    [postId, comments],
  );

  const toggleLike = useCallback(
    async (commentId: string) => {
      // Optimistic update
      function applyToggle(list: Comment[]): Comment[] {
        return list.map((c) => {
          if (c.id === commentId) {
            const liked = !c.likedByMe;
            return {
              ...c,
              likedByMe: liked,
              likesCount: (c.likesCount ?? 0) + (liked ? 1 : -1),
            };
          }
          if (c.replies?.some((r) => r.id === commentId)) {
            return {
              ...c,
              replies: c.replies.map((r) => {
                if (r.id !== commentId) return r;
                const liked = !r.likedByMe;
                return {
                  ...r,
                  likedByMe: liked,
                  likesCount: (r.likesCount ?? 0) + (liked ? 1 : -1),
                };
              }),
            };
          }
          return c;
        });
      }

      setComments((prev) => applyToggle(prev));

      const result = await likeFromApi(postId, commentId);
      if (!result) {
        // Revert on failure
        setComments((prev) => applyToggle(prev));
        return;
      }

      // Apply confirmed values
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            return { ...c, likesCount: result.likesCount, likedByMe: result.likedByMe };
          }
          if (c.replies?.some((r) => r.id === commentId)) {
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === commentId
                  ? { ...r, likesCount: result.likesCount, likedByMe: result.likedByMe }
                  : r,
              ),
            };
          }
          return c;
        }),
      );
    },
    [postId],
  );

  return { comments, addComment, addReply, removeComment, toggleLike };
}
