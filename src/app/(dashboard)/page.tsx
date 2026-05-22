"use client";

import { FeedHistoryWidget } from "@/features/panel/components/feed-history-widget";
import { FeedInhousesWidget } from "@/features/panel/components/feed-inhouses-widget";
import { FeedMembersWidget } from "@/features/panel/components/feed-members-widget";
import { PanelShell } from "@/features/panel/components/panel-shell";
import { PostCard } from "@/features/panel/components/post-card";
import { PostComposer } from "@/features/panel/components/post-composer";
import { usePosts } from "@/features/panel/use-posts";

export default function FeedPage() {
  const { posts, loading, createPost } = usePosts();

  return (
    <PanelShell showBanner={false}>
      <section className="grid gap-[20px] pb-[80px] pt-[10px] xl:grid-cols-[minmax(0,1fr)_320px] xl:pr-[45px]">
        {/* Coluna esquerda: composer + feed */}
        <div className="flex min-w-0 flex-col gap-[14px]">
          <PostComposer onCreate={createPost} />

          {loading && posts.length === 0 && (
            <p className="py-[40px] text-center text-[13px] text-[#8d8d8d]">
              Carregando posts...
            </p>
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
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {/* Coluna direita: histórico + inhouses + membros */}
        <aside className="flex flex-col gap-[14px]">
          <FeedHistoryWidget />
          <FeedInhousesWidget />
          <FeedMembersWidget />
        </aside>
      </section>
    </PanelShell>
  );
}
