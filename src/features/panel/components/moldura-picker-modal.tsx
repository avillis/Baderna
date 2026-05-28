"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { LEVEL_FRAMES } from "@/features/panel/molduras-data";
import { getRankFrameSrc } from "@/features/panel/rank-utils";
import type { RankType } from "@/features/panel/rank-utils";
import { useAccount } from "@/features/panel/use-account";
import { useMemberUnlocks } from "@/features/panel/use-member-unlocks";
import { useRiotProfile } from "@/features/panel/use-riot-profile";

const TIER_TO_RANK_TYPE: Record<string, RankType> = {
  IRON: "iron", BRONZE: "bronze", SILVER: "silver", GOLD: "gold",
  PLATINUM: "platinum", EMERALD: "emerald", DIAMOND: "diamond",
  MASTER: "master", GRANDMASTER: "grandmaster", CHALLENGER: "challenger",
};

type Tab = "moldura" | "rank";

export function MolduraPickerModal({
  open,
  onClose,
  activeFrameId,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  /** Slug da moldura de nível atualmente equipada; null = usa rank. */
  activeFrameId?: string | null;
  /** Chamado com slug ao equipar uma moldura, ou null para voltar ao rank. */
  onSelect: (frameSlug: string | null) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [tab, setTab] = useState<Tab>(activeFrameId ? "moldura" : "rank");
  const { account } = useAccount();
  const { isUnlocked } = useMemberUnlocks();

  // Deriva o rank type ao vivo pra mostrar a moldura correta do elo.
  const riot = useRiotProfile(account.gameNick || null);
  const liveTier =
    riot.status === "ready" ? (riot.profile?.rank?.tier ?? "") : "";
  const currentRankType: RankType =
    liveTier && liveTier !== "Unranked"
      ? (TIER_TO_RANK_TYPE[liveTier.toUpperCase()] ?? "gold")
      : "gold";

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      setClosing(false);
      return;
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleClose() {
    setClosing(true);
  }

  if (!open || !mounted) return null;

  const rankFrameSrc = getRankFrameSrc(currentRankType);
  const tabs: Tab[] = ["moldura", "rank"];
  const tabLabels: Record<Tab, string> = { moldura: "Moldura", rank: "Rank" };
  const activeIdx = tabs.indexOf(tab);

  return createPortal(
    <div
      className={`${closing ? "modal-backdrop-out" : "modal-backdrop-in"} fixed inset-0 z-[9999] flex items-center justify-center bg-black/38 px-4 py-6 backdrop-blur-[2px]`}
      onClick={handleClose}
    >
      <div
        className={`${closing ? "modal-panel-out" : "modal-panel-in"} relative flex max-h-[86vh] w-full max-w-[680px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0px_30px_90px_rgba(0,0,0,0.18)]`}
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={() => {
          if (closing) onClose();
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Fechar"
          className="absolute right-[20px] top-[20px] z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#ff4100] text-white transition-opacity hover:opacity-85"
        >
          <svg
            viewBox="0 0 10 10"
            fill="none"
            className="h-[12px] w-[12px]"
            stroke="currentColor"
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" />
          </svg>
        </button>

        {/* Header */}
        <div className="border-b border-[#ededed] px-[28px] pb-[16px] pt-[28px]">
          <h2 className="text-[22px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
            Editar moldura
          </h2>
          <div className="mt-[14px]">
            <div
              className="relative flex h-[40px] items-center rounded-[25px] p-[4px]"
              style={{ background: "#ededed", width: 200 }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute bottom-[4px] top-[4px] rounded-[25px] bg-white"
                style={{
                  width: "calc((100% - 8px) / 2)",
                  transform: `translateX(${activeIdx * 100}%)`,
                  transition:
                    "transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
                  zIndex: 0,
                }}
              />
              {tabs.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`relative z-[1] flex h-full flex-1 items-center justify-center rounded-[25px] text-[13px] font-semibold transition-colors duration-300 ${
                    tab === t
                      ? "text-[#0f0f0f]"
                      : "text-black/40 hover:text-black/70"
                  }`}
                >
                  {tabLabels[t]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab content */}
        {tab === "rank" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-[24px] px-[28px] py-[40px]">
            <p className="max-w-[360px] text-center text-[13px] text-[#8d8d8d]">
              A moldura padrão do seu elo atual.
              <br />
              Atualiza junto com o seu rank.
            </p>
            <div className="relative h-[260px] w-[260px]">
              <Image
                src={rankFrameSrc}
                alt="Moldura do rank"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <button
              type="button"
              onClick={() => {
                onSelect(null);
                handleClose();
              }}
              className={`flex h-[50px] items-center justify-center rounded-[16px] px-8 text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-85 ${
                !activeFrameId
                  ? "bg-[#ff4100] opacity-50 cursor-default"
                  : "bg-[#ff4100]"
              }`}
              disabled={!activeFrameId}
            >
              {!activeFrameId ? "Moldura atual" : "Usar moldura do Rank"}
            </button>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto p-[24px] no-scrollbar">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {LEVEL_FRAMES.map((frame) => {
                const owned = isUnlocked("moldura", frame.slug);
                const isActive = activeFrameId === frame.slug;
                return (
                  <button
                    key={frame.slug}
                    type="button"
                    disabled={!owned}
                    onClick={() => {
                      onSelect(frame.slug);
                      handleClose();
                    }}
                    className={`relative flex flex-col items-center gap-[6px] overflow-hidden rounded-[16px] p-[8px] transition-all focus:outline-none ${
                      owned ? "cursor-pointer hover:bg-[#f7f7f7]" : "cursor-default"
                    } ${isActive ? "ring-2 ring-[#ff4100] bg-[#fff5f2]" : ""}`}
                  >
                    <div
                      className={`relative flex aspect-square w-full items-center justify-center rounded-[12px] bg-[#ededed] ${
                        !owned ? "opacity-40" : ""
                      }`}
                    >
                      <Image
                        src={frame.imageSrc}
                        alt={`Moldura Nível ${frame.level}`}
                        width={80}
                        height={80}
                        className="h-[80%] w-[80%] object-contain"
                        unoptimized
                      />
                    </div>
                    <span
                      className={`text-[11px] font-semibold tracking-[-0.01em] ${
                        !owned ? "text-[#c0b8b4]" : "text-[#0f0f0f]"
                      }`}
                    >
                      Nível {frame.level}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-bold text-[#ff4100]">
                        Ativa
                      </span>
                    )}
                    {!owned && !isActive && (
                      <span className="text-[10px] font-bold text-[#c0b8b4]">
                        Bloqueada
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
