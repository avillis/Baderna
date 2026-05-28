"use client";

import Link from "next/link";
import { formatPostDate, type FeedPost } from "@/features/panel/use-posts";

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 17v5" />
      <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v3.76z" />
    </svg>
  );
}

export function PinnedPostCard({ post }: { post: FeedPost }) {
  const media = post.imageUrl ?? post.gifUrl;

  return (
    <Link
      href={`/post/${post.shortCode || post.id}`}
      className="block rounded-[var(--panel-radius-card)] bg-white p-[22px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#fafafa]"
    >
      {/* Cabeçalho com ícone de pin */}
      <div className="mb-[12px] flex items-center gap-[7px]">
        <PinIcon className="h-[13px] w-[13px] shrink-0 text-[#ff4100]" />
        <span className="text-[11px] font-bold tracking-[-0.02em] text-[#ff4100]">
          Post em destaque
        </span>
      </div>

      {/* Imagem */}
      {media && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media}
          alt=""
          className="mb-[12px] h-[110px] w-full rounded-[10px] object-cover"
          loading="lazy"
        />
      )}

      {/* Conteúdo de texto */}
      {post.content && (
        <p className="line-clamp-3 text-[13px] leading-[1.5] tracking-[-0.01em] text-[#0f0f0f]">
          {post.content}
        </p>
      )}

      {/* Rodapé: curtidas · comentários · data */}
      <div className="mt-[12px] flex items-center gap-[6px] text-[11px] font-medium text-[#a0a0a0]">
        <span>
          {post.likesCount} curtida{post.likesCount !== 1 ? "s" : ""}
        </span>
        <span>·</span>
        <span>
          {post.commentsCount} comentário{post.commentsCount !== 1 ? "s" : ""}
        </span>
        <span>·</span>
        <span>{formatPostDate(post.createdAt)}</span>
      </div>
    </Link>
  );
}
