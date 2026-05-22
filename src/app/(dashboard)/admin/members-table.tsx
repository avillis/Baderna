"use client";

import Link from "next/link";
import { useState } from "react";
import { X as XIcon } from "lucide-react";
import { getMemberSlug } from "@/features/panel/members-data";
import { getChampionAvatarSrc } from "@/features/panel/champion-avatar";
import { AddMemberModal } from "@/features/panel/components/add-member-modal";
import { EditMemberTitlesModal } from "@/features/panel/components/edit-member-titles-modal";
import { ConfirmDeleteMemberModal } from "@/features/panel/components/confirm-delete-member-modal";
import { useAccount } from "@/features/panel/use-account";
import { useDeletedMembers } from "@/features/panel/use-deleted-members";
import { useBadernaMembers } from "@/features/panel/use-baderna-members";

type RoleMap = Record<string, "Admin" | "Membro">;

function defaultUnlockedFor(_memberId: string): string[] {
  return ["aprendiz"];
}

export function MembersTable() {
  const allMembers = useBadernaMembers();
  const { account } = useAccount();
  const selfId = getMemberSlug({
    nickname: account.gameNick.split("#")[0] || "",
  });
  const [roles, setRoles] = useState<RoleMap>({});

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const { deleteMember } = useDeletedMembers();

  const visibleMembers = allMembers;

  function toggleRole(id: string) {
    setRoles((prev) => ({
      ...prev,
      [id]: prev[id] === "Admin" ? "Membro" : "Admin",
    }));
  }

  function defaultRoleFor(member: { isAdmin?: boolean }) {
    return member.isAdmin ? "Admin" : "Membro";
  }

  const editingMember = editingMemberId
    ? allMembers.find((m) => m.id === editingMemberId)
    : null;

  const deletingMember = deletingMemberId
    ? allMembers.find((m) => m.id === deletingMemberId)
    : null;

  return (
    <section className="flex-1 rounded-[var(--panel-radius-card)] bg-white p-6 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-[18px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
            Membros da Baderna
          </h2>
          <p className="text-[13px] font-medium text-[#8d8d8d]">
            Gerencie contas e permissões.
          </p>
        </div>
        <AddMemberModal />
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[500px] text-left">
          <thead>
            <tr className="border-b border-[#efebe8] text-[11px] font-bold text-[#8d8d8d]">
              <th className="pb-3 pl-2">Membro</th>
              <th className="pb-3 text-center">Cargo</th>
              <th className="pb-3 text-right pr-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {visibleMembers.map((member) => {
              const role = roles[member.id] ?? defaultRoleFor(member);
              const isAdmin = role === "Admin";
              const isSelf = member.id === selfId;
              const avatar = member.avatarSrc || getChampionAvatarSrc(member.id);

              return (
                <tr
                  key={member.id}
                  className="group border-b border-[#efebe8] last:border-0 hover:bg-[#fdfcfa] transition-colors"
                >
                  <td className="py-4 pl-2">
                    <Link
                      href={`/membro/${member.id}`}
                      className="flex items-center gap-4 w-max transition-opacity hover:opacity-80"
                    >
                      <div className="relative h-[38px] w-[38px] shrink-0 overflow-hidden rounded-full">
                        <img
                          src={avatar}
                          alt={member.nickname}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-[17px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
                          {member.nickname}
                        </div>
                        <div className="mt-0.5 text-[12px] font-semibold text-[#8d8d8d]">
                          {member.name}
                        </div>
                      </div>
                    </Link>
                  </td>

                  <td className="py-4 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (isSelf) return;
                        toggleRole(member.id);
                      }}
                      disabled={isSelf}
                      title={
                        isSelf
                          ? "Você não pode alterar seu próprio cargo"
                          : "Clique para alterar o cargo"
                      }
                      className={
                        (isAdmin
                          ? "inline-block rounded-full bg-[#ededed] px-2.5 py-1 text-[11px] font-bold text-[#ff4100] transition-all"
                          : "inline-block rounded-full bg-[#ededed] px-2.5 py-1 text-[11px] font-bold text-[#6f6f6f] transition-all") +
                        (isSelf
                          ? " cursor-not-allowed opacity-60"
                          : " hover:bg-[#e0e0e0]")
                      }
                    >
                      {isAdmin ? "Admin" : "Membro"}
                    </button>
                  </td>

                  <td className="py-4 pr-2 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => setEditingMemberId(member.id)}
                        className="text-[12px] font-bold text-[#8d8d8d] transition-colors hover:text-[#ff4100]"
                      >
                        Editar títulos
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (isSelf) return;
                          setDeletingMemberId(member.id);
                        }}
                        disabled={isSelf}
                        aria-label={`Apagar conta de ${member.nickname}`}
                        title={
                          isSelf
                            ? "Você não pode apagar a própria conta"
                            : "Apagar conta"
                        }
                        className={
                          "flex h-[30px] w-[30px] items-center justify-center rounded-full text-[#c53030] transition-opacity " +
                          (isSelf
                            ? "cursor-not-allowed opacity-20"
                            : "opacity-50 hover:opacity-100 hover:bg-[#fff0f0]")
                        }
                      >
                        <XIcon className="h-[16px] w-[16px]" strokeWidth={2.4} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editingMember && (
        <EditMemberTitlesModal
          open
          onClose={() => setEditingMemberId(null)}
          memberId={editingMember.id}
          targetUserId={editingMember.userId ?? null}
          memberNickname={editingMember.nickname}
          defaultUnlocked={defaultUnlockedFor(editingMember.id)}
        />
      )}

      {deletingMember && (
        <ConfirmDeleteMemberModal
          open
          onClose={() => setDeletingMemberId(null)}
          memberNickname={deletingMember.nickname}
          onConfirm={() => deleteMember(deletingMember.id)}
        />
      )}
    </section>
  );
}
