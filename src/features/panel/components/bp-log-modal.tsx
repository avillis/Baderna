"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { getChampionAvatarSrc } from "@/features/panel/champion-avatar";
import { StyledName } from "@/features/panel/components/styled-name";
import { EventRow } from "@/features/panel/components/bp-log-shared";
import { useMemberBpLog } from "@/features/panel/use-member-bp-log";

export function BpLogModal({
  userId,
  fallbackNick,
  fallbackAvatarSrc,
  fallbackStyleId,
  badernaRank,
  onClose,
}: {
  userId: number | null;
  fallbackNick: string;
  fallbackAvatarSrc?: string | null;
  fallbackStyleId?: string | null;
  badernaRank?: number;
  onClose: () => void;
}) {
  const [closing, setClosing] = useState(false);
  const { row, loading, error } = useMemberBpLog(userId, true);

  function handleClose() {
    setClosing(true);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  const nick = row?.nickname ?? fallbackNick;
  const avatar =
    row?.avatarSrc || fallbackAvatarSrc || getChampionAvatarSrc(row?.slug ?? fallbackNick);
  const styleId = row?.activeNameId ?? fallbackStyleId ?? undefined;
  const rank = badernaRank;

  return (
    <div
      className={`${closing ? "modal-backdrop-out" : "modal-backdrop-in"} fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4`}
      onClick={handleClose}
    >
      <div
        className={`${closing ? "modal-panel-out" : "modal-panel-in"} relative flex max-h-[80vh] w-full max-w-[440px] flex-col rounded-[25px] bg-white p-6 shadow-[0px_30px_90px_rgba(0,0,0,0.18)]`}
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={() => {
          if (closing) onClose();
        }}
      >
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

        {/* Header: avatar + nick + rank */}
        <div className="flex items-center gap-[14px] pr-[40px]">
          <div className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-full bg-[#ededed]">
            <Image
              src={avatar}
              alt={nick}
              fill
              className="object-cover"
              sizes="52px"
              unoptimized
            />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[18px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
              <StyledName styleId={styleId}>{nick}</StyledName>
            </div>
            <p className="text-[12px] font-semibold text-[#9a9a9a]">
              Rank da Baderna{rank ? ` · #${String(rank).padStart(2, "0")}` : ""}
            </p>
          </div>
        </div>

        {/* Resumo Flex / Inhouse / Total */}
        {row && (
          <div className="mt-[16px] grid grid-cols-3 gap-[10px]">
            <div className="rounded-[14px] bg-[#f7f7f7] px-[12px] py-[10px] text-center">
              <div className="text-[15px] font-bold tracking-[-0.02em] text-[#0f0f0f] tabular-nums">
                {row.flexBp}
              </div>
              <div className="mt-[2px] text-[10px] font-bold text-[#9a9a9a]">
                Flex · {row.flexWins}v {row.flexLosses}d
              </div>
            </div>
            <div className="rounded-[14px] bg-[#f7f7f7] px-[12px] py-[10px] text-center">
              <div className="text-[15px] font-bold tracking-[-0.02em] text-[#0f0f0f] tabular-nums">
                {row.inhouseBp}
              </div>
              <div className="mt-[2px] text-[10px] font-bold text-[#9a9a9a]">
                Inhouse · {row.inhouseWins}v {row.inhouseLosses}d
              </div>
            </div>
            <div className="rounded-[14px] bg-[#fff1ea] px-[12px] py-[10px] text-center">
              <div className="text-[15px] font-bold tracking-[-0.02em] text-[#ff4100] tabular-nums">
                {row.totalBp}
              </div>
              <div className="mt-[2px] text-[10px] font-bold text-[#e0a48f]">
                Total BP
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="mt-[16px] min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-[40px]">
              <svg
                className="capas-spinner h-[28px] w-[28px] [&_circle]:stroke-[#ff4100]"
                viewBox="25 25 50 50"
              >
                <circle r="20" cy="50" cx="50" />
              </svg>
            </div>
          ) : error ? (
            <p className="py-[30px] text-center text-[13px] font-medium text-[#9a9a9a]">
              Não foi possível carregar o histórico.
            </p>
          ) : !row || row.events.length === 0 ? (
            <p className="py-[30px] text-center text-[13px] font-medium text-[#9a9a9a]">
              Ainda sem partidas registradas.
            </p>
          ) : (
            <div className="rounded-[14px] bg-[#fafafa] px-[14px] py-[6px]">
              {row.events.map((ev, i) => (
                <EventRow
                  key={`${ev.type}-${ev.matchId ?? ev.shortCode ?? i}`}
                  ev={ev}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
