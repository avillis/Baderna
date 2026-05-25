"use client";

import Link from "next/link";
import { useState } from "react";
import { X as XIcon } from "lucide-react";
import { getMemberSlug } from "@/features/panel/members-data";
import { getChampionAvatarSrc } from "@/features/panel/champion-avatar";
import { AddMemberModal } from "@/features/panel/components/add-member-modal";
import { EditMemberNamesModal } from "@/features/panel/components/edit-member-names-modal";
import { EditMemberTitlesModal } from "@/features/panel/components/edit-member-titles-modal";
import { ConfirmDeleteMemberModal } from "@/features/panel/components/confirm-delete-member-modal";
import { useAccount } from "@/features/panel/use-account";
import { authToken } from "@/features/panel/use-auth";
import { useToast } from "@/components/toast";
import { useDeletedMembers } from "@/features/panel/use-deleted-members";
import { useBadernaMembers } from "@/features/panel/use-baderna-members";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

async function apiSetRole(userId: number, isAdmin: boolean): Promise<boolean> {
  const token = authToken();
  if (!token) return false;
  const res = await fetch(`${API_BASE}/admin/members/${userId}/role`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ is_admin: isAdmin }),
  });
  return res.ok;
}

// Relê o estado REAL do servidor pra confirmar se o cargo foi salvo de fato
// (em vez de confiar só no update otimista). Retorna null se não der pra ler.
async function apiGetMemberIsAdmin(userId: number): Promise<boolean | null> {
  const token = authToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/members`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const list = (await res.json()) as Array<{ userId: number; isAdmin?: boolean }>;
  const found = list.find((m) => m.userId === userId);
  return found ? !!found.isAdmin : null;
}

type RoleMap = Record<string, "Admin" | "Membro">;

function defaultUnlockedFor(_memberId: string): string[] {
  return ["aprendiz"];
}

/**
 * Mostra o avatar do membro com o shimmer padrão enquanto carrega ou se
 * falhar. Mesma estratégia do RankedAvatar — substitui o bg cinza por uma
 * classe `skeleton-shimmer` quando a imagem ainda não veio.
 */
function MemberAvatar({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const showSkeleton = !loaded || errored;
  return (
    <div
      className={`relative h-[38px] w-[38px] shrink-0 overflow-hidden rounded-full ${
        showSkeleton ? "skeleton-shimmer" : "bg-[#ededed]"
      }`}
    >
      {!errored && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}

export function MembersTable() {
  const allMembers = useBadernaMembers();
  const { account } = useAccount();
  const selfId = getMemberSlug({
    nickname: account.gameNick.split("#")[0] || "",
  });
  const [roles, setRoles] = useState<RoleMap>({});
  const toast = useToast();
  // Viewer eh o dono? Usa pra liberar mexer em cargos. Admins normais
  // veem a tabela inteira mas o toggle de cargo fica disabled.
  const selfMember = allMembers.find((m) => m.id === selfId);
  const viewerIsOwner = !!selfMember?.isOwner;

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingNamesMemberId, setEditingNamesMemberId] = useState<string | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const { deleteMember } = useDeletedMembers();

  const visibleMembers = allMembers;

  async function toggleRole(id: string, userId?: number) {
    if (!userId) return;
    const current = roles[id] ?? defaultRoleFor(allMembers.find((m) => m.id === id) ?? { isAdmin: false });
    const nextIsAdmin = current === "Membro";
    // Update otimista pra feedback imediato.
    setRoles((prev) => ({ ...prev, [id]: nextIsAdmin ? "Admin" : "Membro" }));
    const ok = await apiSetRole(userId, nextIsAdmin);
    if (!ok) {
      setRoles((prev) => ({ ...prev, [id]: current }));
      toast.show("Não foi possível alterar o cargo.");
      return;
    }
    // Confirma com o estado REAL do servidor — não mascara com o otimista.
    const real = await apiGetMemberIsAdmin(userId);
    if (real === null) return; // não deu pra confirmar; mantém o otimista
    setRoles((prev) => ({ ...prev, [id]: real ? "Admin" : "Membro" }));
    if (real === nextIsAdmin) {
      toast.show("Cargo atualizado.", "success");
    } else {
      toast.show("O servidor aceitou mas não salvou o cargo.");
    }
  }

  function defaultRoleFor(member: { isAdmin?: boolean }) {
    return member.isAdmin ? "Admin" : "Membro";
  }

  const editingMember = editingMemberId
    ? allMembers.find((m) => m.id === editingMemberId)
    : null;
  const editingNamesMember = editingNamesMemberId
    ? allMembers.find((m) => m.id === editingNamesMemberId)
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
              const isOwnerRow = !!member.isOwner;
              // Toggle de cargo: so o dono pode; nem o dono mexe no proprio
              // nem no de outro dono (defensivo — so deve existir um).
              const roleLocked = !viewerIsOwner || isSelf || isOwnerRow;
              // Apagar: dono nao apaga ngm? apaga sim, exceto outro dono e ele
              // mesmo. Admin comum tbm pode apagar (poder de moderacao), mas
              // nao o dono.
              const deleteLocked = isSelf || isOwnerRow;
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
                      <MemberAvatar src={avatar} alt={member.nickname} />
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
                        if (roleLocked) return;
                        void toggleRole(member.id, member.userId);
                      }}
                      disabled={roleLocked}
                      title={
                        isOwnerRow
                          ? "Master não pode ser despromovido"
                          : isSelf
                            ? "Você não pode alterar seu próprio cargo"
                            : !viewerIsOwner
                              ? "Apenas o Master pode alterar cargos"
                              : "Clique para alterar o cargo"
                      }
                      className={
                        "inline-block rounded-full bg-[#ededed] px-2.5 py-1 text-[11px] font-bold transition-all " +
                        (isOwnerRow
                          ? "text-[#ff4100]"
                          : isAdmin
                            ? "text-[#ff4100]"
                            : "text-[#6f6f6f]") +
                        (roleLocked
                          ? " cursor-not-allowed opacity-60"
                          : " hover:bg-[#e0e0e0]")
                      }
                    >
                      {isOwnerRow ? "Master" : isAdmin ? "Admin" : "Membro"}
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
                        onClick={() => setEditingNamesMemberId(member.id)}
                        className="text-[12px] font-bold text-[#8d8d8d] transition-colors hover:text-[#ff4100]"
                      >
                        Editar nomes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (deleteLocked) return;
                          setDeletingMemberId(member.id);
                        }}
                        disabled={deleteLocked}
                        aria-label={`Apagar conta de ${member.nickname}`}
                        title={
                          isOwnerRow
                            ? "Master não pode ser apagado"
                            : isSelf
                              ? "Você não pode apagar a própria conta"
                              : "Apagar conta"
                        }
                        className={
                          "flex h-[30px] w-[30px] items-center justify-center rounded-full text-[#c53030] transition-opacity " +
                          (deleteLocked
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

      {editingNamesMember && (
        <EditMemberNamesModal
          open
          onClose={() => setEditingNamesMemberId(null)}
          targetUserId={editingNamesMember.userId ?? null}
          memberNickname={editingNamesMember.nickname}
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
