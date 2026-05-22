"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import {
  clampBannerFocusY,
  DEFAULT_BANNER_FOCUS_Y,
  getSplashImageSrc,
  PANEL_BANNER_CHANGE_EVENT,
  PANEL_BANNER_POSITION_STORAGE_KEY,
  PANEL_BANNER_STORAGE_KEY,
} from "@/features/panel/banner-selection";
import { PanelBannerPicker } from "@/features/panel/components/panel-banner-picker";
import type { SplashGroup } from "@/features/panel/splash-catalog";

import { useAuth } from "@/features/panel/use-auth";

type PanelBannerProps = {
  src: string;
  alt: string;
  splashGroups?: SplashGroup[];
  defaultBannerFileName?: string;
  isOwnProfile?: boolean;
  /** user_id do dono do perfil — server passa, client compara com useAuth. */
  targetUserId?: number | null;
};

export function PanelBanner({
  src,
  alt,
  splashGroups = [],
  defaultBannerFileName = "",
  isOwnProfile: isOwnProfileProp,
  targetUserId,
}: PanelBannerProps) {
  const { user } = useAuth();
  const isOwnProfile =
    isOwnProfileProp ??
    (user != null && targetUserId != null && user.id === targetUserId);
  const bannerRef = useRef<HTMLDivElement>(null);
  const imageLayerRef = useRef<HTMLDivElement>(null);
  const [activeSrc, setActiveSrc] = useState(src);
  const [activeFocusY, setActiveFocusY] = useState(DEFAULT_BANNER_FOCUS_Y);

  const getStoredFocusY = (fileName: string) => {
    const raw = window.localStorage.getItem(PANEL_BANNER_POSITION_STORAGE_KEY);

    if (!raw) {
      return DEFAULT_BANNER_FOCUS_Y;
    }

    try {
      const positions = JSON.parse(raw) as Record<string, number>;
      return clampBannerFocusY(positions[fileName] ?? DEFAULT_BANNER_FOCUS_Y);
    } catch {
      return DEFAULT_BANNER_FOCUS_Y;
    }
  };

  useEffect(() => {
    let frame = 0;

    const updateParallax = () => {
      frame = 0;

      const banner = bannerRef.current;
      const imageLayer = imageLayerRef.current;

      if (!banner || !imageLayer) {
        return;
      }

      const { top } = banner.getBoundingClientRect();
      const travel = Math.min(Math.max(-top, 0) * 0.12, 22);

      imageLayer.style.transform = `translate3d(0, ${travel}px, 0)`;
    };

    const scheduleUpdate = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(updateParallax);
    };

    updateParallax();

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  useEffect(() => {
    // Other members' profiles always show the passed-in banner — never read or
    // listen to localStorage (that's the logged-in user's own preference).
    if (!isOwnProfile) {
      setActiveSrc(src);
      setActiveFocusY(DEFAULT_BANNER_FOCUS_Y);
      return;
    }

    const storedFileName = window.localStorage.getItem(PANEL_BANNER_STORAGE_KEY);
    const isValid = storedFileName && /^[A-Za-z]+_[A-Za-z0-9]+\.webp$/.test(storedFileName);

    if (isValid && storedFileName) {
      setActiveSrc(getSplashImageSrc(storedFileName));
      setActiveFocusY(getStoredFocusY(storedFileName));
    } else {
      // Stored value is from the old naming scheme — clear it so the default banner takes over.
      if (storedFileName) window.localStorage.removeItem(PANEL_BANNER_STORAGE_KEY);
      setActiveSrc(src);
      setActiveFocusY(DEFAULT_BANNER_FOCUS_Y);
    }

    const handleBannerChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ fileName?: string; focusY?: number }>;
      const nextFileName = customEvent.detail?.fileName;
      const nextFocusY = customEvent.detail?.focusY;

      if (!nextFileName) {
        setActiveSrc(src);
        setActiveFocusY(DEFAULT_BANNER_FOCUS_Y);
        return;
      }

      setActiveSrc(getSplashImageSrc(nextFileName));
      setActiveFocusY(
        clampBannerFocusY(
          typeof nextFocusY === "number" ? nextFocusY : getStoredFocusY(nextFileName),
        ),
      );
    };

    window.addEventListener(PANEL_BANNER_CHANGE_EVENT, handleBannerChange);

    return () => {
      window.removeEventListener(PANEL_BANNER_CHANGE_EVENT, handleBannerChange);
    };
  }, [src, isOwnProfile]);

  return (
    <div
      ref={bannerRef}
      className="group relative isolate overflow-hidden rounded-none bg-black
        -mt-[calc(6vh+16px)] h-[calc(250px+6vh+16px)]
        sm:-mt-[calc(6vh+24px)] sm:h-[calc(290px+6vh+24px)]
        xl:-mt-[calc(6vh+45px)] xl:-mr-[45px] xl:h-[calc(320px+6vh+45px)] xl:rounded-bl-[var(--panel-radius-shell)]
        2xl:h-[calc(350px+6vh+45px)]"
    >
      <div
        ref={imageLayerRef}
        className="absolute -inset-x-[1%] -top-[22px] -bottom-[22px] will-change-transform"
      >
        <Image
          src={activeSrc}
          alt={alt}
          fill
          preload
          quality={100}
          className="object-cover"
          style={{ objectPosition: `56% ${activeFocusY}%` }}
          sizes="100vw"
        />
      </div>


      {isOwnProfile && splashGroups.length > 0 && (
        <PanelBannerPicker
          splashGroups={splashGroups}
          defaultBannerFileName={defaultBannerFileName}
        />
      )}
    </div>
  );
}
