import Image from "next/image";

import { cn } from "@/lib/utils";

type PanelStatCardProps = {
  eyebrow: string;
  value: string;
  tone?: "default" | "rank" | "featured" | "rank-baderna";
  rankFrameSrc?: string;
  featuredSrc?: string;
  placeholder?: boolean;
  /** Só no tom rank-baderna: mostra a pill de BP ao lado do #NN. */
  badernaPoints?: number | null;
  /** Só no tom rank-baderna: clique na pill de BP (abre o log do membro). */
  onBadernaPointsClick?: () => void;
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
  // #01 — diamante prismático (cores saturadas, tom claro — sem escurecer)
  if (num === 1)
    return {
      gradient: [
        "repeating-linear-gradient(62deg,  transparent 0px, rgba(255,255,255,0.30) 1px, rgba(255,255,255,0.06) 2px, transparent 3px, transparent 26px)",
        "repeating-linear-gradient(-62deg, transparent 0px, rgba(255,255,255,0.20) 1px, rgba(255,255,255,0.04) 2px, transparent 3px, transparent 26px)",
        "repeating-linear-gradient(0deg,   transparent 0px, rgba(255,255,255,0.10) 1px, transparent 2px, transparent 20px)",
        "linear-gradient(125deg, #e8f4ff 0%, #58a2ff 11%, #9060ff 22%, #e858f0 33%, #ff88d0 44%, #ffcca0 54%, #50e4ff 64%, #5ca0ff 76%, #c098ff 88%, #e8f4ff 100%)",
      ].join(", "),
      glow: "0 0 26px rgba(155,210,255,0.75), 0 0 52px rgba(200,165,255,0.26), inset 1px 1px 6px rgba(255,255,255,0.38), inset -1px -1px 8px rgba(0,0,0,0.42)",
      smoke: "rgba(218, 232, 255, 1)",
    };
  // #02 — rubi facetado
  if (num === 2)
    return {
      gradient: [
        "repeating-linear-gradient(62deg,  transparent 0px, rgba(255,220,200,0.30) 1px, rgba(255,200,180,0.06) 2px, transparent 3px, transparent 26px)",
        "repeating-linear-gradient(-62deg, transparent 0px, rgba(255,220,200,0.20) 1px, rgba(255,200,180,0.04) 2px, transparent 3px, transparent 26px)",
        "repeating-linear-gradient(0deg,   transparent 0px, rgba(255,220,200,0.10) 1px, transparent 2px, transparent 20px)",
        "linear-gradient(125deg, #ffe8e8 0%, #aa1820 10%, #ff3535 20%, #c04000 30%, #ff5820 40%, #ff1848 50%, #880010 60%, #ff4040 70%, #ff9060 82%, #ffe0d8 92%, #ffe8e8 100%)",
      ].join(", "),
      glow: "0 0 26px rgba(255,55,55,0.78), 0 0 52px rgba(220,30,30,0.28), inset 1px 1px 6px rgba(255,200,180,0.40), inset -1px -1px 8px rgba(80,0,0,0.50)",
      smoke: "rgba(255, 75, 55, 1)",
    };
  // #03 — ametista facetada
  if (num === 3)
    return {
      gradient: [
        "repeating-linear-gradient(62deg,  transparent 0px, rgba(220,190,255,0.30) 1px, rgba(200,170,255,0.06) 2px, transparent 3px, transparent 26px)",
        "repeating-linear-gradient(-62deg, transparent 0px, rgba(220,190,255,0.20) 1px, rgba(200,170,255,0.04) 2px, transparent 3px, transparent 26px)",
        "repeating-linear-gradient(0deg,   transparent 0px, rgba(220,190,255,0.10) 1px, transparent 2px, transparent 20px)",
        "linear-gradient(125deg, #f0e8ff 0%, #501090 10%, #9040ff 20%, #3020c0 30%, #7060ff 40%, #c030e0 50%, #400090 60%, #a050ff 70%, #d080ff 82%, #f0e0ff 92%, #ead0ff 100%)",
      ].join(", "),
      glow: "0 0 26px rgba(155,75,255,0.78), 0 0 52px rgba(120,45,220,0.28), inset 1px 1px 6px rgba(220,180,255,0.40), inset -1px -1px 8px rgba(30,0,60,0.50)",
      smoke: "rgba(165, 85, 255, 1)",
    };
  // #04–#08 — dourado
  if (num <= 8)
    return {
      gradient: "linear-gradient(135deg, rgba(255,215,0,0.33) 0%, #ffcc00 100%)",
      glow: "0 0 22px rgba(255,215,0,0.55), inset 1px 1px 4px rgba(255,255,255,0.2), inset -1px -1px 6px rgba(0,0,0,0.3)",
      smoke: "rgba(255, 215, 0, 0.85)",
    };
  // #09–#13 — prata
  if (num <= 13)
    return {
      gradient: "linear-gradient(135deg, rgba(192,192,192,0.33) 0%, #e0e0e0 100%)",
      glow: "0 0 22px rgba(192,192,192,0.5), inset 1px 1px 4px rgba(255,255,255,0.2), inset -1px -1px 6px rgba(0,0,0,0.3)",
      smoke: "rgba(220, 220, 220, 0.85)",
    };
  // #14+ — bronze
  return {
    gradient: "linear-gradient(135deg, rgba(205,127,50,0.33) 0%, #cd7f32 100%)",
    glow: "0 0 22px rgba(205,127,50,0.5), inset 1px 1px 4px rgba(255,255,255,0.2), inset -1px -1px 6px rgba(0,0,0,0.3)",
    smoke: "rgba(232, 180, 120, 0.85)",
  };
}

export function PanelStatCard({
  eyebrow,
  value,
  tone = "default",
  rankFrameSrc,
  featuredSrc,
  placeholder = false,
  badernaPoints,
  onBadernaPointsClick,
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
        <div className="relative z-10 flex h-full items-center justify-between gap-[6px] pl-[18px] pr-[14px]">
          <div className="min-w-0">
            <p className="whitespace-nowrap text-[10px] font-bold tracking-[-0.03em] text-white/80">
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
          {typeof badernaPoints === "number" &&
            (onBadernaPointsClick ? (
              <button
                type="button"
                onClick={onBadernaPointsClick}
                title="Ver histórico de BP"
                className="inline-flex h-[30px] shrink-0 items-center gap-[4px] rounded-[10px] bg-[#ededed] px-[9px] text-[12px] font-bold tracking-[-0.02em] text-[#0f0f0f] shadow-[0_4px_14px_rgba(0,0,0,0.18)] transition-transform hover:scale-[1.05] active:scale-95"
              >
                <Image
                  src="/images/bp.png"
                  alt=""
                  width={16}
                  height={16}
                  className="h-[16px] w-[16px] object-contain"
                  unoptimized
                />
                {badernaPoints.toLocaleString("pt-BR")} BP
              </button>
            ) : (
              <span className="inline-flex h-[30px] shrink-0 items-center gap-[4px] rounded-[10px] bg-[#ededed] px-[9px] text-[12px] font-bold tracking-[-0.02em] text-[#0f0f0f] shadow-[0_4px_14px_rgba(0,0,0,0.18)]">
                <Image
                  src="/images/bp.png"
                  alt=""
                  width={16}
                  height={16}
                  className="h-[16px] w-[16px] object-contain"
                  unoptimized
                />
                {badernaPoints.toLocaleString("pt-BR")} BP
              </span>
            ))}
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
