"use client";

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
        <p className="text-[15px] font-medium leading-snug tracking-[-0.01em] text-[#0f0f0f]">
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
                className={`relative flex h-[56px] w-full items-center overflow-hidden rounded-[14px] border text-left transition-colors ${
                  opt.votedByMe ? "border-[#ff4100]" : "border-[#e6e0dd]"
                } ${poll.closed ? "cursor-default" : ""} ${
                  !poll.closed && !opt.votedByMe ? "hover:border-[#d8d2ce]" : ""
                }`}
              >
                {/* Barra de resultado */}
                <span
                  className="absolute inset-y-0 left-0 bg-[#ededed] transition-[width] duration-300"
                  style={{ width: `${pct}%` }}
                />
                <span className="relative flex w-full items-center gap-[10px] px-[12px]">
                  {/* Foto à esquerda */}
                  {opt.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={opt.imageUrl}
                      alt=""
                      className="h-[40px] w-[40px] shrink-0 rounded-[10px] object-cover"
                    />
                  )}
                  {/* Nome */}
                  <span className="min-w-0 flex-1 truncate text-[14px] font-medium tracking-[-0.01em] text-[#0f0f0f]">
                    {opt.text}
                  </span>
                  {/* Porcentagem à direita */}
                  <span className="shrink-0 text-[14px] font-medium tracking-[-0.01em] text-[#0f0f0f]">
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
              className="flex h-[56px] w-full items-center gap-[10px] rounded-[14px] border border-[#e6e0dd] px-[12px] text-left transition-colors hover:bg-[#f7f5f3]"
            >
              {/* Foto à esquerda */}
              {opt.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={opt.imageUrl}
                  alt=""
                  className="h-[40px] w-[40px] shrink-0 rounded-[10px] object-cover"
                />
              )}
              {/* Nome */}
              <span className="min-w-0 flex-1 truncate text-[14px] font-medium tracking-[-0.01em] text-[#0f0f0f]">
                {opt.text}
              </span>
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
