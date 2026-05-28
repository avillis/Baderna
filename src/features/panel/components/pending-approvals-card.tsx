"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

import { ConfirmDeleteMemberModal } from "@/features/panel/components/confirm-delete-member-modal";
import { useToast } from "@/components/toast";
import {
  usePendingMembers,
  type PendingMember,
} from "@/features/panel/use-pending-members";

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 6V5.2C16 4.0799 16 3.51984 15.782 3.09202C15.5903 2.71569 15.2843 2.40973 14.908 2.21799C14.4802 2 13.9201 2 12.8 2H11.2C10.0799 2 9.51984 2 9.09202 2.21799C8.71569 2.40973 8.40973 2.71569 8.21799 3.09202C8 3.51984 8 4.0799 8 5.2V6M3 6H21M19 6V17.2C19 18.8802 19 19.7202 18.673 20.362C18.3854 20.9265 17.9265 21.3854 17.362 21.673C16.7202 22 15.8802 22 14.2 22H9.8C8.11984 22 7.27976 22 6.63803 21.673C6.07354 21.3854 5.6146 20.9265 5.32698 20.362C5 19.7202 5 18.8802 5 17.2V6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
  const { members, loading, approve, reject, remove } = usePendingMembers();
  const [acting, setActing] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PendingMember | null>(null);
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

  async function confirmDelete() {
    if (!deleteTarget) return;
    const member = deleteTarget;
    setDeleteTarget(null);
    setActing(member.userId);
    try {
      const ok = await remove(member.userId);
      if (!ok) {
        toast.show("Não foi possível excluir a conta.");
        return;
      }
      toast.show("Conta excluída.", "success");
    } finally {
      setActing(null);
    }
  }

  const pendingCount = members.filter(
    (m) => m.approvalStatus === "pending",
  ).length;

  return (
    <>
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
                    {isRejected ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setDeleteTarget(member)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#ededed] px-3 py-1.5 text-[12px] font-bold text-[#c53030] transition-colors hover:bg-[#fff0f0] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <TrashIcon className="h-[14px] w-[14px]" />
                        Excluir
                      </button>
                    ) : (
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

      <ConfirmDeleteMemberModal
        open={deleteTarget !== null}
        memberNickname={deleteTarget?.summonerName || deleteTarget?.nickname || ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
