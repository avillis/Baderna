"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";

import { getChampionAvatarSrc } from "@/features/panel/champion-avatar";
import { useToast } from "@/components/toast";
import { LeaderDiceModal } from "@/features/panel/components/leader-dice-modal";
import { LoadingOverlay } from "@/features/panel/components/loading-overlay";
import { useBadernaMembers } from "@/features/panel/use-baderna-members";
import {
  formatRankLabel,
  useMemberRanks,
} from "@/features/panel/use-member-ranks";
import {
  buildInhouseMatch,
  buildLeaderInhouseMatch,
  type InhouseMode,
  type InhouseParticipant,
  type Lane,
} from "@/features/panel/inhouse-builder-logic";
import {
  INHOUSES_UPDATED_EVENT,
  matchIdFromInhouseId,
  useInhouses,
} from "@/features/panel/use-inhouses";

// Re-exports kept so older imports don't break.
export const INHOUSE_CREATED_EVENT = INHOUSES_UPDATED_EVENT;
export const INHOUSE_STORAGE_KEY = "baderna:inhouses";

const ROLE_TO_LANE: Record<string, Lane> = {
  Top: "TOP",
  Topo: "TOP",
  Jungle: "JG",
  Selva: "JG",
  Mid: "MID",
  Meio: "MID",
  ADC: "ADC",
  Atirador: "ADC",
  Support: "SUP",
  Suporte: "SUP",
};

function toLane(role: string | undefined): Lane | undefined {
  if (!role) return undefined;
  return ROLE_TO_LANE[role];
}

/* ── lane icon map ──────────────────────────────────────── */
const ROLE_ICON: Record<string, string> = {
  Top: "/images/lanes/Top_icon.png",
  Jungle: "/images/lanes/Jungle_icon.png",
  Mid: "/images/lanes/Middle_icon.png",
  ADC: "/images/lanes/Bottom_icon.png",
  Support: "/images/lanes/Support_icon.png",
};

/* ── lane config ────────────────────────────────────────── */
const LANES: { key: Lane; icon: string; label: string }[] = [
  { key: "TOP", icon: "/images/lanes/Top_icon.png", label: "Top" },
  { key: "JG", icon: "/images/lanes/Jungle_icon.png", label: "Jungle" },
  { key: "MID", icon: "/images/lanes/Middle_icon.png", label: "Mid" },
  { key: "ADC", icon: "/images/lanes/Bottom_icon.png", label: "Atirador" },
  { key: "SUP", icon: "/images/lanes/Support_icon.png", label: "Suporte" },
];

/* ── Lane Picker ────────────────────────────────────────── */
function LanePicker({
  value,
  onChange,
  exclude,
  label,
}: {
  value?: Lane;
  onChange: (lane: Lane | undefined) => void;
  exclude?: Lane;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-[38px] shrink-0 text-[10px] font-bold text-[#b0a8a4]">
        {label}
      </span>
      <div className="flex gap-1">
        {LANES.filter((l) => l.key !== exclude).map((lane) => (
          <button
            key={lane.key}
            type="button"
            title={lane.label}
            onClick={() => onChange(value === lane.key ? undefined : lane.key)}
            className={`flex h-[26px] w-[26px] items-center justify-center rounded-full transition-all ${
              value === lane.key
                ? "bg-[#ff4100]"
                : "bg-[#f0eded] hover:bg-[#e4e0de]"
            }`}
          >
            <Image
              src={lane.icon}
              alt={lane.label}
              width={13}
              height={13}
              className={`object-contain ${value === lane.key ? "brightness-0 invert" : "opacity-60"}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── types ──────────────────────────────────────────────── */
type LanePrefs = { lane1?: Lane; lane2?: Lane };
interface Guest {
  id: string;
  nickname: string;
}

/* ── Modal inner content ────────────────────────────────── */
function InhouseCreatorContent({
  onClose,
  onCloseImmediate,
  closing,
  creating,
  setCreating,
}: {
  onClose: () => void;
  onCloseImmediate: () => void;
  closing: boolean;
  creating: boolean;
  setCreating: (v: boolean) => void;
}) {
  const router = useRouter();
  const visibleMembers = useBadernaMembers();
  const memberRanks = useMemberRanks();
  const { addInhouse } = useInhouses();
  const toast = useToast();
  const rankOrder: Record<string, number> = {
    challenger: 9,
    grandmaster: 8,
    master: 7,
    diamond: 6,
    platinum: 5,
    gold: 4,
    silver: 3,
    bronze: 2,
    iron: 1,
  };
  const rankPositions = new Map<string, number>(
    [...visibleMembers]
      .sort((a, b) => (rankOrder[b.rankType] ?? 0) - (rankOrder[a.rankType] ?? 0))
      .map((m, i) => [m.id, i + 1]),
  );
  const [mode, setMode] = useState<InhouseMode>("random");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [guestName, setGuestName] = useState("");
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestLanePrefs, setGuestLanePrefs] = useState<
    Record<string, LanePrefs>
  >({});
  const [diceLeaders, setDiceLeaders] = useState<
    [{ id: string; nickname: string; avatarSrc?: string }, { id: string; nickname: string; avatarSrc?: string }] | null
  >(null);

  const totalSelected = selectedIds.size + guests.length;
  const remaining = 10 - totalSelected;

  function toggleMember(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function addGuest() {
    const name = guestName.trim();
    if (!name) return;
    const id = `guest-${Date.now()}`;
    setGuests((prev) => [...prev, { id, nickname: name }]);
    setGuestName("");
  }

  function removeGuest(id: string) {
    setGuests((prev) => prev.filter((g) => g.id !== id));
    setGuestLanePrefs((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function setGuestLane(
    id: string,
    slot: "lane1" | "lane2",
    lane: Lane | undefined,
  ) {
    setGuestLanePrefs((prev) => ({
      ...prev,
      [id]: { ...prev[id], [slot]: lane },
    }));
  }

  async function persistResult(
    result: ReturnType<typeof buildInhouseMatch>,
  ): Promise<{ id: string; shortCode: string } | null> {
    const id = await addInhouse(result);
    if (!id) return null;
    // Lê o cache atualizado pra pegar o shortCode recém-criado.
    try {
      const raw = window.localStorage.getItem("baderna:inhouses-cache");
      const list = raw ? (JSON.parse(raw) as Array<{ id: string; shortCode: string }>) : [];
      const fresh = list.find((i) => i.id === id);
      if (fresh) return { id: fresh.id, shortCode: fresh.shortCode };
    } catch {
      /* ignore */
    }
    return { id, shortCode: matchIdFromInhouseId(id) };
  }

  function buildParticipants(): InhouseParticipant[] {
    return [
      ...visibleMembers
        .filter((m) => selectedIds.has(m.id))
        .map((m) => ({
          id: m.id,
          nickname: m.nickname,
          name: m.name,
          rankType: m.rankType,
          avatarSrc: m.avatarSrc || getChampionAvatarSrc(m.id),
          lane1: toLane(m.preferredRoles[0]),
          lane2: toLane(m.preferredRoles[1]),
        })),
      ...guests.map((g) => ({
        id: g.id,
        nickname: g.nickname,
        name: "Convidado",
        rankType: "gold" as const, // guests default to Gold
        avatarSrc: getChampionAvatarSrc(g.id),
        lane1: guestLanePrefs[g.id]?.lane1,
        lane2: guestLanePrefs[g.id]?.lane2,
      })),
    ];
  }

  async function handleCreate() {
    if (creating) return;

    // No modo líder a regra é: mínimo de 10 participantes, mas pode ter mais.
    // Os líderes escolhem na UI da partida quem entra em cada time, e quem
    // sobrar não joga.
    if (mode === "leader") {
      if (totalSelected < 10) {
        toast.show(
          `Selecione pelo menos 10 participantes. Faltam ${10 - totalSelected}.`,
        );
        return;
      }
      const participants = buildParticipants();
      const eligible = participants.filter((p) => !p.id.startsWith("guest-"));
      if (eligible.length < 2) {
        toast.show("Precisa de pelo menos 2 membros (não convidados) pra sortear os líderes.");
        return;
      }
      const shuffled = [...eligible].sort(() => Math.random() - 0.5);
      setDiceLeaders([
        { id: shuffled[0].id, nickname: shuffled[0].nickname, avatarSrc: shuffled[0].avatarSrc },
        { id: shuffled[1].id, nickname: shuffled[1].nickname, avatarSrc: shuffled[1].avatarSrc },
      ]);
      return;
    }

    // Modo random: precisa ser exatamente 10.
    if (totalSelected !== 10) {
      toast.show(
        `Selecione exatamente 10 participantes. Faltam ${remaining > 0 ? remaining : Math.abs(remaining) + " a mais"}.`,
      );
      return;
    }

    await runBuild((participants) => buildInhouseMatch(participants));
  }

  /**
   * Etapa final: monta o inhouse com a fn dada (random ou leader) e persiste.
   */
  async function runBuild(
    builder: (
      participants: InhouseParticipant[],
    ) => ReturnType<typeof buildInhouseMatch>,
  ) {
    setCreating(true);
    onCloseImmediate();

    const MIN_MS = 900;
    const startedAt = Date.now();

    try {
      const participants = buildParticipants();
      const result = builder(participants);
      const persisted = await persistResult(result);

      const elapsed = Date.now() - startedAt;
      const remainingMs = Math.max(0, MIN_MS - elapsed);
      if (remainingMs > 0) {
        await new Promise((r) => setTimeout(r, remainingMs));
      }

      if (persisted) {
        router.push(`/inhouse/${persisted.shortCode}`);
      } else {
        toast.show("Não foi possível salvar o inhouse no servidor.");
        setCreating(false);
      }
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Erro ao criar o inhouse.");
      setCreating(false);
    }
  }

  function handleDiceConfirm(winnerId: string, side: "blue" | "red") {
    if (!diceLeaders) return;
    const [a, b] = diceLeaders;
    const loserId = winnerId === a.id ? b.id : a.id;
    // Vencedor escolhe o lado dele; perdedor vai pro lado oposto.
    const blueLeaderId = side === "blue" ? winnerId : loserId;
    const redLeaderId = side === "blue" ? loserId : winnerId;
    setDiceLeaders(null);
    void runBuild((participants) =>
      buildLeaderInhouseMatch({ participants, blueLeaderId, redLeaderId }),
    );
  }

  return (
    <>
    <LeaderDiceModal
      open={diceLeaders !== null}
      leaders={diceLeaders}
      onCancel={() => setDiceLeaders(null)}
      onConfirm={handleDiceConfirm}
    />
    <div
      className={`${closing ? "modal-backdrop-out" : "modal-backdrop-in"} fixed inset-0 z-[100] flex items-center justify-center bg-black/38 px-4 py-6 backdrop-blur-[2px]`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`${closing ? "modal-panel-out" : "modal-panel-in"} relative flex h-[94vh] max-h-[780px] w-full max-w-[860px] flex-col overflow-hidden rounded-[var(--panel-radius-shell)] bg-[#f7f7f7] shadow-[0px_30px_90px_rgba(0,0,0,0.18)] sm:h-[88vh]`}
        onAnimationEnd={() => { if (closing) onCloseImmediate(); }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-[20px] top-[20px] z-50 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#ff4100] text-white transition-opacity hover:opacity-85"
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
        <div className="shrink-0 border-b border-[#ece7e2] bg-white px-5 py-5 pr-[64px] sm:px-8 sm:py-6">
          <h2 className="text-[20px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
            Criar Inhouse
          </h2>
          <p className="mt-1 text-[13px] font-medium leading-[1.4] text-[#8d8d8d]">
            {mode === "random"
              ? "Selecione os 10 participantes. As lanes são definidas no perfil de cada um."
              : "Selecione os 10 participantes. Os líderes serão sorteados e você monta os times no inhouse."}
          </p>
        </div>

        {/* Body — two columns (mobile: lista menor, convidados maior) */}
        <div className="grid min-h-0 flex-1 grid-rows-[38%_minmax(0,1fr)] overflow-hidden lg:grid-cols-[minmax(0,1fr)_280px] lg:grid-rows-1">
          {/* Left: member list */}
          <div className="flex min-h-0 flex-col overflow-hidden border-b border-[#ece7e2] bg-white lg:border-b-0 lg:border-r">
            <div className="shrink-0 px-5 py-3 text-[11px] font-bold text-[#8d8d8d] sm:px-6">
              Membros ({visibleMembers.length})
            </div>
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-1 sm:px-4 sm:pb-4 sm:pt-2">
              <div className="space-y-2">
                {visibleMembers.map((member, idx) => {
                  const isSelected = selectedIds.has(member.id);
                  const avatar = member.avatarSrc || getChampionAvatarSrc(member.id);
                  const memberRiotId =
                    member.summonerName && member.tagLine
                      ? `${member.summonerName}#${member.tagLine}`
                      : "";

                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleMember(member.id)}
                      className={`flex w-full items-center gap-3 rounded-full bg-[#ededed] px-4 py-3 text-left outline-none transition-shadow ${
                        isSelected ? "ring-2 ring-[#ff4100]/20" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all ${
                          isSelected
                            ? "bg-[#ff4100]"
                            : "bg-white"
                        }`}
                      >
                        {isSelected && (
                          <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>

                      <div className="relative h-[34px] w-[34px] shrink-0 overflow-hidden rounded-full">
                        <img
                          src={avatar}
                          alt={member.nickname}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
                            {member.nickname}
                          </span>
                          <span className="text-[11px] font-bold tracking-[0.02em] text-[#b0a8a4]">
                            #{rankPositions.get(member.id)}
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold text-[#8d8d8d]">
                          {member.userId && memberRanks[member.userId]
                            ? formatRankLabel(memberRanks[member.userId])
                            : member.rankName}
                        </div>
                      </div>

                      {/* Lane icons */}
                      <div className="flex shrink-0 items-center gap-1">
                        {member.preferredRoles.slice(0, 2).map((role) => (
                          ROLE_ICON[role] ? (
                            <Image
                              key={role}
                              src={ROLE_ICON[role]}
                              alt={role}
                              width={18}
                              height={18}
                              className="object-contain opacity-50"
                            />
                          ) : null
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: guests + summary */}
          <div className="flex min-h-0 flex-col overflow-hidden bg-[#f7f7f7]">
            {/* Mode toggle */}
            <div className="shrink-0 border-b border-[#ece7e2] bg-white p-4 sm:p-5">
              <p className="mb-3 text-[12px] font-bold text-[#0f0f0f]">
                Modo de jogo
              </p>
              <div
                className="relative flex h-[40px] w-full items-center rounded-[25px] p-[4px]"
                style={{ background: "#ededed" }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute top-[4px] bottom-[4px] w-[calc((100%-8px)/2)] rounded-[25px]"
                  style={{
                    background: "#ffffff",
                    transform: `translateX(${mode === "leader" ? 100 : 0}%)`,
                    transition:
                      "transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
                    zIndex: 0,
                  }}
                />
                {(["random", "leader"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`relative z-[1] flex h-full flex-1 items-center justify-center rounded-[25px] text-[13px] font-semibold transition-colors duration-300 ${
                      mode === m
                        ? "text-[#0f0f0f]"
                        : "text-black/40 hover:text-black/70"
                    }`}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {m === "random" ? "Aleatório" : "Líder"}
                  </button>
                ))}
              </div>
            </div>
            {/* Guest input */}
            <div className="shrink-0 border-b border-[#ece7e2] bg-white p-4 sm:p-5">
              <p className="mb-3 text-[12px] font-bold text-[#0f0f0f]">
                Adicionar convidado
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addGuest()}
                  placeholder="Nickname..."
                  className="h-[38px] min-w-0 flex-1 rounded-full border-none bg-[#ededed] px-4 text-[13px] outline-none placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff4100]/20"
                />
                <button
                  type="button"
                  onClick={addGuest}
                  className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#ff4100] text-white transition-opacity hover:opacity-85"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Guest list */}
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
              {guests.length === 0 ? (
                <p className="mt-4 text-center text-[12px] font-semibold text-[#b0a8a4]">
                  Nenhum convidado adicionado
                </p>
              ) : (
                <div className="space-y-2">
                  {guests.map((guest) => {
                    const prefs = guestLanePrefs[guest.id] ?? {};
                    return (
                      <div
                        key={guest.id}
                        className="rounded-[var(--panel-radius-card-sm)] border border-[#efebe8] bg-white p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="relative h-[32px] w-[32px] overflow-hidden rounded-full bg-[#f0eded]">
                              <Image
                                src={getChampionAvatarSrc(guest.id)}
                                alt={guest.nickname}
                                fill
                                className="object-cover"
                                sizes="32px"
                              />
                            </div>
                            <div>
                              <div className="text-[13px] font-bold text-[#0f0f0f]">
                                {guest.nickname}
                              </div>
                              <div className="text-[10px] font-semibold text-[#8d8d8d]">
                                Convidado
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeGuest(guest.id)}
                            className="flex h-6 w-6 items-center justify-center rounded-full text-[#b0a8a4] transition-colors hover:bg-[#fee2e2] hover:text-[#c53030]"
                          >
                            <svg
                              viewBox="0 0 10 10"
                              fill="none"
                              className="h-[9px] w-[9px]"
                              stroke="currentColor"
                              strokeWidth={1.4}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" />
                            </svg>
                          </button>
                        </div>
                        <div className="mt-2 space-y-1.5">
                          <LanePicker
                            label="Lane 1"
                            value={prefs.lane1}
                            exclude={prefs.lane2}
                            onChange={(lane) =>
                              setGuestLane(guest.id, "lane1", lane)
                            }
                          />
                          <LanePicker
                            label="Lane 2"
                            value={prefs.lane2}
                            exclude={prefs.lane1}
                            onChange={(lane) =>
                              setGuestLane(guest.id, "lane2", lane)
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[#ece7e2] bg-white px-5 py-4 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {mode === "leader" ? (
                <>
                  <div
                    className={`h-2 w-2 rounded-full ${
                      totalSelected >= 10 ? "bg-[#2f855a]" : "bg-[#d97706]"
                    }`}
                  />
                  <span className="whitespace-nowrap text-[13px] font-bold text-[#0f0f0f]">
                    {totalSelected} participante{totalSelected === 1 ? "" : "s"}
                  </span>
                  {totalSelected < 10 ? (
                    <span className="whitespace-nowrap text-[12px] font-semibold text-[#8d8d8d]">
                      · mínimo 10 (faltam {10 - totalSelected})
                    </span>
                  ) : (
                    <span className="whitespace-nowrap text-[12px] font-semibold text-[#8d8d8d]">
                      · os líderes escolhem o time depois
                    </span>
                  )}
                </>
              ) : (
                <>
                  <div
                    className={`h-2 w-2 rounded-full ${
                      totalSelected === 10
                        ? "bg-[#2f855a]"
                        : totalSelected > 10
                          ? "bg-[#c53030]"
                          : "bg-[#d97706]"
                    }`}
                  />
                  <span className="whitespace-nowrap text-[13px] font-bold text-[#0f0f0f]">
                    {totalSelected}/10 participantes
                  </span>
                  {remaining > 0 && (
                    <span className="whitespace-nowrap text-[12px] font-semibold text-[#8d8d8d]">
                      · faltam {remaining}
                    </span>
                  )}
                  {totalSelected > 10 && (
                    <span className="whitespace-nowrap text-[12px] font-semibold text-[#c53030]">
                      · {totalSelected - 10} a mais
                    </span>
                  )}
                </>
              )}
            </div>

            <div className="flex w-full items-center gap-3 sm:w-auto">
              <button
                type="button"
                onClick={handleCreate}
                disabled={
                  creating ||
                  (mode === "leader" ? totalSelected < 10 : totalSelected !== 10)
                }
                className="flex h-[50px] w-full items-center justify-center rounded-[18px] bg-[#ff4100] px-6 text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:min-w-[200px] sm:px-12"
              >
                {creating ? (
                  <svg
                    className="capas-spinner h-[18px] w-[18px] [&_circle]:stroke-white"
                    viewBox="25 25 50 50"
                  >
                    <circle r="20" cy="50" cx="50" />
                  </svg>
                ) : mode === "leader" ? (
                  "Sortear líderes"
                ) : (
                  "Criar times"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}


/* ── Exported component ─────────────────────────────────── */
export function InhouseCreatorModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [creating, setCreating] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  function handleClose() {
    setClosing(true);
  }

  function handleCloseImmediate() {
    setIsOpen(false);
    setClosing(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-[50px] w-full items-center justify-center rounded-[18px] bg-[#ff4100] text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-90"
      >
        Criar Inhouse
      </button>

      {/* Portal modal */}
      {mounted &&
        isOpen &&
        createPortal(
          <InhouseCreatorContent
            onClose={handleClose}
            onCloseImmediate={handleCloseImmediate}
            closing={closing}
            creating={creating}
            setCreating={setCreating}
          />,
          document.body,
        )}

      {/* Overlay fullscreen com gif + frases — sobrevive ao close do modal. */}
      <LoadingOverlay visible={creating} />
    </>
  );
}
