export const PANEL_BANNER_STORAGE_KEY = "baderna.selectedSplashBanner";
export const PANEL_BANNER_POSITION_STORAGE_KEY =
  "baderna.selectedSplashBannerPositions";
export const PANEL_BANNER_CHANGE_EVENT = "baderna:banner-change";
export const DEFAULT_BANNER_FOCUS_Y = 16;

export function clampBannerFocusY(value: number) {
  return Math.min(100, Math.max(0, value));
}

export type SplashSize = "full" | "thumb";

export const DEFAULT_BANNER_FILE = "Garen_Original.webp";

export function getSplashImageSrc(
  fileName: string,
  size: SplashSize = "full",
) {
  return `/api/champion-splash/${encodeURIComponent(fileName)}?size=${size}`;
}
