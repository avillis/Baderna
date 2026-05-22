import { PanelCommentsCard } from "@/features/panel/components/panel-comments-card";
import { PanelFavoriteChampionsCard } from "@/features/panel/components/panel-favorite-champions-card";
import { LiveFavoriteChampionsCard } from "@/features/panel/components/live-favorite-champions-card";
import { LiveFeaturedChampionCard } from "@/features/panel/components/live-featured-champion-card";
import { PanelGameModeToggle } from "@/features/panel/components/panel-game-mode-toggle";
import { LiveHistoryCard } from "@/features/panel/components/live-history-card";
import { PanelLaneSelectorCard } from "@/features/panel/components/panel-lane-selector-card";
import { PanelMemberWinratesCard } from "@/features/panel/components/panel-member-winrates-card";
import { PanelProfileSummary } from "@/features/panel/components/panel-profile-summary";
import { PanelShell } from "@/features/panel/components/panel-shell";
import { PanelStatCard } from "@/features/panel/components/panel-stat-card";
import { LiveRankCard } from "@/features/panel/components/live-rank-card";
import { ProfileLoadingOverlay } from "@/features/panel/components/profile-loading-overlay";
import { GameModeProvider } from "@/features/panel/game-mode-context";
import { getChampionAvatarSrc } from "@/features/panel/champion-avatar";
import { panelProfile, panelStats } from "@/features/panel/panel-data";
import { getSplashImageSrc } from "@/features/panel/banner-selection";
import { getSplashCatalog } from "@/features/panel/splash-catalog";

type MembroPageProps = {
  params: Promise<{ slug: string }>;
};

const DEFAULT_BANNER = "Blitzcrank_0.jpg";
const DEFAULT_BIO = "";

// Server-side fetch: troca "localhost" por "127.0.0.1" pra evitar resolução
// IPv6 (::1) que o `php artisan serve` não escuta — sem isso, o fetch do
// Node fica pendurado e a página não renderiza nunca.
const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api"
).replace("localhost", "127.0.0.1");

type ApiMember = {
  id: string;
  userId: number;
  name: string;
  nickname: string | null;
  summonerName: string | null;
  tagLine: string | null;
  avatarSrc: string | null;
  bannerFileName: string | null;
  isAdmin: boolean;
  bio: string | null;
  teamName: string | null;
  primaryLane: "TOP" | "JG" | "MID" | "ADC" | "SUP" | null;
  secondaryLane: "TOP" | "JG" | "MID" | "ADC" | "SUP" | null;
};

async function fetchMembersList(): Promise<ApiMember[]> {
  try {
    const res = await fetch(`${API_BASE}/members`, { cache: "no-store" });
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

export default async function MembroPage({ params }: MembroPageProps) {
  const { slug } = await params;
  const membersList = await fetchMembersList();
  const { member: apiMember, rank: badernaRankIndex } = findMemberInList(
    membersList,
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

  // Splash catalog é puxado sempre — o front decide se mostra o picker.
  const splashGroups = await getSplashCatalog();

  const profile = {
    ...panelProfile,
    displayName: member.nickname,
    fullName: member.name,
    avatarSrc: member.avatarSrc,
    rankType: member.rankType,
    rankFrameSrc: `/images/ranks/${member.rankType}.png`,
    bio: member.bio,
    bannerFileName: apiMember?.bannerFileName || DEFAULT_BANNER,
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

  // Live cards funcionam pra qualquer membro — sempre passa o riotId dele.
  // O `isOwnProfile` é resolvido client-side pelos componentes que precisam
  // (PanelProfileSummary) via useAuth.
  const targetUserId = member.userId;
  const riotId = member.riotId;

  return (
    <PanelShell
      splashGroups={splashGroups}
      defaultBannerFileName={profile.bannerFileName}
      bannerSrc={profile.bannerSrc}
      targetUserId={targetUserId}
    >
      <ProfileLoadingOverlay />
      <GameModeProvider>
        <div className="2xl:hidden">
          <div className="grid gap-8 xl:grid-cols-[277px_minmax(0,1fr)] xl:items-start">
            <div className="xl:pl-0">
              <PanelProfileSummary
                avatarSrc={profile.avatarSrc}
                displayName={profile.displayName}
                fullName={profile.fullName}
                bio={profile.bio}
                rankType={profile.rankType}
                targetUserId={targetUserId}
                riotId={riotId}
                initialTitleIds={["aprendiz"]}
                unlockedTitleIds={["aprendiz"]}
                memberId={member.id}
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
            <div className="mb-6 hidden xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,400px)] xl:gap-[32px]">
              <div />
              <div />
              <div className="flex justify-end">
                <PanelGameModeToggle />
              </div>
            </div>
            <div className="mb-4 flex justify-end xl:hidden">
              <PanelGameModeToggle />
            </div>
            <div className="grid gap-8 2xl:hidden xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,400px)] xl:items-start xl:gap-[32px]">
              <LiveHistoryCard riotId={riotId} />
              <PanelMemberWinratesCard />
              <div className="flex flex-col gap-8">
                <LiveFavoriteChampionsCard riotId={riotId} />
                <PanelCommentsCard memberId={member.id} targetUserId={targetUserId} />
              </div>
            </div>
          </div>
        </div>

        <div className="hidden 2xl:block">
          <div className="origin-top-left scale-[0.955]">
            <div className="grid grid-cols-[1.67fr_repeat(4,minmax(0,1fr))] gap-x-[clamp(16px,2vw,39px)] items-start">
              <div className="pl-0">
                <PanelProfileSummary
                  avatarSrc={profile.avatarSrc}
                  displayName={profile.displayName}
                  fullName={profile.fullName}
                  bio={profile.bio}
                  rankType={profile.rankType}
                  targetUserId={targetUserId}
                  riotId={riotId}
                  initialTitleIds={["aprendiz"]}
                  unlockedTitleIds={["aprendiz"]}
                  memberId={member.id}
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

            <div className="mt-[54px] mb-6 grid grid-cols-[1.67fr_repeat(4,minmax(0,1fr))] gap-x-[clamp(16px,2vw,39px)]">
              <div className="col-start-4 col-span-2 flex justify-end">
                <PanelGameModeToggle />
              </div>
            </div>
            <div className="grid grid-cols-[1.67fr_repeat(4,minmax(0,1fr))] gap-x-[clamp(16px,2vw,39px)] items-start">
              <div className="col-start-1 col-span-1">
                <PanelMemberWinratesCard />
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
    </PanelShell>
  );
}
