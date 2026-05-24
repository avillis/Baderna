"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

import { useToast } from "@/components/toast";
import {
  usePendingMembers,
  type PendingMember,
} from "@/features/panel/use-pending-members";

function Avatar({ src, alt }: { src: string | null; alt: string }) {
  const [errored, setErrored] = useState(false);
  return (
    <div className="relative h-[38px] w-[38px] shrink-0 overflow-hidden rounded-full bg-[#ededed]">
      {src && !errored && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}

export function PendingApprovalsCard() {
  const { members, loading, approve, reject } = usePendingMembers();
  const [acting, setActing] = useState<number | null>(null);
  const toast = useToast();

  async function handle(
    member: PendingMember,
    action: "approve" | "reject",
  ) {
    setActing(member.userId);
    try {
      const ok = await (action === "approve"
        ? approve(member.userId)
        : reject(member.userId));
      if (!ok) {
        toast.show("Não foi possível concluir a ação.");
        return;
      }
      toast.show(
        action === "approve" ? "Conta aprovada." : "Conta rejeitada.",
        "success",
      );
    } finally {
      setActing(null);
    }
  }

  const pendingCount = members.filter(
    (m) => m.approvalStatus === "pending",
  ).length;

  return (
    <section className="rounded-[var(--panel-radius-card)] bg-white p-6 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
            Aprovações pendentes
          </h2>
          <p className="text-[13px] font-medium text-[#8d8d8d]">
            Contas novas precisam ser liberadas pra poder entrar.
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="inline-flex h-[26px] min-w-[26px] items-center justify-center rounded-full bg-[#ff4100] px-2 text-[12px] font-bold text-white">
            {pendingCount}
          </span>
        )}
      </div>

      {loading ? (
        <p className="py-6 text-center text-[13px] font-medium text-[#8d8d8d]">
          Carregando…
        </p>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <div className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#eef7f1] text-[#2f855a]">
            <Check className="h-[22px] w-[22px]" strokeWidth={2.4} />
          </div>
          <p className="text-[13px] font-bold tracking-[-0.02em] text-[#6f6f6f]">
            Nenhuma conta aguardando
          </p>
          <p className="text-[12px] font-medium text-[#a59c95]">
            Cadastros novos vão aparecer aqui pra aprovar.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col">
          {members.map((member) => {
            const isRejected = member.approvalStatus === "rejected";
            const busy = acting === member.userId;
            const tag = member.tagLine ? `#${member.tagLine}` : "";
            return (
              <li
                key={member.userId}
                className="flex items-center gap-4 border-b border-[#efebe8] py-4 last:border-0"
              >
                <Avatar src={member.avatarSrc} alt={member.nickname} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
                      {member.summonerName || member.nickname}
                      <span className="font-semibold text-[#8d8d8d]">{tag}</span>
                    </span>
                    {isRejected && (
                      <span className="shrink-0 rounded-full bg-[#fff0f0] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#c53030]">
                        Rejeitada
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 truncate text-[12px] font-semibold text-[#8d8d8d]">
                    {member.name}
                    {member.email ? ` · ${member.email}` : ""}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handle(member, "approve")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#ededed] px-3 py-1.5 text-[12px] font-bold text-[#16794c] transition-colors hover:bg-[#dff3e8] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Check className="h-[14px] w-[14px]" strokeWidth={2.6} />
                    Aprovar
                  </button>
                  {!isRejected && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handle(member, "reject")}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#ededed] px-3 py-1.5 text-[12px] font-bold text-[#c53030] transition-colors hover:bg-[#fff0f0] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X className="h-[14px] w-[14px]" strokeWidth={2.6} />
                      Rejeitar
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
