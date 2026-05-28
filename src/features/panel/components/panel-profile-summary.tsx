"use client";

import { Plus } from "lucide-react";
import { type ReactNode, useState } from "react";

import { NAME_STYLES } from "@/features/panel/names-data";
import { AvatarPickerModal } from "@/features/panel/components/avatar-picker-modal";
import { ProfileActions } from "@/features/panel/components/profile-actions";
import { RankedAvatar } from "@/features/panel/components/ranked-avatar";
import { RaritySmokeOverlay } from "@/features/panel/components/rarity-smoke-overlay";
import { StyledName } from "@/features/panel/components/styled-name";
import { TitleModal } from "@/features/panel/components/title-modal";
import type { RankType } from "@/features/panel/rank-utils";
import { RARITY_META } from "@/features/panel/titles-data";
import { LEVEL_FRAMES } from "@/features/panel/molduras-data";
import { useAccount } from "@/features/panel/use-account";
import { useAuth } from "@/features/panel/use-auth";
import { useMemberActiveName } from "@/features/panel/use-member-active-name";
import { useMemberActiveTitles } from "@/features/panel/use-member-active-titles";
import { useMemberUnlockedTitles } from "@/features/panel/use-member-titles";
import { useMemberUnlockedNames } from "@/features/panel/use-member-unlocked-names";
import { useRiotProfile } from "@/features/panel/use-riot-profile";
import { useTitles } from "@/features/panel/use-titles";

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

const MAX_ACTIVE_TITLES = 2;

type PanelProfileSummaryProps = {
  avatarSrc: string;
  displayName: string;
  fullName: string;
  bio: string;
  rankType: RankType;
  /** Sobrescrição manual; normalmente derivamos do targetUserId vs user.id. */
  isOwnProfile?: boolean;
  /** user_id do dono desse perfil — pra comparar com o user logado. */
  targetUserId?: number | null;
  /** Riot ID do dono ("Summoner#Tag") — usado pra buscar dados ao vivo. */
  riotId?: string;
  initialTitleIds?: string[];
  unlockedTitleIds?: string[];
  memberId?: string;
  /** Quando passado (e não é o próprio perfil), mostra "Comparar com você". */
  onCompare?: () => void;
  /** Posição na Baderna (#N) — usada no cartão compartilhável. */
  badernaRank?: number;
  /** Splash do banner — usado de fundo no cartão compartilhável. */
  bannerSrc?: string;
  /** Botão extra (ex: "Editar cards") exibido junto às ações no mobile. */
  editButton?: ReactNode;
  /** Moldura de nível do membro (quando diferente da moldura de rank). */
  levelFrameSrc?: string;
};

export function PanelProfileSummary({
  avatarSrc,
  displayName,
  fullName,
  bio,
  rankType,
  isOwnProfile: isOwnProfileProp,
  targetUserId,
  riotId,
  initialTitleIds = ["aprendiz"],
  unlockedTitleIds = ["aprendiz"],
  memberId,
  onCompare,
  badernaRank,
  bannerSrc,
  editButton,
  levelFrameSrc: levelFrameSrcProp,
}: PanelProfileSummaryProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  const { account, updateField } = useAccount();
  const { user } = useAuth();

  // isOwnProfile derivado da comparação user.id com targetUserId. Se o prop
  // for explicitamente passado, usa ele.
  const isOwnProfile =
    isOwnProfileProp ??
    (user != null && targetUserId != null && user.id === targetUserId);

  // Sempre busca o riotId do membro alvo (não do logado).
  const effectiveRiotId = riotId || (isOwnProfile ? account.gameNick : "");
  const hasRiotId = Boolean(effectiveRiotId);
  const riot = useRiotProfile(effectiveRiotId || null);
  const liveTier =
    riot.status === "ready" ? (riot.profile?.rank?.tier ?? "") : "";
  const isUnranked =
    !hasRiotId ||
    riot.status !== "ready" ||
    !liveTier ||
    liveTier === "Unranked";
  const liveRankType =
    riot.status === "ready" && liveTier && liveTier !== "Unranked"
      ? (TIER_TO_RANK_TYPE[liveTier.toUpperCase()] ?? rankType)
      : rankType;

  const accountNick = account.gameNick.split("#")[0] || "";
  const liveDisplayName =
    isOwnProfile && accountNick ? accountNick : displayName;
  // Usa account.name (display_name editável) ao invés de user.name (original
  // do Sanctum) — esse último não atualiza quando a pessoa muda o Nome em
  // "Minha conta".
  const liveFullName = isOwnProfile && account.name ? account.name : fullName;
  const liveBio = isOwnProfile && account.bio ? account.bio : bio;
  const liveAvatarSrc =
    isOwnProfile && account.avatarSrc ? account.avatarSrc : avatarSrc;

  // Moldura de nível: para o próprio perfil, usa a do account (mais fresca).
  // Para outros membros, usa o prop passado pelo caller.
  const ownFrameId = isOwnProfile ? account.activeFrameId : undefined;
  // "none" = sem moldura alguma; null/undefined = usa moldura do rank
  const noFrame = ownFrameId === "none";
  const ownFrameSrc = ownFrameId && ownFrameId !== "none"
    ? (LEVEL_FRAMES.find((f) => f.slug === ownFrameId)?.imageSrc ?? undefined)
    : undefined;
  const levelFrameSrc = ownFrameSrc ?? levelFrameSrcProp;

  const { unlocked: persistedUnlocked } = useMemberUnlockedTitles(
    memberId ?? "__none__",
    unlockedTitleIds,
  );
  const effectiveUnlocked = memberId ? persistedUnlocked : unlockedTitleIds;

  // Persisted active title selection (per member). Falls back to the prop on
  // the very first render so SSR/idle state matches before localStorage hydrates.
  const { active: activeTitleIds, setActive: setActiveTitleIds } =
    useMemberActiveTitles(memberId ?? "__none__", initialTitleIds);

  // Active name style — applied to the displayName render.
  const { active: activeNameId, setActive: setActiveNameId } =
    useMemberActiveName(memberId ?? "__none__", "preto");
  const { unlocked: unlockedNameIds } = useMemberUnlockedNames(
    memberId ?? "__none__",
  );

  // Cycle through unlocked name styles on each click — ordered by the
  // canonical NAME_STYLES list so the rotation is predictable.
  function cycleNameStyle() {
    const ordered = NAME_STYLES
      .map((s) => s.id)
      .filter((id) => unlockedNameIds.includes(id));
    if (ordered.length <= 1) return;
    const idx = ordered.indexOf(activeNameId);
    const next = ordered[(idx + 1) % ordered.length];
    setActiveNameId(next);
  }

  // Use the full titles list (defaults + custom) so custom titles like "OnlyCrias"
  // can also resolve to a real pill.
  const { titles: allTitles } = useTitles();
  const titles = activeTitleIds
    .map((id) => allTitles.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  function toggleTitle(id: string) {
    const prev = activeTitleIds;
    let next: string[];
    if (prev.includes(id)) {
      // Always keep at least one title — prevents getting stuck with no pill to click
      if (prev.length === 1) return;
      next = prev.filter((t) => t !== id);
    } else if (prev.length >= MAX_ACTIVE_TITLES) {
      // At the limit? Replace the OLDEST title (smooth swap).
      next = [...prev.slice(1), id];
    } else {
      next = [...prev, id];
    }
    setActiveTitleIds(next);
  }

  return (
    <section className="w-full max-w-[395px]">
      <div className="px-[16px] pb-[10px] sm:px-0 sm:pl-[42px] xl:pb-0">
        <div className="relative mb-[24px] h-[156px] w-[156px]">
          <RankedAvatar
            src={liveAvatarSrc}
            alt={liveDisplayName}
            rankType={liveRankType}
            unranked={isUnranked || noFrame}
            size={156}
            avatarInset={21}
            frameScale={2.72}
            frameOffsetY={-40}
            ringClassName="shadow-[0_0_0_4px_#f7f7f7]"
            priority
            levelFrameSrc={levelFrameSrc}
            levelFrameOffsetY={0}
          />
          {isOwnProfile && (
            <button
              type="button"
              onClick={() => setAvatarPickerOpen(true)}
              aria-label="Trocar avatar"
              className="group absolute inset-0 z-20 cursor-pointer"
            >
              <span className="pointer-events-none absolute inset-[21px] flex items-center justify-center rounded-full bg-black/0 text-[11px] font-bold text-white opacity-0 transition-all group-hover:bg-black/45 group-hover:opacity-100">
                Trocar
              </span>
            </button>
          )}
        </div>

        <div className="relative z-10 flex items-center gap-x-[10px] sm:gap-x-[14px]">
          {isOwnProfile ? (
            <button
              type="button"
              onClick={cycleNameStyle}
              aria-label="Próximo estilo do nome"
              title="Clique pra trocar o estilo"
              className="shrink-0 cursor-pointer whitespace-nowrap rounded-[4px] text-[22px] font-bold leading-[1.2] tracking-[-0.03em] transition-opacity hover:opacity-80 sm:text-[26px]"
            >
              <StyledName styleId={activeNameId}>{liveDisplayName}</StyledName>
            </button>
          ) : (
            <h1 className="shrink-0 whitespace-nowrap text-[22px] font-bold leading-[1.2] tracking-[-0.03em] sm:text-[26px]">
              <StyledName styleId={activeNameId}>{liveDisplayName}</StyledName>
            </h1>
          )}

          {titles.length > 0 ? (
            <div className="flex min-w-0 flex-1 items-center gap-[8px] overflow-x-auto touch-pan-x pl-[4px] -ml-[4px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:ml-0 sm:overflow-visible sm:pl-0">
              {titles.map((title) => (
                <button
                  key={title.id}
                  type="button"
                  onClick={() => {
                    if (isOwnProfile) setModalOpen(true);
                  }}
                  className="pointer-events-auto relative z-20 inline-flex shrink-0 items-center overflow-hidden whitespace-nowrap rounded-full px-[10px] py-[4px] text-[10px] font-semibold tracking-[-0.01em]"
                  style={{
                    background: RARITY_META[title.rarity].pillGradient,
                    color: RARITY_META[title.rarity].pillText,
                    cursor: isOwnProfile ? "pointer" : "default",
                  }}
                >
                  <RaritySmokeOverlay rarity={title.rarity} />
                  <span className="relative z-10">{title.label}</span>
                </button>
              ))}
            </div>
          ) : isOwnProfile ? (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              aria-label="Adicionar título"
              className="pointer-events-auto relative z-20 inline-flex h-[20px] w-[20px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#ededed] text-[#0f0f0f] transition-colors hover:bg-[#e0e0e0]"
            >
              <Plus className="h-[12px] w-[12px]" strokeWidth={2.5} />
            </button>
          ) : null}
        </div>

        <p className="mt-[8px] text-[12px] font-semibold tracking-[-0.03em] text-[#989898]">
          {liveFullName}
        </p>
        <p className="mt-[12px] whitespace-pre-wrap text-[13px] font-medium leading-[1.5] tracking-[-0.02em] text-[#989898]">
          {liveBio}
        </p>

        <ProfileActions
          className="mt-[24px] flex flex-wrap items-center gap-[10px] xl:hidden"
          displayName={displayName}
          fullName={fullName}
          avatarSrc={avatarSrc}
          rankType={rankType}
          targetUserId={targetUserId}
          memberId={memberId}
          riotId={riotId}
          badernaRank={badernaRank}
          bannerSrc={bannerSrc}
          onCompare={onCompare}
          editButton={editButton}
        />
      </div>

      <TitleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        activeTitleIds={activeTitleIds}
        onToggle={isOwnProfile ? toggleTitle : undefined}
        readonly={!isOwnProfile}
        unlockedTitleIds={effectiveUnlocked}
        maxActive={MAX_ACTIVE_TITLES}
      />

      {isOwnProfile && (
        <AvatarPickerModal
          open={avatarPickerOpen}
          onClose={() => setAvatarPickerOpen(false)}
          currentSrc={liveAvatarSrc}
          ownerId={accountNick.toLowerCase() || (user ? String(user.id) : "me")}
          onSelect={(src) => updateField("avatarSrc", src)}
        />
      )}

    </section>
  );
}
