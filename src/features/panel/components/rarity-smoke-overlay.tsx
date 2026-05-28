"use client";

import type { TitleRarity } from "@/features/panel/titles-data";

// Premium rarities get an animated smoke effect inspired by the Rank da
// Baderna stat card (icy blue for limitado, gold for lendária). Render
// this overlay INSIDE a relatively positioned element with overflow:hidden;
// then put the pill's label inside a `<span className="relative z-10">`.
const SMOKE_CONFIG: Partial<
  Record<TitleRarity, { gradient: string; smoke: string }>
> = {
  lendaria: {
    gradient: "linear-gradient(135deg, rgba(255,215,0,0.33) 0%, rgba(255,215,0,1) 100%)",
    smoke: "rgba(255, 215, 0, 0.9)",
  },
  exclusivo: {
    gradient: "linear-gradient(135deg, rgba(139,0,0,0.4) 0%, rgba(139,0,0,1) 100%)",
    smoke: "rgba(139, 0, 0, 0.85)",
  },
  limitado: {
    gradient:
      "linear-gradient(135deg, rgba(208,231,255,0.33) 0%, #a0d8ff 100%)",
    smoke: "rgba(160, 216, 255, 0.85)",
  },
};

export function rarityHasSmoke(rarity: TitleRarity): boolean {
  return rarity in SMOKE_CONFIG;
}

export function RaritySmokeOverlay({ rarity }: { rarity: TitleRarity }) {
  const cfg = SMOKE_CONFIG[rarity];
  if (!cfg) return null;
  return (
    <>
      {/* Dark base — paints over whatever the parent's bg is so the smoke
          (which is gold/cyan) has contrast and actually pops. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[#0c0c0c]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: cfg.gradient, opacity: 0.7 }}
      />
      <span
        aria-hidden
        className="rank-smoke rank-smoke--a absolute left-[-30%] top-[-60%] h-[220%] w-[80%]"
        style={{ ["--smoke" as string]: cfg.smoke } as React.CSSProperties}
      />
      <span
        aria-hidden
        className="rank-smoke rank-smoke--b absolute right-[-30%] bottom-[-60%] h-[220%] w-[80%]"
        style={{ ["--smoke" as string]: cfg.smoke } as React.CSSProperties}
      />
    </>
  );
}
