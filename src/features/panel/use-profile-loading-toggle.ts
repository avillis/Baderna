"use client";

import { useCallback, useEffect, useState } from "react";

import { authToken } from "@/features/panel/use-auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

const CACHE_KEY = "baderna:profile-loading-overlay-cache";
export const PROFILE_LOADING_TOGGLE_EVENT =
  "baderna:profile-loading-toggle";

type ProfileLoadingOverlaySettings = {
  disabled: boolean;
};

function normalize(
  input: Partial<ProfileLoadingOverlaySettings> | null,
): ProfileLoadingOverlaySettings {
  return {
    disabled: input?.disabled ?? false,
  };
}

function readCache(): ProfileLoadingOverlaySettings {
  if (typeof window === "undefined") return { disabled: false };

  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return { disabled: false };

    return normalize(JSON.parse(raw) as Partial<ProfileLoadingOverlaySettings>);
  } catch {
    return { disabled: false };
  }
}

function writeCache(settings: ProfileLoadingOverlaySettings) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(CACHE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event(PROFILE_LOADING_TOGGLE_EVENT));
}

async function fetchFromApi(): Promise<ProfileLoadingOverlaySettings> {
  const token = authToken();
  if (!token) throw new Error("Sem token");

  const res = await fetch(`${API_BASE}/profile-loading-overlay`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error(`API respondeu ${res.status}`);

  return normalize(
    (await res.json()) as Partial<ProfileLoadingOverlaySettings>,
  );
}

async function putToApi(
  settings: ProfileLoadingOverlaySettings,
): Promise<ProfileLoadingOverlaySettings> {
  const token = authToken();
  const res = await fetch(`${API_BASE}/admin/profile-loading-overlay`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(settings),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as
      | { error?: string; message?: string }
      | null;

    throw new Error(
      body?.error ?? body?.message ?? `API respondeu ${res.status}`,
    );
  }

  return normalize(
    (await res.json()) as Partial<ProfileLoadingOverlaySettings>,
  );
}

export function useProfileLoadingToggle() {
  const [disabled, setDisabled] = useState(() => readCache().disabled);
  const hydrated = true;

  useEffect(() => {
    let cancelled = false;

    fetchFromApi()
      .then((fresh) => {
        if (cancelled) return;
        setDisabled(fresh.disabled);
        writeCache(fresh);
      })
      .catch(() => {
        /* keep cached value */
      });

    function sync() {
      setDisabled(readCache().disabled);
    }

    window.addEventListener(PROFILE_LOADING_TOGGLE_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      cancelled = true;
      window.removeEventListener(PROFILE_LOADING_TOGGLE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setValue = useCallback(async (value: boolean) => {
    const previous = readCache();
    const optimistic = { disabled: value };

    setDisabled(value);
    writeCache(optimistic);

    try {
      const saved = await putToApi(optimistic);
      setDisabled(saved.disabled);
      writeCache(saved);
    } catch {
      setDisabled(previous.disabled);
      writeCache(previous);
    }
  }, []);

  const toggle = useCallback(async () => {
    await setValue(!readCache().disabled);
  }, [setValue]);

  return { disabled, hydrated, toggle, setDisabled: setValue };
}
