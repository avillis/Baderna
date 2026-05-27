"use client";

import Image from "next/image";
import { useState } from "react";

import { MemberCoinsModal } from "@/features/panel/components/member-coins-modal";
import { authToken } from "@/features/panel/use-auth";
import { useCoinRewards } from "@/features/panel/use-coin-rewards";
import { useToast } from "@/components/toast";
import type { CoinRewards } from "@/features/panel/coin-rewards";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

type Mode = keyof CoinRewards;
type Outcome = "win" | "loss";

const MODE_LABEL: Record<Mode, string> = {
  flex: "Flex",
  inhouse: "Inhouse",
};

const OUTCOME_LABEL: Record<Outcome, string> = {
  win: "Vitória",
  loss: "Derrota",
};

function RewardField({
  value,
  onChange,
  label,
  accent,
}: {
  value: number;
  onChange: (next: number) => void;
  label: string;
  accent: "win" | "loss";
}) {
  return (
    <label className="flex flex-col gap-[6px]">
      <span
        className={`text-[12px] font-bold tracking-[-0.02em] ${
          accent === "win" ? "text-[#2f855a]" : "text-[#c53030]"
        }`}
      >
        {label}
      </span>
      <div className="relative">
        <Image
          src="/images/coin/Coin_icon2.png"
          alt=""
          width={14}
          height={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
        />
        <input
          type="number"
          min={0}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-full rounded-full border-none bg-[#ededed] py-[8px] pl-[30px] pr-3 text-[13px] font-semibold text-[#0f0f0f] outline-none focus:ring-2 focus:ring-[#ff4100]/20"
        />
      </div>
    </label>
  );
}

export function AdminCoinRewardsCard() {
  const { rewards, update } = useCoinRewards();
  const modes: Mode[] = ["flex", "inhouse"];
  const toast = useToast();
  const [creditingFlex, setCreditingFlex] = useState(false);

  async function handleCreditFlex() {
    if (creditingFlex) return;
    setCreditingFlex(true);
    try {
      const token = authToken();
      if (!token) {
        toast.show("Sem autenticação.");
        return;
      }
      const res = await fetch(`${API_BASE}/admin/flex-credit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lookback: 5 }),
      });
      if (!res.ok) {
        toast.show("Não foi possível creditar.");
        return;
      }
      const data = (await res.json()) as {
        totalUsers: number;
        totalMatches: number;
        totalCredited: number;
      };
      toast.show(
        `${data.totalMatches} partidas creditadas (+${data.totalCredited} moedas no total, ${data.totalUsers} membros).`,
      );
    } catch {
      toast.show("Erro ao processar Flex.");
    } finally {
      setCreditingFlex(false);
    }
  }

  return (
    <aside className="rounded-[var(--panel-radius-card)] bg-white p-6 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <div className="mb-5 flex items-center justify-between gap-2">
        <h2 className="text-[18px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
          Recompensas
        </h2>
      </div>

      <div className="space-y-5">
        {modes.map((mode) => (
          <div key={mode} className="space-y-[10px]">
            <div className="text-[14px] font-semibold text-[#313131]">
              {MODE_LABEL[mode]}
            </div>
            <div className="grid grid-cols-2 gap-[10px]">
              <RewardField
                label={OUTCOME_LABEL.win}
                accent="win"
                value={rewards[mode].win}
                onChange={(v) => update(mode, "win", v)}
              />
              <RewardField
                label={OUTCOME_LABEL.loss}
                accent="loss"
                value={rewards[mode].loss}
                onChange={(v) => update(mode, "loss", v)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-2">
        <button
          type="button"
          onClick={() => void handleCreditFlex()}
          disabled={creditingFlex}
          className="w-full rounded-full bg-[#0f0f0f] py-[10px] text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creditingFlex ? "Creditando..." : "Creditar Flex (últimas 5)"}
        </button>
        <MemberCoinsModal />
      </div>

      <p className="mt-4 text-[11px] leading-[1.5] text-[#9a9a9a]">
        Inhouse credita automaticamente quando o admin define o vencedor. Flex
        precisa do botão acima — varre as últimas 5 partidas de cada membro
        com Riot ID e credita as novas (idempotente, nunca credita 2x).
      </p>
    </aside>
  );
}
