"use client";

import { useCallback, useEffect, useState } from "react";

// Preferencia por browser (localStorage). Quando true, o ProfileLoadingOverlay
// nao renderiza em nenhum lugar. Usado pelo admin pra silenciar o Braum quando
// o gif fica chato. Reage em tempo real via custom event.
const STORAGE_KEY = "baderna:profile-loading-disabled";
export const PROFILE_LOADING_TOGGLE_EVENT = "baderna:profile-loading-toggle";

function read(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

function write(disabled: boolean) {
  if (typeof window === "undefined") return;
  if (disabled) window.localStorage.setItem(STORAGE_KEY, "1");
  else window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(PROFILE_LOADING_TOGGLE_EVENT));
}

export function useProfileLoadingToggle() {
  const [disabled, setDisabled] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDisabled(read());
    setHydrated(true);
    const sync = () => setDisabled(read());
    window.addEventListener(PROFILE_LOADING_TOGGLE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROFILE_LOADING_TOGGLE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback(() => write(!read()), []);
  const setValue = useCallback((v: boolean) => write(v), []);

  return { disabled, hydrated, toggle, setDisabled: setValue };
}
