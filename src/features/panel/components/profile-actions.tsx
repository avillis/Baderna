"use client";

import { useState } from "react";

import { useToast } from "@/components/toast";
import { NAME_BY_ID } from "@/features/panel/names-data";
import type { RankType } from "@/features/panel/rank-utils";
import { useAccount } from "@/features/panel/use-account";
import { useAuth } from "@/features/panel/use-auth";
import { useMemberActiveName } from "@/features/panel/use-member-active-name";
import { useRiotProfile } from "@/features/panel/use-riot-profile";

const TIER_PT: Record<string, string> = {
  IRON: "Ferro",
  BRONZE: "Bronze",
  SILVER: "Prata",
  GOLD: "Ouro",
  PLATINUM: "Platina",
  EMERALD: "Esmeralda",
  DIAMOND: "Diamante",
  MASTER: "Mestre",
  GRANDMASTER: "Grão-Mestre",
  CHALLENGER: "Desafiante",
};

const TIER_TO_RANK_TYPE: Record<string, RankType> = {
  IRON: "iron",
  BRONZE: "bronze",
  SILVER: "silver",
  GOLD: "gold",
  PLATINUM: "platinum",
  EMERALD: "emerald",
  DIAMOND: "diamond",
  MASTER: "master",
  GRANDMASTER: "grandmaster",
  CHALLENGER: "challenger",
};

type ProfileActionsProps = {
  displayName: string;
  fullName: string;
  avatarSrc: string;
  rankType: RankType;
  targetUserId?: number | null;
  memberId?: string;
  riotId?: string;
  badernaRank?: number;
  bannerSrc?: string;
  onCompare?: () => void;
  className?: string;
  editButton?: React.ReactNode;
};

export function ProfileActions({
  displayName,
  fullName,
  avatarSrc,
  rankType,
  targetUserId,
  memberId,
  riotId,
  badernaRank,
  bannerSrc,
  onCompare,
  className = "",
  editButton,
}: ProfileActionsProps) {
  const { account } = useAccount();
  const { user } = useAuth();
  const toast = useToast();
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const isOwnProfile =
    user != null && targetUserId != null && user.id === targetUserId;

  const accountNick = account.gameNick.split("#")[0] || "";
  const liveDisplayName =
    isOwnProfile && accountNick ? accountNick : displayName;
  const liveFullName = isOwnProfile && account.name ? account.name : fullName;
  const liveAvatarSrc =
    isOwnProfile && account.avatarSrc ? account.avatarSrc : avatarSrc;

  const effectiveRiotId = riotId || (isOwnProfile ? account.gameNick : "");
  const hasRiotId = Boolean(effectiveRiotId);
  const riot = useRiotProfile(effectiveRiotId || null);
  const liveTier = riot.status === "ready" ? riot.profile?.rank?.tier ?? "" : "";
  const isUnranked =
    riot.status === "ready" && (!liveTier || liveTier === "Unranked");
  const liveRankType =
    liveTier && liveTier !== "Unranked"
      ? TIER_TO_RANK_TYPE[liveTier.toUpperCase()] ?? rankType
      : rankType;

  const { active: activeNameId } = useMemberActiveName(
    memberId ?? "__none__",
    "preto",
  );

  function buildCardRequest() {
    if (typeof window === "undefined") return null;

    const rankObj = riot.status === "ready" ? riot.profile.rank : null;
    const elo =
      rankObj && rankObj.tier && rankObj.tier !== "Unranked"
        ? `${TIER_PT[rankObj.tier.toUpperCase()] ?? rankObj.tier}${
            rankObj.division ? ` ${rankObj.division}` : ""
          }`
        : "Sem classificação";
    const games = rankObj ? rankObj.wins + rankObj.losses : 0;
    const wr = games > 0 && rankObj ? String(Math.round((rankObj.wins / games) * 100)) : "";
    const abs = (src: string) => {
      try {
        return new URL(src, window.location.origin).toString();
      } catch {
        return src;
      }
    };
    const params = new URLSearchParams({
      name: liveDisplayName,
      full: liveFullName ?? "",
      elo,
      pos: badernaRank ? String(badernaRank) : "",
      avatar: abs(liveAvatarSrc),
      banner: bannerSrc ? abs(bannerSrc) : "",
      rankType: isUnranked ? "" : liveRankType,
      color: NAME_BY_ID[activeNameId]?.color ?? "#0f0f0f",
      wr,
    });
    const cardUrl = `${window.location.origin}/api/profile-card?${params.toString()}`;
    const fileName = `baderna-${(liveDisplayName || "perfil")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")}.png`;

    return { cardUrl, fileName };
  }

  async function fetchCardBlob() {
    const built = buildCardRequest();
    if (!built) return null;

    const res = await fetch(built.cardUrl);
    if (!res.ok) throw new Error("falha ao gerar o cartão");
    const blob = await res.blob();
    return { ...built, blob };
  }

  function downloadBlob(blob: Blob, fileName: string) {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }

  const profileUrl = memberId
    ? (typeof window !== "undefined"
        ? `${window.location.origin}/membro/${memberId}`
        : `/membro/${memberId}`)
    : (typeof window !== "undefined" ? window.location.origin : "/");

  async function shareCard() {
    if (typeof window === "undefined" || sharing) return;

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;

    // Desktop: copia o link e exibe toast
    if (isDesktop) {
      try {
        await navigator.clipboard.writeText(
          `${window.location.origin}/membro/${memberId ?? ""}`,
        );
        setCopied(true);
        toast.show("Link copiado!", "success");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.show("Não foi possível copiar o link.");
      }
      return;
    }

    // Mobile/tablet: share nativo com imagem
    setSharing(true);
    try {
      const card = await fetchCardBlob();
      if (!card) return;

      const file = new File([card.blob], card.fileName, { type: "image/png" });
      const intro = isOwnProfile
        ? "Esse é o meu perfil na Baderna!"
        : `Confira o perfil de ${liveDisplayName} na Baderna!`;
      const text = `${intro}\n${window.location.origin}/membro/${memberId ?? ""}`;
      const nav = navigator as Navigator & {
        canShare?: (data: { files?: File[] }) => boolean;
      };

      if (nav.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            text,
            title: `Perfil de ${liveDisplayName} · Baderna`,
          });
        } catch {
          // usuario cancelou
        }
      } else {
        downloadBlob(card.blob, card.fileName);
      }
    } catch {
      const built = buildCardRequest();
      if (built) window.open(built.cardUrl, "_blank");
    } finally {
      setSharing(false);
    }
  }

  const actionButtonClass =
    "inline-flex h-[40px] items-center justify-center gap-[8px] rounded-[12px] bg-[#ededed] px-[14px] text-[12px] font-bold tracking-[-0.02em] text-[#0f0f0f] transition-colors hover:bg-[#e3e3e3] disabled:cursor-not-allowed disabled:opacity-60";
  const compareButtonClass = actionButtonClass;

  return (
    <div className={className}>
      {!isOwnProfile && onCompare && hasRiotId && (
        <button
          type="button"
          onClick={onCompare}
          className={compareButtonClass}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-[14px] w-[14px]"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 17H20M20 17L16 13M20 17L16 21M20 7H4M4 7L8 3M4 7L8 11" />
          </svg>
          Comparar com você
        </button>
      )}

        <button
          type="button"
          onClick={shareCard}
          disabled={sharing}
          className={actionButtonClass}
        >
          {sharing ? (
            <svg
              className="capas-spinner h-[16px] w-[16px] [&_circle]:stroke-[#ff4100]"
              viewBox="25 25 50 50"
            >
              <circle r="20" cy="50" cx="50" />
            </svg>
          ) : copied ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-[15px] w-[15px]"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-[15px] w-[15px]"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.7914 12.6074C21.0355 12.3981 21.1575 12.2935 21.2023 12.169C21.2415 12.0598 21.2415 11.9402 21.2023 11.831C21.1575 11.7065 21.0355 11.6018 20.7914 11.3926L12.3206 4.13196C11.9004 3.77176 11.6903 3.59166 11.5124 3.58725C11.3578 3.58342 11.2101 3.65134 11.1124 3.77122C11 3.90915 11 4.18589 11 4.73936V9.03462C8.86532 9.40807 6.91159 10.4897 5.45971 12.1139C3.87682 13.8845 3.00123 16.1759 3 18.551V19.1629C4.04934 17.8989 5.35951 16.8765 6.84076 16.1659C8.1467 15.5394 9.55842 15.1683 11 15.0705V19.2606C11 19.8141 11 20.0908 11.1124 20.2288C11.2101 20.3486 11.3578 20.4166 11.5124 20.4127C11.6903 20.4083 11.9004 20.2282 12.3206 19.868L20.7914 12.6074Z" />
            </svg>
          )}
          {sharing ? "Carregando..." : copied ? "Copiado!" : "Compartilhar"}
        </button>

      {editButton}
    </div>
  );
}
