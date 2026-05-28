"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, X } from "lucide-react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { createPortal } from "react-dom";

import {
  inhouseLobby,
  type InhousePlayer,
  type InhouseSide,
} from "@/features/panel/inhouse-data";
import { badernaMembers } from "@/features/panel/members-data";
import { panelProfile } from "@/features/panel/panel-data";
import { useTeamNames } from "@/features/panel/use-account";
import { useAuth } from "@/features/panel/use-auth";
import { useBadernaMembers } from "@/features/panel/use-baderna-members";
import type { RankType } from "@/features/panel/rank-utils";

const RANK_POINTS: Record<RankType, number> = {
  iron: 1,
  bronze: 2,
  silver: 3,
  gold: 4,
  platinum: 5,
  diamond: 6,
  master: 7,
  grandmaster: 8,
  challenger: 9,
};

function pointsFor(player: InhousePlayer): number {
  const member = badernaMembers.find((m) => m.id === player.id);
  return member ? RANK_POINTS[member.rankType] : 4; // guests default to gold
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  return [
    ...combinations(rest, k - 1).map((c) => [first, ...c]),
    ...combinations(rest, k),
  ];
}
import {
  matchIdFromInhouseId,
  useInhouses,
  type Inhouse,
} from "@/features/panel/use-inhouses";

function getPlayerHref(player: InhousePlayer): string | null {
  // Convidados não têm perfil — `id` começa com "guest-".
  if (player.id.startsWith("guest-")) return null;
  // player.id é a slug canônica do user (users.slug do DB), igual o que
  // a página /membro/{slug} usa pra lookup. Antes íamos no badernaMembers
  // estático que ficou vazio depois da migração pra API.
  return `/membro/${player.id}`;
}
const laneIconByKey = {
  TOP: "/images/lanes/Top_icon.png",
  JG: "/images/lanes/Jungle_icon.png",
  MID: "/images/lanes/Middle_icon.png",
  ADC: "/images/lanes/Bottom_icon.png",
  SUP: "/images/lanes/Support_icon.png",
} as const;

const SPECIALIST_ICON = "/images/lanes/Specialist_icon.png";

function PlayerAvatar({ player }: { player: InhousePlayer }) {
  if (player.avatarSrc) {
    return (
      <img
        src={player.avatarSrc}
        alt={player.nickname}
        className="h-[40px] w-[40px] shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="relative h-[40px] w-[40px] shrink-0 overflow-hidden rounded-full bg-[#d9d9d9]">
      <div className="absolute left-1/2 top-[9px] h-[12px] w-[12px] -translate-x-1/2 rounded-full bg-[#ababab]" />
      <div className="absolute left-1/2 bottom-[-5px] h-[19px] w-[28px] -translate-x-1/2 rounded-t-[999px] bg-[#ababab]" />
    </div>
  );
}

function LaneIcon({
  lane,
  specialist,
}: {
  lane: InhousePlayer["lane"];
  specialist?: boolean;
}) {
  const src = specialist ? SPECIALIST_ICON : laneIconByKey[lane];
  return (
    <Image
      src={src}
      alt={specialist ? "Specialist" : lane}
      width={24}
      height={24}
      className="h-[24px] w-[24px] object-contain opacity-75"
    />
  );
}

function PlayerRow({
  player,
  side,
  isLeader,
  specialist,
  badernaRank,
  dimmed = false,
}: {
  player: InhousePlayer;
  side: InhouseSide;
  isLeader: boolean;
  specialist?: boolean;
  badernaRank?: number;
  dimmed?: boolean;
}) {
  const href = getPlayerHref(player);
  // Time perdedor depois que o vencedor foi definido: opacidade + grayscale
  // pra deixar visualmente "apagado" sem esconder informação.
  const dimClass = dimmed ? "opacity-50 grayscale" : "";
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    href ? (
      <Link
        href={href}
        className={`block w-full max-w-[390px] md:max-w-[640px] xl:max-w-[390px] transition-all duration-300 hover:scale-[1.02] ${dimClass}`}
      >
        {children}
      </Link>
    ) : (
      <div className={`w-full max-w-[390px] md:max-w-[640px] xl:max-w-[390px] transition-opacity duration-300 ${dimClass}`}>
        {children}
      </div>
    );

  if (side === "blue") {
    return (
      <Wrapper>
        <article className="flex h-[76px] w-full items-center gap-4 rounded-[22px] bg-white px-[20px] shadow-[0_16px_38px_rgba(0,0,0,0.09)]">
          <PlayerAvatar player={player} />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-[17px] font-bold tracking-[-0.03em] text-[#111111]">
                {player.nickname}
              </p>
              {badernaRank ? (
                <span className="shrink-0 text-[11px] font-bold tracking-[0em] text-[#b0a8a4]">
                  #{String(badernaRank).padStart(2, "0")}
                </span>
              ) : null}
              {isLeader ? (
                <span className="inline-flex shrink-0 items-center rounded-full bg-[#fff1ea] px-2.5 py-1 text-[10px] font-bold tracking-[0em] text-[#ff4100]">
                  Lider
                </span>
              ) : null}
            </div>
            <p className="mt-[1px] truncate text-[10px] font-medium tracking-[0em] text-[#9a9a9a]">
              {player.name}
            </p>
          </div>
          <LaneIcon lane={player.lane} specialist={specialist} />
        </article>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <article className="flex h-[76px] w-full items-center gap-4 rounded-[22px] bg-white px-[20px] shadow-[0_16px_38px_rgba(0,0,0,0.09)]">
        {/* Mobile: avatar à esquerda. Desktop: lane icon à esquerda. */}
        <div className="order-3 xl:order-1">
          <LaneIcon lane={player.lane} specialist={specialist} />
        </div>
        <div className="order-2 min-w-0 flex-1 text-left xl:text-right">
          <div className="flex items-center justify-start gap-2 xl:justify-end">
            {isLeader ? (
              <span className="order-3 inline-flex shrink-0 items-center rounded-full bg-[#fff1ea] px-2.5 py-1 text-[10px] font-bold tracking-[0em] text-[#ff4100] xl:order-1">
                Lider
              </span>
            ) : null}
            {badernaRank ? (
              <span className="order-2 shrink-0 text-[11px] font-bold tracking-[0em] text-[#b0a8a4]">
                #{String(badernaRank).padStart(2, "0")}
              </span>
            ) : null}
            <p className="order-1 truncate text-[17px] font-bold tracking-[-0.03em] text-[#111111] xl:order-3">
              {player.nickname}
            </p>
          </div>
          <p className="mt-[1px] truncate text-[10px] font-medium tracking-[0em] text-[#9a9a9a]">
            {player.name}
          </p>
        </div>

        <div className="order-1 xl:order-3">
          <PlayerAvatar player={player} />
        </div>
      </article>
    </Wrapper>
  );
}

function TeamHeader({
  label,
  leader,
  align = "left",
  side,
  hideAvatar = false,
  dimmed = false,
}: {
  label: string;
  leader: InhousePlayer;
  align?: "left" | "right" | "center";
  side: InhouseSide;
  hideAvatar?: boolean;
  dimmed?: boolean;
}) {
  const sideLabel = side === "blue" ? "Azul" : "Vermelho";
  const sideGradient =
    side === "blue"
      ? "bg-gradient-to-r from-[#0a4a8c] to-[#1a72d8]"
      : "bg-gradient-to-r from-[#8b1a1a] to-[#d83333]";
  const subtitle = (
    <p className="mt-1 text-[12px] font-semibold tracking-[0em] text-[#8f8f8f]">
      Lider: {leader.nickname}
      <span className="mx-[6px] text-[#d0cbc7]">·</span>
      <span
        className={`${sideGradient} bg-clip-text text-transparent font-bold`}
      >
        {sideLabel}
      </span>
    </p>
  );
  const justifyClass =
    align === "right"
      ? "justify-self-end"
      : align === "center"
        ? "justify-self-center"
        : "justify-self-start";
  const dimClass = dimmed ? "opacity-50 grayscale" : "";
  return (
    <div className={`flex items-center gap-4 transition-opacity duration-300 ${justifyClass} ${dimClass}`}>
      {align === "right" ? (
        <>
          <div className="text-right">
            <p className="text-[24px] font-bold tracking-[-0.03em] text-[#111111]">{label}</p>
            {subtitle}
          </div>
          {!hideAvatar && <PlayerAvatar player={leader} />}
        </>
      ) : align === "center" ? (
        <div className="text-center">
          <p className="text-[24px] font-bold tracking-[-0.03em] text-[#111111]">{label}</p>
          {subtitle}
        </div>
      ) : (
        <>
          {!hideAvatar && <PlayerAvatar player={leader} />}
          <div className="text-left">
            <p className="text-[24px] font-bold tracking-[-0.03em] text-[#111111]">{label}</p>
            {subtitle}
          </div>
        </>
      )}
    </div>
  );
}

function InhouseMatchHeader({
  blueLeader,
  redLeader,
  mode,
  losingSide = null,
}: {
  blueLeader: InhousePlayer;
  redLeader: InhousePlayer;
  mode: Inhouse["mode"];
  losingSide?: InhouseSide | null;
}) {
  const teamNames = useTeamNames();
  const allMembers = useBadernaMembers();
  // Procura o teamName custom do membro pela API (settings de "Minha conta").
  // Cai pra teamNames (localStorage por user_id) se for guest. Default = "Time {nick}".
  function resolveTeamLabel(leader: InhousePlayer): string {
    const member = allMembers.find((m) => m.id === leader.id);
    const apiTeam = member?.teamName?.trim();
    if (apiTeam && apiTeam !== `Time ${leader.nickname}`) return apiTeam;
    if (apiTeam) return apiTeam;
    return teamNames[leader.id] ?? `Time ${leader.nickname}`;
  }
  const blueLabel = resolveTeamLabel(blueLeader);
  const redLabel = resolveTeamLabel(redLeader);
  // Quando vencedor já foi definido (losingSide != null), o lobby tá
  // "Concluído"; antes disso continua "Pronto" (status default).
  const statusLabel = losingSide ? "Concluído" : inhouseLobby.status;
  return (
    <section className="grid w-full items-center gap-6 xl:grid-cols-[minmax(0,0.84fr)_minmax(320px,0.7fr)_minmax(0,0.88fr)]">
      {/* Mobile: compact status pill no topo. Desktop: continua no centro. */}
      <div className="order-first flex items-center justify-center gap-[10px] xl:hidden">
        <span className="text-[12px] font-semibold tracking-[-0.02em] text-[#8b8b8b]">
          {inhouseLobby.matchType}
        </span>
        <span className="h-[4px] w-[4px] rounded-full bg-[#d4d4d4]" />
        <span className="text-[13px] font-bold tracking-[-0.02em] text-[#111111]">
          {statusLabel}
        </span>
        <span className="h-[4px] w-[4px] rounded-full bg-[#d4d4d4]" />
        <span className="text-[12px] font-semibold tracking-[-0.02em] text-[#8f8f8f]">
          {mode === "leader" ? "Modo Líder" : "Modo Aleatório"}
        </span>
      </div>

      <TeamHeader
        label={blueLabel}
        leader={blueLeader}
        side="blue"
        dimmed={losingSide === "blue"}
      />

      {/* Desktop only: bloco grande centralizado entre os times */}
      <div className="hidden text-center xl:block">
        <p className="text-[14px] font-bold tracking-[0em] text-[#8b8b8b]">
          {inhouseLobby.matchType}
        </p>
        <p className="mt-2 text-[30px] font-bold leading-none tracking-[-0.03em] text-[#111111]">
          {statusLabel}
        </p>
        <p className="mt-2 text-[14px] font-semibold tracking-[0em] text-[#8f8f8f]">
          {mode === "leader" ? "Modo Líder" : "Modo Aleatório"}
        </p>
      </div>

      <TeamHeader
        label={redLabel}
        leader={redLeader}
        align="right"
        side="red"
        dimmed={losingSide === "red"}
      />
    </section>
  );
}

function InhouseConnectCard() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inhouseLobby.consoleLinkLabel);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-[380px] rounded-[26px] border border-[#f0e7e2] bg-[#ffffff] p-4 xl:shadow-[0_18px_60px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-2 rounded-[18px] bg-[#ededed] p-2">
        <a
          href={inhouseLobby.consoleLinkHref}
          className="min-w-0 flex-1 truncate px-3 text-[13px] font-semibold tracking-[-0.02em] text-[#666666] transition-colors hover:text-[#0f0f0f]"
        >
          {inhouseLobby.consoleLinkLabel}
        </a>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-[14px] bg-white px-4 text-[11px] font-bold tracking-[-0.02em] text-[#0f0f0f] transition-colors hover:bg-[#f4f1ef]"
        >
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>

      <a
        href={inhouseLobby.connectHref}
        className="mt-3 flex h-[50px] w-full items-center justify-center rounded-[18px] bg-[#ff4100] text-[13px] font-bold tracking-[-0.02em] text-white transition-colors hover:bg-[#ff4100]"
      >
        Conectar na partida
      </a>
    </section>
  );
}

/**
 * Card de definição/exibição de vencedor. Antes de marcar, mostra um
 * botão pro criador/admin escolher quem ganhou. Depois de marcado,
 * mostra "Time X venceu" + indicação das moedas creditadas.
 */
function InhouseWinnerCard({
  inhouse,
  blueLabel,
  redLabel,
}: {
  inhouse: Inhouse;
  blueLabel: string;
  redLabel: string;
}) {
  const { user } = useAuth();
  const { setInhouseWinner } = useInhouses();
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const winner = inhouse.winner ?? null;
  const isCreator = !!user && inhouse.createdBy === user.id;
  const isAdmin = !!user?.is_admin;
  const canMark = !winner && (isCreator || isAdmin) && !!inhouse.shortCode;

  async function confirm(side: "blue" | "red") {
    if (!inhouse.shortCode) return;
    setSaving(true);
    setError(null);
    const err = await setInhouseWinner(inhouse.shortCode, side);
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    setPicking(false);
  }

  if (winner) {
    const winLabel = winner === "blue" ? blueLabel : redLabel;
    const winGradient =
      winner === "blue"
        ? "from-[#0a4a8c] to-[#1a72d8]"
        : "from-[#8b1a1a] to-[#d83333]";
    return (
      <section className="mx-auto mt-4 w-full max-w-[380px] rounded-[26px] border border-[#f0e7e2] bg-white p-5 text-center xl:shadow-[0_18px_60px_rgba(0,0,0,0.08)]">
        <p className="text-[11px] font-bold tracking-[-0.02em] text-[#8d8d8d]">
          Resultado
        </p>
        <p
          className={`mt-1 bg-gradient-to-r ${winGradient} bg-clip-text text-[20px] font-bold tracking-[-0.03em] text-transparent`}
        >
          {winLabel} venceu
        </p>
        <p className="mt-2 text-[12px] font-medium text-[#8d8d8d]">
          Moedas creditadas pra todos os jogadores.
        </p>
      </section>
    );
  }

  if (!canMark) return null;

  // Botão inline + modal portalizado pra não crescer o layout (e
  // empurrar a sidebar). Modal só monta enquanto `picking`.
  return (
    <>
      <section className="mx-auto mt-4 w-full max-w-[380px] rounded-[26px] border border-[#f0e7e2] bg-white p-4 xl:shadow-[0_18px_60px_rgba(0,0,0,0.08)]">
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="flex h-[50px] w-full items-center justify-center rounded-[18px] bg-[#0f0f0f] text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-85"
        >
          Definir vencedor
        </button>
      </section>
      {picking && typeof document !== "undefined"
        ? createPortal(
            <WinnerPickerModal
              blueLabel={blueLabel}
              redLabel={redLabel}
              saving={saving}
              error={error}
              onPick={(side) => void confirm(side)}
              onClose={() => {
                if (saving) return;
                setPicking(false);
                setError(null);
              }}
            />,
            document.body,
          )
        : null}
    </>
  );
}

function WinnerPickerModal({
  blueLabel,
  redLabel,
  saving,
  error,
  onPick,
  onClose,
}: {
  blueLabel: string;
  redLabel: string;
  saving: boolean;
  error: string | null;
  onPick: (side: "blue" | "red") => void;
  onClose: () => void;
}) {
  // Padrão dos outros modais do app: estado interno `closing` toca a
  // animação de saída e dispara onClose só quando ela termina.
  const [closing, setClosing] = useState(false);
  function requestClose() {
    if (saving) return;
    setClosing(true);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") requestClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving]);

  return (
    <div
      className={`${closing ? "modal-backdrop-out" : "modal-backdrop-in"} fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[3px]`}
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        className={`${closing ? "modal-panel-out" : "modal-panel-in"} relative mx-4 w-full max-w-[420px] rounded-[28px] bg-white p-6 shadow-[0_32px_80px_rgba(0,0,0,0.22)]`}
        onAnimationEnd={() => {
          if (closing) onClose();
        }}
      >
        <p className="text-center text-[15px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
          Qual time venceu?
        </p>
        <p className="mt-1 text-center text-[12px] font-medium text-[#8d8d8d]">
          Credita as moedas configuradas em Recompensas.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onPick("blue")}
            disabled={saving}
            className="flex h-[50px] items-center justify-center rounded-[18px] bg-gradient-to-r from-[#0a4a8c] to-[#1a72d8] text-[12px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-85 disabled:opacity-60"
          >
            {blueLabel}
          </button>
          <button
            type="button"
            onClick={() => onPick("red")}
            disabled={saving}
            className="flex h-[50px] items-center justify-center rounded-[18px] bg-gradient-to-r from-[#8b1a1a] to-[#d83333] text-[12px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-85 disabled:opacity-60"
          >
            {redLabel}
          </button>
        </div>
        <button
          type="button"
          onClick={requestClose}
          disabled={saving}
          className="mt-3 w-full text-center text-[12px] font-semibold tracking-[-0.02em] text-[#8d8d8d] transition-colors hover:text-[#0f0f0f] disabled:opacity-50"
        >
          Cancelar
        </button>
        {error && (
          <p className="mt-2 text-center text-[11px] font-medium text-red-500">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}


export function InhouseDetail({ inhouse }: { inhouse: Inhouse }) {
  const { updateInhouse } = useInhouses();
  const allMembersForRank = useBadernaMembers();
  const teamNames = useTeamNames();
  function resolveTeamLabel(leader: InhousePlayer): string {
    const member = allMembersForRank.find((m) => m.id === leader.id);
    const apiTeam = member?.teamName?.trim();
    if (apiTeam && apiTeam !== `Time ${leader.nickname}`) return apiTeam;
    if (apiTeam) return apiTeam;
    return teamNames[leader.id] ?? `Time ${leader.nickname}`;
  }
  // Mapa { player.id -> posição no ranking Baderna }. Usa a ordem natural
  // da API (mesma da página /ranking aba Baderna) — sem re-sort por tier.
  const badernaRankByMemberId = useMemo(() => {
    return new Map<string, number>(
      allMembersForRank.map((m, i) => [m.id, i + 1]),
    );
  }, [allMembersForRank]);
  const hasPool = inhouse.players.some((p) => p.side === "pool");
  const isAssigning = inhouse.mode === "leader" && hasPool;
  const [hoverSide, setHoverSide] = useState<InhouseSide | null>(null);
  const [drag, setDrag] = useState<{ id: string } | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const draggingId = drag?.id ?? null;
  const hoverSideRef = useRef<InhouseSide | null>(null);
  hoverSideRef.current = hoverSide;
  const dragRef = useRef<{ id: string } | null>(null);
  dragRef.current = drag;

  // While dragging, the dragged player is visually removed from its source.
  const visiblePlayers = draggingId
    ? inhouse.players.filter((p) => p.id !== draggingId)
    : inhouse.players;
  function sortLeaderFirst(team: InhousePlayer[], leaderId: string) {
    return [...team].sort((a, b) =>
      a.id === leaderId ? -1 : b.id === leaderId ? 1 : 0,
    );
  }
  const blueTeam = sortLeaderFirst(
    visiblePlayers.filter((p) => p.side === "blue"),
    inhouse.blueLeaderId,
  );
  const redTeam = sortLeaderFirst(
    visiblePlayers.filter((p) => p.side === "red"),
    inhouse.redLeaderId,
  );
  const blueCount = visiblePlayers.filter((p) => p.side === "blue").length;
  const redCount = visiblePlayers.filter((p) => p.side === "red").length;
  // Times completos (5x5). Quando + tem extras na pool, mostra botão Confirmar.
  const teamsFull = blueCount === 5 && redCount === 5;
  const poolPlayers = visiblePlayers.filter((p) => p.side === "pool");

  // Callback: descarta os participantes que sobraram na pool e finaliza
  // a montagem dos times. Chamado quando o admin clica em "Confirmar".
  function confirmTeams() {
    if (!teamsFull) return;
    const next = inhouse.players.filter((p) => p.side !== "pool");
    updateInhouse(inhouse.id, { players: next });
  }
  const blueLeader =
    inhouse.players.find((p) => p.id === inhouse.blueLeaderId) ?? blueTeam[0];
  const redLeader =
    inhouse.players.find((p) => p.id === inhouse.redLeaderId) ?? redTeam[0];
  const blueLabel = blueLeader ? resolveTeamLabel(blueLeader) : "Time Azul";
  const redLabel = redLeader ? resolveTeamLabel(redLeader) : "Time Vermelho";
  // Lado perdedor (oposto do vencedor) — dimmed visualmente na lista.
  const losingSide: InhouseSide | null = inhouse.winner
    ? inhouse.winner === "blue" ? "red" : "blue"
    : null;
  const statusLabel = inhouse.winner ? "Concluído" : inhouseLobby.status;

  function setPlayerSide(id: string, side: InhouseSide) {
    if (id === inhouse.blueLeaderId || id === inhouse.redLeaderId) return;
    const current = inhouse.players.find((p) => p.id === id)?.side;
    if (!current || current === side) return;
    if (side === "blue" && blueTeam.length >= 5) return;
    if (side === "red" && redTeam.length >= 5) return;
    updateInhouse(inhouse.id, {
      players: inhouse.players.map((p) =>
        p.id === id ? { ...p, side } : p,
      ),
    });
  }

  function startDrag(e: ReactPointerEvent, id: string) {
    // Skip if the actual target was an interactive child (eg. the remove X)
    const target = e.target as HTMLElement;
    if (target.closest("[data-no-drag]")) return;
    e.preventDefault();
    setDrag({ id });
    setDragPos({ x: e.clientX, y: e.clientY });
  }

  // Auto-fill the other team when one side hits 5 with players still on the bench.
  // SÓ funciona se o total for exatamente 10 — senão atravanca quando o líder
  // escolheu 5 num time mas a pool tem mais gente do que cabe no outro lado.
  useEffect(() => {
    if (!isAssigning) return;
    if (inhouse.players.length !== 10) return;
    const blueCount = inhouse.players.filter((p) => p.side === "blue").length;
    const redCount = inhouse.players.filter((p) => p.side === "red").length;
    const poolCount = inhouse.players.filter((p) => p.side === "pool").length;
    if (poolCount === 0) return;
    let target: InhouseSide | null = null;
    if (blueCount === 5) target = "red";
    else if (redCount === 5) target = "blue";
    if (!target) return;
    const dest = target;
    updateInhouse(inhouse.id, {
      players: inhouse.players.map((p) =>
        p.side === "pool" ? { ...p, side: dest } : p,
      ),
    });
  }, [isAssigning, inhouse.id, inhouse.players, updateInhouse]);

  useEffect(() => {
    if (!drag) return;
    function onMove(e: PointerEvent) {
      setDragPos({ x: e.clientX, y: e.clientY });
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const zone = (el as HTMLElement | null)?.closest(
        "[data-drop-side]",
      ) as HTMLElement | null;
      const side = (zone?.dataset.dropSide as InhouseSide | undefined) ?? null;
      setHoverSide(side);
    }
    function onUp() {
      const id = dragRef.current?.id;
      const side = hoverSideRef.current;
      if (id && side) setPlayerSide(id, side);
      setDrag(null);
      setHoverSide(null);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag]);

  function randomize() {
    if (poolPlayers.length === 0) return;
    const blueSlotsLeft = 5 - blueTeam.length;
    const redSlotsLeft = 5 - redTeam.length;
    if (blueSlotsLeft + redSlotsLeft !== poolPlayers.length) return;
    const blueBaseSum = blueTeam.reduce((s, p) => s + pointsFor(p), 0);
    const redBaseSum = redTeam.reduce((s, p) => s + pointsFor(p), 0);
    const idxs = poolPlayers.map((_, i) => i);
    const combos = combinations(idxs, blueSlotsLeft);
    let bestDiff = Infinity;
    let bestCombos: number[][] = [];
    for (const combo of combos) {
      const blueExtra = combo.reduce((s, i) => s + pointsFor(poolPlayers[i]), 0);
      const redExtra = idxs
        .filter((i) => !combo.includes(i))
        .reduce((s, i) => s + pointsFor(poolPlayers[i]), 0);
      const diff = Math.abs(
        blueBaseSum + blueExtra - (redBaseSum + redExtra),
      );
      if (diff < bestDiff) {
        bestDiff = diff;
        bestCombos = [combo];
      } else if (diff === bestDiff) {
        bestCombos.push(combo);
      }
    }
    const chosen =
      bestCombos[Math.floor(Math.random() * bestCombos.length)] ?? [];
    const chosenIds = new Set(chosen.map((i) => poolPlayers[i].id));
    const nextPlayers = inhouse.players.map((p) => {
      if (p.side !== "pool") return p;
      return { ...p, side: chosenIds.has(p.id) ? "blue" : "red" } as InhousePlayer;
    });
    updateInhouse(inhouse.id, { players: nextPlayers });
  }

  function buildSlots(team: InhousePlayer[], leaderId: string): Array<InhousePlayer | null> {
    const leader = team.find((p) => p.id === leaderId);
    const others = team.filter((p) => p.id !== leaderId);
    const slots: Array<InhousePlayer | null> = [];
    slots.push(leader ?? null);
    for (let i = 0; i < 4; i++) slots.push(others[i] ?? null);
    return slots;
  }

  const blueSlots = isAssigning
    ? buildSlots(blueTeam, inhouse.blueLeaderId)
    : null;
  const redSlots = isAssigning
    ? buildSlots(redTeam, inhouse.redLeaderId)
    : null;

  return (
    <section className="relative min-h-0 overflow-visible rounded-[36px] bg-transparent px-0 py-2 xl:min-h-[calc(100vh-120px)]">
      <div className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden rounded-[36px] xl:block">
        <div className="absolute inset-x-0 top-[30px] h-[120px] bg-[radial-gradient(circle_at_center,rgba(52,125,255,0.06),transparent_58%)] blur-[44px]" />

        <div className="absolute top-[200px] left-1/2 h-[540px] w-[820px] -translate-x-[calc(50%+16px)]">
          <div className="inhouse-rift-float absolute inset-0">
            <Image
              src="/images/inhouse/summoners-rift.png"
              alt="Summoner's Rift"
              fill
              className="object-contain"
              sizes="820px"
              unoptimized
            />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_90%_at_center,transparent_40%,rgba(255,255,255,0.16)_65%,rgba(255,255,255,0.45)_85%,rgba(255,255,255,0)_100%)]" />
          <div className="absolute -bottom-[4px] left-[6%] right-[6%] h-[124px] bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.16),transparent_72%)] blur-[24px]" />
          <div className="inhouse-smoke inhouse-smoke--a absolute z-[2] -left-[56px] bottom-[74px] h-[228px] w-[290px]" />
          <div className="inhouse-smoke inhouse-smoke--b absolute z-[2] left-[18px] bottom-[-22px] h-[216px] w-[328px]" />
          <div className="inhouse-smoke inhouse-smoke--b absolute z-[2] right-[8px] top-[88px] h-[214px] w-[284px]" />
          <div className="inhouse-smoke inhouse-smoke--a absolute z-[2] right-[42px] bottom-[-4px] h-[210px] w-[342px]" />
          <div className="inhouse-smoke inhouse-smoke--a absolute z-[2] left-1/2 top-[16px] h-[172px] w-[250px] -translate-x-1/2" />
          <div className="inhouse-smoke inhouse-smoke--c absolute z-[2] left-1/2 bottom-[26px] h-[248px] w-[372px] -translate-x-1/2" />
        </div>
      </div>

      <div className="relative z-10 flex w-full flex-col gap-4 justify-center pt-[24px] xl:min-h-[860px] xl:pt-[62px]">
        <div className="hidden xl:block">
          <InhouseMatchHeader
            blueLeader={blueLeader}
            redLeader={redLeader}
            mode={inhouse.mode}
            losingSide={losingSide}
          />
        </div>

        <div className="mt-[20px] grid w-full items-start gap-6 xl:mt-[40px] xl:grid-cols-[minmax(0,0.84fr)_minmax(340px,0.7fr)_minmax(0,0.88fr)] xl:gap-5">
          <div
            data-drop-side={isAssigning ? "blue" : undefined}
            className={`order-1 w-full max-w-[390px] md:max-w-[640px] xl:max-w-[390px] space-y-4 xl:order-none xl:-ml-[4px] xl:space-y-7 ${
              isAssigning && hoverSide === "blue"
                ? "rounded-[24px] outline-2 outline-dashed outline-[#347dff]"
                : ""
            }`}
          >
            {/* Mobile-only: header do time azul antes dos cards (centralizado) */}
            <div className="mb-[32px] flex justify-center xl:hidden">
              <TeamHeader label={resolveTeamLabel(blueLeader)} leader={blueLeader} side="blue" align="center" hideAvatar dimmed={losingSide === "blue"} />
            </div>
            {isAssigning && blueSlots
              ? blueSlots.map((p, i) =>
                  p ? (
                    <DraggablePlayerRow
                      key={p.id}
                      player={p}
                      side="blue"
                      isLeader={p.id === inhouse.blueLeaderId}
                      onRemove={() => setPlayerSide(p.id, "pool")}
                      onPointerDown={(e) => startDrag(e, p.id)}
                      badernaRank={badernaRankByMemberId.get(p.id)}
                    />
                  ) : (
                    <EmptySlot key={`empty-blue-${i}`} side="blue" index={i} />
                  ),
                )
              : blueTeam.map((player) => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    side="blue"
                    isLeader={player.id === inhouse.blueLeaderId}
                    specialist={inhouse.mode === "leader"}
                    badernaRank={badernaRankByMemberId.get(player.id)}
                    dimmed={losingSide === "blue"}
                  />
                ))}
          </div>

          {/* Mobile-only: status block ENTRE os dois times */}
          <div className="order-2 my-[40px] flex items-center justify-center gap-[10px] xl:hidden">
            <span className="text-[12px] font-semibold tracking-[-0.02em] text-[#8b8b8b]">
              {inhouseLobby.matchType}
            </span>
            <span className="h-[4px] w-[4px] rounded-full bg-[#d4d4d4]" />
            <span className="text-[13px] font-bold tracking-[-0.02em] text-[#111111]">
              {statusLabel}
            </span>
            <span className="h-[4px] w-[4px] rounded-full bg-[#d4d4d4]" />
            <span className="text-[12px] font-semibold tracking-[-0.02em] text-[#8f8f8f]">
              {inhouse.mode === "leader" ? "Modo Líder" : "Modo Aleatório"}
            </span>
          </div>

          <div className="order-4 hidden items-end justify-center xl:flex xl:order-none xl:min-h-[620px]">
            <div className="w-full pt-0 xl:pt-[458px]">
              {isAssigning ? (
                <AssignmentPoolCard
                  players={poolPlayers}
                  total={blueTeam.length + redTeam.length}
                  isHover={hoverSide === "pool"}
                  onRandomize={randomize}
                  onChipPointerDown={(e, id) => startDrag(e, id)}
                  teamsFull={teamsFull}
                  onConfirm={confirmTeams}
                />
              ) : (
                <>
                  <InhouseConnectCard />
                  <InhouseWinnerCard
                    inhouse={inhouse}
                    blueLabel={blueLabel}
                    redLabel={redLabel}
                  />
                </>
              )}
            </div>
          </div>

          {/* Mobile: pool/connect vira bottom sheet ancorado no fim da tela. */}
          <div className="order-4 xl:hidden">
            <MobilePoolBottomSheet
              isAssigning={isAssigning}
              poolPlayers={poolPlayers}
              total={blueTeam.length + redTeam.length}
              isHover={hoverSide === "pool"}
              onRandomize={randomize}
              onChipPointerDown={(e, id) => startDrag(e, id)}
              teamsFull={teamsFull}
              onConfirm={confirmTeams}
              inhouse={inhouse}
              blueLabel={blueLabel}
              redLabel={redLabel}
            />
          </div>

          <div
            data-drop-side={isAssigning ? "red" : undefined}
            className={`order-3 w-full max-w-[390px] md:max-w-[640px] xl:max-w-[390px] space-y-4 xl:order-none xl:ml-auto xl:space-y-7 xl:flex xl:flex-col xl:items-end ${
              isAssigning && hoverSide === "red"
                ? "rounded-[24px] outline-2 outline-dashed outline-[#e84545]"
                : ""
            }`}
          >
            {/* Mobile-only: header do time vermelho antes dos cards (centralizado) */}
            <div className="mb-[32px] flex justify-center xl:hidden">
              <TeamHeader label={resolveTeamLabel(redLeader)} leader={redLeader} side="red" align="center" hideAvatar dimmed={losingSide === "red"} />
            </div>
            {isAssigning && redSlots
              ? redSlots.map((p, i) =>
                  p ? (
                    <DraggablePlayerRow
                      key={p.id}
                      player={p}
                      side="red"
                      isLeader={p.id === inhouse.redLeaderId}
                      onRemove={() => setPlayerSide(p.id, "pool")}
                      onPointerDown={(e) => startDrag(e, p.id)}
                      badernaRank={badernaRankByMemberId.get(p.id)}
                    />
                  ) : (
                    <EmptySlot key={`empty-red-${i}`} side="red" index={i} />
                  ),
                )
              : redTeam.map((player) => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    side="red"
                    isLeader={player.id === inhouse.redLeaderId}
                    specialist={inhouse.mode === "leader"}
                    badernaRank={badernaRankByMemberId.get(player.id)}
                    dimmed={losingSide === "red"}
                  />
                ))}
          </div>
        </div>
      </div>

      {drag && (() => {
        const player = inhouse.players.find((p) => p.id === drag.id);
        if (!player) return null;
        return (
          <div
            className="pointer-events-none fixed z-[200] flex h-[48px] w-[200px] -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-[14px] bg-white px-3 shadow-[0_24px_60px_rgba(0,0,0,0.25)] ring-1 ring-black/[0.04]"
            style={{ left: dragPos.x, top: dragPos.y }}
          >
            <div className="relative h-[32px] w-[32px] shrink-0 overflow-hidden rounded-full">
              {player.avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={player.avatarSrc}
                  alt={player.nickname}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-[#d9d9d9]" />
              )}
            </div>
            <p className="min-w-0 flex-1 truncate text-[12px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
              {player.nickname}
            </p>
          </div>
        );
      })()}
    </section>
  );
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d}d`;
}

function InhouseListCard({
  inhouse,
  onRemove,
}: {
  inhouse: Inhouse;
  onRemove: () => void;
}) {
  const { user } = useAuth();
  const isAdmin = !!user?.is_admin;
  const blueTeam = inhouse.players.filter((p) => p.side === "blue");
  const redTeam = inhouse.players.filter((p) => p.side === "red");
  const blueLeader =
    blueTeam.find((p) => p.id === inhouse.blueLeaderId) ?? blueTeam[0];
  const redLeader =
    redTeam.find((p) => p.id === inhouse.redLeaderId) ?? redTeam[0];

  return (
    <Link
      href={`/inhouse/${inhouse.shortCode ?? matchIdFromInhouseId(inhouse.id)}`}
      className="group relative flex w-full flex-col rounded-[var(--panel-radius-card)] bg-white px-[20px] py-[18px] text-left shadow-[0_16px_38px_rgba(0,0,0,0.06)] transition-opacity hover:opacity-85"
    >
      {isAdmin && (
        <span
          role="button"
          aria-label="Excluir inhouse"
          title="Excluir inhouse"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="absolute right-[12px] top-[12px] z-10 flex h-[26px] w-[26px] items-center justify-center rounded-full text-[#b0a8a4] opacity-0 transition-all hover:bg-[#fee2e2] hover:text-[#c53030] group-hover:opacity-100"
        >
          <X className="h-[14px] w-[14px]" strokeWidth={2.4} />
        </span>
      )}

      {/* Blue team row */}
      <TeamRow
        leader={blueLeader}
        team={blueTeam}
        dimmed={inhouse.winner === "red"}
      />

      {/* Vs divider */}
      <div className="my-[12px] flex items-center gap-[10px]">
        <span className="h-px flex-1 bg-[#ececec]" />
        <span className="text-[12px] font-semibold tracking-[0em] text-[#8d8d8d]">
          vs
        </span>
        <span className="h-px flex-1 bg-[#ececec]" />
      </div>

      {/* Red team row */}
      <TeamRow
        leader={redLeader}
        team={redTeam}
        dimmed={inhouse.winner === "blue"}
      />

      {/* Meta footer */}
      <div className="mt-[14px] flex items-center justify-between border-t border-[#f1eeec] pt-[10px]">
        <span className="text-[11px] font-semibold text-[#b0a8a4]">
          5v5 · {formatRelative(inhouse.createdAt)}
        </span>
        <span className="text-[11px] font-semibold text-[#b0a8a4]">
          {inhouse.shortCode ?? matchIdFromInhouseId(inhouse.id)}
        </span>
      </div>
    </Link>
  );
}

function CaptainAvatar({ player }: { player: InhousePlayer }) {
  const imgRef = useRef<HTMLImageElement>(null);
  // Inicia "loaded" se a imagem já estiver em cache (complete=true antes do
  // primeiro paint). Evita o flash do skeleton em refreshes.
  const [loaded, setLoaded] = useState(() => false);
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, [player.avatarSrc]);
  return (
    <div className="relative h-[48px] w-[48px] shrink-0 overflow-hidden rounded-full ring-[2px] ring-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] bg-[#ededed]">
      {player.avatarSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={player.avatarSrc}
          alt=""
          className="h-full w-full object-cover"
          onLoad={() => setLoaded(true)}
          style={{ opacity: loaded ? 1 : 0 }}
        />
      ) : null}
    </div>
  );
}

function TeamRow({
  leader,
  team,
  dimmed = false,
}: {
  leader: InhousePlayer;
  team: InhousePlayer[];
  dimmed?: boolean;
}) {
  const teamNames = useTeamNames();
  const allMembers = useBadernaMembers();
  const member = allMembers.find((m) => m.id === leader.id);
  const apiTeam = member?.teamName?.trim();
  const label =
    apiTeam || teamNames[leader.id] || `Time ${leader.nickname}`;
  return (
    <div
      className={`flex items-center gap-[14px] transition-opacity duration-300 ${
        dimmed ? "opacity-50 grayscale" : ""
      }`}
    >
      <CaptainAvatar player={leader} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
          {label}
        </p>
        <p className="truncate text-[11px] font-semibold text-[#8d8d8d]">
          Líder · {leader.nickname}
        </p>
      </div>
      <div className="flex shrink-0 items-center">
        {team
          .filter((p) => p.id !== leader.id)
          .map((p, i) => (
            <div
              key={p.id}
              className="relative -ml-[6px] h-[24px] w-[24px] overflow-hidden rounded-full ring-2 ring-white first:ml-0"
              style={{ zIndex: 10 - i }}
              title={p.nickname}
            >
              {p.avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.avatarSrc}
                  alt=""
                  className="h-full w-full object-cover bg-[#ededed]"
                />
              ) : (
                <div className="h-full w-full bg-[#ededed]" />
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

export function InhouseLobbyBoard() {
  const { inhouses, removeInhouse } = useInhouses();

  if (inhouses.length === 0) {
    return (
      <section className="-mt-4 -mb-10 flex h-screen w-full flex-col items-center justify-center px-4 text-center sm:-mt-6 xl:-mt-[45px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/gifs/skeleton.gif"
          alt=""
          className="mb-[36px] h-[180px] w-[180px] object-contain"
        />
        <p className="text-[16px] font-semibold tracking-[-0.02em] text-[#0f0f0f]">
          Nenhum inhouse ativo no momento.
        </p>
        <p className="mt-[6px] text-[13px] text-[#7c7c7c]">
          Peça um admin para criar um novo.
        </p>
      </section>
    );
  }

  return (
    <section className="relative w-full pt-[1.5vh] sm:pt-[6vh]">
      <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2 xl:grid-cols-3">
        {inhouses.map((inhouse) => (
          <InhouseListCard
            key={inhouse.id}
            inhouse={inhouse}
            onRemove={() => removeInhouse(inhouse.id)}
          />
        ))}
      </div>
    </section>
  );
}

/* ── Inline-assignment helpers ────────────────────────── */
function DraggablePlayerRow({
  player,
  side,
  isLeader,
  onRemove,
  onPointerDown,
  badernaRank,
}: {
  player: InhousePlayer;
  side: "blue" | "red";
  isLeader: boolean;
  onRemove: () => void;
  onPointerDown: (e: ReactPointerEvent) => void;
  badernaRank?: number;
}) {
  const isBlue = side === "blue";
  return (
    <div
      onPointerDown={isLeader ? undefined : onPointerDown}
      className={`group block w-full max-w-[390px] md:max-w-[640px] xl:max-w-[390px] touch-none select-none ${
        isLeader ? "cursor-default" : "cursor-grab active:cursor-grabbing"
      }`}
    >
      <article
        className={`relative flex h-[76px] w-full items-center gap-4 rounded-[22px] bg-white px-[20px] shadow-[0_16px_38px_rgba(0,0,0,0.09)] ${
          isBlue ? "" : "flex-row"
        }`}
      >
        {isBlue ? (
          <>
            <PlayerAvatar player={player} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-[17px] font-bold tracking-[-0.03em] text-[#111111]">
                  {player.nickname}
                </p>
                {badernaRank ? (
                  <span className="shrink-0 text-[11px] font-bold tracking-[0em] text-[#b0a8a4]">
                    #{String(badernaRank).padStart(2, "0")}
                  </span>
                ) : null}
                {isLeader ? (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-[#fff1ea] px-2.5 py-1 text-[10px] font-bold tracking-[0em] text-[#ff4100]">
                    Lider
                  </span>
                ) : null}
              </div>
              <p className="mt-[1px] truncate text-[10px] font-medium tracking-[0em] text-[#9a9a9a]">
                {player.name}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="order-2 min-w-0 flex-1 text-left xl:order-1 xl:text-right">
              <div className="flex items-center justify-start gap-2 xl:justify-end">
                {isLeader ? (
                  <span className="order-3 inline-flex shrink-0 items-center rounded-full bg-[#fff1ea] px-2.5 py-1 text-[10px] font-bold tracking-[0em] text-[#ff4100] xl:order-1">
                    Lider
                  </span>
                ) : null}
                {badernaRank ? (
                  <span className="order-2 shrink-0 text-[11px] font-bold tracking-[0em] text-[#b0a8a4]">
                    #{String(badernaRank).padStart(2, "0")}
                  </span>
                ) : null}
                <p className="order-1 truncate text-[17px] font-bold tracking-[-0.03em] text-[#111111] xl:order-3">
                  {player.nickname}
                </p>
              </div>
              <p className="mt-[1px] truncate text-[10px] font-medium tracking-[0em] text-[#9a9a9a]">
                {player.name}
              </p>
            </div>
            <div className="order-1 xl:order-2">
              <PlayerAvatar player={player} />
            </div>
          </>
        )}
        {!isLeader && (
          <button
            type="button"
            data-no-drag
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            aria-label="Mandar pro banco"
            className={`absolute ${isBlue ? "right-[10px]" : "right-[10px] xl:left-[10px] xl:right-auto"} top-[10px] flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white/80 text-[#b0a8a4] opacity-0 transition-opacity hover:text-[#c53030] group-hover:opacity-100`}
          >
            <X className="h-[12px] w-[12px]" strokeWidth={2.4} />
          </button>
        )}
      </article>
    </div>
  );
}

function EmptySlot({ side, index }: { side: "blue" | "red"; index: number }) {
  return (
    <div
      className={`flex h-[76px] w-full max-w-[390px] md:max-w-[640px] xl:max-w-[390px] items-center rounded-[22px] border-2 border-dashed border-[#d9d4d1] bg-white/40 px-[20px] text-[14px] font-semibold text-[#b0a8a4] ${
        side === "red" ? "xl:justify-end" : ""
      }`}
    >
      Jogador {index + 1}
    </div>
  );
}

/**
 * Versão mobile do pool/connect card: vira um handle fixo no rodapé que
 * desliza pra cima ao tocar, revelando o card completo. Spacer ocupa
 * espaço no layout pra os times não ficarem cobertos pelo handle.
 */
function MobilePoolBottomSheet({
  isAssigning,
  poolPlayers,
  total,
  isHover,
  onRandomize,
  onChipPointerDown,
  teamsFull,
  onConfirm,
  inhouse,
  blueLabel,
  redLabel,
}: {
  isAssigning: boolean;
  poolPlayers: InhousePlayer[];
  total: number;
  isHover: boolean;
  onRandomize: () => void;
  onChipPointerDown: (e: ReactPointerEvent, id: string) => void;
  teamsFull: boolean;
  onConfirm: () => void;
  inhouse: Inhouse;
  blueLabel: string;
  redLabel: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleLabel = "Controles";

  return (
    <>
      {/* Spacer pra reservar espaço pro handle fixo (não ficar atrás do conteúdo) */}
      <div className="h-[80px]" />

      {/* Sheet único: quando fechado, apenas o handle (64px) fica visível no
          rodapé. Quando aberto, ele DESLIZA pra cima revelando o conteúdo.
          Sem backdrop — permite arrastar players pros times atrás. */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 rounded-t-[24px] bg-[#ededed] shadow-[0_-12px_50px_rgba(0,0,0,0.18)] transition-transform duration-300 ease-out"
        style={{
          maxHeight: "85vh",
          transform: open ? "translateY(0)" : "translateY(calc(100% - 64px))",
        }}
      >
        {/* Handle — clica pra alternar abrir/fechar */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex h-[64px] w-full flex-col items-center justify-center gap-[6px] px-[20px] text-[14px] font-bold tracking-[-0.02em] text-[#0f0f0f] transition-opacity hover:opacity-90"
        >
          <span className="h-[4px] w-[44px] rounded-full bg-[#d4d4d4]" />
          <span>{handleLabel}</span>
        </button>

        {/* Conteúdo do sheet — só fica visível quando aberto (sheet sobe) */}
        <div className="max-h-[calc(85vh-64px)] overflow-y-auto px-[16px] pb-[20px]">
          {isAssigning ? (
            <AssignmentPoolCard
              players={poolPlayers}
              total={total}
              isHover={isHover}
              onRandomize={onRandomize}
              onChipPointerDown={onChipPointerDown}
              teamsFull={teamsFull}
              onConfirm={() => {
                onConfirm();
                setOpen(false);
              }}
            />
          ) : (
            <>
              <InhouseConnectCard />
              <InhouseWinnerCard
                inhouse={inhouse}
                blueLabel={blueLabel}
                redLabel={redLabel}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}

function AssignmentPoolCard({
  players,
  total,
  isHover,
  onRandomize,
  onChipPointerDown,
  teamsFull,
  onConfirm,
}: {
  players: InhousePlayer[];
  total: number;
  isHover: boolean;
  onRandomize: () => void;
  onChipPointerDown: (e: ReactPointerEvent, id: string) => void;
  teamsFull: boolean;
  onConfirm: () => void;
}) {
  return (
    <section
      data-drop-side="pool"
      className={`mx-auto w-full max-w-[380px] rounded-[26px] p-[20px] transition-colors ${
        isHover ? "bg-[#fff4ef]" : "bg-[#ededed]"
      } xl:shadow-[0_18px_60px_rgba(0,0,0,0.08)]`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-[12px] font-semibold text-[#8d8d8d]">
          Jogadores · {players.length}
        </p>
        <p className="text-[12px] font-semibold text-[#8d8d8d]">
          {total}/10 nos times
        </p>
      </div>
      <div className="min-h-[216px]">
        {players.length === 0 ? (
          <p className="flex h-[216px] items-center justify-center text-[12px] font-semibold text-[#b0a8a4]">
            Todos distribuídos.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {players.map((p) => (
              <PoolChip
                key={p.id}
                player={p}
                onPointerDown={(e) => onChipPointerDown(e, p.id)}
              />
            ))}
          </div>
        )}
      </div>
      {teamsFull ? (
        <button
          type="button"
          onClick={onConfirm}
          className="mt-3 flex h-[50px] w-full items-center justify-center rounded-[18px] bg-[#ff4100] text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-90"
        >
          Confirmar draft
        </button>
      ) : (
        <button
          type="button"
          onClick={onRandomize}
          disabled={players.length === 0}
          className="mt-3 flex h-[50px] w-full items-center justify-center rounded-[18px] bg-[#ff4100] text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Aleatorizar
        </button>
      )}
    </section>
  );
}

function PoolChip({
  player,
  onPointerDown,
}: {
  player: InhousePlayer;
  onPointerDown: (e: ReactPointerEvent) => void;
}) {
  return (
    <div
      onPointerDown={onPointerDown}
      className="flex h-[48px] cursor-grab touch-none select-none items-center gap-2 rounded-[14px] bg-white px-3 transition-colors hover:bg-[#f7f7f7] active:cursor-grabbing"
    >
      <div className="relative h-[32px] w-[32px] shrink-0 overflow-hidden rounded-full">
        {player.avatarSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.avatarSrc}
            alt={player.nickname}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-[#d9d9d9]" />
        )}
      </div>
      <p className="min-w-0 flex-1 truncate text-[12px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
        {player.nickname}
      </p>
    </div>
  );
}

