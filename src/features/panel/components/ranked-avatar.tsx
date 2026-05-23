"use client";

import Image from "next/image";
import { useState } from "react";

import type { RankType } from "@/features/panel/rank-utils";
import { getRankFrameSrc } from "@/features/panel/rank-utils";

type RankedAvatarProps = {
  src: string;
  alt: string;
  rankType: RankType;
  size: number;
  avatarInset: number;
  frameScale?: number;
  frameOffsetY?: number;
  ringClassName?: string;
  priority?: boolean;
  /** Quando true, não renderiza a moldura de rank ao redor. */
  unranked?: boolean;
};

export function RankedAvatar({
  src,
  alt,
  rankType,
  size,
  avatarInset,
  frameScale = 1,
  frameOffsetY = 0,
  ringClassName = "",
  priority = false,
  unranked = false,
}: RankedAvatarProps) {
  const [errored, setErrored] = useState(false);
  return (
    <div
      className="relative shrink-0"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <div
        className={`absolute overflow-hidden rounded-full ${
          !errored && src ? "bg-[#ededed]" : "skeleton-shimmer"
        } ${ringClassName}`.trim()}
        style={{
          inset: `${avatarInset}px`,
        }}
      >
        {!errored && src ? (
          <Image
            src={src}
            alt=""
            fill
            className="object-cover"
            sizes={`${size}px`}
            priority={priority}
            onError={() => setErrored(true)}
          />
        ) : (
          <span aria-label={alt} className="sr-only">
            {alt}
          </span>
        )}
      </div>

      {!unranked && (
        <Image
          src={getRankFrameSrc(rankType)}
          alt={`${rankType} border`}
          fill
          className="pointer-events-none object-contain"
          sizes={`${size}px`}
          unoptimized
          style={{
            transform: `translateY(${frameOffsetY}px) scale(${frameScale})`,
          }}
        />
      )}
    </div>
  );
}
