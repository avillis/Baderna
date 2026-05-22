"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useInhouses } from "@/features/panel/use-inhouses";

function formatWhen(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Agora";
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(ts).toLocaleDateString("pt-BR");
}

export function FeedInhousesWidget() {
  const { inhouses } = useInhouses();

  const recent = useMemo(() => {
    return [...inhouses]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 3);
  }, [inhouses]);

  if (recent.length === 0) return null;

  return (
    <section className="rounded-[20px] border border-[#ededed] bg-white p-[20px]">
      <h3 className="text-[15px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
        Últimos inhouses
      </h3>
      <div className="mt-[14px] space-y-[8px]">
        {recent.map((ih) => (
          <Link
            key={ih.id}
            href={`/inhouse/${ih.shortCode}`}
            className="flex items-center gap-[12px] rounded-[12px] p-[8px] transition-colors hover:bg-[#f7f7f7]"
          >
            <div className="flex h-[36px] w-[36px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#0f0f0f] text-[10px] font-black text-white">
              {ih.shortCode.slice(0, 4)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
                {ih.shortCode}
              </p>
              <p className="truncate text-[12px] text-[#8d8d8d]">
                {ih.players.length}{" "}
                {ih.players.length === 1 ? "jogador" : "jogadores"}
              </p>
            </div>
            <span className="flex-shrink-0 text-[11px] font-medium text-[#b0a09a]">
              {formatWhen(ih.createdAt)}
            </span>
          </Link>
        ))}
      </div>
      <Link
        href="/inhouse"
        className="mt-[12px] block text-center text-[12px] font-semibold text-[#ff4100] hover:opacity-80"
      >
        Ver todos
      </Link>
    </section>
  );
}
