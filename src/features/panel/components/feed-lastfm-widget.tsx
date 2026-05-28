"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { useFeedLastFm } from "@/features/panel/use-lastfm";

function MarqueeText({ text, className }: { text: string; className: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [distance, setDistance] = useState(0);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const el = textRef.current;
    if (!container || !el) return;
    setDistance(Math.max(0, el.scrollWidth - container.clientWidth));
  }, [text]);

  return (
    <div ref={containerRef} className="overflow-hidden">
      <span
        ref={textRef}
        className={`inline-block whitespace-nowrap ${className}`}
        style={
          distance > 0
            ? ({ "--md": `-${distance}px`, animation: "marquee-title 7s linear infinite" } as React.CSSProperties)
            : undefined
        }
      >
        {text}
      </span>
    </div>
  );
}

function LastFmLogo({ className = "h-[16px] w-[16px]" }: { className?: string }) {
  return (
    <img
      src="/last_fm.png"
      alt="Last.fm"
      className={`${className} rounded-full object-cover`}
    />
  );
}

export function FeedLastFmWidget() {
  const { data, loading } = useFeedLastFm();

  if (loading || !data || data.length === 0) return null;

  return (
    <section className="rounded-[20px] bg-white p-[20px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-[8px]">
        <LastFmLogo className="h-[16px] w-[16px]" />
        <h3 className="text-[15px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
          Last.fm
        </h3>
      </div>

      <div className="mt-[14px] space-y-[4px]">
        {data.map((entry) => (
          <Link
            key={entry.memberSlug}
            href={`/membro/${entry.memberSlug}`}
            className={`group flex items-center gap-[10px] rounded-[12px] px-[8px] py-[8px] transition-colors ${
              entry.track.nowPlaying
                ? "bg-[#D51007]/10 hover:bg-[#D51007]/15"
                : "hover:bg-[#f7f7f7]"
            }`}
          >
            {/* Avatar do membro com bolinha de nowPlaying */}
            <div className="relative h-[34px] w-[34px] shrink-0">
              <div className="h-[34px] w-[34px] overflow-hidden rounded-full bg-[#ededed]">
                {entry.memberAvatar && (
                  <Image
                    src={entry.memberAvatar}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="34px"
                    unoptimized
                  />
                )}
              </div>
              {entry.track.nowPlaying && (
                <span className="absolute bottom-0 right-0 h-[10px] w-[10px] rounded-full bg-[#D51007] ring-2 ring-white animate-pulse" />
              )}
            </div>

            {/* Nome do membro + faixa */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-bold tracking-[-0.02em] text-[#0f0f0f] group-hover:text-[#D51007]">
                {entry.memberName}
              </p>
              <MarqueeText
                text={`${entry.track.name}${entry.track.artist ? ` · ${entry.track.artist}` : ""}`}
                className="text-[11px] font-medium text-[#8d8d8d]"
              />
            </div>

            {/* Capa do álbum */}
            {entry.track.image && (
              <div className="relative h-[34px] w-[34px] shrink-0 overflow-hidden rounded-[6px] bg-[#ededed]">
                <Image
                  src={entry.track.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="34px"
                  unoptimized
                />
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
