"use client";

import Image from "next/image";
import { ChevronDown, ChevronUp, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import {
  clampBannerFocusY,
  DEFAULT_BANNER_FOCUS_Y,
  PANEL_BANNER_CHANGE_EVENT,
  PANEL_BANNER_POSITION_STORAGE_KEY,
  PANEL_BANNER_STORAGE_KEY,
} from "@/features/panel/banner-selection";
import type { SplashGroup } from "@/features/panel/splash-catalog";
import { useAccount } from "@/features/panel/use-account";
import { useUnlockedBanners } from "@/features/panel/use-unlocked-banners";
import { useAuth } from "@/features/panel/use-auth";

type PanelBannerPickerProps = {
  splashGroups: SplashGroup[];
  defaultBannerFileName: string;
};

function getChampionFromFileName(fileName: string) {
  return fileName.replace(/_\d+\.(jpg|jpeg|png|webp)$/i, "");
}

function readStoredBannerPositions() {
  const rawPositions = window.localStorage.getItem(PANEL_BANNER_POSITION_STORAGE_KEY);

  if (!rawPositions) {
    return {} as Record<string, number>;
  }

  try {
    return JSON.parse(rawPositions) as Record<string, number>;
  } catch {
    return {} as Record<string, number>;
  }
}

export function PanelBannerPicker({
  splashGroups,
  defaultBannerFileName,
}: PanelBannerPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { updateField } = useAccount();
  const LOGGED_USER_ID = user ? String(user.id) : "__guest__";
  const { isUnlocked, unlocked } = useUnlockedBanners(LOGGED_USER_ID);
  const [selectedFileName, setSelectedFileName] = useState(defaultBannerFileName);

  const UNLOCKED_KEY = "__liberadas__";
  const [selectedChampion, setSelectedChampion] = useState(
    getChampionFromFileName(defaultBannerFileName),
  );
  const [focusYByFileName, setFocusYByFileName] = useState<Record<string, number>>({});
  const [selectedFocusY, setSelectedFocusY] = useState(DEFAULT_BANNER_FOCUS_Y);

  const filteredGroups = useMemo(() => splashGroups, [splashGroups]);

  // Build a virtual "Liberadas" group containing all unlocked variants
  // across every champion (only present when the user has unlocked banners).
  const unlockedGroup = useMemo<SplashGroup | null>(() => {
    const variants = splashGroups
      .flatMap((g) => g.variants)
      .filter((v) => unlocked.includes(v.fileName));
    if (variants.length === 0) return null;
    return {
      champion: UNLOCKED_KEY,
      displayChampion: "Liberadas",
      variants,
    };
  }, [splashGroups, unlocked]);

  const activeGroup =
    selectedChampion === UNLOCKED_KEY
      ? unlockedGroup ?? filteredGroups[0] ?? null
      : filteredGroups.find((group) => group.champion === selectedChampion) ??
        filteredGroups[0] ??
        null;

  const selectedVariant =
    splashGroups
      .flatMap((group) => group.variants)
      .find((variant) => variant.fileName === selectedFileName) ?? null;

  useEffect(() => {
    const storedFileName = window.localStorage.getItem(PANEL_BANNER_STORAGE_KEY);
    const storedPositions = readStoredBannerPositions();

    setFocusYByFileName(storedPositions);

    if (storedFileName) {
      setSelectedFileName(storedFileName);
      setSelectedChampion(getChampionFromFileName(storedFileName));
      setSelectedFocusY(
        clampBannerFocusY(
          storedPositions[storedFileName] ?? DEFAULT_BANNER_FOCUS_Y,
        ),
      );
      return;
    }

    setSelectedFocusY(DEFAULT_BANNER_FOCUS_Y);
  }, []);

  // Permite abrir o picker via custom event (usado pelo atalho de "Editar
  // capa" na página /minha-conta). Sem isso, o picker só abre pelo botão
  // que aparece em hover sobre o banner.
  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener("panel:open-banner-picker", open);
    return () => window.removeEventListener("panel:open-banner-picker", open);
  }, []);

  useEffect(() => {
    if (!activeGroup) {
      return;
    }

    if (activeGroup.champion !== selectedChampion) {
      setSelectedChampion(activeGroup.champion);
    }
  }, [activeGroup, selectedChampion]);

  useEffect(() => {
    setSelectedFocusY(
      clampBannerFocusY(
        focusYByFileName[selectedFileName] ?? DEFAULT_BANNER_FOCUS_Y,
      ),
    );
  }, [focusYByFileName, selectedFileName]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const applyBanner = (fileName: string) => {
    const nextFocusY = clampBannerFocusY(
      focusYByFileName[fileName] ?? DEFAULT_BANNER_FOCUS_Y,
    );

    setSelectedFileName(fileName);
    // Keep the user in the "Liberadas" view if they're browsing it — don't jump
    // them back into the champion-specific list.
    if (selectedChampion !== UNLOCKED_KEY) {
      setSelectedChampion(getChampionFromFileName(fileName));
    }
    setSelectedFocusY(nextFocusY);
    window.localStorage.setItem(PANEL_BANNER_STORAGE_KEY, fileName);
    window.dispatchEvent(
      new CustomEvent(PANEL_BANNER_CHANGE_EVENT, {
        detail: { fileName, focusY: nextFocusY },
      }),
    );
    // Persiste no backend pra capa sobreviver a logout/outro device.
    updateField("bannerFileName", fileName);
  };

  const updateSelectedFocusY = (nextFocusY: number) => {
    const clampedFocusY = clampBannerFocusY(nextFocusY);
    const nextPositions = {
      ...focusYByFileName,
      [selectedFileName]: clampedFocusY,
    };

    setSelectedFocusY(clampedFocusY);
    setFocusYByFileName(nextPositions);
    window.localStorage.setItem(
      PANEL_BANNER_POSITION_STORAGE_KEY,
      JSON.stringify(nextPositions),
    );
    window.dispatchEvent(
      new CustomEvent(PANEL_BANNER_CHANGE_EVENT, {
        detail: {
          fileName: selectedFileName,
          focusY: clampedFocusY,
        },
      }),
    );
    // Persiste no backend pra posição sobreviver a logout/outro device.
    updateField("bannerFocusY", clampedFocusY);
  };

  const modal =
    isOpen && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/38 px-4 py-6 backdrop-blur-[2px]">
            <div className="relative flex h-[86vh] max-h-[820px] w-full max-w-[1180px] flex-col overflow-hidden rounded-[var(--panel-radius-shell)] bg-[#f7f7f7] shadow-[0px_30px_90px_rgba(0,0,0,0.18)]">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Fechar seletor de capa"
                className="absolute right-[24px] top-[24px] z-50 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#ff4100] text-white transition-opacity hover:opacity-85"
              >
                <X className="h-[16px] w-[16px]" strokeWidth={2.4} />
              </button>

              <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[260px_minmax(0,1fr)]">
                <aside className="flex min-h-0 max-h-[34vh] flex-col border-b border-[#ece7e2] bg-white px-[14px] lg:max-h-none lg:border-b-0 lg:border-r">
                  <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pr-[6px] pb-[14px] pt-[64px] lg:py-[18px]">
                    <div className="space-y-[6px] pr-[4px]">
                      {unlockedGroup ? (
                        <>
                          <button
                            key={UNLOCKED_KEY}
                            type="button"
                            onClick={() => setSelectedChampion(UNLOCKED_KEY)}
                            className={`flex w-full items-center justify-between rounded-[var(--panel-radius-chip)] px-[14px] py-[7px] text-left transition-opacity ${
                              activeGroup?.champion === UNLOCKED_KEY
                                ? "bg-[#ff4100] text-white"
                                : "bg-[#faf7f5] text-[#0f0f0f] hover:opacity-82"
                            }`}
                          >
                            <span className="text-[13px] font-bold tracking-[-0.03em]">
                              Liberadas
                            </span>
                            <span
                              className={`text-[11px] font-semibold tracking-[-0.02em] ${
                                activeGroup?.champion === UNLOCKED_KEY
                                  ? "text-white/82"
                                  : "text-[#9a9a9a]"
                              }`}
                            >
                              {unlockedGroup.variants.length}
                            </span>
                          </button>
                          <div className="my-[8px] h-px bg-[#ece7e2]" />
                        </>
                      ) : null}
                      {filteredGroups.map((group) => {
                        const isActive = activeGroup?.champion === group.champion;

                        return (
                          <button
                            key={group.champion}
                            type="button"
                            onClick={() => setSelectedChampion(group.champion)}
                            className={`flex w-full items-center justify-between rounded-[var(--panel-radius-chip)] px-[14px] py-[7px] text-left transition-opacity ${
                              isActive
                                ? "bg-[#ff4100] text-white"
                                : "bg-[#faf7f5] text-[#0f0f0f] hover:opacity-82"
                            }`}
                          >
                            <span className="text-[13px] font-bold tracking-[-0.03em]">
                              {group.displayChampion}
                            </span>
                            <span
                              className={`text-[11px] font-semibold tracking-[-0.02em] ${
                                isActive ? "text-white/82" : "text-[#9a9a9a]"
                              }`}
                            >
                              {group.variants.length}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </aside>

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f7f7f7] px-[16px] lg:px-[24px]">
                  {selectedVariant ? (
                    <div className="pt-[14px] pb-[12px] shrink-0 lg:pt-[24px] lg:pb-[18px]">
                      <div className="overflow-hidden rounded-[var(--panel-radius-card-sm)] bg-white p-[10px] lg:p-[14px]">
                        <div className="relative aspect-[2.2/1] overflow-hidden rounded-[var(--panel-radius-block)] bg-black lg:aspect-[3/1]">
                          <Image
                            src={selectedVariant.src}
                            alt={`${selectedVariant.displayChampion} splash selecionada`}
                            fill
                            quality={100}
                            sizes="(min-width: 1024px) 60vw, 100vw"
                            className="object-cover"
                            style={{ objectPosition: `56% ${selectedFocusY}%` }}
                          />

                          <div className="absolute left-[16px] top-[16px] rounded-full bg-black/48 px-[11px] py-[6px] text-[10px] font-bold tracking-[-0.02em] text-white backdrop-blur-[6px]">
                            Prévia
                          </div>

                          <div className="absolute right-[16px] top-[16px] flex flex-col gap-[8px]">
                            <button
                              type="button"
                              aria-label="Subir enquadramento"
                              onClick={() => updateSelectedFocusY(selectedFocusY - 4)}
                              className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/92 text-[#0f0f0f] transition-opacity hover:opacity-85"
                            >
                              <ChevronUp className="h-[16px] w-[16px]" strokeWidth={2.4} />
                            </button>

                            <button
                              type="button"
                              aria-label="Descer enquadramento"
                              onClick={() => updateSelectedFocusY(selectedFocusY + 4)}
                              className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/92 text-[#0f0f0f] transition-opacity hover:opacity-85"
                            >
                              <ChevronDown className="h-[16px] w-[16px]" strokeWidth={2.4} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className={`no-scrollbar min-h-0 flex-1 overflow-y-auto pr-[4px] pb-[16px] lg:pb-[24px] ${selectedVariant ? "pt-0" : "pt-[14px] lg:pt-[24px]"}`}>
                    <div className="grid grid-cols-2 gap-[10px] pb-[8px] sm:grid-cols-2 lg:gap-[14px] lg:pb-[12px] xl:grid-cols-3">
                      {activeGroup?.variants.map((variant) => {
                        const isSelected = variant.fileName === selectedFileName;
                        const locked = !isUnlocked(variant.fileName);

                        return (
                          <button
                            key={variant.fileName}
                            type="button"
                            onClick={() => {
                              if (locked) return;
                              applyBanner(variant.fileName);
                            }}
                            disabled={locked}
                            className={`overflow-hidden rounded-[var(--panel-radius-card-sm)] bg-white p-[10px] text-left transition-opacity ${
                              locked
                                ? "cursor-not-allowed"
                                : "hover:opacity-88"
                            } ${isSelected ? "shadow-[0_0_0_2px_#ededed]" : ""}`}
                          >
                            <div className="relative aspect-[1.65/1] overflow-hidden rounded-[var(--panel-radius-tile)] bg-black">
                              <Image
                                src={variant.src}
                                alt={`${variant.displayChampion} ${variant.displaySkin}`}
                                fill
                                sizes="(min-width: 1280px) 20vw, (min-width: 640px) 33vw, 100vw"
                                className="object-cover"
                                style={locked ? { opacity: 0.3 } : undefined}
                              />
                              {locked && (
                                <div className="absolute inset-0 bg-black/40" />
                              )}
                            </div>

                            <div className="flex flex-col gap-[2px] px-[4px] pb-[2px] pt-[10px] sm:flex-row sm:items-center sm:justify-between sm:gap-[8px]">
                              <p
                                className={`min-w-0 truncate text-[13px] font-bold tracking-[-0.03em] sm:flex-1 ${
                                  locked ? "text-[#9a9a9a]" : "text-[#0f0f0f]"
                                }`}
                              >
                                {variant.displaySkin}
                              </p>

                              {isSelected ? (
                                <span className="shrink-0 text-[11px] font-bold tracking-[-0.02em] text-[#ff4100]">
                                  Ativa
                                </span>
                              ) : locked ? (
                                <span className="shrink-0 text-[11px] font-bold tracking-[-0.02em] text-[#9a9a9a]">
                                  Bloqueada
                                </span>
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="absolute left-[24px] top-[24px] z-10 hidden rounded-full bg-black/50 px-[16px] py-[8px] text-[12px] font-bold tracking-[-0.03em] text-white backdrop-blur-md transition-all duration-200 hover:bg-black/70 xl:block xl:opacity-0 xl:group-hover:opacity-100"
      >
        Trocar capa
      </button>

      {modal}
    </>
  );
}
