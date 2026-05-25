"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { LiveFeaturedChampionCard } from "@/features/panel/components/live-featured-champion-card";
import { LiveRankCard } from "@/features/panel/components/live-rank-card";
import { PanelLaneSelectorCard } from "@/features/panel/components/panel-lane-selector-card";
import { PanelStatCard } from "@/features/panel/components/panel-stat-card";
import { StyledName } from "@/features/panel/components/styled-name";

export type ProfileModuleId =
  | "lane-selector"
  | "baderna-rank"
  | "lol-rank"
  | "featured-champion"
  | "top-champions"
  | "collection"
  | "participation"
  | "duo"
  | "community-highlight"
  | "favorite-game"
  | "member-since"
  | "showcase";

export const LOL_LOCKED_MODULE_IDS = new Set<ProfileModuleId>([
  "lane-selector",
  "lol-rank",
  "featured-champion",
  "top-champions",
]);

const CARD_HEIGHT_CLASS = "h-[122px]";

function CardShell({ children }: { children: ReactNode }) {
  return (
    <article
      className={`relative flex ${CARD_HEIGHT_CLASS} overflow-hidden rounded-[var(--panel-radius-card)] bg-white px-[22px] py-[18px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]`}
    >
      {children}
    </article>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
      {children}
    </p>
  );
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-[10px]">
      <span className="truncate text-[11px] font-semibold tracking-[-0.02em] text-[#8d8d8d]">
        {label}
      </span>
      <span className="shrink-0 text-[11px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
        {value}
      </span>
    </div>
  );
}

function LockedOverlay({ message }: { message?: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-[var(--panel-radius-card)] bg-white/72 backdrop-blur-[2px]">
      <div className="flex flex-col items-center gap-[6px] px-[14px] text-center">
        <Image
          src="/images/lanes/Top_icon.png"
          alt=""
          width={20}
          height={20}
          className="opacity-50"
        />
        <p className="text-[11px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
          {message ?? "Conecte seu Riot ID"}
        </p>
      </div>
    </div>
  );
}

function LockedWrapper({
  locked,
  message,
  children,
}: {
  locked: boolean;
  message?: string;
  children: ReactNode;
}) {
  if (!locked) return <>{children}</>;
  return (
    <div className="relative">
      <div className="pointer-events-none opacity-40">{children}</div>
      <LockedOverlay message={message} />
    </div>
  );
}

function CollectionModuleCard({
  unlockedBanners,
  unlockedTitles,
  unlockedNames,
  totalBanners,
  totalTitles,
  totalNames,
}: {
  unlockedBanners: number;
  unlockedTitles: number;
  unlockedNames: number;
  totalBanners: number;
  totalTitles: number;
  totalNames: number;
}) {
  return (
    <CardShell>
      <div className="flex h-full w-full flex-col justify-center">
        <div className="space-y-[10px]">
          <StatLine label="Capas" value={`${unlockedBanners}/${totalBanners}`} />
          <StatLine label="Títulos" value={`${unlockedTitles}/${totalTitles}`} />
          <StatLine label="Estilos" value={`${unlockedNames}/${totalNames}`} />
        </div>
      </div>
    </CardShell>
  );
}

function ParticipationModuleCard({
  postsCount,
  authoredCommentsCount,
  profileCommentsCount,
}: {
  postsCount: number;
  authoredCommentsCount: number;
  profileCommentsCount: number;
}) {
  return (
    <CardShell>
      <div className="flex h-full w-full flex-col justify-center">
        <div className="space-y-[10px]">
          <StatLine label="Posts" value={String(postsCount)} />
          <StatLine label="Comentários" value={String(authoredCommentsCount)} />
          <StatLine label="Mural" value={String(profileCommentsCount)} />
        </div>
      </div>
    </CardShell>
  );
}

function TopChampionsModuleCard({
  favoriteChampionSlugs,
}: {
  favoriteChampionSlugs: string[];
}) {
  const champs = favoriteChampionSlugs.filter(Boolean).slice(0, 3);
  return (
    <CardShell>
      <div className="flex h-full w-full flex-col">
        <Eyebrow>Top 3 favoritos</Eyebrow>
        <div className="mt-auto flex items-end justify-between gap-[10px]">
          {champs.length > 0 ? (
            champs.map((champ) => (
              <div key={champ} className="min-w-0 flex-1 text-center">
                <div className="relative mx-auto h-[46px] w-[46px] overflow-hidden rounded-full bg-[#f4f0ed] ring-1 ring-[#efe6e2]">
                  <Image
                    src={`/api/champion-tile/${champ}_0.jpg`}
                    alt={champ}
                    fill
                    className="object-cover"
                    sizes="46px"
                    unoptimized
                  />
                </div>
                <p className="mt-[6px] truncate text-[10px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
                  {champ}
                </p>
              </div>
            ))
          ) : (
            <p className="text-[11px] font-medium tracking-[-0.02em] text-[#8d8d8d]">
              Escolha 3 champs favoritos
            </p>
          )}
        </div>
      </div>
    </CardShell>
  );
}

function DuoModuleCard({
  duoSlug,
  duoFullName,
  duoName,
  duoAvatarSrc,
  duoStyleId,
}: {
  duoSlug: string | null;
  duoFullName: string | null;
  duoName: string | null;
  duoAvatarSrc: string | null;
  duoStyleId: string | null;
}) {
  const cardContent = (
    <div className="flex h-full w-full flex-col">
      <Eyebrow>Duo favorito</Eyebrow>
      <div className="mt-auto flex items-center gap-[12px]">
        {duoAvatarSrc ? (
          <div className="relative h-[46px] w-[46px] overflow-hidden rounded-full bg-[#f4f0ed]">
            <Image
              src={duoAvatarSrc}
              alt={duoName ?? ""}
              fill
              className="object-cover"
              sizes="46px"
              unoptimized
            />
          </div>
        ) : (
          <div className="h-[46px] w-[46px] rounded-full bg-[#f4f0ed]" />
        )}
        <div className="min-w-0">
          <div className="truncate text-[13px] font-bold leading-[1.05] tracking-[-0.03em]">
            <StyledName styleId={duoStyleId ?? undefined}>
              {duoName ?? "Sem duo escolhido"}
            </StyledName>
          </div>
          <p className="mt-[4px] truncate text-[11px] font-medium tracking-[-0.02em] text-[#8d8d8d]">
            {duoFullName ?? "Escolha alguém para destacar"}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <CardShell>
      {duoSlug ? (
        <Link
          href={`/membro/${duoSlug}`}
          className="block h-full w-full transition-opacity hover:opacity-85"
          aria-label={`Ver perfil de ${duoName ?? duoFullName ?? "duo favorito"}`}
        >
          {cardContent}
        </Link>
      ) : (
        cardContent
      )}
    </CardShell>
  );
}

function CommunityHighlightModuleCard({
  highlight,
}: {
  highlight: string | null;
}) {
  return (
    <CardShell>
      <div className="flex h-full w-full flex-col justify-between">
        <Eyebrow>Destaque da comunidade</Eyebrow>
        <div>
          <p
            className={`line-clamp-2 text-[18px] font-bold leading-[1.05] tracking-[-0.04em] ${
              highlight ? "text-[#ff4100]" : "text-[#0f0f0f]"
            }`}
          >
            {highlight ?? "Sem destaque ainda"}
          </p>
          <p className="mt-[6px] line-clamp-1 text-[11px] font-medium tracking-[-0.02em] text-[#8d8d8d]">
            {highlight
              ? "Entregue pela administração"
              : "Admin pode entregar um badge aqui"}
          </p>
        </div>
      </div>
    </CardShell>
  );
}

function FavoriteGameModuleCard({
  title,
  coverUrl,
}: {
  title: string | null;
  coverUrl: string | null;
}) {
  if (coverUrl) {
    return (
      <article
        className={`relative ${CARD_HEIGHT_CLASS} overflow-hidden rounded-[var(--panel-radius-card)] bg-black shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]`}
      >
        <Image
          src={coverUrl}
          alt={title ?? "Jogo favorito"}
          fill
          className="object-cover"
          sizes="(min-width: 1536px) 237px, (min-width: 1280px) 25vw, 100vw"
          unoptimized
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.75)_0%,rgba(0,0,0,0.10)_100%)]" />
        <div className="relative z-10 flex h-full flex-col justify-end p-[22px]">
          <p className="text-[10px] font-bold tracking-[-0.03em] text-white/80">
            Jogo favorito
          </p>
          <p className="mt-[6px] line-clamp-1 text-[22px] font-bold leading-[1.05] tracking-[-0.04em] text-white">
            {title}
          </p>
        </div>
      </article>
    );
  }
  return (
    <CardShell>
      <div className="flex h-full w-full flex-col justify-between">
        <Eyebrow>Jogo favorito</Eyebrow>
        <div>
          <p className="text-[18px] font-bold leading-[1.05] tracking-[-0.04em] text-[#0f0f0f]">
            {title ?? "Defina seu jogo favorito"}
          </p>
          <p className="mt-[6px] text-[11px] font-medium tracking-[-0.02em] text-[#8d8d8d]">
            {title ? "Sem capa cacheada ainda" : "Editor multi-game em breve"}
          </p>
        </div>
      </div>
    </CardShell>
  );
}

const MONTH_LABELS_PT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

function formatMemberSince(iso: string | null): {
  duration: string;
  joinedAt: string;
} {
  if (!iso) return { duration: "—", joinedAt: "data desconhecida" };
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return { duration: "—", joinedAt: "data desconhecida" };
  }
  const now = new Date();
  let months =
    (now.getFullYear() - date.getFullYear()) * 12 +
    (now.getMonth() - date.getMonth());
  if (now.getDate() < date.getDate()) months -= 1;
  if (months < 0) months = 0;

  let duration: string;
  if (months < 1) duration = "Recém chegou";
  else if (months < 12) duration = `${months} ${months === 1 ? "mês" : "meses"}`;
  else {
    const years = Math.floor(months / 12);
    const rest = months % 12;
    duration =
      rest === 0
        ? `${years} ${years === 1 ? "ano" : "anos"}`
        : `${years}a ${rest}m`;
  }

  const joinedAt = `${MONTH_LABELS_PT[date.getMonth()]}/${date.getFullYear()}`;
  return { duration, joinedAt };
}

function MemberSinceModuleCard({ memberSince }: { memberSince: string | null }) {
  const { duration, joinedAt } = formatMemberSince(memberSince);
  return (
    <CardShell>
      <div className="flex h-full w-full flex-col justify-between">
        <Eyebrow>Tempo de casa</Eyebrow>
        <div>
          <p className="text-[24px] font-bold leading-none tracking-[-0.04em] text-[#0f0f0f]">
            {duration}
          </p>
          <p className="mt-[6px] text-[11px] font-medium tracking-[-0.02em] text-[#8d8d8d]">
            entrou em {joinedAt}
          </p>
        </div>
      </div>
    </CardShell>
  );
}

function ShowcaseModuleCard({
  items,
}: {
  items: { label: string; src: string | null }[];
}) {
  const slots = items.slice(0, 3);
  while (slots.length < 3) slots.push({ label: "—", src: null });
  return (
    <CardShell>
      <div className="flex h-full w-full flex-col">
        <Eyebrow>Vitrine</Eyebrow>
        <div className="mt-auto flex items-end justify-between gap-[8px]">
          {slots.map((slot, idx) => (
            <div
              key={`${slot.label}-${idx}`}
              className="min-w-0 flex-1 text-center"
            >
              <div className="relative mx-auto h-[44px] w-[44px] overflow-hidden rounded-[10px] bg-[#f4f0ed] ring-1 ring-[#efe6e2]">
                {slot.src ? (
                  <Image
                    src={slot.src}
                    alt={slot.label}
                    fill
                    className="object-cover"
                    sizes="44px"
                    unoptimized
                  />
                ) : null}
              </div>
              <p className="mt-[6px] truncate text-[10px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
                {slot.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  );
}

export type ProfileModuleData = {
  hasRiotId: boolean;
  isOwnProfile: boolean;
  riotId: string;
  targetUserId: number | null;
  primaryLane: "TOP" | "JG" | "MID" | "ADC" | "SUP" | null;
  secondaryLane: "TOP" | "JG" | "MID" | "ADC" | "SUP" | null;
  badernaRank: number;
  fallbackRankEyebrow: string;
  fallbackRankValue: string;
  fallbackRankFrameSrc: string;
  fallbackFeaturedEyebrow: string;
  fallbackFeaturedValue: string;
  fallbackFeaturedSrc?: string;
  favoriteChampionSlugs: string[];
  communityHighlight: string | null;
  duoSlug: string | null;
  duoFullName: string | null;
  duoName: string | null;
  duoAvatarSrc: string | null;
  duoStyleId: string | null;
  favoriteGameTitle: string | null;
  favoriteGameCoverUrl: string | null;
  memberSince: string | null;
  unlockedBanners: number;
  unlockedTitles: number;
  unlockedNames: number;
  totalBanners: number;
  totalTitles: number;
  totalNames: number;
  postsCount: number;
  authoredCommentsCount: number;
  profileCommentsCount: number;
  showcaseItems: { label: string; src: string | null }[];
};

export function ProfileModuleCard({
  moduleId,
  data,
}: {
  moduleId: ProfileModuleId;
  data: ProfileModuleData;
}) {
  const locked = !data.hasRiotId && LOL_LOCKED_MODULE_IDS.has(moduleId);

  switch (moduleId) {
    case "lane-selector":
      return (
        <LockedWrapper locked={locked}>
          <PanelLaneSelectorCard
            primaryLane={data.primaryLane}
            secondaryLane={data.secondaryLane}
            targetUserId={data.targetUserId}
            readonly={locked}
          />
        </LockedWrapper>
      );

    case "baderna-rank": {
      const value = `#${String(Math.max(data.badernaRank, 1)).padStart(2, "0")}`;
      return (
        <PanelStatCard
          eyebrow="Rank da Baderna"
          value={value}
          tone="rank-baderna"
        />
      );
    }

    case "lol-rank":
      return (
        <LockedWrapper locked={locked}>
          <LiveRankCard
            riotId={data.riotId}
            fallbackEyebrow={data.fallbackRankEyebrow}
            fallbackValue={data.fallbackRankValue}
            fallbackFrameSrc={data.fallbackRankFrameSrc}
          />
        </LockedWrapper>
      );

    case "featured-champion":
      return (
        <LockedWrapper locked={locked}>
          <LiveFeaturedChampionCard
            riotId={data.riotId}
            fallbackEyebrow={data.fallbackFeaturedEyebrow}
            fallbackValue={data.fallbackFeaturedValue}
            fallbackSrc={data.fallbackFeaturedSrc}
          />
        </LockedWrapper>
      );

    case "top-champions":
      return (
        <LockedWrapper locked={locked}>
          <TopChampionsModuleCard
            favoriteChampionSlugs={data.favoriteChampionSlugs}
          />
        </LockedWrapper>
      );

    case "collection":
      return (
        <CollectionModuleCard
          unlockedBanners={data.unlockedBanners}
          unlockedTitles={data.unlockedTitles}
          unlockedNames={data.unlockedNames}
          totalBanners={data.totalBanners}
          totalTitles={data.totalTitles}
          totalNames={data.totalNames}
        />
      );

    case "participation":
      return (
        <ParticipationModuleCard
          postsCount={data.postsCount}
          authoredCommentsCount={data.authoredCommentsCount}
          profileCommentsCount={data.profileCommentsCount}
        />
      );

    case "duo":
      return (
        <DuoModuleCard
          duoSlug={data.duoSlug}
          duoFullName={data.duoFullName}
          duoName={data.duoName}
          duoAvatarSrc={data.duoAvatarSrc}
          duoStyleId={data.duoStyleId}
        />
      );

    case "community-highlight":
      return (
        <CommunityHighlightModuleCard highlight={data.communityHighlight} />
      );

    case "favorite-game":
      return (
        <FavoriteGameModuleCard
          title={data.favoriteGameTitle}
          coverUrl={data.favoriteGameCoverUrl}
        />
      );

    case "member-since":
      return <MemberSinceModuleCard memberSince={data.memberSince} />;

    case "showcase":
      return <ShowcaseModuleCard items={data.showcaseItems} />;

    default:
      return null;
  }
}

export const ALL_CONFIGURABLE_MODULE_IDS: ProfileModuleId[] = [
  "lol-rank",
  "featured-champion",
  "top-champions",
  "collection",
  "participation",
  "duo",
  "community-highlight",
  "favorite-game",
  "member-since",
  "showcase",
];

const LOL_DEFAULT_ORDER: ProfileModuleId[] = [
  "lol-rank",
  "featured-champion",
  "top-champions",
  "collection",
  "participation",
  "duo",
  "community-highlight",
  "favorite-game",
  "member-since",
  "showcase",
];

const NO_LOL_DEFAULT_ORDER: ProfileModuleId[] = [
  "member-since",
  "showcase",
  "community-highlight",
  "collection",
  "participation",
  "duo",
  "favorite-game",
  "lol-rank",
  "featured-champion",
  "top-champions",
];

export function resolveTopSlots({
  profileModuleOrder,
  hasRiotId,
}: {
  profileModuleOrder: string[] | null | undefined;
  hasRiotId: boolean;
}): ProfileModuleId[] {
  const slotCount = hasRiotId ? 2 : 3;
  const defaultOrder = hasRiotId ? LOL_DEFAULT_ORDER : NO_LOL_DEFAULT_ORDER;

  const preferred = (profileModuleOrder ?? []).filter((id): id is ProfileModuleId =>
    ALL_CONFIGURABLE_MODULE_IDS.includes(id as ProfileModuleId),
  );
  const merged = [...preferred, ...defaultOrder].filter(
    (id, idx, list) => list.indexOf(id) === idx,
  );
  return merged.slice(0, slotCount);
}
