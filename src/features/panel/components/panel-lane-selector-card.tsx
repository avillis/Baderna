"use client";

import Image from "next/image";

import { useAccount, type Lane } from "@/features/panel/use-account";
import { useAuth } from "@/features/panel/use-auth";

const LANES: { key: Lane; label: string; icon: string }[] = [
  { key: "TOP", label: "Topo",     icon: "/images/lanes/Top_icon.png" },
  { key: "JG",  label: "Selva",    icon: "/images/lanes/Jungle_icon.png" },
  { key: "MID", label: "Meio",     icon: "/images/lanes/Middle_icon.png" },
  { key: "ADC", label: "Atirador", icon: "/images/lanes/Bottom_icon.png" },
  { key: "SUP", label: "Suporte",  icon: "/images/lanes/Support_icon.png" },
];

function laneIdx(lane: Lane | null | undefined, fallback: number): number {
  if (!lane) return fallback;
  const idx = LANES.findIndex((l) => l.key === lane);
  return idx >= 0 ? idx : fallback;
}

function LaneTile({
  laneIdx,
  onCycle,
  readonly = false,
}: {
  laneIdx: number;
  onCycle?: () => void;
  readonly?: boolean;
}) {
  const lane = LANES[laneIdx];

  return (
    <button
      type="button"
      onClick={readonly ? undefined : onCycle}
      disabled={readonly}
      className="group flex flex-1 flex-col items-center justify-center rounded-[var(--panel-radius-card)] bg-white disabled:cursor-default"
      style={{ boxShadow: "0px 14px 50px 12px rgba(0,0,0,0.05)" }}
    >
      <div
        className={`flex items-center justify-center rounded-full ${
          readonly ? "" : "transition-opacity duration-150 group-hover:opacity-60"
        }`}
        style={{ width: 72, height: 72, background: "#ededed" }}
      >
        <Image
          src={lane.icon}
          alt={lane.label}
          width={30}
          height={30}
          className="h-[30px] w-[30px] object-contain"
        />
      </div>
    </button>
  );
}

type PanelLaneSelectorCardProps = {
  /** Lanes do membro sendo visualizado (vem do server-side fetch). */
  primaryLane?: Lane | null;
  secondaryLane?: Lane | null;
  /** Força readonly mesmo no próprio perfil. */
  readonly?: boolean;
  /** ID do usuário sendo visualizado. Se bater com o logado, libera edição. */
  targetUserId?: number | null;
  /** @deprecated usar primaryLane direto */
  initialPrimary?: number;
  /** @deprecated usar secondaryLane direto */
  initialSecondary?: number;
};

export function PanelLaneSelectorCard({
  primaryLane,
  secondaryLane,
  readonly: readonlyProp = false,
  targetUserId,
  initialPrimary,
  initialSecondary,
}: PanelLaneSelectorCardProps = {}) {
  const { user } = useAuth();
  const { account, updateField } = useAccount();

  const isOwnProfile =
    targetUserId == null || (user != null && user.id === targetUserId);
  const readonly = readonlyProp || !isOwnProfile;

  // No próprio perfil, fonte de verdade é o account (com cache otimista).
  // Fora dele, usa o que veio por prop (server-side fetch).
  const effectivePrimary = isOwnProfile ? account.primaryLane : primaryLane;
  const effectiveSecondary = isOwnProfile ? account.secondaryLane : secondaryLane;

  const primaryIdx = laneIdx(effectivePrimary, initialPrimary ?? 2);
  const secondaryIdx = laneIdx(effectiveSecondary, initialSecondary ?? 0);

  function cyclePrimary() {
    let next = (primaryIdx + 1) % LANES.length;
    if (next === secondaryIdx) next = (next + 1) % LANES.length;
    updateField("primaryLane", LANES[next].key);
  }

  function cycleSecondary() {
    let next = (secondaryIdx + 1) % LANES.length;
    if (next === primaryIdx) next = (next + 1) % LANES.length;
    updateField("secondaryLane", LANES[next].key);
  }

  return (
    <div className="flex h-[122px] gap-[6px]">
      <LaneTile
        laneIdx={primaryIdx}
        readonly={readonly}
        onCycle={cyclePrimary}
      />
      <LaneTile
        laneIdx={secondaryIdx}
        readonly={readonly}
        onCycle={cycleSecondary}
      />
    </div>
  );
}
