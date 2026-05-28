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
import { LastFmProfileModule } from "@/features/panel/components/lastfm-card";
import { PinnedPostCard } from "@/features/panel/components/pinned-post-card";
import { fetchPost, apiPinPost, type FeedPost } from "@/features/panel/use-posts";
import { PanelProfileSummary } from "@/features/panel/components/panel-profile-summary";
import { PanelShell } from "@/features/panel/components/panel-shell";
import { ProfileLoadingOverlay } from "@/features/panel/components/profile-loading-overlay";
import { ChampionPickerModal } from "@/features/panel/components/champion-picker-modal";
import { DuoPickerModal, type DuoCandidate } from "@/features/panel/components/duo-picker-modal";
import { GamePickerModal } from "@/features/panel/components/game-picker-modal";
import { SpotifyTrackPickerModal } from "@/features/panel/components/spotify-track-picker-modal";
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
  favoriteSongId: string | null;
  favoriteSongName: string | null;
  favoriteSongArtist: string | null;
  favoriteSongImage: string | null;
  favoriteSongUrl: string | null;
  duoUserId: number | null;
  pinnedPostId: number | null;
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
  // Match exclusivamente pelo slug canônico (users.slug). Sem fallback por
  // summonerName/userId — assim slugs customizados não colidem com nicks
  // alheios e URL antiga sem slug correspondente 404 conscientemente.
  const lowerSlug = slug.toLowerCase();
  const normSlug = normalizeSlug(slug);
  const index = list.findIndex(
    (m) => m.id === lowerSlug || m.id === normSlug,
  );
  return {
    member: index === -1 ? null : list[index],
    rank: index === -1 ? 0 : index + 1,
  };
}

function NoLolCard() {
  return (
    <div className="flex min-h-[140px] items-center justify-center rounded-[var(--panel-radius-card)] bg-white px-[22px] py-[18px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <p className="text-[13px] font-semibold tracking-[-0.02em] text-[#c0c0c0]">
        Essa pessoa não joga lol
      </p>
    </div>
  );
}

export function MembroPageClient({ slug }: { slug: string }) {
  const [members, setMembers] = useState<ApiMember[] | null>(null);
  const [splashGroups, setSplashGroups] = useState<SplashGroup[]>([]);
  const allMembers = useBadernaMembers();
  const ranks = useMemberRanks();
  const { user } = useAuth();
  const { account, updateField, updateFavoriteSong } = useAccount();
  const [showCompare, setShowCompare] = useState(false);
  const [showModuleEditor, setShowModuleEditor] = useState(false);
  const [showGamePicker, setShowGamePicker] = useState(false);
  const [showChampionPicker, setShowChampionPicker] = useState(false);
  const [showDuoPicker, setShowDuoPicker] = useState(false);
  const [showSongPicker, setShowSongPicker] = useState(false);
  const { titles: allTitles } = useTitles();
  const [pinnedPost, setPinnedPost] = useState<FeedPost | null>(null);

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

  // Busca o post fixado quando a lista de membros chega (ou quando o slug muda).
  useEffect(() => {
    if (!members) return;
    const { member } = findMemberInList(members, slug);
    const pid = member?.pinnedPostId;
    if (!pid) {
      setPinnedPost(null);
      return;
    }
    let cancelled = false;
    fetchPost(pid).then((post) => {
      if (!cancelled) setPinnedPost(post);
    });
    return () => {
      cancelled = true;
    };
  }, [members, slug]);

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

  // Duo: usa account.duoUserId (otimista) quando no próprio perfil, senão o da API.
  // account.duoUserId === undefined → ainda não foi tocado, usa API.
  // account.duoUserId === null     → usuário limpou o duo.
  // account.duoUserId === N        → usuário escolheu o membro N.
  const effectiveDuoUserId = isOwnProfile
    ? (account.duoUserId !== undefined ? account.duoUserId : (apiMember?.duoUserId ?? null))
    : (apiMember?.duoUserId ?? null);

  const duoMember =
    effectiveDuoUserId != null
      ? members.find((m) => m.userId === effectiveDuoUserId)
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
    favoriteChampionSlugs: isOwnProfile
      ? (account.favoriteChampionSlugs ?? apiMember?.favoriteChampionSlugs ?? [])
      : (apiMember?.favoriteChampionSlugs ?? []),
    onUpdateFavoriteChampions: isOwnProfile
      ? (champions) => updateField("favoriteChampionSlugs", champions)
      : null,
    communityHighlight: apiMember?.communityHighlight ?? null,
    duoSlug: duoMember?.id ?? null,
    duoFullName: duoMember?.name ?? null,
    duoName: duoMember?.nickname ?? duoMember?.name ?? null,
    duoAvatarSrc: duoMember?.avatarSrc ?? null,
    duoStyleId: duoMember?.activeNameId ?? null,
    favoriteGameTitle: isOwnProfile
      ? (account.favoriteGameTitle ?? apiMember?.favoriteGameTitle ?? null)
      : (apiMember?.favoriteGameTitle ?? null),
    favoriteGameCoverUrl: isOwnProfile
      ? (account.favoriteGameCoverUrl ?? apiMember?.favoriteGameCoverUrl ?? null)
      : (apiMember?.favoriteGameCoverUrl ?? null),
    onEditFavoriteGame: isOwnProfile ? () => setShowGamePicker(true) : undefined,
    onEditTopChampions: isOwnProfile ? () => setShowChampionPicker(true) : undefined,
    onEditDuo: isOwnProfile ? () => setShowDuoPicker(true) : undefined,
    onEditFavoriteSong: isOwnProfile ? () => setShowSongPicker(true) : undefined,
    favoriteSongId: isOwnProfile
      ? (account.favoriteSongId ?? apiMember?.favoriteSongId ?? null)
      : (apiMember?.favoriteSongId ?? null),
    favoriteSongName: isOwnProfile
      ? (account.favoriteSongName ?? apiMember?.favoriteSongName ?? null)
      : (apiMember?.favoriteSongName ?? null),
    favoriteSongArtist: isOwnProfile
      ? (account.favoriteSongArtist ?? apiMember?.favoriteSongArtist ?? null)
      : (apiMember?.favoriteSongArtist ?? null),
    favoriteSongImage: isOwnProfile
      ? (account.favoriteSongImage ?? apiMember?.favoriteSongImage ?? null)
      : (apiMember?.favoriteSongImage ?? null),
    favoriteSongUrl: isOwnProfile
      ? (account.favoriteSongUrl ?? apiMember?.favoriteSongUrl ?? null)
      : (apiMember?.favoriteSongUrl ?? null),
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
  //   lol user:     [lane-FIXO] [baderna-FIXO] [config[0]] [config[1]]
  //   Não-lol user: [config[0]] [baderna-FIXO] [config[1]] [config[2]]
  const configurableSlots = resolveTopSlots({
    profileModuleOrder: effectiveModuleOrder,
    hasRiotId,
  });

  const baderna = <ProfileModuleCard key="baderna-rank" moduleId="baderna-rank" data={moduleData} />;
  const renderConfig = (i: number) => {
    const id = configurableSlots[i];
    return id ? <ProfileModuleCard key={id} moduleId={id} data={moduleData} /> : null;
  };

  // lol:     [baderna-FIXO] [lane-FIXO] [config0] [config1] → 4 cards
  // Não-lol: [baderna-FIXO] [config0]  [config1] [config2] → 4 cards
  const topSlots = hasRiotId
    ? [
        baderna,
        <ProfileModuleCard key="lane-selector" moduleId="lane-selector" data={moduleData} />,
        renderConfig(0),
        renderConfig(1),
      ]
    : [
        baderna,
        renderConfig(0),
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

  const canEditModules = isOwnProfile;
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
        <path d="M2.87601 18.1156C2.92195 17.7021 2.94493 17.4954 3.00748 17.3022C3.06298 17.1307 3.1414 16.9676 3.24061 16.8171C3.35242 16.6475 3.49952 16.5005 3.7937 16.2063L17 3C18.1046 1.89543 19.8954 1.89543 21 3C22.1046 4.10457 22.1046 5.89543 21 7L7.7937 20.2063C7.49951 20.5005 7.35242 20.6475 7.18286 20.7594C7.03242 20.8586 6.86926 20.937 6.69782 20.9925C6.50457 21.055 6.29783 21.078 5.88434 21.124L2.49997 21.5L2.87601 18.1156Z" />
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
          currentOrder={configurableSlots}
          hasRiotId={hasRiotId}
          onSave={(order) => updateField("profileModuleOrder", order)}
          onClose={() => setShowModuleEditor(false)}
        />
      )}
      {showGamePicker && isOwnProfile && (
        <GamePickerModal
          currentTitle={account.favoriteGameTitle ?? null}
          onSelect={({ title, coverUrl }) => {
            updateField("favoriteGameTitle", title);
            updateField("favoriteGameCoverUrl", coverUrl ?? null);
          }}
          onClose={() => setShowGamePicker(false)}
        />
      )}
      {showChampionPicker && isOwnProfile && (
        <ChampionPickerModal
          current={account.favoriteChampionSlugs ?? apiMember?.favoriteChampionSlugs ?? []}
          onSave={(slugs) => updateField("favoriteChampionSlugs", slugs)}
          onClose={() => setShowChampionPicker(false)}
        />
      )}
      {showDuoPicker && isOwnProfile && (
        <DuoPickerModal
          currentDuoUserId={effectiveDuoUserId}
          candidates={members
            .filter((m) => m.userId !== targetUserId)
            .map<DuoCandidate>((m) => ({
              userId: m.userId,
              nickname: m.nickname ?? m.name,
              name: m.name,
              avatarSrc: m.avatarSrc,
              activeNameId: m.activeNameId ?? null,
            }))}
          onSave={async (userId) => {
            await updateField("duoUserId", userId);
          }}
          onClose={() => setShowDuoPicker(false)}
        />
      )}
      {showSongPicker && isOwnProfile && (
        <SpotifyTrackPickerModal
          currentSongId={account.favoriteSongId ?? apiMember?.favoriteSongId ?? null}
          onSave={async (track) => {
            await updateFavoriteSong(track);
          }}
          onClose={() => setShowSongPicker(false)}
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
                editButton={editCardsButton}
              />
            </div>

            <div className="xl:pr-[26px]">
              <div className="grid gap-6 md:grid-cols-2">{topSlots}</div>
            </div>
          </div>

          <div className="mt-[20px] xl:mt-[24px]">
            <div className="mb-6 hidden flex-wrap items-center gap-[10px] xl:flex">
              <ProfileActions
                className="flex flex-wrap items-center gap-[10px]"
                editButton={editCardsButton}
                {...actionProps}
              />
              <div className="ml-auto hidden xl:flex">
                <PanelGameModeToggle />
              </div>
            </div>
            <div className="mt-[96px] mb-4 flex justify-center xl:hidden">
              <PanelGameModeToggle />
            </div>
            <div className="grid gap-8 2xl:hidden xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,400px)] xl:items-start xl:gap-[32px]">
              <div className="min-w-0 max-w-full">
                {hasRiotId ? <LiveHistoryCard riotId={riotId} /> : <NoLolCard />}
              </div>
              <div className="flex min-w-0 max-w-full flex-col gap-8">
                {pinnedPost && (
                  <PinnedPostCard
                    post={pinnedPost}
                    onUnpin={isOwnProfile ? async () => {
                      await apiPinPost(pinnedPost.id);
                      setPinnedPost(null);
                    } : undefined}
                  />
                )}
                <LastFmProfileModule slug={slug} />
                {hasRiotId ? <PanelMemberWinratesCard targetUserId={targetUserId} /> : <NoLolCard />}
              </div>
              <div className="flex min-w-0 max-w-full flex-col gap-8 pb-[32px] xl:pb-0">
                {hasRiotId ? <LiveFavoriteChampionsCard riotId={riotId} /> : <NoLolCard />}
                <PanelCommentsCard memberId={member.id} targetUserId={targetUserId} />
              </div>
            </div>
          </div>
        </div>

        <div className="hidden 2xl:block">
          <div>
            <div className="grid grid-cols-[1.67fr_minmax(0,0.65fr)_minmax(0,1fr)_minmax(0,1.35fr)_minmax(0,1fr)] gap-x-[clamp(16px,2vw,39px)] items-start">
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
            <div className="mt-[54px] mb-6 grid grid-cols-[1.67fr_minmax(0,0.65fr)_minmax(0,1fr)_minmax(0,1.35fr)_minmax(0,1fr)] items-center gap-x-[clamp(16px,2vw,39px)]">
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
              <div className="col-start-1 col-span-1 flex flex-col gap-8">
                {pinnedPost && (
                  <PinnedPostCard
                    post={pinnedPost}
                    onUnpin={isOwnProfile ? async () => {
                      await apiPinPost(pinnedPost.id);
                      setPinnedPost(null);
                    } : undefined}
                  />
                )}
                <LastFmProfileModule slug={slug} />
                {hasRiotId ? <PanelMemberWinratesCard targetUserId={targetUserId} /> : <NoLolCard />}
              </div>
              <div className="col-start-2 col-span-2">
                {hasRiotId ? <LiveHistoryCard riotId={riotId} /> : <NoLolCard />}
              </div>
              <div className="col-start-4 col-span-2 flex flex-col gap-[42px]">
                {hasRiotId ? <LiveFavoriteChampionsCard riotId={riotId} /> : <NoLolCard />}
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
