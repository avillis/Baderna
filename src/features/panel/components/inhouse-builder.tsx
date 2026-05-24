"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Plus, ShieldCheck, Swords, Users, UserRoundPlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MemberAvatar } from "@/features/panel/components/member-avatar";
import { type BadernaMember } from "@/features/panel/members-data";
import { useBadernaMembers } from "@/features/panel/use-baderna-members";
import { cn } from "@/lib/utils";

type GuestPlayer = {
  id: string;
  name: string;
};

type Participant =
  | { type: "member"; member: BadernaMember }
  | { type: "guest"; guest: GuestPlayer };

function OverviewCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <article className="rounded-[var(--panel-radius-card-sm)] bg-white px-5 py-5 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff4100]">
            {label}
          </p>
          <p className="mt-3 text-[28px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
            {value}
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff4f0] text-[#ff4100]">
          {icon}
        </div>
      </div>
    </article>
  );
}

export function InhouseBuilder() {
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([
    "avillis",
    "jb",
    "vitin",
    "nicolas",
  ]);
  const [guestName, setGuestName] = useState("");
  const [guestPlayers, setGuestPlayers] = useState<GuestPlayer[]>([
    { id: "guest-corner", name: "Corner" },
    { id: "guest-rush", name: "Rush" },
  ]);

  const visibleMembers = useBadernaMembers();

  const selectedMembers = useMemo(
    () => visibleMembers.filter((member) => selectedMemberIds.includes(member.id)),
    [visibleMembers, selectedMemberIds],
  );

  const participants = useMemo<Participant[]>(
    () => [
      ...selectedMembers.map((member) => ({ type: "member" as const, member })),
      ...guestPlayers.map((guest) => ({ type: "guest" as const, guest })),
    ],
    [guestPlayers, selectedMembers],
  );

  const teams = useMemo(
    () => ({
      blue: participants.filter((_, index) => index % 2 === 0),
      red: participants.filter((_, index) => index % 2 === 1),
    }),
    [participants],
  );

  function toggleMember(memberId: string) {
    setSelectedMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    );
  }

  function addGuest() {
    const normalizedName = guestName.trim();

    if (!normalizedName) {
      return;
    }

    setGuestPlayers((current) => [
      ...current,
      {
        id: `guest-${normalizedName.toLowerCase().replace(/\s+/g, "-")}-${current.length + 1}`,
        name: normalizedName,
      },
    ]);
    setGuestName("");
  }

  function removeGuest(guestId: string) {
    setGuestPlayers((current) => current.filter((guest) => guest.id !== guestId));
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[25px] bg-white px-8 py-8 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-[780px]">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#fff4f0] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff4100]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Somente admin cria lobby
            </div>
            <h1 className="mt-4 text-[32px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
              Central de Inhouse
            </h1>
            <p className="mt-4 text-[15px] leading-[1.7] tracking-[-0.02em] text-[#6f6f6f]">
              Aqui o admin monta a inhouse escolhendo membros da Baderna e adicionando
              convidados aleatórios. Os convidados entram no lobby, mas não contam em
              estatísticas, ranking ou histórico de membros cadastrados.
            </p>
          </div>

          <div className="rounded-[var(--panel-radius-card-sm)] border border-[#f1e5df] bg-[#fffaf8] px-5 py-4 text-sm text-[#7c6b63]">
            Estrutura pronta para evoluir depois em:
            <div className="mt-2 font-semibold text-[#0f0f0f]">
              criação de sala, draft, times e persistência.
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-4">
        <OverviewCard
          label="Membros cadastrados"
          value={`${visibleMembers.length}`}
          icon={<Users className="h-5 w-5" />}
        />
        <OverviewCard
          label="Selecionados"
          value={`${selectedMembers.length}`}
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <OverviewCard
          label="Randoms no lobby"
          value={`${guestPlayers.length}`}
          icon={<UserRoundPlus className="h-5 w-5" />}
        />
        <OverviewCard
          label="Total da sala"
          value={`${participants.length}/10`}
          icon={<Swords className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-8 2xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <section className="space-y-8">
          <article className="rounded-[25px] bg-white px-7 py-7 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff4100]">
                  Base da Baderna
                </p>
                <h2 className="mt-3 text-[26px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
                  Escolher membros para a inhouse
                </h2>
              </div>
              <div className="rounded-full bg-[#f6f6f6] px-3 py-1 text-xs font-semibold text-[#767676]">
                Clique para adicionar/remover
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {visibleMembers.map((member) => {
                const isSelected = selectedMemberIds.includes(member.id);

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleMember(member.id)}
                    className={cn(
                      "flex items-center gap-4 rounded-[var(--panel-radius-card-sm)] border px-4 py-4 text-left transition-all duration-200",
                      isSelected
                        ? "border-[#ff4100] bg-[#fff7f3] shadow-[0_10px_30px_rgba(255,65,0,0.08)]"
                        : "border-[#f0e5e0] bg-[#fcfcfc] hover:border-[#ffd1bf]",
                    )}
                  >
                    <MemberAvatar member={member} size={62} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[16px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
                          {member.nickname}
                        </p>
                        {member.isAdmin ? (
                          <span className="rounded-full bg-[#0f0f0f] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                            Admin
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-[#767676]">{member.rankName}</p>
                      <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#b08a79]">
                        {member.preferredRoles
                          .map((r) => (r === "ADC" ? "Atirador" : r))
                          .join(" • ")}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </article>

          <article className="rounded-[25px] bg-white px-7 py-7 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff4100]">
              Membro random
            </p>
            <h2 className="mt-3 text-[26px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
              Adicionar convidado que não é cadastrado
            </h2>
            <p className="mt-3 max-w-[650px] text-[15px] leading-[1.7] tracking-[-0.02em] text-[#6f6f6f]">
              Use isso quando entrar alguém de fora da Baderna. Você informa só o nome e
              ele participa da inhouse sem virar membro oficial e sem poluir as estatísticas.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Input
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder="Ex.: Fulano do duo queue"
                className="h-12 rounded-[14px] border-[#eaded9] bg-[#fcfcfc] px-4"
              />
              <Button
                onClick={addGuest}
                className="h-12 rounded-[14px] px-5 text-sm font-bold"
              >
                <Plus className="h-4 w-4" />
                Adicionar random
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {guestPlayers.length === 0 ? (
                <div className="rounded-full bg-[#f6f6f6] px-4 py-2 text-sm text-[#8a8a8a]">
                  Nenhum convidado aleatório ainda.
                </div>
              ) : null}

              {guestPlayers.map((guest) => (
                <div
                  key={guest.id}
                  className="inline-flex items-center gap-3 rounded-full border border-[#f0e2dc] bg-[#fff9f6] px-4 py-2"
                >
                  <span className="text-sm font-semibold text-[#0f0f0f]">{guest.name}</span>
                  <button
                    type="button"
                    onClick={() => removeGuest(guest.id)}
                    className="text-[#8d8d8d] transition-colors hover:text-[#ff4100]"
                    aria-label={`Remover ${guest.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="space-y-8">
          <article className="rounded-[25px] bg-white px-7 py-7 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff4100]">
              Lobby montado
            </p>
            <h2 className="mt-3 text-[26px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
              Prévia da sala
            </h2>

            <div className="mt-6 space-y-3">
              {participants.map((participant) => (
                <div
                  key={
                    participant.type === "member"
                      ? participant.member.id
                      : participant.guest.id
                  }
                  className="flex items-center justify-between rounded-[var(--panel-radius-card-sm)] bg-[#faf7f6] px-4 py-3"
                >
                  <div>
                    <p className="text-[15px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
                      {participant.type === "member"
                        ? participant.member.nickname
                        : participant.guest.name}
                    </p>
                    <p className="mt-1 text-sm text-[#7c7c7c]">
                      {participant.type === "member"
                        ? `${participant.member.rankName} • ${participant.member.preferredRoles.map((r) => (r === "ADC" ? "Atirador" : r)).join(" / ")}`
                        : "Convidado aleatório • sem estatística"}
                    </p>
                  </div>

                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]",
                      participant.type === "member"
                        ? "bg-[#eef8f0] text-[#237b41]"
                        : "bg-[#fff1ea] text-[#ff4100]",
                    )}
                  >
                    {participant.type === "member" ? "membro" : "random"}
                  </span>
                </div>
              ))}

              {participants.length === 0 ? (
                <div className="rounded-[var(--panel-radius-card-sm)] border border-dashed border-[#eaded9] px-4 py-6 text-sm text-[#8a8a8a]">
                  Nenhum jogador selecionado ainda.
                </div>
              ) : null}
            </div>
          </article>

          <article className="rounded-[25px] bg-white px-7 py-7 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff4100]">
              Estrutura sugerida
            </p>
            <h2 className="mt-3 text-[26px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
              Times provisórios
            </h2>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div className="rounded-[var(--panel-radius-card-sm)] bg-[#f4f8ff] px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#3a6dff]">
                  Time azul
                </p>
                <div className="mt-4 space-y-3">
                  {teams.blue.map((participant) => (
                    <p key={participant.type === "member" ? participant.member.id : participant.guest.id} className="text-sm font-semibold text-[#0f0f0f]">
                      {participant.type === "member" ? participant.member.nickname : participant.guest.name}
                    </p>
                  ))}
                </div>
              </div>

              <div className="rounded-[var(--panel-radius-card-sm)] bg-[#fff4f4] px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff4100]">
                  Time vermelho
                </p>
                <div className="mt-4 space-y-3">
                  {teams.red.map((participant) => (
                    <p key={participant.type === "member" ? participant.member.id : participant.guest.id} className="text-sm font-semibold text-[#0f0f0f]">
                      {participant.type === "member" ? participant.member.nickname : participant.guest.name}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[var(--panel-radius-card-sm)] border border-[#efe3de] bg-[#fffaf8] px-4 py-4 text-sm leading-[1.7] text-[#7c6b63]">
              Próximas evoluções fáceis daqui: salvar lobby, sortear capitães, registrar resultado
              e reaproveitar só os membros oficiais nas estatísticas.
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
