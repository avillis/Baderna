"use client";

import { useEffect, useState } from "react";

import { getSplashImageSrc } from "@/features/panel/banner-selection";
import { getChampionAvatarSrc } from "@/features/panel/champion-avatar";
import { GameModeProvider } from "@/features/panel/game-mode-context";
import { panelProfile, panelStats } from "@/features/panel/panel-data";
import { getSplashCatalog, type SplashGroup } from "@/features/panel/splash-catalog";
import { authToken, useAuth } from "@/features/panel/use-auth";
import { useBadernaMembers } from "@/features/panel/use-baderna-members";
import { useMemberRanks } from "@/features/panel/use-member-ranks";
import {
  MemberCompareModal,
  type CompareSide,
} from "@/features/panel/components/member-compare-modal";
import { ProfileActions } from "@/features/panel/components/profile-actions";
import type { BadernaMember } from "@/features/panel/members-data";
import { LiveFavoriteChampionsCard } from "@/features/panel/components/live-favorite-champions-card";
import { LiveFeaturedChampionCard } from "@/features/panel/components/live-featured-champion-card";
import { LiveHistoryCard } from "@/features/panel/components/live-history-card";
import { LiveRankCard } from "@/features/panel/components/live-rank-card";
import { PanelCommentsCard } from "@/features/panel/components/panel-comments-card";
import { PanelGameModeToggle } from "@/features/panel/components/panel-game-mode-toggle";
import { PanelLaneSelectorCard } from "@/features/panel/components/panel-lane-selector-card";
import { PanelMemberWinratesCard } from "@/features/panel/components/panel-member-winrates-card";
import { PanelProfileSummary } from "@/features/panel/components/panel-profile-summary";
import { PanelShell } from "@/features/panel/components/panel-shell";
import { PanelStatCard } from "@/features/panel/components/panel-stat-card";
import { ProfileLoadingOverlay } from "@/features/panel/components/profile-loading-overlay";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

const DEFAULT_BANNER = "Blitzcrank_0.jpg";
const DEFAULT_BIO = "";

type ApiMember = {
  id: string;
  userId: number;
  name: string;
  nickname: string | null;
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
  const [showCompare, setShowCompare] = useState(false);

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

  return (
    <PanelShell
      splashGroups={splashGroups}
      defaultBannerFileName={profile.bannerFileName}
      defaultBannerFocusY={profile.bannerFocusY}
      bannerSrc={profile.bannerSrc}
      targetUserId={targetUserId}
    >
      <ProfileLoadingOverlay />
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
              <div className="grid gap-6 md:grid-cols-2">
                <PanelLaneSelectorCard
                  primaryLane={apiMember?.primaryLane ?? null}
                  secondaryLane={apiMember?.secondaryLane ?? null}
                  targetUserId={targetUserId}
                />
                <PanelStatCard
                  eyebrow={stats[1].eyebrow}
                  value={stats[1].value}
                  tone="rank-baderna"
                  placeholder={stats[1].placeholder}
                />
                <LiveRankCard
                  riotId={riotId}
                  fallbackEyebrow={stats[2].eyebrow}
                  fallbackValue={stats[2].value}
                  fallbackFrameSrc={profile.rankFrameSrc}
                />
                <LiveFeaturedChampionCard
                  riotId={riotId}
                  fallbackEyebrow={stats[3].eyebrow}
                  fallbackValue={stats[3].value}
                  fallbackSrc={profile.featuredChampionSrc}
                />
              </div>
            </div>
          </div>

          <div className="mt-[20px] xl:mt-[24px]">
            <div className="mb-6 hidden xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,400px)] xl:items-center xl:gap-[32px]">
              <ProfileActions
                className="col-span-2 flex flex-wrap items-center gap-[10px]"
                {...actionProps}
              />
              <div className="flex justify-end">
                <PanelGameModeToggle />
              </div>
            </div>
            <div className="mt-[72px] mb-4 flex justify-center xl:hidden">
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

              <PanelLaneSelectorCard
                  primaryLane={apiMember?.primaryLane ?? null}
                  secondaryLane={apiMember?.secondaryLane ?? null}
                  targetUserId={targetUserId}
                />
              <PanelStatCard
                eyebrow={stats[1].eyebrow}
                value={stats[1].value}
                tone="rank-baderna"
                placeholder={stats[1].placeholder}
              />
              <LiveRankCard
                riotId={riotId}
                fallbackEyebrow={stats[2].eyebrow}
                fallbackValue={stats[2].value}
                fallbackFrameSrc={profile.rankFrameSrc}
              />
              <LiveFeaturedChampionCard
                riotId={riotId}
                fallbackEyebrow={stats[3].eyebrow}
                fallbackValue={stats[3].value}
                fallbackSrc={profile.featuredChampionSrc}
              />
            </div>

            <div className="mt-[54px] mb-6 grid grid-cols-[1.67fr_minmax(0,1fr)_minmax(0,0.65fr)_minmax(0,1.35fr)_minmax(0,1fr)] items-center gap-x-[clamp(16px,2vw,39px)]">
              <ProfileActions
                className="col-start-1 col-span-3 flex flex-wrap items-center gap-[10px]"
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
