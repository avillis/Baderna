import type { BpEvent } from "@/features/panel/use-baderna-points-log";

export function formatShortDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function eventLabel(ev: BpEvent): string {
  const base =
    ev.type === "flex"
      ? `Flex ${ev.result === "win" ? "vitória" : "derrota"}`
      : `Inhouse ${ev.result === "win" ? "vitória" : "derrota"}`;
  if (ev.type === "inhouse" && ev.teamName) return `${base} (${ev.teamName})`;
  return base;
}

export function EventRow({ ev }: { ev: BpEvent }) {
  const isWin = ev.result === "win";
  const deltaColor =
    ev.bp > 0 ? "text-[#2f855a]" : ev.bp < 0 ? "text-[#c53030]" : "text-[#8d8d8d]";
  const sign = ev.bp > 0 ? "+" : "";
  return (
    <div className="flex items-center justify-between gap-3 py-[7px]">
      <div className="flex min-w-0 items-center gap-[10px]">
        <span
          className={`inline-flex h-[7px] w-[7px] shrink-0 rounded-full ${
            isWin ? "bg-[#2f855a]" : "bg-[#c53030]"
          }`}
        />
        <span className="truncate text-[12px] font-semibold text-[#3a3a3a]">
          {eventLabel(ev)}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-[12px]">
        <span className={`text-[12px] font-bold tabular-nums ${deltaColor}`}>
          {sign}
          {ev.bp} BP
        </span>
        <span className="w-[42px] text-right text-[11px] font-medium text-[#9a9a9a] tabular-nums">
          {formatShortDate(ev.date)}
        </span>
      </div>
    </div>
  );
}
