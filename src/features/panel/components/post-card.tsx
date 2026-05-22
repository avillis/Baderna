"use client";

import Image from "next/image";

import { formatPostDate, type FeedPost } from "@/features/panel/use-posts";

export function PostCard({ post }: { post: FeedPost }) {
  const media = post.imageUrl ?? post.gifUrl;
  return (
    <article className="rounded-[20px] border border-[#ededed] bg-white p-[20px]">
      <div className="flex items-start gap-[14px]">
        <div className="relative h-[48px] w-[48px] flex-shrink-0 overflow-hidden rounded-full bg-[#ededed]">
          {post.author.avatarSrc ? (
            <Image
              src={post.author.avatarSrc}
              alt=""
              fill
              className="object-cover"
              sizes="48px"
              unoptimized
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-[8px]">
            <p className="truncate text-[15px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
              {post.author.name ?? "Anônimo"}
            </p>
            {post.author.gameNick && (
              <p className="truncate text-[13px] text-[#8d8d8d]">
                @{post.author.gameNick}
              </p>
            )}
            <span className="text-[13px] text-[#8d8d8d]">·</span>
            <p className="text-[13px] text-[#8d8d8d]">
              {formatPostDate(post.createdAt)}
            </p>
          </div>

          {post.content && (
            <p className="mt-[6px] whitespace-pre-wrap break-words text-[15px] leading-[1.45] text-[#0f0f0f]">
              {post.content}
            </p>
          )}

          {media && (
            <div className="mt-[12px] overflow-hidden rounded-[16px] bg-[#ededed]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={media}
                alt=""
                className="max-h-[520px] w-full object-cover"
                loading="lazy"
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
