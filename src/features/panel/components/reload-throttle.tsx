"use client";

import { useEffect } from "react";

const STORAGE_KEY = "baderna:last-reload";
const MIN_INTERVAL_MS = 2000;

/**
 * Blocks rapid F5 / Ctrl+R / Ctrl+Shift+R presses. Stores the last reload
 * timestamp in sessionStorage so the block survives the reload itself.
 */
export function ReloadThrottle() {
  useEffect(() => {
    function isReloadShortcut(e: KeyboardEvent): boolean {
      if (e.key === "F5") return true;
      const isR = e.key.toLowerCase() === "r";
      if (!isR) return false;
      return e.ctrlKey || e.metaKey;
    }

    function onKey(e: KeyboardEvent) {
      if (!isReloadShortcut(e)) return;
      const last = Number(sessionStorage.getItem(STORAGE_KEY)) || 0;
      const now = Date.now();
      if (now - last < MIN_INTERVAL_MS) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      sessionStorage.setItem(STORAGE_KEY, String(now));
    }

    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, []);

  return null;
}
