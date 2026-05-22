import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { PanelBanner } from "@/features/panel/components/panel-banner";
import { PanelSidebar } from "@/features/panel/components/panel-sidebar";
import { panelProfile } from "@/features/panel/panel-data";
import type { SplashGroup } from "@/features/panel/splash-catalog";

export function PanelShell({
  children,
  splashGroups = [],
  defaultBannerFileName = "",
  bannerSrc,
  showBanner = true,
  isOwnProfile,
  targetUserId,
  bgClassName = "bg-[#f7f7f7]",
}: {
  children: ReactNode;
  splashGroups?: SplashGroup[];
  defaultBannerFileName?: string;
  bannerSrc?: string;
  showBanner?: boolean;
  /** Sobrescreve a comparação automática. Se omitido, deriva de targetUserId. */
  isOwnProfile?: boolean;
  targetUserId?: number | null;
  bgClassName?: string;
}) {
  return (
    <div className={`relative min-h-screen overflow-x-clip ${bgClassName}`}>
      <div className="relative w-full px-4 pt-4 sm:px-6 sm:pt-6 xl:px-[45px] xl:pt-[45px]">
        <div className="grid gap-6 xl:grid-cols-[318px_minmax(0,1fr)] xl:gap-[60px] 2xl:gap-[80px]">
          <PanelSidebar />

          <main className="min-w-0 pb-10 xl:pb-10">
            <div className={`relative ${showBanner ? "pt-[6vh]" : ""}`}>
              {showBanner && (
                <PanelBanner
                  src={bannerSrc ?? panelProfile.bannerSrc}
                  alt="Banner do perfil"
                  splashGroups={splashGroups}
                  defaultBannerFileName={defaultBannerFileName}
                  isOwnProfile={isOwnProfile}
                  targetUserId={targetUserId}
                />
              )}

              <div className={showBanner ? "relative -mt-[42px] sm:-mt-[54px] xl:-mt-[78px] 2xl:-mt-[84px]" : "relative"}>
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Full-width footer below everything (the sticky sidebar ends with
          its grid column, so the footer occupies the full viewport width). */}
      <SiteFooter />
    </div>
  );
}
