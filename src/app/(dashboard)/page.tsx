"use client";

import { useEffect, useRef } from "react";

import { FeedHistoryWidget } from "@/features/panel/components/feed-history-widget";
import { FeedInhousesWidget } from "@/features/panel/components/feed-inhouses-widget";
import { FeedMembersWidget } from "@/features/panel/components/feed-members-widget";
import { PanelShell } from "@/features/panel/components/panel-shell";
import { PostCard } from "@/features/panel/components/post-card";
import { PostComposer } from "@/features/panel/components/post-composer";
import { usePosts } from "@/features/panel/use-posts";

export default function FeedPage() {
  const {
    posts,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    createPost,
    toggleLike,
    deletePost,
  } = usePosts();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll: observa um elemento sentinel no fim da lista. Quando
  // aparece na viewport, dispara loadMore. IntersectionObserver é muito mais
  // barato que escutar scroll event.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  return (
    <PanelShell showBanner={false}>
      <section className="grid gap-[28px] pb-[20px] pt-[1.5vh] sm:gap-[20px] sm:pb-[40px] sm:pt-[6vh] xl:pb-[80px] xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Coluna esquerda: composer + feed (centralizado a 680px dentro da coluna) */}
        <div className="mx-auto flex w-full min-w-0 max-w-[680px] flex-col gap-[20px] sm:gap-[14px]">
          <PostComposer onCreate={createPost} />

          {loading && posts.length === 0 && (
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/gifs/alistar.gif"
                alt=""
                className="mb-[8px] h-[180px] w-[180px] object-contain"
              />
              <p className="text-[16px] font-semibold tracking-[-0.02em] text-[#0f0f0f]">
                Nenhum post por aqui ainda.
              </p>
              <p className="mt-[6px] text-[13px] text-[#7c7c7c]">
                Seja o primeiro a postar.
              </p>
            </div>
          )}

          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={toggleLike}
              onDelete={deletePost}
            />
          ))}

          {/* Sentinel: visível dispara loadMore via IntersectionObserver */}
          {hasMore && <div ref={sentinelRef} className="h-[1px] w-full" />}

          {loadingMore && (
            <div className="flex items-center justify-center py-[20px]">
              <svg
                className="capas-spinner h-[24px] w-[24px] [&_circle]:stroke-[#ff4100]"
                viewBox="25 25 50 50"
              >
                <circle r="20" cy="50" cx="50" />
              </svg>
            </div>
          )}
        </div>

        {/* Coluna direita: histórico + inhouses + membros */}
        <aside className="flex flex-col gap-[20px] pt-[72px] sm:gap-[14px] sm:pt-0">
          <FeedHistoryWidget />
          <FeedInhousesWidget />
          <FeedMembersWidget />
        </aside>
      </section>
    </PanelShell>
  );
}
