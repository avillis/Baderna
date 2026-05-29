"use client";

import { useInhousePoints } from "@/features/panel/use-inhouse-points";
import type { InhousePoints } from "@/features/panel/inhouse-points";

type Mode = keyof InhousePoints;
type Outcome = "win" | "loss";

const MODE_LABEL: Record<Mode, string> = {
  flex: "Flex",
  inhouse: "Inhouse",
};

const OUTCOME_LABEL: Record<Outcome, string> = {
  win: "Vitória",
  loss: "Derrota",
};

function PointsField({
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
      <input
        type="number"
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full rounded-full border-none bg-[#ededed] px-4 py-[8px] text-[13px] font-semibold text-[#0f0f0f] outline-none focus:ring-2 focus:ring-[#ff4100]/20"
      />
    </label>
  );
}

export function AdminInhousePointsCard() {
  const { points, update } = useInhousePoints();
  const modes: Mode[] = ["flex", "inhouse"];

  return (
    <aside className="rounded-[var(--panel-radius-card)] bg-white p-6 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <div className="mb-5 flex items-center justify-between gap-2">
        <h2 className="text-[18px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
          Baderna Points (BP)
        </h2>
      </div>

      <div className="space-y-5">
        {modes.map((mode) => (
          <div key={mode} className="space-y-[10px]">
            <div className="text-[14px] font-semibold text-[#313131]">
              {MODE_LABEL[mode]}
            </div>
            <div className="grid grid-cols-2 gap-[10px]">
              <PointsField
                label={OUTCOME_LABEL.win}
                accent="win"
                value={points[mode].win}
                onChange={(v) => update(mode, "win", v)}
              />
              <PointsField
                label={OUTCOME_LABEL.loss}
                accent="loss"
                value={points[mode].loss}
                onChange={(v) => update(mode, "loss", v)}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 text-[11px] leading-[1.5] text-[#9a9a9a]">
        Pontos por partida, usados pra montar o ranking interno da Baderna.
        Pode ser negativo — ex: derrota na Flex tira pontos. Mudar aqui
        recalcula o ranking de todo mundo na hora.
      </p>
    </aside>
  );
}
