"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import { PanelStatCard } from "@/features/panel/components/panel-stat-card";
import { useRiotProfile } from "@/features/panel/use-riot-profile";

export type ProfileTopModuleId =
  | "lol-rank"
  | "top-champions"
  | "collection"
  | "participation"
  | "community-highlight"
  | "duo"
  | "favorite-game";

const DEFAULT_MODULE_ORDER: ProfileTopModuleId[] = [
  "lol-rank",
  "top-champions",
  "collection",
  "participation",
  "community-highlight",
  "duo",
  "favorite-game",
];

function cardShell(children: ReactNode) {
  return (
    <article className="relative flex h-[122px] overflow-hidden rounded-[var(--panel-radius-card)] bg-white px-[22px] py-[18px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      {children}
    </article>
  );
}

function line(
  label: string,
  value: string,
  accent = "text-[#0f0f0f]",
) {
  return (
    <div className="flex items-center justify-between gap-[10px]">
      <span className="truncate text-[11px] font-semibold tracking-[-0.02em] text-[#8d8d8d]">
        {label}
      </span>
      <span
        className={`shrink-0 text-[11px] font-bold tracking-[-0.02em] ${accent}`}
      >
        {value}
      </span>
    </div>
  );
}

function CompactTextCard({
  eyebrow,
  title,
  description,
  titleClassName = "text-[#0f0f0f]",
}: {
  eyebrow: string;
  title: string;
  description: string;
  titleClassName?: string;
}) {
  return cardShell(
    <div className="flex h-full w-full flex-col justify-between">
      <p className="text-[10px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
        {eyebrow}
      </p>
      <div>
        <p
          className={`line-clamp-2 text-[20px] font-bold leading-[1.05] tracking-[-0.04em] ${titleClassName}`}
        >
          {title}
        </p>
        <p className="mt-[8px] line-clamp-2 text-[11px] font-medium leading-[1.35] tracking-[-0.02em] text-[#8d8d8d]">
          {description}
        </p>
      </div>
    </div>,
  );
}

function CollectionModuleCard({
  unlockedTitlesCount,
  unlockedBannersCount,
  unlockedNamesCount,
  totalTitles,
  totalBanners,
  totalNames,
}: {
  unlockedTitlesCount: number;
  unlockedBannersCount: number;
  unlockedNamesCount: number;
  totalTitles: number;
  totalBanners: number;
  totalNames: number;
}) {
  return cardShell(
    <div className="flex h-full w-full flex-col">
      <p className="text-[10px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
        Colecao
      </p>
      <div className="mt-auto space-y-[8px]">
        {line("Capas", `${unlockedBannersCount}/${totalBanners}`)}
        {line("Titulos", `${unlockedTitlesCount}/${totalTitles}`)}
        {line("Estilos", `${unlockedNamesCount}/${totalNames}`)}
      </div>
    </div>,
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
  const total = postsCount + authoredCommentsCount + profileCommentsCount;

  return cardShell(
    <div className="flex h-full w-full flex-col justify-between">
      <div>
        <p className="text-[10px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
          Participacao
        </p>
        <p className="mt-[8px] text-[28px] font-bold leading-none tracking-[-0.03em] text-[#0f0f0f]">
          {total}
        </p>
      </div>
      <div className="space-y-[6px]">
        {line("Posts", String(postsCount))}
        {line("Comentarios", String(authoredCommentsCount))}
        {line("Mural", String(profileCommentsCount))}
      </div>
    </div>,
  );
}

function TopChampionsModuleCard({
  riotId,
  favoriteChampionSlugs,
}: {
  riotId?: string;
  favoriteChampionSlugs?: string[];
}) {
  const state = useRiotProfile(riotId || null);
  const manual = (favoriteChampionSlugs ?? []).filter(Boolean).slice(0, 3);
  const live =
    state.status === "ready"
      ? state.profile.masteries
          .slice(0, 3)
          .map((mastery) => mastery.championName)
          .filter(Boolean)
      : [];
  const champions = (manual.length > 0 ? manual : live).slice(0, 3);

  return cardShell(
    <div className="flex h-full w-full flex-col">
      <p className="text-[10px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
        Top 3 favoritos
      </p>
      <div className="mt-auto flex items-end justify-between gap-[10px]">
        {champions.length > 0 ? (
          champions.map((champion) => (
            <div key={champion} className="min-w-0 flex-1 text-center">
              <div className="relative mx-auto h-[46px] w-[46px] overflow-hidden rounded-full bg-[#f4f0ed] ring-1 ring-[#efe6e2]">
                <Image
                  src={`/api/champion-tile/${champion}_0.jpg`}
                  alt={champion ?? ""}
                  fill
                  className="object-cover"
                  sizes="46px"
                  unoptimized
                />
              </div>
              <p className="mt-[8px] truncate text-[10px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
                {champion}
              </p>
            </div>
          ))
        ) : (
          <div className="w-full rounded-[14px] bg-[#f6f2ef] px-[14px] py-[12px] text-left text-[11px] font-medium leading-[1.35] tracking-[-0.02em] text-[#8d8d8d]">
            Defina seus 3 champs favoritos quando esse modulo ganhar editor.
          </div>
        )}
      </div>
    </div>,
  );
}

function CommunityHighlightModuleCard({
  highlight,
}: {
  highlight?: string | null;
}) {
  return (
    <CompactTextCard
      eyebrow="Destaque"
      title={highlight || "Sem destaque"}
      description={
        highlight
          ? "Destaque entregue pela administracao da Baderna."
          : "Quando um admin destacar esse perfil, ele aparece aqui."
      }
      titleClassName={highlight ? "text-[#ff4100]" : "text-[#0f0f0f]"}
    />
  );
}

function DuoModuleCard({ duoLabel }: { duoLabel?: string | null }) {
  return (
    <CompactTextCard
      eyebrow="Amizades / Duo"
      title={duoLabel || "Sem duo"}
      description={
        duoLabel
          ? "Parceria em destaque neste perfil."
          : "Espaco reservado para destacar a dupla favorita."
      }
    />
  );
}

function FavoriteGameModuleCard({
  title,
  coverUrl,
}: {
  title?: string | null;
  coverUrl?: string | null;
}) {
  return cardShell(
    <>
      {coverUrl ? (
        <>
          <Image
            src={coverUrl}
            alt={title || "Jogo favorito"}
            fill
            className="object-cover"
            sizes="(min-width: 1280px) 18vw, 100vw"
            unoptimized
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.16)_100%)]" />
          <div className="relative z-10 mt-auto">
            <p className="text-[10px] font-bold tracking-[-0.03em] text-white/80">
              Jogo favorito
            </p>
            <p className="mt-[8px] line-clamp-2 text-[22px] font-bold leading-[1.05] tracking-[-0.04em] text-white">
              {title}
            </p>
          </div>
        </>
      ) : (
        <div className="flex h-full w-full flex-col justify-between">
          <p className="text-[10px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
            Jogo favorito
          </p>
          <div>
            <p className="text-[20px] font-bold leading-[1.05] tracking-[-0.04em] text-[#0f0f0f]">
              {title || "Em breve"}
            </p>
            <p className="mt-[8px] text-[11px] font-medium leading-[1.35] tracking-[-0.02em] text-[#8d8d8d]">
              Vamos plugar a busca automatica da capa depois.
            </p>
          </div>
        </div>
      )}
    </>,
  );
}

export function resolveTopModules({
  hasRiotId,
  profileModuleOrder,
  slotCount,
}: {
  hasRiotId: boolean;
  profileModuleOrder?: string[] | null;
  slotCount: number;
}): ProfileTopModuleId[] {
  const preferred = (profileModuleOrder ?? [])
    .filter((moduleId): moduleId is ProfileTopModuleId =>
      DEFAULT_MODULE_ORDER.includes(moduleId as ProfileTopModuleId),
    );
  const merged = [...preferred, ...DEFAULT_MODULE_ORDER].filter(
    (moduleId, index, list) => list.indexOf(moduleId) === index,
  );

  const available = merged.filter((moduleId) => {
    if ((moduleId === "lol-rank" || moduleId === "top-champions") && !hasRiotId) {
      return false;
    }
    return true;
  });

  return available.slice(0, slotCount);
}

export function ProfileTopModuleCard({
  moduleId,
  riotId,
  favoriteChampionSlugs,
  favoriteGameTitle,
  favoriteGameCoverUrl,
  communityHighlight,
  duoLabel,
  unlockedTitlesCount,
  unlockedBannersCount,
  unlockedNamesCount,
  totalTitles,
  totalBanners,
  totalNames,
  postsCount,
  authoredCommentsCount,
  profileCommentsCount,
  fallbackLolRankEyebrow,
  fallbackLolRankValue,
  fallbackLolRankFrameSrc,
}: {
  moduleId: ProfileTopModuleId;
  riotId?: string;
  favoriteChampionSlugs?: string[];
  favoriteGameTitle?: string | null;
  favoriteGameCoverUrl?: string | null;
  communityHighlight?: string | null;
  duoLabel?: string | null;
  unlockedTitlesCount: number;
  unlockedBannersCount: number;
  unlockedNamesCount: number;
  totalTitles: number;
  totalBanners: number;
  totalNames: number;
  postsCount: number;
  authoredCommentsCount: number;
  profileCommentsCount: number;
  fallbackLolRankEyebrow: string;
  fallbackLolRankValue: string;
  fallbackLolRankFrameSrc?: string;
}) {
  switch (moduleId) {
    case "lol-rank":
      return (
        <LiveLolRankModuleCard
          riotId={riotId}
          fallbackEyebrow={fallbackLolRankEyebrow}
          fallbackValue={fallbackLolRankValue}
          fallbackFrameSrc={fallbackLolRankFrameSrc}
        />
      );
    case "top-champions":
      return (
        <TopChampionsModuleCard
          riotId={riotId}
          favoriteChampionSlugs={favoriteChampionSlugs}
        />
      );
    case "collection":
      return (
        <CollectionModuleCard
          unlockedTitlesCount={unlockedTitlesCount}
          unlockedBannersCount={unlockedBannersCount}
          unlockedNamesCount={unlockedNamesCount}
          totalTitles={totalTitles}
          totalBanners={totalBanners}
          totalNames={totalNames}
        />
      );
    case "participation":
      return (
        <ParticipationModuleCard
          postsCount={postsCount}
          authoredCommentsCount={authoredCommentsCount}
          profileCommentsCount={profileCommentsCount}
        />
      );
    case "community-highlight":
      return <CommunityHighlightModuleCard highlight={communityHighlight} />;
    case "duo":
      return <DuoModuleCard duoLabel={duoLabel} />;
    case "favorite-game":
      return (
        <FavoriteGameModuleCard
          title={favoriteGameTitle}
          coverUrl={favoriteGameCoverUrl}
        />
      );
    default:
      return null;
  }
}

function LiveLolRankModuleCard({
  riotId,
  fallbackEyebrow,
  fallbackValue,
  fallbackFrameSrc,
}: {
  riotId?: string;
  fallbackEyebrow: string;
  fallbackValue: string;
  fallbackFrameSrc?: string;
}) {
  const state = useRiotProfile(riotId || null);

  if (state.status === "ready") {
    const rank = state.profile.rank;
    const tier = rank.tier?.toUpperCase() ?? "";
    const tierLabels: Record<string, string> = {
      IRON: "Ferro",
      BRONZE: "Bronze",
      SILVER: "Prata",
      GOLD: "Ouro",
      PLATINUM: "Platina",
      EMERALD: "Esmeralda",
      DIAMOND: "Diamante",
      MASTER: "Mestre",
      GRANDMASTER: "Grao-mestre",
      CHALLENGER: "Desafiante",
    };
    const frameByTier: Record<string, string> = {
      IRON: "/images/ranks/iron.png",
      BRONZE: "/images/ranks/bronze.png",
      SILVER: "/images/ranks/silver.png",
      GOLD: "/images/ranks/gold.png",
      PLATINUM: "/images/ranks/platinum.png",
      EMERALD: "/images/ranks/platinum.png",
      DIAMOND: "/images/ranks/diamond.png",
      MASTER: "/images/ranks/master.png",
      GRANDMASTER: "/images/ranks/grandmaster.png",
      CHALLENGER: "/images/ranks/challenger.png",
    };
    const eyebrow = rank.tier && rank.tier !== "Unranked"
      ? `${tierLabels[tier] ?? rank.tier}${rank.division ? ` ${rank.division}` : ""}`
      : "Sem classificacao";
    const value =
      rank.tier && rank.tier !== "Unranked"
        ? `${rank.league_points} pdl`
        : "00 pdl";

    return (
      <PanelStatCard
        eyebrow={eyebrow}
        value={value}
        tone="rank"
        rankFrameSrc={frameByTier[tier] ?? fallbackFrameSrc}
      />
    );
  }

  return (
    <PanelStatCard
      eyebrow={fallbackEyebrow}
      value={fallbackValue}
      tone="rank"
      rankFrameSrc={fallbackFrameSrc}
      placeholder={state.status === "loading"}
    />
  );
}
