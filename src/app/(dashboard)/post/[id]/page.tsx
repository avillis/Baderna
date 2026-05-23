"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useToast } from "@/components/toast";
import { PanelShell } from "@/features/panel/components/panel-shell";
import { PostCard } from "@/features/panel/components/post-card";
import {
  apiDeletePost,
  apiToggleLike,
  fetchPost,
  type FeedPost,
} from "@/features/panel/use-posts";

export default function PostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const id = Number(params.id);
  const [post, setPost] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (Number.isNaN(id)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchPost(id)
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
  }, [id]);

  async function handleLike(postId: number) {
    if (!post) return;
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
      <section className="mx-auto flex w-full max-w-[680px] flex-col gap-[14px] pb-[80px] pt-[6vh]">
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
          <PostCard post={post} onLike={handleLike} onDelete={handleDelete} />
        )}
      </section>
    </PanelShell>
  );
}
