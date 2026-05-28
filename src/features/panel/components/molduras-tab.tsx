"use client";

import Image from "next/image";
import { useState } from "react";

import { useToast } from "@/components/toast";
import { LEVEL_FRAMES, type LevelFrame } from "@/features/panel/molduras-data";
import { useMemberCoins } from "@/features/panel/use-member-coins";
import { useMemberUnlocks } from "@/features/panel/use-member-unlocks";
import { useAuth } from "@/features/panel/use-auth";

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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {LEVEL_FRAMES.map((frame) => {
          const owned = isUnlocked("moldura", frame.slug);
          const isLoading = buying === frame.slug;
          const canAfford = balance >= frame.price;

          return (
            <div
              key={frame.slug}
              className="overflow-hidden rounded-[20px] bg-white shadow-[0px_8px_30px_8px_rgba(0,0,0,0.06)]"
            >
              {/* Preview area */}
              <div className="relative flex aspect-square items-center justify-center bg-[#ededed]">
                <Image
                  src={frame.imageSrc}
                  alt={`Moldura Nível ${frame.level}`}
                  width={120}
                  height={120}
                  className={`h-[80%] w-[80%] object-contain transition-opacity duration-200 ${
                    owned ? "opacity-50" : "opacity-100"
                  }`}
                  unoptimized
                />
              </div>

              {/* Info area */}
              <div className="px-3 py-3">
                <p className="mb-2 text-[14px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
                  Nível {frame.level}
                </p>

                {/* Price row — sempre visível */}
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

                <button
                  type="button"
                  onClick={() => !owned && handleBuy(frame)}
                  disabled={owned || isLoading || !canAfford || !user}
                  className="flex h-[50px] w-full items-center justify-center rounded-[16px] bg-[#ff4100] text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-70"
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
                  ) : owned ? (
                    "Desbloqueada"
                  ) : (
                    "Comprar"
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
