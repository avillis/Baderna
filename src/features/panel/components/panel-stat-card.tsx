import Image from "next/image";

import { cn } from "@/lib/utils";

type PanelStatCardProps = {
  eyebrow: string;
  value: string;
  tone?: "default" | "rank" | "featured" | "rank-baderna";
  rankFrameSrc?: string;
  featuredSrc?: string;
  placeholder?: boolean;
};

function StatSkeleton({
  featured = false,
  compact = false,
}: {
  featured?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "mt-[13px] h-[22px] rounded-full",
        compact ? "w-[76px]" : featured ? "w-[92px]" : "w-[104px]",
        featured ? "bg-white/24" : "bg-[#ece7e4]",
      )}
    />
  );
}

function getRankBadernaEffect(value: string) {
  const num = parseInt(value.replace(/\D/g, ""), 10);
  if (num === 1)
    return {
      gradient: "linear-gradient(135deg, rgba(208,231,255,0.33) 0%, #a0d8ff 100%)",
      glow: "0 0 22px rgba(160,216,255,0.55), inset 1px 1px 4px rgba(255,255,255,0.2), inset -1px -1px 6px rgba(0,0,0,0.3)",
      smoke: "rgba(160, 216, 255, 0.85)",
    };
  if (num === 2)
    return {
      gradient: "linear-gradient(135deg, rgba(255,215,0,0.33) 0%, #ffcc00 100%)",
      glow: "0 0 22px rgba(255,215,0,0.55), inset 1px 1px 4px rgba(255,255,255,0.2), inset -1px -1px 6px rgba(0,0,0,0.3)",
      smoke: "rgba(255, 215, 0, 0.85)",
    };
  if (num >= 7)
    return {
      gradient: "linear-gradient(135deg, rgba(205,127,50,0.33) 0%, #cd7f32 100%)",
      glow: "0 0 22px rgba(205,127,50,0.5), inset 1px 1px 4px rgba(255,255,255,0.2), inset -1px -1px 6px rgba(0,0,0,0.3)",
      smoke: "rgba(232, 180, 120, 0.85)",
    };
  return {
    gradient: "linear-gradient(135deg, rgba(192,192,192,0.33) 0%, #e0e0e0 100%)",
    glow: "0 0 22px rgba(192,192,192,0.5), inset 1px 1px 4px rgba(255,255,255,0.2), inset -1px -1px 6px rgba(0,0,0,0.3)",
    smoke: "rgba(220, 220, 220, 0.85)",
  };
}

export function PanelStatCard({
  eyebrow,
  value,
  tone = "default",
  rankFrameSrc,
  featuredSrc,
  placeholder = false,
}: PanelStatCardProps) {
  const isFeatured = tone === "featured";
  const isRank = tone === "rank";
  const isRankBaderna = tone === "rank-baderna";

  if (isRankBaderna) {
    const { gradient, glow, smoke } = getRankBadernaEffect(value);
    return (
      <article
        className="relative h-[122px] overflow-hidden rounded-[var(--panel-radius-card)] bg-[#0c0c0c]"
        style={{ boxShadow: glow, ["--smoke" as string]: smoke } as React.CSSProperties}
      >
        {/* Colour gradient layer */}
        <div
          className="absolute inset-0"
          style={{ background: gradient, opacity: 0.75 }}
        />
        {/* Animated smoke blobs (colored, drifting) */}
        <div className="rank-smoke rank-smoke--a absolute left-[-25%] top-[-30%] h-[140%] w-[70%]" />
        <div className="rank-smoke rank-smoke--b absolute right-[-20%] bottom-[-35%] h-[140%] w-[65%]" />
        {/* Glass sheen */}
        <div
          className="absolute inset-0"
          style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}
        />
        <div className="relative z-10 flex h-full items-center px-[26px]">
          <div>
            <p className="text-[10px] font-bold tracking-[-0.03em] text-white/80">
              {eyebrow}
            </p>
            {placeholder ? (
              <StatSkeleton featured />
            ) : (
              <p className="mt-[8px] text-[28px] font-bold leading-none tracking-[-0.03em] text-white">
                {value}
              </p>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "relative h-[122px] overflow-hidden rounded-[var(--panel-radius-card)] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]",
        isFeatured ? "bg-black" : "bg-white",
      )}
    >
      {isFeatured && featuredSrc ? (
        <>
          <Image
            src={featuredSrc}
            alt={value}
            fill
            className="object-cover object-[54%_34%]"
            sizes="(min-width: 1536px) 237px, (min-width: 1280px) 25vw, 100vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.75)_0%,rgba(0,0,0,0.20)_100%)]" />
        </>
      ) : null}

      {isRank && rankFrameSrc ? (
        <>
          <div className="relative z-10 flex h-full items-center pl-[26px] pr-[126px]">
            <div>
              <p className="text-[10px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
                {eyebrow}
              </p>
              {placeholder ? (
                <StatSkeleton compact />
              ) : (
                <p className="mt-[8px] text-[28px] font-bold leading-none tracking-[-0.03em] text-[#0f0f0f]">
                  {value}
                </p>
              )}
            </div>
          </div>

          <div className="absolute right-[14px] top-1/2 h-[102px] w-[102px] -translate-y-1/2 xl:h-[109px] xl:w-[109px]">
            <Image
              src={rankFrameSrc}
              alt={eyebrow}
              fill
              className="object-contain"
              sizes="109px"
            />
          </div>
        </>
      ) : (
        <div className="relative z-10 flex h-full items-center px-[26px]">
          <div>
            <p
              className={cn(
                "text-[10px] font-bold tracking-[-0.03em]",
                isFeatured ? "text-white" : "text-[#0f0f0f]",
              )}
            >
              {eyebrow}
            </p>
            {placeholder ? (
              <StatSkeleton featured={isFeatured} />
            ) : (
              <p
                className={cn(
                  "mt-[8px] text-[28px] font-bold leading-none tracking-[-0.03em]",
                  isFeatured ? "text-white" : "text-[#0f0f0f]",
                )}
              >
                {value}
              </p>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
