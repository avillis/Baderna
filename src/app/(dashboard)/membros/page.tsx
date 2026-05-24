"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";

import { PanelShell } from "@/features/panel/components/panel-shell";
import { StyledName } from "@/features/panel/components/styled-name";
import {
  MemberCompareModal,
  type CompareSide,
} from "@/features/panel/components/member-compare-modal";
import { getChampionAvatarSrc } from "@/features/panel/champion-avatar";
import { useBadernaMembers } from "@/features/panel/use-baderna-members";
import { useMemberRanks } from "@/features/panel/use-member-ranks";

type RankEffect = { gradient: string; glow: string };

const RANK_EFFECTS: Record<number, RankEffect> = {
  1: {
    gradient: "linear-gradient(135deg, #c8e8ff, #6ab8f0)",
    glow: "0 0 14px 3px rgba(100, 185, 255, 0.30)",
  },
  2: {
    gradient: "linear-gradient(135deg, #ffe066, #ffb300)",
    glow: "0 0 14px 3px rgba(255, 185, 0, 0.28)",
  },
  3: {
    gradient: "linear-gradient(135deg, #f2f2f2, #b0b0b0)",
    glow: "0 0 14px 3px rgba(140, 140, 140, 0.22)",
  },
};

// `value` casa com o que a API manda em preferredRoles (inglês); `label` é o
// texto em PT mostrado no chip.
const LANES = [
  { value: "Top", label: "Top" },
  { value: "Jungle", label: "Jungle" },
  { value: "Mid", label: "Meio" },
  { value: "ADC", label: "Atirador" },
  { value: "Support", label: "Suporte" },
] as const;

function getRankEffect(rank: number): RankEffect | null {
  return RANK_EFFECTS[rank] ?? null;
}

function MemberAvatar({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative h-[124px] w-[124px] overflow-hidden rounded-full">
      {!loaded && (
        <div className="absolute inset-0 animate-pulse rounded-full bg-[#ededed]" />
      )}
      <Image
        src={src}
        alt={alt}
        width={124}
        height={124}
        className={`h-full w-full object-cover transition-opacity duration-200 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export default function MembrosPage() {
  const allMembers = useBadernaMembers();
  const ranks = useMemberRanks();
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState<(typeof LANES)[number]["value"] | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  // Guarda o rank original (posição na lista cheia) antes de filtrar, pra o
  // número "#N" continuar fazendo sentido mesmo com busca/filtro ativos.
  const ranked = useMemo(
    () => allMembers.map((member, index) => ({ member, badernaRank: index + 1 })),
    [allMembers],
  );

  function toggleCompareMode() {
    setCompareMode((on) => {
      if (on) {
        setSelectedIds([]);
        setShowCompare(false);
      }
      return !on;
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  const compareSides: CompareSide[] = useMemo(
    () =>
      selectedIds
        .map((id) => ranked.find((r) => r.member.id === id))
        .filter((r): r is (typeof ranked)[number] => Boolean(r))
        .map((r) => ({
          member: r.member,
          badernaRank: r.badernaRank,
          rank: r.member.userId != null ? ranks[r.member.userId] : undefined,
          riotId:
            r.member.summonerName && r.member.tagLine
              ? `${r.member.summonerName}#${r.member.tagLine}`
              : null,
        })),
    [selectedIds, ranked, ranks],
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return ranked.filter(({ member }) => {
      if (lane && !member.preferredRoles.includes(lane)) return false;
      if (!q) return true;
      const haystack = normalize(
        `${member.nickname} ${member.name} ${member.summonerName ?? ""}`,
      );
      return haystack.includes(q);
    });
  }, [ranked, query, lane]);

  return (
    <PanelShell showBanner={false}>
      <div className="pt-[1.5vh] sm:pt-[6vh]">
        {/* Busca + filtros */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-[360px]">
            <Search className="pointer-events-none absolute left-[18px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#b0a8a4]" strokeWidth={2} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nick ou nome…"
              className="w-full rounded-full border-none bg-white py-3.5 pl-[46px] pr-5 text-sm font-medium text-[#0f0f0f] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)] outline-none placeholder:text-[#b0a8a4] focus:ring-2 focus:ring-[#ff4100]/20"
            />
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            {LANES.map((l) => {
              const active = lane === l.value;
              return (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setLane(active ? null : l.value)}
                  className={`flex-1 whitespace-nowrap rounded-full px-2 py-2 text-center text-[11px] font-bold tracking-[-0.01em] transition-colors sm:flex-none sm:px-3.5 sm:text-[12px] ${
                    active
                      ? "bg-[#ff4100] text-white"
                      : "bg-white text-[#6f6f6f] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)] hover:bg-[#fff4f4]"
                  }`}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Comparar membros */}
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={toggleCompareMode}
            className={`inline-flex h-[50px] items-center justify-center gap-[8px] rounded-[18px] px-6 text-[13px] font-bold tracking-[-0.02em] transition-opacity hover:opacity-90 ${
              compareMode ? "bg-[#0f0f0f] text-white" : "bg-[#ff4100] text-white"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-[16px] w-[16px]"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 17H20M20 17L16 13M20 17L16 21M20 7H4M4 7L8 3M4 7L8 11"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {compareMode ? "Cancelar" : "Comparar membros"}
          </button>
          {compareMode && selectedIds.length < 2 && (
            <span className="text-[13px] font-medium text-[#989898]">
              Toque em 2 membros pra comparar.
            </span>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-[25px] bg-white px-6 py-16 text-center shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
            <p className="text-[15px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
              Nenhum membro encontrado
            </p>
            <p className="mt-1 text-[13px] font-medium text-[#989898]">
              Tenta outro nick ou tira o filtro de lane.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            {filtered.map(({ member, badernaRank }) => {
              const rankEffect = getRankEffect(badernaRank);
              const isSelected = selectedIds.includes(member.id);
              const baseClass =
                "relative flex flex-col items-center rounded-[25px] bg-white px-6 py-10 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)] transition-transform duration-200";

              const inner = (
                <>
                  {/* Avatar */}
                  <div
                    className="rounded-full p-[3px]"
                    style={
                      rankEffect
                        ? { background: rankEffect.gradient, boxShadow: rankEffect.glow }
                        : undefined
                    }
                  >
                    <MemberAvatar
                      src={member.avatarSrc || getChampionAvatarSrc(member.id)}
                      alt={member.nickname}
                    />
                  </div>

                  {/* Name + rank */}
                  <div className="mt-4 text-center">
                    <h2 className="text-[17px] font-bold leading-none tracking-[-0.03em] text-[#0f0f0f]">
                      <StyledName styleId={member.activeNameId}>
                        {member.nickname}
                      </StyledName>
                      <span className="ml-[5px] text-[12px] font-semibold tracking-normal text-[#aaaaaa]">
                        #{badernaRank}
                      </span>
                    </h2>
                    <p className="mt-[6px] text-[13px] font-medium tracking-[-0.01em] text-[#989898]">
                      {member.name}
                    </p>
                  </div>
                </>
              );

              if (compareMode) {
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleSelect(member.id)}
                    className={`${baseClass} ${
                      isSelected ? "scale-[1.02] ring-2 ring-[#ff4100]" : "hover:scale-[1.02]"
                    }`}
                  >
                    <span
                      className={`absolute right-3 top-3 flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 transition-colors ${
                        isSelected
                          ? "border-[#ff4100] bg-[#ff4100] text-white"
                          : "border-[#e3ddd9] bg-white text-transparent"
                      }`}
                    >
                      <Check className="h-[15px] w-[15px]" strokeWidth={3} />
                    </span>
                    {inner}
                  </button>
                );
              }

              return (
                <Link
                  key={member.id}
                  href={`/membro/${member.id}`}
                  className={`${baseClass} hover:scale-[1.02]`}
                >
                  {inner}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Barra de comparação */}
      {compareMode && selectedIds.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="flex items-center gap-3 rounded-full bg-[#0f0f0f] py-2.5 pl-5 pr-2.5 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.25)]">
            <span className="text-[13px] font-semibold text-white">
              {selectedIds.length}/2 selecionados
            </span>
            <button
              type="button"
              disabled={selectedIds.length < 2}
              onClick={() => setShowCompare(true)}
              className="rounded-full bg-[#ff4100] px-4 py-2 text-[13px] font-bold text-white transition-opacity disabled:opacity-40"
            >
              Comparar
            </button>
          </div>
        </div>
      )}

      {showCompare && compareSides.length === 2 && (
        <MemberCompareModal
          left={compareSides[0]}
          right={compareSides[1]}
          onClose={() => setShowCompare(false)}
        />
      )}
    </PanelShell>
  );
}
