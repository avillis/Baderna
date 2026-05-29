"use client";

import { Check } from "lucide-react";

import type { PollData } from "@/features/panel/use-posts";

function formatTimeLeft(closesAt: string | null, closed: boolean): string {
  if (closed) return "Encerrada";
  if (!closesAt) return "";
  const ms = new Date(closesAt).getTime() - Date.now();
  if (ms <= 0) return "Encerrada";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} min restantes`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h restantes`;
  const days = Math.floor(hours / 24);
  return `${days}d restantes`;
}

export function PollView({
  poll,
  onVote,
}: {
  poll: PollData;
  /** Vota/desvota numa opção. No-op se a enquete estiver encerrada. */
  onVote: (optionId: number) => void;
}) {
  const hasVoted = poll.options.some((o) => o.votedByMe);
  const showResults = hasVoted || poll.closed;
  const total = poll.totalVotes;

  function handle(optionId: number) {
    if (poll.closed) return;
    onVote(optionId);
  }

  return (
    <div className="mt-[12px] flex flex-col gap-[8px]">
      {poll.title && (
        <p className="text-[15px] font-bold leading-snug tracking-[-0.02em] text-[#0f0f0f]">
          {poll.title}
        </p>
      )}

      <div className="flex flex-col gap-[8px]">
        {poll.options.map((opt) => {
          const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;

          if (showResults) {
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handle(opt.id)}
                disabled={poll.closed}
                className={`relative flex h-[42px] w-full items-center overflow-hidden rounded-[12px] border text-left transition-colors ${
                  opt.votedByMe ? "border-[#ff4100]/50" : "border-[#ece6e3]"
                } ${poll.closed ? "cursor-default" : "hover:border-[#ff4100]/40"}`}
              >
                {/* Barra de resultado */}
                <span
                  className={`absolute inset-y-0 left-0 transition-[width] duration-300 ${
                    opt.votedByMe ? "bg-[#ff4100]/15" : "bg-[#f1ede9]"
                  }`}
                  style={{ width: `${pct}%` }}
                />
                <span className="relative flex w-full items-center gap-[10px] px-[12px]">
                  {opt.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={opt.imageUrl}
                      alt=""
                      className="h-[28px] w-[28px] shrink-0 rounded-[7px] object-cover"
                    />
                  )}
                  <span className="flex min-w-0 flex-1 items-center gap-[6px]">
                    <span className="truncate text-[14px] font-semibold tracking-[-0.02em] text-[#0f0f0f]">
                      {opt.text}
                    </span>
                    {opt.votedByMe && (
                      <Check className="h-[14px] w-[14px] shrink-0 text-[#ff4100]" strokeWidth={3} />
                    )}
                  </span>
                  <span className="shrink-0 text-[13px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
                    {pct}%
                  </span>
                </span>
              </button>
            );
          }

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handle(opt.id)}
              className="flex h-[42px] w-full items-center justify-center gap-[8px] rounded-full border border-[#ff4100]/40 px-[12px] text-[14px] font-bold tracking-[-0.02em] text-[#ff4100] transition-colors hover:bg-[#fff4f0]"
            >
              {opt.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={opt.imageUrl}
                  alt=""
                  className="h-[26px] w-[26px] shrink-0 rounded-[7px] object-cover"
                />
              )}
              <span className="truncate">{opt.text}</span>
            </button>
          );
        })}
      </div>

      <p className="text-[12px] font-medium tracking-[-0.02em] text-[#8d8d8d]">
        {total} {total === 1 ? "voto" : "votos"}
        <span className="mx-[5px] opacity-40">·</span>
        {formatTimeLeft(poll.closesAt, poll.closed)}
        {poll.multiple && !poll.closed && (
          <>
            <span className="mx-[5px] opacity-40">·</span>
            Pode marcar mais de uma
          </>
        )}
      </p>
    </div>
  );
}
