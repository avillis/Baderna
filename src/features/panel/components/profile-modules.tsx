"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { NAME_BY_ID } from "@/features/panel/names-data";
import { LiveFeaturedChampionCard } from "@/features/panel/components/live-featured-champion-card";
import { LiveRankCard } from "@/features/panel/components/live-rank-card";
import { PanelLaneSelectorCard } from "@/features/panel/components/panel-lane-selector-card";
import { PanelStatCard } from "@/features/panel/components/panel-stat-card";

/**
 * Catálogo de módulos do topo do perfil. Os IDs viram chave no
 * `profile_module_order` (json) salvo no user.
 *
 * Bloco lol (entra em estado "trancado" sem Riot ID):
 *   - lane-selector       — slot 0, sempre fixo pra quem joga lol
 *   - lol-rank
 *   - featured-champion
 *
 * Bloco Baderna (sempre fixo na pos 2, não removível):
 *   - baderna-rank
 *
 * Bloco modular (livre escolha do user via seletor):
 *   - collection           — Coleção (banners/títulos/estilos)
 *   - participation        — Posts + comentários
 *   - top-champions        — Top 3 champs favoritos (lol — bloqueia sem Riot ID)
 *   - duo                  — Amizade/duo em destaque
 *   - community-highlight  — Badge entregue pelo admin
 *   - favorite-game        — Jogo favorito (multi-game)
 *   - member-since         — Tempo de casa
 *   - showcase             — Vitrine (3 itens em destaque)
 */
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

function StatLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
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

/** Overlay aplicado em módulos lol quando o user não tem Riot ID. */
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

// ─── Módulos individuais ──────────────────────────────────────────────────

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
      <div className="flex h-full w-full flex-col justify-center gap-[10px]">
        <StatLine label="Capas" value={`${unlockedBanners}/${totalBanners}`} />
        <StatLine label="Títulos" value={`${unlockedTitles}/${totalTitles}`} />
        <StatLine label="Estilos" value={`${unlockedNames}/${totalNames}`} />
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
      <div className="flex h-full w-full flex-col justify-center gap-[10px]">
        <StatLine label="Posts" value={String(postsCount)} />
        <StatLine label="Comentários" value={String(authoredCommentsCount)} />
        <StatLine label="Mural" value={String(profileCommentsCount)} />
      </div>
    </CardShell>
  );
}

function TopChampionsModuleCard({
  favoriteChampionSlugs,
  onEdit,
}: {
  favoriteChampionSlugs: string[];
  onEdit?: () => void;
}) {
  const champs = favoriteChampionSlugs.filter(Boolean).slice(0, 3);
  const editableClass = onEdit ? "cursor-pointer transition-opacity hover:opacity-90 active:opacity-75" : "";
  return (
    <article
      className={`relative flex ${CARD_HEIGHT_CLASS} overflow-hidden rounded-[var(--panel-radius-card)] bg-white px-[22px] py-[18px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)] ${editableClass}`}
      onClick={onEdit}
      role={onEdit ? "button" : undefined}
      tabIndex={onEdit ? 0 : undefined}
      onKeyDown={onEdit ? (e) => e.key === "Enter" && onEdit() : undefined}
    >
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
            <div>
              <p className={`text-[18px] font-bold leading-[1.05] tracking-[-0.04em] text-[#c0c0c0]`}>
                Escolher champs…
              </p>
              {onEdit && (
                <p className="mt-[6px] text-[11px] font-medium tracking-[-0.02em] text-[#c0c0c0]">
                  Clique para escolher
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function DuoModuleCard({
  duoName,
  duoFullName,
  duoAvatarSrc,
  duoSlug,
  duoStyleId,
}: {
  duoName: string | null;
  duoFullName: string | null;
  duoAvatarSrc: string | null;
  duoSlug: string | null;
  duoStyleId: string | null;
}) {
  const nameColor = duoStyleId
    ? (NAME_BY_ID[duoStyleId]?.color ?? "#0f0f0f")
    : "#0f0f0f";

  if (!duoSlug) {
    // Estado vazio
    return (
      <CardShell>
        <div className="flex h-full w-full items-center gap-[14px]">
          <div className="h-[52px] w-[52px] shrink-0 rounded-full bg-[#f0f0f0]" />
          <p className="text-[13px] font-semibold tracking-[-0.02em] text-[#c0c0c0]">
            Sem duo escolhido
          </p>
        </div>
      </CardShell>
    );
  }

  return (
    <article
      className={`relative flex h-[122px] overflow-hidden rounded-[var(--panel-radius-card)] bg-white shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]`}
    >
      <Link
        href={`/membro/${duoSlug}`}
        className="flex h-full w-full items-center gap-[14px] px-[22px] py-[18px] transition-opacity hover:opacity-75"
      >
        {/* Avatar */}
        <div className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-full bg-[#f4f0ed]">
          {duoAvatarSrc && (
            <Image
              src={duoAvatarSrc}
              alt={duoName ?? ""}
              fill
              className="object-cover"
              sizes="52px"
              unoptimized
            />
          )}
        </div>

        {/* Texto */}
        <div className="min-w-0">
          {/* Nickname estilizado */}
          <p
            className="truncate text-[14px] font-bold leading-[1.15] tracking-[-0.03em]"
            style={{ color: nameColor }}
          >
            {duoName ?? duoFullName ?? "—"}
          </p>
          {/* Nome real abaixo, sempre que existir */}
          {duoFullName && (
            <p className="mt-[3px] truncate text-[11px] font-medium tracking-[-0.02em] text-[#8d8d8d]">
              {duoFullName}
            </p>
          )}
        </div>
      </Link>
    </article>
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

function GameEditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="absolute right-[10px] top-[10px] z-20 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-[4px] transition-colors hover:bg-black/65"
      title="Editar jogo favorito"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-[12px] w-[12px]"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2.87601 18.1156C2.92195 17.7021 2.94493 17.4954 3.00748 17.3022C3.06298 17.1307 3.1414 16.9676 3.24061 16.8171C3.35242 16.6475 3.49952 16.5005 3.7937 16.2063L17 3C18.1046 1.89543 19.8954 1.89543 21 3C22.1046 4.10457 22.1046 5.89543 21 7L7.7937 20.2063C7.49951 20.5005 7.35242 20.6475 7.18286 20.7594C7.03242 20.8586 6.86926 20.937 6.69782 20.9925C6.50457 21.055 6.29783 21.078 5.88434 21.124L2.49997 21.5L2.87601 18.1156Z" />
      </svg>
    </button>
  );
}

function FavoriteGameModuleCard({
  title,
  coverUrl,
  onEdit,
}: {
  title: string | null;
  coverUrl: string | null;
  onEdit?: () => void;
}) {
  const editableClass = onEdit ? "cursor-pointer transition-opacity hover:opacity-90 active:opacity-75" : "";

  if (coverUrl) {
    return (
      <article
        className={`relative ${CARD_HEIGHT_CLASS} overflow-hidden rounded-[var(--panel-radius-card)] bg-black shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)] ${editableClass}`}
        onClick={onEdit}
        role={onEdit ? "button" : undefined}
        tabIndex={onEdit ? 0 : undefined}
        onKeyDown={onEdit ? (e) => e.key === "Enter" && onEdit() : undefined}
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
    <article
      className={`relative flex ${CARD_HEIGHT_CLASS} overflow-hidden rounded-[var(--panel-radius-card)] bg-white px-[22px] py-[18px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)] ${editableClass}`}
      onClick={onEdit}
      role={onEdit ? "button" : undefined}
      tabIndex={onEdit ? 0 : undefined}
      onKeyDown={onEdit ? (e) => e.key === "Enter" && onEdit() : undefined}
    >
      <div className="flex h-full w-full flex-col justify-between">
        <Eyebrow>Jogo favorito</Eyebrow>
        <div>
          <p
            className={`text-[18px] font-bold leading-[1.05] tracking-[-0.04em] ${title ? "text-[#0f0f0f]" : "text-[#c0c0c0]"}`}
          >
            {title ?? "Escolher jogo…"}
          </p>
          {!title && (
            <p className="mt-[6px] text-[11px] font-medium tracking-[-0.02em] text-[#c0c0c0]">
              Clique para buscar
            </p>
          )}
        </div>
      </div>
    </article>
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

// ─── Public renderer ──────────────────────────────────────────────────────

export type ProfileModuleData = {
  hasRiotId: boolean;
  /** Próprio user editando o perfil — habilita interatividade do lane selector. */
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
  onUpdateFavoriteChampions: ((champions: string[]) => void) | null;
  communityHighlight: string | null;
  duoSlug: string | null;
  duoFullName: string | null;
  duoName: string | null;
  duoAvatarSrc: string | null;
  duoStyleId: string | null;
  favoriteGameTitle: string | null;
  favoriteGameCoverUrl: string | null;
  /** Abre o modal de busca RAWG (só no próprio perfil). */
  onEditFavoriteGame?: () => void;
  /** Abre o modal de seleção de campeões favoritos (só no próprio perfil). */
  onEditTopChampions?: () => void;
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
            onEdit={data.onEditTopChampions}
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
          duoName={data.duoName}
          duoFullName={data.duoFullName}
          duoAvatarSrc={data.duoAvatarSrc}
          duoSlug={data.duoSlug}
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
          onEdit={data.onEditFavoriteGame}
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

/**
 * Layout de slots da grid de topo. Posições:
 *   slot 0 — lane-selector (fixo pra lol, tranca/placeholder sem Riot ID)
 *   slot 1 — baderna-rank (fixo sempre)
 *   slot 2 — primeiro módulo configurável (default: lol-rank)
 *   slot 3 — segundo módulo configurável (default: featured-champion)
 *
 * O `profileModuleOrder` salvo no user controla SOMENTE os slots 2+. Os
 * dois primeiros são imutáveis.
 */
/** Todos os IDs que o usuário pode colocar nos slots configuráveis. */
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

// Defaults separados por contexto lol.
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
  "collection",
  "participation",
  "duo",
  "community-highlight",
  "favorite-game",
  "member-since",
  "showcase",
  "lol-rank",
  "featured-champion",
  "top-champions",
];

/**
 * Resolve os IDs dos slots CONFIGURÁVEIS do topo do perfil.
 *
 * Layout de slots completo:
 *   Slot 1 — lane-selector (FIXO para lol; config[0] para não-lol)
 *   Slot 2 — baderna-rank  (SEMPRE FIXO)
 *   Slot 3 — configurável
 *   Slot 4 — configurável
 *
 * lol:     2 configuráveis (slots 3–4)
 * Não-lol: 3 configuráveis (slots 1, 3, 4)
 */
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
