"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { useToast } from "@/components/toast";
import {
  CHAMPION_AVATAR_FILES,
  getChampionTileSrc,
} from "@/features/panel/champion-avatar";
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
          src="/riot_logo.svg"
          alt="Riot Games"
          width={20}
          height={20}
          className="opacity-70"
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
  onSave,
}: {
  favoriteChampionSlugs: string[];
  onSave: ((champions: string[]) => Promise<boolean> | boolean) | null;
}) {
  const toast = useToast();
  const canEdit = Boolean(onSave);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<string[]>(
    favoriteChampionSlugs.filter(Boolean).slice(0, 3),
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(favoriteChampionSlugs.filter(Boolean).slice(0, 3));
  }, [favoriteChampionSlugs]);

  const champs = selected;
  const championOptions = useMemo(
    () =>
      CHAMPION_AVATAR_FILES.map((file) => file.replace(/_0\.jpg$/i, "")).sort(
        (a, b) => a.localeCompare(b),
      ),
    [],
  );

  function toggleChampion(champion: string) {
    setSelected((prev) => {
      if (prev.includes(champion)) return prev.filter((item) => item !== champion);
      if (prev.length >= 3) return [...prev.slice(1), champion];
      return [...prev, champion];
    });
  }

  async function handleSave() {
    if (!onSave) return;
    setSaving(true);
    try {
      const ok = await onSave(selected);
      if (!ok) {
        toast.show("Não foi possível salvar seus mains.");
        return;
      }
      toast.show("Mains salvos.", "success");
      setOpen(false);
    } catch {
      toast.show("Não foi possível salvar seus mains.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <CardShell>
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => {
            if (canEdit) setOpen(true);
          }}
          className={`flex h-full w-full flex-col text-left ${canEdit ? "cursor-pointer" : "cursor-default"}`}
        >
          <Eyebrow>Mains</Eyebrow>
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
                {canEdit
                  ? "Clique para escolher 3 mains"
                  : "Sem mains escolhidos"}
              </p>
            )}
          </div>
        </button>
      </CardShell>

      {typeof document !== "undefined" && open
        ? createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/38 px-4 py-6 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
            >
              <div
                className="relative flex max-h-[86vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0px_30px_90px_rgba(0,0,0,0.18)]"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="absolute right-[20px] top-[20px] z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#ff4100] text-white transition-opacity hover:opacity-85"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-[16px] w-[16px]"
                    stroke="currentColor"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
                <div className="border-b border-[#ededed] px-[28px] pt-[28px] pb-[16px]">
                  <h2 className="text-[22px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
                    Escolher mains
                  </h2>
                  <p className="mt-[8px] text-[13px] text-[#8d8d8d]">
                    Escolha até 3 campeões para destacar no perfil.
                  </p>
                </div>
                <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-4 items-start gap-[16px] overflow-y-auto p-[24px] sm:grid-cols-5 md:grid-cols-6">
                  {championOptions.map((champion) => {
                    const selectedChampion = selected.includes(champion);
                    return (
                      <button
                        key={champion}
                        type="button"
                        onClick={() => toggleChampion(champion)}
                        className="group text-center"
                      >
                        <div
                          className={`relative mx-auto h-[62px] w-[62px] overflow-hidden rounded-full ring-2 transition-all ${
                            selectedChampion
                              ? "ring-[#ff4100]"
                              : "ring-transparent group-hover:ring-[#ff4100]/35"
                          }`}
                        >
                          <Image
                            src={getChampionTileSrc(`${champion}_0.jpg`)}
                            alt={champion}
                            fill
                            className="object-cover"
                            sizes="62px"
                            unoptimized
                          />
                        </div>
                        <p className="mt-[8px] truncate text-[11px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
                          {champion}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between border-t border-[#f0f0f0] px-[24px] py-[18px]">
                  <p className="text-[11px] font-medium text-[#8d8d8d]">
                    {selected.length}/3 selecionados
                  </p>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex h-[40px] items-center justify-center gap-[8px] rounded-[12px] bg-[#0f0f0f] px-[20px] text-[13px] font-bold tracking-[-0.02em] text-white hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <svg
                          className="capas-spinner h-[16px] w-[16px] [&_circle]:stroke-white"
                          viewBox="25 25 50 50"
                        >
                          <circle r="20" cy="50" cx="50" />
                        </svg>
                        Salvando...
                      </>
                    ) : (
                      "Salvar"
                    )}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
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
  onSave,
}: {
  title: string | null;
  coverUrl: string | null;
  onSave: ((title: string | null) => Promise<boolean> | boolean) | null;
}) {
  const toast = useToast();
  const canEdit = Boolean(onSave);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(title ?? "");

  async function handleSave() {
    if (!onSave) return;
    setSaving(true);
    try {
      const nextTitle = draft.trim();
      const ok = await onSave(nextTitle.length > 0 ? nextTitle : null);
      if (!ok) {
        toast.show("NÃ£o foi possÃ­vel salvar seu jogo favorito.");
        return;
      }
      toast.show("Jogo favorito salvo.", "success");
      setOpen(false);
    } catch {
      toast.show("NÃ£o foi possÃ­vel salvar seu jogo favorito.");
    } finally {
      setSaving(false);
    }
  }

  if (coverUrl) {
    return (
      <>
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => {
            if (canEdit) {
              setDraft(title ?? "");
              setOpen(true);
            }
          }}
          className={`relative block ${CARD_HEIGHT_CLASS} w-full overflow-hidden rounded-[var(--panel-radius-card)] bg-black text-left shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)] ${canEdit ? "cursor-pointer" : "cursor-default"}`}
        >
          <Image
            src={coverUrl}
            alt={title ?? "Jogo favorito"}
            fill
            className="object-cover"
            sizes="(min-width: 1536px) 237px, (min-width: 1280px) 25vw, 100vw"
            unoptimized
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.80)_0%,rgba(0,0,0,0.24)_55%,rgba(0,0,0,0.10)_100%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between p-[22px]">
            <div className="flex items-start justify-between gap-[12px]">
              <p className="text-[10px] font-bold tracking-[-0.03em] text-white/78">
                Jogo favorito
              </p>
              {canEdit ? (
                <span className="rounded-full bg-white/18 px-[8px] py-[4px] text-[10px] font-bold tracking-[-0.02em] text-white backdrop-blur-[2px]">
                  editar
                </span>
              ) : null}
            </div>
            <div>
              <p className="line-clamp-2 max-w-[72%] text-[22px] font-bold leading-[1.02] tracking-[-0.05em] text-white">
                {title}
              </p>
              <p className="mt-[6px] text-[11px] font-medium tracking-[-0.02em] text-white/72">
                capa puxada automaticamente
              </p>
            </div>
          </div>
        </button>

        {typeof document !== "undefined" && open
          ? createPortal(
              <div
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/38 px-4 py-6 backdrop-blur-[2px]"
                onClick={() => setOpen(false)}
              >
                <div
                  className="relative flex w-full max-w-[460px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0px_30px_90px_rgba(0,0,0,0.18)]"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="absolute right-[20px] top-[20px] z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#ff4100] text-white transition-opacity hover:opacity-85"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-[16px] w-[16px]"
                      stroke="currentColor"
                      strokeWidth={2.4}
                      strokeLinecap="round"
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="border-b border-[#ededed] px-[28px] pt-[28px] pb-[16px]">
                    <h2 className="text-[22px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
                      Jogo favorito
                    </h2>
                    <p className="mt-[8px] text-[13px] text-[#8d8d8d]">
                      Defina o nome agora. A capa automÃ¡tica entra depois com a API.
                    </p>
                  </div>
                  <div className="px-[24px] py-[22px]">
                    <label className="block text-[12px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
                      Nome do jogo
                    </label>
                    <input
                      type="text"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Ex.: League of Legends, Valorant, Hades..."
                      className="mt-[10px] h-[48px] w-full rounded-[14px] border border-[#ededed] bg-[#fafafa] px-[14px] text-[14px] font-medium tracking-[-0.02em] text-[#0f0f0f] outline-none transition-colors placeholder:text-[#a6a6a6] focus:border-[#ff4100]"
                    />
                  </div>
                  <div className="flex items-center justify-between border-t border-[#f0f0f0] px-[24px] py-[18px]">
                    <p className="text-[11px] font-medium text-[#8d8d8d]">
                      vocÃª pode trocar isso quando quiser
                    </p>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex h-[40px] items-center justify-center gap-[8px] rounded-[12px] bg-[#0f0f0f] px-[20px] text-[13px] font-bold tracking-[-0.02em] text-white hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? (
                        <>
                          <svg
                            className="capas-spinner h-[16px] w-[16px] [&_circle]:stroke-white"
                            viewBox="25 25 50 50"
                          >
                            <circle r="20" cy="50" cx="50" />
                          </svg>
                          Salvando...
                        </>
                      ) : (
                        "Salvar"
                      )}
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )
          : null}
      </>
    );
  }
  return (
    <>
      <CardShell>
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => {
            if (canEdit) {
              setDraft(title ?? "");
              setOpen(true);
            }
          }}
          className={`flex h-full w-full text-left ${canEdit ? "cursor-pointer" : "cursor-default"}`}
        >
          <div className="flex h-full w-full items-center gap-[14px]">
            <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#f6f0ed_0%,#ededed_100%)] ring-1 ring-[#eee3de]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-[24px] w-[24px] text-[#0f0f0f]"
                stroke="currentColor"
                strokeWidth={1.9}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 4h9l3 3v13H6z" />
                <path d="M15 4v3h3" />
                <path d="M9 12h6M9 16h4" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <Eyebrow>Jogo favorito</Eyebrow>
              <p className="mt-[10px] line-clamp-2 text-[18px] font-bold leading-[1.02] tracking-[-0.04em] text-[#0f0f0f]">
                {title ?? "Defina seu jogo favorito"}
              </p>
              <p className="mt-[6px] text-[11px] font-medium tracking-[-0.02em] text-[#8d8d8d]">
                {title
                  ? "a capa automÃ¡tica entra na prÃ³xima etapa"
                  : canEdit
                    ? "clique para escolher o nome do jogo"
                    : "mÃ³dulo multi-game"}
              </p>
            </div>
          </div>
        </button>
      </CardShell>

      {typeof document !== "undefined" && open
        ? createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/38 px-4 py-6 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
            >
              <div
                className="relative flex w-full max-w-[460px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0px_30px_90px_rgba(0,0,0,0.18)]"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="absolute right-[20px] top-[20px] z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#ff4100] text-white transition-opacity hover:opacity-85"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-[16px] w-[16px]"
                    stroke="currentColor"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
                <div className="border-b border-[#ededed] px-[28px] pt-[28px] pb-[16px]">
                  <h2 className="text-[22px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
                    Jogo favorito
                  </h2>
                  <p className="mt-[8px] text-[13px] text-[#8d8d8d]">
                    Defina o nome agora. A capa automÃ¡tica entra depois com a API.
                  </p>
                </div>
                <div className="px-[24px] py-[22px]">
                  <label className="block text-[12px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
                    Nome do jogo
                  </label>
                  <input
                    type="text"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Ex.: League of Legends, Valorant, Hades..."
                    className="mt-[10px] h-[48px] w-full rounded-[14px] border border-[#ededed] bg-[#fafafa] px-[14px] text-[14px] font-medium tracking-[-0.02em] text-[#0f0f0f] outline-none transition-colors placeholder:text-[#a6a6a6] focus:border-[#ff4100]"
                  />
                </div>
                <div className="flex items-center justify-between border-t border-[#f0f0f0] px-[24px] py-[18px]">
                  <p className="text-[11px] font-medium text-[#8d8d8d]">
                    vocÃª pode trocar isso quando quiser
                  </p>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex h-[40px] items-center justify-center gap-[8px] rounded-[12px] bg-[#0f0f0f] px-[20px] text-[13px] font-bold tracking-[-0.02em] text-white hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <svg
                          className="capas-spinner h-[16px] w-[16px] [&_circle]:stroke-white"
                          viewBox="25 25 50 50"
                        >
                          <circle r="20" cy="50" cx="50" />
                        </svg>
                        Salvando...
                      </>
                    ) : (
                      "Salvar"
                    )}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
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
  onUpdateFavoriteChampions: ((champions: string[]) => Promise<boolean> | boolean) | null;
  communityHighlight: string | null;
  duoSlug: string | null;
  duoFullName: string | null;
  duoName: string | null;
  duoAvatarSrc: string | null;
  duoStyleId: string | null;
  favoriteGameTitle: string | null;
  favoriteGameCoverUrl: string | null;
  onUpdateFavoriteGameTitle: ((title: string | null) => Promise<boolean> | boolean) | null;
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
            onSave={data.onUpdateFavoriteChampions}
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
          onSave={data.onUpdateFavoriteGameTitle}
        />
      );

    case "member-since":
      return <MemberSinceModuleCard memberSince={data.memberSince} />;

    case "showcase":
      return (
        <TopChampionsModuleCard
          favoriteChampionSlugs={data.favoriteChampionSlugs}
          onSave={data.onUpdateFavoriteChampions}
        />
      );

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
];

const NO_LOL_DEFAULT_ORDER: ProfileModuleId[] = [
  "member-since",
  "favorite-game",
  "community-highlight",
  "collection",
  "participation",
  "duo",
  "top-champions",
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

  const preferred = (profileModuleOrder ?? [])
    .map((id) => (id === "showcase" ? "top-champions" : id))
    .filter((id): id is ProfileModuleId =>
      ALL_CONFIGURABLE_MODULE_IDS.includes(id as ProfileModuleId),
    );
  const merged = [...preferred, ...defaultOrder].filter(
    (id, idx, list) => list.indexOf(id) === idx,
  );
  return merged.slice(0, slotCount);
}
