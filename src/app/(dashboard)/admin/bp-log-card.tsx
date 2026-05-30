"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { getChampionAvatarSrc } from "@/features/panel/champion-avatar";
import { StyledName } from "@/features/panel/components/styled-name";
import { EventRow } from "@/features/panel/components/bp-log-shared";
import {
  useBadernaPointsLog,
  type BpLogRow,
} from "@/features/panel/use-baderna-points-log";

function MemberAvatar({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const showSkeleton = !loaded || errored;
  return (
    <div
      className={`relative h-[38px] w-[38px] shrink-0 overflow-hidden rounded-full ${
        showSkeleton ? "skeleton-shimmer" : "bg-[#ededed]"
      }`}
    >
      {!errored && (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="38px"
          unoptimized
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}

function MemberLogRow({ row }: { row: BpLogRow }) {
  const [open, setOpen] = useState(false);
  const avatar = row.avatarSrc || getChampionAvatarSrc(row.slug);
  const hasEvents = row.events.length > 0;

  return (
    <div className="border-b border-[#efebe8] last:border-0">
      <button
        type="button"
        onClick={() => hasEvents && setOpen((v) => !v)}
        className={`flex w-full items-center gap-4 py-4 text-left transition-colors ${
          hasEvents ? "cursor-pointer hover:bg-[#fdfcfa]" : "cursor-default"
        }`}
      >
        <MemberAvatar src={avatar} alt={row.nickname} />

        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
            <StyledName styleId={row.activeNameId ?? undefined}>
              {row.nickname}
            </StyledName>
          </div>
          <div className="mt-[2px] flex flex-wrap gap-x-[14px] gap-y-[2px] text-[11px] font-semibold text-[#8d8d8d]">
            <span>
              Flex: {row.flexWins}v {row.flexLosses}d →{" "}
              <span className="text-[#3a3a3a]">{row.flexBp} BP</span>
            </span>
            <span>
              Inhouse: {row.inhouseWins}v {row.inhouseLosses}d →{" "}
              <span className="text-[#3a3a3a]">{row.inhouseBp} BP</span>
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-[12px]">
          <div className="text-right">
            <div className="text-[16px] font-bold tracking-[-0.03em] text-[#0f0f0f] tabular-nums">
              {row.totalBp}
            </div>
            <div className="text-[10px] font-bold text-[#b0a8a4]">
              total
            </div>
          </div>
          <ChevronDown
            className={`h-[16px] w-[16px] text-[#b0a8a4] transition-transform ${
              open ? "rotate-180" : ""
            } ${hasEvents ? "" : "opacity-0"}`}
            strokeWidth={2.2}
          />
        </div>
      </button>

      {open && hasEvents && (
        <div className="mb-3 ml-[54px] rounded-[14px] bg-[#fafafa] px-[14px] py-[6px]">
          {row.events.map((ev, i) => (
            <EventRow
              key={`${ev.type}-${ev.matchId ?? ev.shortCode ?? i}`}
              ev={ev}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function BpLogCard() {
  const { rows, loading } = useBadernaPointsLog();

  return (
    <section className="rounded-[var(--panel-radius-card)] bg-white p-6 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <div className="mb-4">
        <h2 className="text-[18px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
          Log do Rank da Baderna
        </h2>
        <p className="text-[13px] font-medium text-[#8d8d8d]">
          Veja o que cada membro ganhou e por quê. Clique pra expandir.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-[40px]">
          <svg
            className="capas-spinner h-[28px] w-[28px] [&_circle]:stroke-[#ff4100]"
            viewBox="25 25 50 50"
          >
            <circle r="20" cy="50" cx="50" />
          </svg>
        </div>
      ) : rows.length === 0 ? (
        <p className="py-[30px] text-center text-[13px] font-medium text-[#9a9a9a]">
          Nenhum dado de BP ainda.
        </p>
      ) : (
        <div>
          {rows.map((row) => (
            <MemberLogRow key={row.userId} row={row} />
          ))}
        </div>
      )}
    </section>
  );
}
