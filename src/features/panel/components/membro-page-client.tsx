"use client";

import { useEffect, useState } from "react";

import { getSplashImageSrc } from "@/features/panel/banner-selection";
import { getChampionAvatarSrc } from "@/features/panel/champion-avatar";
import { GameModeProvider } from "@/features/panel/game-mode-context";
import { panelProfile, panelStats } from "@/features/panel/panel-data";
import { getSplashCatalog, type SplashGroup } from "@/features/panel/splash-catalog";
import { authToken, useAuth } from "@/features/panel/use-auth";
import { useAccount } from "@/features/panel/use-account";
import { useBadernaMembers } from "@/features/panel/use-baderna-members";
import { useMemberRanks } from "@/features/panel/use-member-ranks";
import {
  MemberCompareModal,
  type CompareSide,
} from "@/features/panel/components/member-compare-modal";
import { ProfileActions } from "@/features/panel/components/profile-actions";
import type { BadernaMember } from "@/features/panel/members-data";
import { LiveFavoriteChampionsCard } from "@/features/panel/components/live-favorite-champions-card";
import { LiveHistoryCard } from "@/features/panel/components/live-history-card";
import { PanelCommentsCard } from "@/features/panel/components/panel-comments-card";
import { PanelGameModeToggle } from "@/features/panel/components/panel-game-mode-toggle";
import { PanelMemberWinratesCard } from "@/features/panel/components/panel-member-winrates-card";
import { PanelProfileSummary } from "@/features/panel/components/panel-profile-summary";
import { PanelShell } from "@/features/panel/components/panel-shell";
import { ProfileLoadingOverlay } from "@/features/panel/components/profile-loading-overlay";
import { ProfileModuleSelectorModal } from "@/features/panel/components/profile-module-selector-modal";
import {
  ProfileModuleCard,
  resolveTopSlots,
  type ProfileModuleData,
} from "@/features/panel/components/profile-modules";
import { NAME_STYLES } from "@/features/panel/names-data";
import { useTitles } from "@/features/panel/use-titles";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

const DEFAULT_BANNER = "Blitzcrank_0.jpg";
const DEFAULT_BIO = "";

type ApiMember = {
  id: string;
  userId: number;
  name: string;
  nickname: string | null;
  activeNameId: string | null;
  summonerName: string | null;
  tagLine: string | null;
  avatarSrc: string | null;
  bannerFileName: string | null;
  bannerFocusY: number | null;
  isAdmin?: boolean;
  bio: string | null;
  teamName: string | null;
  primaryLane: "TOP" | "JG" | "MID" | "ADC" | "SUP" | null;
  secondaryLane: "TOP" | "JG" | "MID" | "ADC" | "SUP" | null;
  activeTitleSlugs: string[] | null;
  communityHighlight: string | null;
  profileModuleOrder: string[] | null;
  favoriteChampionSlugs: string[] | null;
  favoriteGameTitle: string | null;
  favoriteGameCoverUrl: string | null;
  duoUserId: number | null;
  memberSince: string | null;
  postsCount: number;
  authoredCommentsCount: number;
  profileCommentsCount: number;
  unlockedTitlesCount: number;
  unlockedBannersCount: number;
  unlockedNamesCount: number;
};

async function fetchMembersList(): Promise<ApiMember[]> {
  try {
    const token = authToken();
    if (!token) return [];
    const res = await fetch(`${API_BASE}/members`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return [];
    return (await res.json()) as ApiMember[];
  } catch {
    return [];
  }
}

function normalizeSlug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-");
}

function findMemberInList(
  list: ApiMember[],
  slug: string,
): { member: ApiMember | null; rank: number } {
  const lowerSlug = slug.toLowerCase();
  const normSlug = normalizeSlug(slug);
  const index = list.findIndex((m) => {
    if (m.id === lowerSlug || m.id === normSlug) return true;
    const summ = m.summonerName?.toLowerCase() ?? "";
    if (summ === lowerSlug || normalizeSlug(summ) === normSlug) return true;
    if (String(m.userId) === slug) return true;
    return false;
  });
  return {
    member: index === -1 ? null : list[index],
    rank: index === -1 ? 0 : index + 1,
  };
}

export function MembroPageClient({ slug }: { slug: string }) {
  const [members, setMembers] = useState<ApiMember[] | null>(null);
  const [splashGroups, setSplashGroups] = useState<SplashGroup[]>([]);
  const allMembers = useBadernaMembers();
  const ranks = useMemberRanks();
  const { user } = useAuth();
  const { account, updateField } = useAccount();
  const [showCompare, setShowCompare] = useState(false);
  const [showModuleEditor, setShowModuleEditor] = useState(false);
  const { titles: allTitles } = useTitles();

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchMembersList(), getSplashCatalog()]).then(
      ([list, splash]) => {
        if (cancelled) return;
        setMembers(list);
        setSplashGroups(splash);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // Loading inicial: enquanto não chegou a lista de membros, mostra só o
  // shell com overlay (sem flash de "não encontrado").
  if (members === null) {
    return (
      <PanelShell showBanner={false}>
        <ProfileLoadingOverlay />
      </PanelShell>
    );
  }

  const { member: apiMember, rank: badernaRankIndex } = findMemberInList(
    members,
    slug,
  );

  const member = apiMember
    ? {
        id: apiMember.id,
        userId: apiMember.userId,
        name: apiMember.name,
        nickname: apiMember.nickname ?? apiMember.name,
        rankType: "gold" as const,
        rankName: "—",
        avatarSrc: apiMember.avatarSrc || getChampionAvatarSrc(apiMember.id),
        preferredRoles: ["Mid", "ADC"],
        bio: apiMember.bio || DEFAULT_BIO,
        riotId:
          apiMember.summonerName && apiMember.tagLine
            ? `${apiMember.summonerName}#${apiMember.tagLine}`
            : "",
      }
    : {
        id: slug,
        userId: null as number | null,
        name: "Membro",
        nickname: "Membro",
        rankType: "gold" as const,
        rankName: "—",
        avatarSrc: getChampionAvatarSrc(slug),
        preferredRoles: ["Mid", "ADC"],
        bio: DEFAULT_BIO,
        riotId: "",
      };

  const profile = {
    ...panelProfile,
    displayName: member.nickname,
    fullName: member.name,
    avatarSrc: member.avatarSrc,
    rankType: member.rankType,
    rankFrameSrc: `/images/ranks/${member.rankType}.png`,
    bio: member.bio,
    bannerFileName: apiMember?.bannerFileName || DEFAULT_BANNER,
    bannerFocusY:
      typeof apiMember?.bannerFocusY === "number" ? apiMember.bannerFocusY : 16,
    bannerSrc: getSplashImageSrc(apiMember?.bannerFileName || DEFAULT_BANNER),
  };

  const badernaRank = badernaRankIndex > 0 ? badernaRankIndex : 1;

  const stats = [
    panelStats[0],
    {
      ...panelStats[1],
      value: `#${String(badernaRank).padStart(2, "0")}`,
    },
    { ...panelStats[2], eyebrow: member.rankName },
    panelStats[3],
  ];

  const targetUserId = member.userId;
  const riotId = member.riotId;
  const hasRiotId = Boolean(riotId);
  const isOwnProfile = user != null && targetUserId === user.id;

  // Duo: resolve user_id em nome + avatar olhando na lista de membros.
  const duoMember =
    apiMember?.duoUserId != null
      ? members.find((m) => m.userId === apiMember.duoUserId)
      : null;

  const totalBannerCount = splashGroups.reduce(
    (sum, group) => sum + group.variants.length,
    0,
  );

  const moduleData: ProfileModuleData = {
    hasRiotId,
    isOwnProfile,
    riotId,
    targetUserId,
    primaryLane: apiMember?.primaryLane ?? null,
    secondaryLane: apiMember?.secondaryLane ?? null,
    badernaRank,
    fallbackRankEyebrow: stats[2].eyebrow,
    fallbackRankValue: stats[2].value,
    fallbackRankFrameSrc: profile.rankFrameSrc,
    fallbackFeaturedEyebrow: stats[3].eyebrow,
    fallbackFeaturedValue: stats[3].value,
    fallbackFeaturedSrc: profile.featuredChampionSrc,
    favoriteChampionSlugs: apiMember?.favoriteChampionSlugs ?? [],
    onUpdateFavoriteChampions: isOwnProfile
      ? (champions) => updateField("favoriteChampionSlugs", champions)
      : null,
    communityHighlight: apiMember?.communityHighlight ?? null,
    duoSlug: duoMember?.id ?? null,
    duoFullName: duoMember?.name ?? null,
    duoName: duoMember?.nickname ?? duoMember?.name ?? null,
    duoAvatarSrc: duoMember?.avatarSrc ?? null,
    duoStyleId: duoMember?.activeNameId ?? null,
    favoriteGameTitle: apiMember?.favoriteGameTitle ?? null,
    favoriteGameCoverUrl: apiMember?.favoriteGameCoverUrl ?? null,
    memberSince: apiMember?.memberSince ?? null,
    unlockedBanners: apiMember?.unlockedBannersCount ?? 0,
    unlockedTitles: apiMember?.unlockedTitlesCount ?? 0,
    unlockedNames: apiMember?.unlockedNamesCount ?? 0,
    totalBanners: totalBannerCount || 1,
    totalTitles: allTitles.length || 1,
    totalNames: NAME_STYLES.length,
    postsCount: apiMember?.postsCount ?? 0,
    authoredCommentsCount: apiMember?.authoredCommentsCount ?? 0,
    profileCommentsCount: apiMember?.profileCommentsCount ?? 0,
    showcaseItems: [],
  };

  // No próprio perfil usa o account (update otimista após salvar no modal).
  // Em perfis alheios usa o que veio do fetch da lista.
  const effectiveModuleOrder = isOwnProfile
    ? (account.profileModuleOrder ?? apiMember?.profileModuleOrder)
    : apiMember?.profileModuleOrder;

  // Layout de 4 slots:
  //   LoL user:     [lane-FIXO] [baderna-FIXO] [config[0]] [config[1]]
  //   Não-LoL user: [config[0]] [baderna-FIXO] [config[1]] [config[2]]
  const configurableSlots = resolveTopSlots({
    profileModuleOrder: effectiveModuleOrder,
    hasRiotId,
  });

  const baderna = <ProfileModuleCard key="baderna-rank" moduleId="baderna-rank" data={moduleData} />;
  const renderConfig = (i: number) => {
    const id = configurableSlots[i];
    return id ? <ProfileModuleCard key={id} moduleId={id} data={moduleData} /> : null;
  };

  // 4 slots renderizados na ordem certa:
  const topSlots = hasRiotId
    ? [
        <ProfileModuleCard key="lane-selector" moduleId="lane-selector" data={moduleData} />,
        baderna,
        renderConfig(0),
        renderConfig(1),
      ]
    : [
        renderConfig(0),
        baderna,
        renderConfig(1),
        renderConfig(2),
      ];

  const buildSide = (m: BadernaMember): CompareSide => {
    const idx = allMembers.findIndex((x) => x.id === m.id);
    return {
      member: m,
      badernaRank: idx >= 0 ? idx + 1 : 1,
      rank: m.userId != null ? ranks[m.userId] : undefined,
      riotId:
        m.summonerName && m.tagLine ? `${m.summonerName}#${m.tagLine}` : null,
    };
  };
  const viewedBaderna =
    targetUserId != null
      ? allMembers.find((m) => m.userId === targetUserId)
      : undefined;
  const meBaderna =
    user != null ? allMembers.find((m) => m.userId === user.id) : undefined;
  const viewedSide = viewedBaderna ? buildSide(viewedBaderna) : null;
  const mySide = meBaderna ? buildSide(meBaderna) : null;
  const canCompare = Boolean(
    viewedSide && mySide && viewedSide.member.id !== mySide.member.id,
  );
  const handleCompare = canCompare ? () => setShowCompare(true) : undefined;

  const actionProps = {
    displayName: profile.displayName,
    fullName: profile.fullName,
    avatarSrc: profile.avatarSrc,
    rankType: profile.rankType,
    targetUserId,
    memberId: member.id,
    riotId,
    badernaRank,
    bannerSrc: profile.bannerSrc,
    onCompare: handleCompare,
  };

  const canEditModules = isOwnProfile || Boolean(user?.is_admin);
  const editCardsButton = canEditModules ? (
    <button
      type="button"
      onClick={() => setShowModuleEditor(true)}
      className="inline-flex h-[40px] items-center justify-center gap-[8px] rounded-[12px] bg-[#ededed] px-[14px] text-[12px] font-bold tracking-[-0.02em] text-[#0f0f0f] transition-colors hover:bg-[#e3e3e3]"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-[15px] w-[15px]"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 3.99998H6.8C5.11984 3.99998 4.27976 3.99998 3.63803 4.32696C3.07354 4.61458 2.6146 5.07353 2.32698 5.63801C2 6.27975 2 7.11983 2 8.79998V17.2C2 18.8801 2 19.7202 2.32698 20.362C2.6146 20.9264 3.07354 21.3854 3.63803 21.673C4.27976 22 5.11984 22 6.8 22H15.2C16.8802 22 17.7202 22 18.362 21.673C18.9265 21.3854 19.3854 20.9264 19.673 20.362C20 19.7202 20 18.8801 20 17.2V13M7.99997 16H9.67452C10.1637 16 10.4083 16 10.6385 15.9447C10.8425 15.8957 11.0376 15.8149 11.2166 15.7053C11.4184 15.5816 11.5914 15.4086 11.9373 15.0627L21.5 5.49998C22.3284 4.67156 22.3284 3.32841 21.5 2.49998C20.6716 1.67156 19.3284 1.67155 18.5 2.49998L8.93723 12.0627C8.59133 12.4086 8.41838 12.5816 8.29469 12.7834C8.18504 12.9624 8.10423 13.1574 8.05523 13.3615C7.99997 13.5917 7.99997 13.8363 7.99997 14.3255V16Z" />
      </svg>
      Editar cards
    </button>
  ) : null;

  return (
    <PanelShell
      splashGroups={splashGroups}
      defaultBannerFileName={profile.bannerFileName}
      defaultBannerFocusY={profile.bannerFocusY}
      bannerSrc={profile.bannerSrc}
      targetUserId={targetUserId}
    >
      <ProfileLoadingOverlay />
      {showModuleEditor && (
        <ProfileModuleSelectorModal
          currentOrder={effectiveModuleOrder ?? []}
          hasRiotId={hasRiotId}
          onSave={(order) => updateField("profileModuleOrder", order)}
          onClose={() => setShowModuleEditor(false)}
        />
      )}
      <GameModeProvider>
        <div className="2xl:hidden">
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[277px_minmax(0,1fr)] xl:items-start">
            <div className="min-w-0 xl:pl-0">
              <PanelProfileSummary
                avatarSrc={profile.avatarSrc}
                displayName={profile.displayName}
                fullName={profile.fullName}
                bio={profile.bio}
                rankType={profile.rankType}
                targetUserId={targetUserId}
                riotId={riotId}
                initialTitleIds={
                  apiMember?.activeTitleSlugs?.length
                    ? apiMember.activeTitleSlugs
                    : ["aprendiz"]
                }
                unlockedTitleIds={["aprendiz"]}
                memberId={member.id}
                onCompare={handleCompare}
                badernaRank={badernaRank}
                bannerSrc={profile.bannerSrc}
              />
            </div>

            <div className="xl:pr-[26px]">
              <div className="grid gap-6 md:grid-cols-2">{topSlots}</div>
            </div>
          </div>

          <div className="mt-[20px] xl:mt-[24px]">
            <div className="mb-6 flex flex-wrap items-center gap-[10px]">
              <ProfileActions
                className="flex flex-wrap items-center gap-[10px]"
                editButton={editCardsButton}
                {...actionProps}
              />
              <div className="ml-auto hidden xl:flex">
                <PanelGameModeToggle />
              </div>
            </div>
            <div className="mt-[12px] mb-4 flex justify-center xl:hidden">
              <PanelGameModeToggle />
            </div>
            <div className="grid gap-8 2xl:hidden xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,400px)] xl:items-start xl:gap-[32px]">
              <div className="min-w-0 max-w-full"><LiveHistoryCard riotId={riotId} /></div>
              <div className="min-w-0 max-w-full"><PanelMemberWinratesCard targetUserId={targetUserId} /></div>
              <div className="flex min-w-0 max-w-full flex-col gap-8">
                <LiveFavoriteChampionsCard riotId={riotId} />
                <PanelCommentsCard memberId={member.id} targetUserId={targetUserId} />
              </div>
            </div>
          </div>
        </div>

        <div className="hidden 2xl:block">
          <div>
            <div className="grid grid-cols-[1.67fr_minmax(0,1fr)_minmax(0,0.65fr)_minmax(0,1.35fr)_minmax(0,1fr)] gap-x-[clamp(16px,2vw,39px)] items-start">
              <div className="pl-0">
                <PanelProfileSummary
                  avatarSrc={profile.avatarSrc}
                  displayName={profile.displayName}
                  fullName={profile.fullName}
                  bio={profile.bio}
                  rankType={profile.rankType}
                  targetUserId={targetUserId}
                  riotId={riotId}
                  initialTitleIds={
                    apiMember?.activeTitleSlugs?.length
                      ? apiMember.activeTitleSlugs
                      : ["aprendiz"]
                  }
                  unlockedTitleIds={["aprendiz"]}
                  memberId={member.id}
                  onCompare={handleCompare}
                  badernaRank={badernaRank}
                  bannerSrc={profile.bannerSrc}
                />
              </div>

              {topSlots}
            </div>
            <div className="mt-[54px] mb-6 grid grid-cols-[1.67fr_minmax(0,1fr)_minmax(0,0.65fr)_minmax(0,1.35fr)_minmax(0,1fr)] items-center gap-x-[clamp(16px,2vw,39px)]">
              <ProfileActions
                className="col-start-1 col-span-3 flex flex-wrap items-center gap-[10px]"
                editButton={editCardsButton}
                {...actionProps}
              />
              <div className="col-start-4 col-span-2 flex justify-end">
                <PanelGameModeToggle />
              </div>
            </div>
            <div className="grid grid-cols-[1.67fr_minmax(0,1fr)_minmax(0,0.65fr)_minmax(0,1.35fr)_minmax(0,1fr)] gap-x-[clamp(16px,2vw,39px)] items-start">
              <div className="col-start-1 col-span-1">
                <PanelMemberWinratesCard targetUserId={targetUserId} />
              </div>

              <div className="col-start-2 col-span-2">
                <LiveHistoryCard riotId={riotId} />
              </div>

              <div className="col-start-4 col-span-2 flex flex-col gap-[42px]">
                <LiveFavoriteChampionsCard riotId={riotId} />
                <PanelCommentsCard memberId={member.id} targetUserId={targetUserId} />
              </div>
            </div>
          </div>
        </div>
      </GameModeProvider>

      {showCompare && viewedSide && mySide && (
        <MemberCompareModal
          left={viewedSide}
          right={mySide}
          onClose={() => setShowCompare(false)}
        />
      )}
    </PanelShell>
  );
}
