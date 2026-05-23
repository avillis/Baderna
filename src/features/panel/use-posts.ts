"use client";

import { useCallback, useEffect, useState } from "react";

import { authToken } from "@/features/panel/use-auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

export type FeedPost = {
  id: number;
  shortCode: string;
  content: string;
  imageUrl: string | null;
  gifUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  liked: boolean;
  author: {
    id: number | null;
    name: string | null;
    gameNick: string;
    avatarSrc: string | null;
  };
};

type ApiList = { posts: FeedPost[] };
type ApiOne = { post: FeedPost };

function authHeaders(): Record<string, string> {
  const token = authToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchPosts(before?: number): Promise<FeedPost[]> {
  const url = before
    ? `${API_BASE}/posts?before=${before}`
    : `${API_BASE}/posts`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", ...authHeaders() },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as ApiList;
  return data.posts ?? [];
}

export async function fetchPost(idOrCode: string | number): Promise<FeedPost | null> {
  const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(String(idOrCode))}`, {
    headers: { Accept: "application/json", ...authHeaders() },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as ApiOne;
  return data.post ?? null;
}

async function postCreate(payload: {
  content: string;
  imageUrl?: string | null;
  gifUrl?: string | null;
  videoUrl?: string | null;
}): Promise<FeedPost | null> {
  const res = await fetch(`${API_BASE}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({
      content: payload.content,
      image_url: payload.imageUrl ?? null,
      gif_url: payload.gifUrl ?? null,
      video_url: payload.videoUrl ?? null,
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
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    body: form,
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { url?: string };
  return data.url ?? null;
}

export const MAX_VIDEO_SIZE_BYTES = 20 * 1024 * 1024;

export async function uploadPostVideo(file: File): Promise<string | null> {
  const token = authToken();
  if (!token) return null;
  if (file.size > MAX_VIDEO_SIZE_BYTES) return null;
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/posts/video`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    body: form,
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { url?: string };
  return data.url ?? null;
}

async function apiToggleLike(
  id: number,
): Promise<{ liked: boolean; likesCount: number } | null> {
  const res = await fetch(`${API_BASE}/posts/${id}/like`, {
    method: "POST",
    headers: { Accept: "application/json", ...authHeaders() },
  });
  if (!res.ok) return null;
  return (await res.json()) as { liked: boolean; likesCount: number };
}

async function apiDeletePost(id: number): Promise<boolean> {
  const res = await fetch(`${API_BASE}/posts/${id}`, {
    method: "DELETE",
    headers: { Accept: "application/json", ...authHeaders() },
  });
  return res.ok;
}

const PAGE_SIZE = 5;

// ── Mock pra testes locais ─────────────────────────────────────────────
// Só aparece em localhost. Remove esse bloco quando não precisar mais.
export function isLocalDev() {
  return (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  );
}

export const MOCK_POST_ID = -1;
export const MOCK_POST_CODE = "mockpost";

export function getMockPost(): FeedPost {
  return MOCK_POST;
}

const MOCK_POST: FeedPost = {
  id: -1,
  shortCode: "mockpost",
  content:
    "Post fictício pra testar ajustes de UI 🛠️\n\nLike, comentário, vídeo etc são mockados — não tocam na API.",
  imageUrl:
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Jinx_0.jpg",
  gifUrl: null,
  videoUrl: null,
  createdAt: new Date().toISOString(),
  likesCount: 7,
  commentsCount: 2,
  liked: false,
  author: {
    id: -1,
    name: "Mock Tester",
    gameNick: "MockTester#000",
    avatarSrc: null,
  },
};

export function usePosts() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPosts()
      .then((fresh) => {
        if (cancelled) return;
        const withMock = isLocalDev() ? [MOCK_POST, ...fresh] : fresh;
        setPosts(withMock);
        if (fresh.length < PAGE_SIZE) setHasMore(false);
      })
      .catch(() => {
        if (cancelled) return;
        if (isLocalDev()) {
          setPosts([MOCK_POST]);
          setHasMore(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Carrega a próxima página (cursor-based: usa o id do último post como
   * `before`). Idempotente: já chamadas duplicadas durante o fetch viram no-op.
   */
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    try {
      const lastId = posts[posts.length - 1]?.id;
      if (!lastId) return;
      const more = await fetchPosts(lastId);
      setPosts((curr) => [...curr, ...more]);
      if (more.length < PAGE_SIZE) setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [posts, loadingMore, hasMore, loading]);

  const createPost = useCallback(
    async (input: {
      content: string;
      imageUrl?: string | null;
      gifUrl?: string | null;
      videoUrl?: string | null;
    }) => {
      const created = await postCreate(input);
      if (!created) return null;
      setPosts((curr) => [created, ...curr]);
      return created;
    },
    [],
  );

  const toggleLike = useCallback(async (id: number) => {
    // Update otimista
    setPosts((curr) =>
      curr.map((p) =>
        p.id === id
          ? {
              ...p,
              liked: !p.liked,
              likesCount: p.likesCount + (p.liked ? -1 : 1),
            }
          : p,
      ),
    );
    // Mock: pula a API, só vive em memória.
    if (id === MOCK_POST_ID) return;
    const result = await apiToggleLike(id);
    if (!result) {
      // Rollback se falhou
      setPosts((curr) =>
        curr.map((p) =>
          p.id === id
            ? {
                ...p,
                liked: !p.liked,
                likesCount: p.likesCount + (p.liked ? -1 : 1),
              }
            : p,
        ),
      );
      return;
    }
    // Sincroniza com o server (caso de race condition)
    setPosts((curr) =>
      curr.map((p) =>
        p.id === id
          ? { ...p, liked: result.liked, likesCount: result.likesCount }
          : p,
      ),
    );
  }, []);

  const deletePost = useCallback(async (id: number) => {
    const ok = await apiDeletePost(id);
    if (!ok) return false;
    setPosts((curr) => curr.filter((p) => p.id !== id));
    return true;
  }, []);

  return {
    posts,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    createPost,
    toggleLike,
    deletePost,
  };
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

/** Formato "23/05/2025" — usado no permalink. */
export function formatPostDateLong(iso: string): string {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "";
  return new Date(ts).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Exporta o toggle/delete pra páginas individuais (post detail) usarem.
export { apiToggleLike, apiDeletePost };
