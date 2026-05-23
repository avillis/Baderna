"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useToast } from "@/components/toast";
import { FeedHistoryWidget } from "@/features/panel/components/feed-history-widget";
import { FeedInhousesWidget } from "@/features/panel/components/feed-inhouses-widget";
import { FeedMembersWidget } from "@/features/panel/components/feed-members-widget";
import { PanelShell } from "@/features/panel/components/panel-shell";
import { PostCard } from "@/features/panel/components/post-card";
import { PostCommentsSection } from "@/features/panel/components/post-comments-section";
import {
  apiDeletePost,
  apiToggleLike,
  fetchPost,
  getMockPost,
  isLocalDev,
  MOCK_POST_CODE,
  MOCK_POST_ID,
  type FeedPost,
} from "@/features/panel/use-posts";

export default function PostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  // Pode ser ID numérico (compat legado) ou short_code novo (8 chars).
  const idOrCode = params.id;
  const [post, setPost] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!idOrCode) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    // Mock local: serve da memória, evita 404 na API.
    const isMock =
      idOrCode === MOCK_POST_CODE || idOrCode === String(MOCK_POST_ID);
    if (isMock && isLocalDev()) {
      setPost(getMockPost());
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchPost(idOrCode)
      .then((fresh) => {
        if (cancelled) return;
        if (!fresh) {
          setNotFound(true);
        } else {
          setPost(fresh);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [idOrCode]);

  async function handleLike(postId: number) {
    if (!post) return;
    // Mock: toggle só em memória, sem API.
    if (postId === MOCK_POST_ID) {
      setPost({
        ...post,
        liked: !post.liked,
        likesCount: post.likesCount + (post.liked ? -1 : 1),
      });
      return;
    }
    const prev = post;
    setPost({
      ...post,
      liked: !post.liked,
      likesCount: post.likesCount + (post.liked ? -1 : 1),
    });
    const result = await apiToggleLike(postId);
    if (!result) {
      setPost(prev);
      toast.show("Não foi possível curtir.");
      return;
    }
    setPost({
      ...prev,
      liked: result.liked,
      likesCount: result.likesCount,
    });
  }

  async function handleDelete(postId: number) {
    const ok = await apiDeletePost(postId);
    if (!ok) {
      toast.show("Não foi possível apagar.");
      return;
    }
    toast.show("Post apagado.", "success");
    router.push("/");
  }

  return (
    <PanelShell showBanner={false}>
      <section className="grid gap-[20px] pb-[80px] pt-[1.5vh] sm:pt-[6vh] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="mx-auto flex w-full min-w-0 max-w-[680px] flex-col gap-[14px]">
        <Link
          href="/"
          className="inline-flex h-[50px] w-fit items-center gap-[6px] rounded-[18px] bg-[#ededed] px-[20px] text-[13px] font-bold tracking-[-0.02em] text-[#0f0f0f] transition-colors hover:bg-[#e3e3e3]"
        >
          <ChevronLeft className="h-[16px] w-[16px]" strokeWidth={2.4} />
          Voltar pro feed
        </Link>

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

        {notFound && (
          <div className="flex flex-col items-center py-[60px] text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/gifs/sad-riot.gif"
              alt=""
              className="mb-[12px] h-[160px] w-[160px] object-contain"
            />
            <p className="text-[16px] font-semibold tracking-[-0.02em] text-[#0f0f0f]">
              Post não encontrado.
            </p>
            <p className="mt-[6px] text-[13px] text-[#7c7c7c]">
              Pode ter sido apagado ou nunca existiu.
            </p>
          </div>
        )}

        {post && (
          <>
            <PostCard
              post={post}
              onLike={handleLike}
              onDelete={handleDelete}
              expanded
            />
            <PostCommentsSection
              postId={post.id}
              postOwnerId={post.author.id}
              onCountChange={(count) =>
                setPost((prev) => (prev ? { ...prev, commentsCount: count } : prev))
              }
            />
          </>
        )}
        </div>

        <aside className="flex flex-col gap-[14px]">
          <FeedHistoryWidget />
          <FeedInhousesWidget />
          <FeedMembersWidget />
        </aside>
      </section>
    </PanelShell>
  );
}
