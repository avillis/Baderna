"use client";

import { useEffect, useState } from "react";

import { PanelShell } from "@/features/panel/components/panel-shell";
import { PostCard } from "@/features/panel/components/post-card";
import { authToken } from "@/features/panel/use-auth";
import { type FeedPost } from "@/features/panel/use-posts";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

export default function SalvosPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = authToken();
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/bookmarks`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => (res.ok ? res.json() : { posts: [] }))
      .then((data: { posts: FeedPost[] }) => {
        setPosts(data.posts ?? []);
      })
      .catch(() => {
        setPosts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <PanelShell showBanner={false}>
      <section className="pb-[20px] pt-[1.5vh] sm:pb-[40px] sm:pt-[6vh] xl:pb-[80px]">
        <div className="mx-auto flex w-full min-w-0 max-w-[680px] flex-col gap-[20px] sm:gap-[14px]">
          <h1 className="text-[22px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
            Salvos
          </h1>

          {loading && (
            <div className="flex items-center justify-center py-[40px]">
              <svg
                className="capas-spinner h-[28px] w-[28px] [&_circle]:stroke-[#ff4100]"
                viewBox="25 25 50 50"
              >
                <circle r="20" cy="50" cx="50" />
              </svg>
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-[60px] text-center">
              <svg
                className="mb-[16px] h-[48px] w-[48px] text-[#d0d0d0]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 7.8C5 6.11984 5 5.27976 5.32698 4.63803C5.6146 4.07354 6.07354 3.6146 6.63803 3.32698C7.27976 3 8.11984 3 9.8 3H14.2C15.8802 3 16.7202 3 17.362 3.32698C17.9265 3.6146 18.3854 4.07354 18.673 4.63803C19 5.27976 19 6.11984 19 7.8V21L12 17L5 21V7.8Z" />
              </svg>
              <p className="text-[16px] font-semibold tracking-[-0.02em] text-[#0f0f0f]">
                Nenhum post salvo ainda.
              </p>
              <p className="mt-[6px] text-[13px] text-[#7c7c7c]">
                Salve posts clicando no ícone de marcador.
              </p>
            </div>
          )}

          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </PanelShell>
  );
}
