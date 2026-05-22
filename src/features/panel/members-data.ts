import type { RankType } from "@/features/panel/rank-utils";

export type BadernaMember = {
  id: string;
  /** user_id real do backend, quando vem da API. */
  userId?: number;
  name: string;
  nickname: string;
  rankName: string;
  rankType: RankType;
  preferredRoles: string[];
  laneFocus: string;
  status: "online" | "scrim" | "offline";
  isAdmin?: boolean;
  avatarSrc?: string;
  /** Apelido Riot (sem tag) — usado pra montar gameNick e fazer fetch live. */
  summonerName?: string;
  /** Tag Riot (sem #). */
  tagLine?: string;
  /** Nome customizado do time (definido em "Minha conta"). */
  teamName?: string | null;
  /** Estilo de nome ativo (loja → ex. "preto", "neon", etc). */
  activeNameId?: string;
};

// Membros virão da API. Lista vazia enquanto a migração pro Laravel rola.
export const badernaMembers: BadernaMember[] = [];

export function getMemberSlug(member: Pick<BadernaMember, "nickname">) {
  const slug = member.nickname
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove diacríticos
    .replace(/[^a-z0-9\s-]/g, "") // remove CJK e outros não-ASCII
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "membro";
}

export function getMemberInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
