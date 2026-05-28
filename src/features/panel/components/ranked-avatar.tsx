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
  /** Moldura de nível equipada — substitui a moldura de rank quando definida. */
  levelFrameSrc?: string;
  /** Scale override para moldura de nível (padrão menor que rank frames). */
  levelFrameScale?: number;
  /** OffsetY override para moldura de nível. */
  levelFrameOffsetY?: number;
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
  levelFrameSrc,
  levelFrameScale = 1.75,
  levelFrameOffsetY = 0,
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
          src={levelFrameSrc ?? getRankFrameSrc(rankType)}
          alt={levelFrameSrc ? "level border" : `${rankType} border`}
          fill
          className="pointer-events-none object-contain"
          sizes={`${size}px`}
          unoptimized
          style={{
            transform: levelFrameSrc
              ? `translateY(${levelFrameOffsetY}px) scale(${levelFrameScale})`
              : `translateY(${frameOffsetY}px) scale(${frameScale})`,
          }}
        />
      )}
    </div>
  );
}
