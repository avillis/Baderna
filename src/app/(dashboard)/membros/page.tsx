"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Search } from "lucide-react";

import { PanelShell } from "@/features/panel/components/panel-shell";
import { AniversariosClient } from "@/features/panel/components/aniversarios-client";
import { MemberFlexCard } from "@/features/panel/components/lista-flex-client";
import {
  MemberCompareModal,
  type CompareSide,
} from "@/features/panel/components/member-compare-modal";
import { StyledName } from "@/features/panel/components/styled-name";
import { getChampionAvatarSrc } from "@/features/panel/champion-avatar";
import { useBadernaMembers } from "@/features/panel/use-baderna-members";
import {
  useMemberRanks,
  type MemberRank,
} from "@/features/panel/use-member-ranks";

const TIER_ORDER = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
];

const DIVISION_VALUE: Record<string, number> = { IV: 0, III: 1, II: 2, I: 3 };

// Moldura (gradiente + glow) por posição — idêntica ao card da página Membros.
type RankEffect = { gradient: string; glow: string };
function getRankEffect(rank: number): RankEffect {
  if (rank === 1) return {
    gradient: "linear-gradient(135deg, #f0f8ff 0%, #88b8ff 14%, #c090ff 28%, #f8a8f8 42%, #90e8ff 56%, #d8eeff 70%, #a8c8ff 85%, #f0f8ff 100%)",
    glow: "0 0 16px 5px rgba(65,150,255,0.70), 0 0 30px 3px rgba(150,90,255,0.28)",
  };
  if (rank === 2) return {
    gradient: "linear-gradient(135deg, #ffe8e0 0%, #cc2020 14%, #ff4040 28%, #ff5820 42%, #ff1840 56%, #cc0020 70%, #ff8060 84%, #ffe0e0 100%)",
    glow: "0 0 16px 4px rgba(255,55,55,0.60), 0 0 30px 2px rgba(220,30,30,0.25)",
  };
  if (rank === 3) return {
    gradient: "linear-gradient(135deg, #f0e8ff 0%, #5010a0 14%, #9040ff 28%, #4030c0 42%, #c030e0 56%, #400090 70%, #a050ff 84%, #ead0ff 100%)",
    glow: "0 0 16px 4px rgba(155,75,255,0.55), 0 0 30px 2px rgba(120,45,210,0.25)",
  };
  // #04 — esmeralda
  if (rank === 4) return {
    gradient: "linear-gradient(135deg, #34d399, #059669)",
    glow: "0 0 14px 3px rgba(16, 185, 129, 0.30)",
  };
  // #05 — platina
  if (rank === 5) return {
    gradient: "linear-gradient(135deg, #e0f2fe, #7dd3fc)",
    glow: "0 0 14px 3px rgba(125, 211, 252, 0.30)",
  };
  // #06–#10 — dourado
  if (rank <= 10) return {
    gradient: "linear-gradient(135deg, #ffe066, #ffb300)",
    glow: "0 0 14px 3px rgba(255, 185, 0, 0.28)",
  };
  // #11–#16 — prata
  if (rank <= 16) return {
    gradient: "linear-gradient(135deg, #f2f2f2, #b0b0b0)",
    glow: "0 0 14px 3px rgba(140, 140, 140, 0.22)",
  };
  // #17+ — bronze
  return {
    gradient: "linear-gradient(135deg, #e8b07a, #cd7f32)",
    glow: "0 0 14px 3px rgba(205, 127, 50, 0.22)",
  };
}

// Avatar 124px com skeleton — igual ao da página Membros.
function MemberAvatar({ src, alt }: { src: string; alt: string }) {
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

function eloScore(rank: MemberRank | undefined): number {
  const tier = rank?.tier?.toUpperCase();
  if (!tier || tier === "UNRANKED") return -1;
  const tierIdx = TIER_ORDER.indexOf(tier);
  if (tierIdx < 0) return -1;
  const div = rank?.division ? DIVISION_VALUE[rank.division.toUpperCase()] ?? 0 : 0;
  const lp = rank?.lp ?? 0;
  return tierIdx * 100000 + div * 1000 + lp;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export default function MembrosPage() {
  const members = useBadernaMembers();
  const ranks = useMemberRanks();
  const [mode, setMode] = useState<"baderna" | "flex" | "aniversarios">("baderna");
  const [query, setQuery] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  // Pill de comparar: anima entrada/saída (igual ao dropdown do sininho).
  // Mantém montado durante a saída até o onAnimationEnd desmontar.
  const [pillClosing, setPillClosing] = useState(false);
  const prevCompareMode = useRef(false);
  useEffect(() => {
    if (prevCompareMode.current && !compareMode) setPillClosing(true);
    if (compareMode) setPillClosing(false);
    prevCompareMode.current = compareMode;
  }, [compareMode]);

  // Baderna: ordem natural da API + posição fixa (#NN) antes de filtrar.
  const badernaList = useMemo(() => {
    return members.map((member, index) => {
      const rank = member.userId != null ? ranks[member.userId] : undefined;
      return { member, rank, score: eloScore(rank), badernaRank: index + 1 };
    });
  }, [members, ranks]);

  // Flex: ordenado por elo (só quem tem Riot ID conectada).
  const sorted = useMemo(() => {
    return [...badernaList]
      .filter(({ member }) => !!member.summonerName && !!member.tagLine)
      .sort((a, b) => b.score - a.score);
  }, [badernaList]);

  // Busca por nick / nome / summoner, aplicada às duas listas.
  const matchesQuery = useMemo(() => {
    const q = normalize(query.trim());
    return (m: (typeof members)[number]) =>
      !q || normalize(`${m.nickname} ${m.name} ${m.summonerName ?? ""}`).includes(q);
  }, [query, members]);

  const filteredBaderna = useMemo(
    () => badernaList.filter(({ member }) => matchesQuery(member)),
    [badernaList, matchesQuery],
  );
  const filteredFlex = useMemo(
    () => sorted.filter(({ member }) => matchesQuery(member)),
    [sorted, matchesQuery],
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
  function handleSetMode(key: "baderna" | "flex" | "aniversarios") {
    setMode(key);
    // Comparar só existe na aba Baderna; ao sair, desliga pra não travar.
    if (key !== "baderna") {
      setCompareMode(false);
      setSelectedIds([]);
      setShowCompare(false);
    }
  }

  const compareSides: CompareSide[] = useMemo(
    () =>
      selectedIds
        .map((id) => badernaList.find((r) => r.member.id === id))
        .filter((r): r is (typeof badernaList)[number] => Boolean(r))
        .map((r) => ({
          member: r.member,
          badernaRank: r.badernaRank,
          rank: r.member.userId != null ? ranks[r.member.userId] : undefined,
          riotId:
            r.member.summonerName && r.member.tagLine
              ? `${r.member.summonerName}#${r.member.tagLine}`
              : null,
        })),
    [selectedIds, badernaList, ranks],
  );

  const TABS = [
    { key: "baderna",      label: "Baderna"      },
    { key: "flex",         label: "Flex"         },
    { key: "aniversarios", label: "Aniversários" },
  ] as const;

  const tabIndex = TABS.findIndex((t) => t.key === mode);

  return (
    <PanelShell showBanner={false}>
      <div className="pt-[1.5vh] sm:pt-[6vh]">
        {/* Topo: busca + comparar à esquerda; switcher à direita. */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          {/* Esquerda: busca em cima, comparar embaixo */}
          <div className="flex w-full flex-col gap-3 lg:max-w-[360px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-[18px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#b0a8a4]" strokeWidth={2} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nick ou nome…"
                className="w-full rounded-full border-none bg-white py-3.5 pl-[46px] pr-5 text-sm font-medium text-[#0f0f0f] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)] outline-none placeholder:text-[#b0a8a4] focus:ring-2 focus:ring-[#ff4100]/20"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleCompareMode}
                disabled={mode !== "baderna"}
                className={`inline-flex h-[50px] shrink-0 items-center justify-center gap-[8px] rounded-[18px] px-6 text-[13px] font-bold tracking-[-0.02em] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${
                  compareMode ? "bg-[#ff4100] text-white" : "bg-[#ededed] text-[#0f0f0f]"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-[14px] w-[14px]" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 17H20M20 17L16 13M20 17L16 21M20 7H4M4 7L8 3M4 7L8 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {compareMode ? "Cancelar comparação" : "Comparar membros"}
              </button>
            </div>
          </div>

          {/* Direita: switcher das abas */}
          <div className="relative flex h-[40px] w-full shrink-0 items-center rounded-[25px] bg-[#ededed] p-[4px] lg:w-[460px]">
            <div
              aria-hidden
              className="pointer-events-none absolute top-[4px] bottom-[4px] w-[calc((100%-8px)/3)] rounded-[25px] bg-white"
              style={{
                transform: `translateX(${tabIndex * 100}%)`,
                transition: "transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
              }}
            />
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleSetMode(key)}
                className={`relative z-[1] flex h-full flex-1 items-center justify-center rounded-[25px] text-[12px] font-semibold transition-colors duration-300 ${
                  mode === key
                    ? "text-[#0f0f0f]"
                    : "text-black/40 hover:text-black/70"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {mode === "aniversarios" ? (
          // Aniversários: copia exata da página de aniversários.
          <AniversariosClient />
        ) : mode === "baderna" ? (
          // Baderna: grid de 5 com molduras + busca/comparação.
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            {filteredBaderna.map(({ member, badernaRank }) => {
              const rankEffect = getRankEffect(badernaRank);
              const avatar = member.avatarSrc || getChampionAvatarSrc(member.id);
              const isSelected = selectedIds.includes(member.id);
              const baseClass =
                "relative flex flex-col items-center rounded-[25px] bg-white px-6 py-10 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)] transition-transform duration-200";
              const inner = (
                <>
                  <div
                    className="rounded-full p-[3px]"
                    style={{ background: rankEffect.gradient, boxShadow: rankEffect.glow }}
                  >
                    <MemberAvatar src={avatar} alt={member.nickname} />
                  </div>
                  <div className="mt-4 text-center">
                    <h2 className="text-[17px] font-bold leading-none tracking-[-0.03em] text-[#0f0f0f]">
                      <StyledName styleId={member.activeNameId}>
                        {member.nickname}
                      </StyledName>
                      <span className="ml-[5px] text-[12px] font-semibold tracking-normal text-[#aaaaaa]">
                        #{String(badernaRank).padStart(2, "0")}
                      </span>
                    </h2>
                    <p className="mt-[6px] text-[13px] font-medium tracking-[-0.01em] text-[#989898]">
                      {member.name}
                    </p>
                    <div className="mt-[12px] flex justify-center">
                      <span className="inline-flex h-[36px] items-center gap-[6px] rounded-[12px] bg-[#ededed] px-[14px] text-[13px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
                        <Image
                          src="/images/bp.png"
                          alt=""
                          width={20}
                          height={20}
                          className="h-[20px] w-[20px] object-contain"
                          unoptimized
                        />
                        {(member.badernaPoints ?? 0).toLocaleString("pt-BR")} BP
                      </span>
                    </div>
                  </div>
                </>
              );

              // Sempre Link (mesmo elemento) — no modo comparar, intercepta o
              // clique pra selecionar em vez de navegar. Evita remontar o card
              // (e o avatar) ao alternar o modo, que causava o "piscar".
              return (
                <Link
                  key={member.id}
                  href={`/membro/${member.id}`}
                  onClick={(e) => {
                    if (compareMode) {
                      e.preventDefault();
                      toggleSelect(member.id);
                    }
                  }}
                  className={`${baseClass} ${
                    compareMode && isSelected
                      ? "scale-[1.02] ring-2 ring-[#ff4100]"
                      : "hover:scale-[1.02]"
                  }`}
                >
                  {compareMode && (
                    <span
                      className={`absolute right-3 top-3 flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 transition-colors ${
                        isSelected
                          ? "border-[#ff4100] bg-[#ff4100] text-white"
                          : "border-[#e3ddd9] bg-white text-transparent"
                      }`}
                    >
                      <Check className="h-[15px] w-[15px]" strokeWidth={3} />
                    </span>
                  )}
                  {inner}
                </Link>
              );
            })}
            {filteredBaderna.length === 0 && (
              <div className="col-span-full rounded-[25px] bg-white px-6 py-16 text-center text-[14px] font-medium text-[#8d8d8d] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
                Nenhum membro encontrado.
              </div>
            )}
          </div>
        ) : (
          // Flex: cards com winrate/KDA por lane, ordenado por elo + busca.
          <div className="flex flex-col gap-4">
            {filteredFlex.map(({ member }, index) => (
              <MemberFlexCard
                key={member.id}
                index={index}
                displayName={member.name}
                nickname={member.nickname}
                styleId={member.activeNameId}
                riotId={`${member.summonerName}#${member.tagLine}`}
              />
            ))}
            {filteredFlex.length === 0 && (
              <div className="rounded-[25px] bg-white px-6 py-16 text-center text-[14px] font-medium text-[#8d8d8d] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
                Nenhum membro encontrado.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Barra de comparação */}
      {(compareMode || pillClosing) && (
        <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 xl:left-[423px] xl:right-[45px] 2xl:left-[443px]">
          <div
            onAnimationEnd={() => {
              if (pillClosing) setPillClosing(false);
            }}
            className={`flex items-center gap-[12px] rounded-[20px] bg-[#0f0f0f] py-[10px] pl-[20px] pr-[10px] shadow-[0px_8px_40px_rgba(0,0,0,0.22)] ${
              pillClosing ? "dropdown-up-out" : "dropdown-up-in"
            }`}
          >
            <span className="text-[13px] font-semibold tracking-[-0.02em] text-white">
              {selectedIds.length}/2 selecionados
            </span>
            <button
              type="button"
              disabled={selectedIds.length < 2}
              onClick={() => setShowCompare(true)}
              className="inline-flex h-[38px] items-center justify-center rounded-[12px] bg-[#ff4100] px-[18px] text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-85 disabled:opacity-40"
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
