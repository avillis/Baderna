"use client";

import { useCallback, useEffect, useState } from "react";

import { authToken } from "@/features/panel/use-auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

export type FeedPost = {
  id: number;
  content: string;
  imageUrl: string | null;
  gifUrl: string | null;
  createdAt: string;
  author: {
    id: number | null;
    name: string | null;
    gameNick: string;
    avatarSrc: string | null;
  };
};

type ApiList = { posts: FeedPost[] };
type ApiOne = { post: FeedPost };

async function fetchPosts(before?: number): Promise<FeedPost[]> {
  const url = before
    ? `${API_BASE}/posts?before=${before}`
    : `${API_BASE}/posts`;
  const token = authToken();
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as ApiList;
  return data.posts ?? [];
}

async function postCreate(payload: {
  content: string;
  imageUrl?: string | null;
  gifUrl?: string | null;
}): Promise<FeedPost | null> {
  const token = authToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      content: payload.content,
      image_url: payload.imageUrl ?? null,
      gif_url: payload.gifUrl ?? null,
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as ApiOne;
  return data.post ?? null;
}

export async function uploadPostImage(file: File): Promise<string | null> {
  const token = authToken();
  if (!token) return null;
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/posts/image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: form,
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { url?: string };
  return data.url ?? null;
}

export function usePosts() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPosts()
      .then((fresh) => {
        if (cancelled) return;
        setPosts(fresh);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const createPost = useCallback(
    async (input: {
      content: string;
      imageUrl?: string | null;
      gifUrl?: string | null;
    }) => {
      const created = await postCreate(input);
      if (!created) return null;
      setPosts((curr) => [created, ...curr]);
      return created;
    },
    [],
  );

  return { posts, loading, createPost };
}

export function formatPostDate(iso: string): string {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Agora";
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(ts).toLocaleDateString("pt-BR");
}
