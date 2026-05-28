"use client";

import Image from "next/image";
import { useState } from "react";

import { useToast } from "@/components/toast";
import { LEVEL_FRAMES, TIER_INFO, type LevelFrame } from "@/features/panel/molduras-data";
import { useMemberCoins } from "@/features/panel/use-member-coins";
import { useMemberUnlocks } from "@/features/panel/use-member-unlocks";
import { useAuth } from "@/features/panel/use-auth";

const TIERS = [1, 2, 3, 4] as const;

const TIER_PRICE_LABEL: Record<1 | 2 | 3 | 4, string> = {
  1: "+50 por frame",
  2: "+100 por frame",
  3: "+120 por frame",
  4: "+200 por frame",
};

export function MoldurasTab() {
  const { user } = useAuth();
  const { getCoinsFor, syncBalance } = useMemberCoins();
  const { isUnlocked, unlock } = useMemberUnlocks();
  const toast = useToast();
  const [buying, setBuying] = useState<string | null>(null);

  const userId = user ? String(user.id) : "__guest__";
  const balance = getCoinsFor(userId);

  async function handleBuy(frame: LevelFrame) {
    if (buying) return;
    setBuying(frame.slug);
    const result = await unlock("moldura", frame.slug);
    setBuying(null);
    if (!result) {
      toast.show("Saldo insuficiente ou erro ao comprar.", "error");
      return;
    }
    if (result.duplicate) {
      toast.show("Você já tem essa moldura.", "info");
    } else {
      syncBalance(result.balance);
      toast.show(`Moldura Nível ${frame.level} desbloqueada!`, "success");
    }
  }

  return (
    <div className="pt-[28px]">
      {TIERS.map((tier) => {
        const info = TIER_INFO[tier];
        const frames = LEVEL_FRAMES.filter((f) => f.tier === tier);
        return (
          <div key={tier} className="mb-10">
            {/* Section header */}
            <div className="mb-4 flex items-center gap-2.5">
              <h3 className="text-[16px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
                {info.label}
              </h3>
              <span className="text-[11px] font-semibold text-[#8d8d8d]">
                {info.levels}
              </span>
              <span
                className="ml-auto rounded-full px-3 py-0.5 text-[11px] font-bold text-white"
                style={{ backgroundColor: info.color }}
              >
                {TIER_PRICE_LABEL[tier]}
              </span>
            </div>

            {/* Frame grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {frames.map((frame) => {
                const owned = isUnlocked("moldura", frame.slug);
                const isLoading = buying === frame.slug;
                const canAfford = balance >= frame.price;

                return (
                  <div
                    key={frame.slug}
                    className="overflow-hidden rounded-[20px] bg-white shadow-[0px_8px_30px_8px_rgba(0,0,0,0.06)]"
                  >
                    {/* Preview area */}
                    <div className="relative flex aspect-square items-center justify-center bg-[#0c0c0c]">
                      <Image
                        src={frame.imageSrc}
                        alt={`Moldura Nível ${frame.level}`}
                        width={120}
                        height={120}
                        className={`h-[80%] w-[80%] object-contain transition-opacity duration-200 ${
                          owned ? "opacity-40" : "opacity-100"
                        }`}
                        unoptimized
                      />
                      {owned && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                          <span className="text-[28px] font-bold text-green-400">
                            ✓
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info area */}
                    <div className="px-3 py-3">
                      <p className="mb-2 text-[14px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
                        Nível {frame.level}
                      </p>

                      {owned ? (
                        <div className="flex h-[34px] w-full items-center justify-center rounded-full bg-[#e8f5e9] text-[12px] font-bold text-green-600">
                          Desbloqueada
                        </div>
                      ) : (
                        <>
                          {/* Price row */}
                          <div className="mb-2 flex items-center gap-1">
                            <Image
                              src="/images/coin/Coin_icon2.png"
                              alt="moedas"
                              width={22}
                              height={22}
                              unoptimized
                            />
                            <span className="text-[13px] font-semibold text-[#0f0f0f]">
                              {frame.price.toLocaleString("pt-BR")}
                            </span>
                          </div>

                          {/* Buy button */}
                          <button
                            type="button"
                            onClick={() => handleBuy(frame)}
                            disabled={isLoading || !canAfford || !user}
                            className={`flex h-[34px] w-full items-center justify-center rounded-full bg-[#ff4100] text-[12px] font-bold text-white transition-opacity ${
                              !canAfford || !user
                                ? "cursor-not-allowed opacity-40"
                                : "hover:opacity-90"
                            }`}
                          >
                            {isLoading ? (
                              <svg
                                className="h-4 w-4 animate-spin"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8v8H4z"
                                />
                              </svg>
                            ) : (
                              "Comprar"
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
