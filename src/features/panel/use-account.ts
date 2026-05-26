"use client";

import { useCallback, useEffect, useState } from "react";

import { authToken, useAuth, type AuthUser } from "@/features/panel/use-auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

const CACHE_PREFIX = "baderna:account-cache:";
const TEAM_NAMES_KEY = "baderna:team-names";
export const ACCOUNT_UPDATED_EVENT = "baderna:account-updated";

export type Lane = "TOP" | "JG" | "MID" | "ADC" | "SUP";

export type Account = {
  name: string;
  slug: string;
  gameNick: string;
  bio: string;
  teamName: string;
  avatarSrc: string;
  bannerFileName: string;
  bannerFocusY?: number;
  email: string;
  activeNameId?: string;
  activeTitleSlugs?: string[];
  primaryLane?: Lane | null;
  secondaryLane?: Lane | null;
  riotIconUrl?: string | null;
  communityHighlight?: string | null;
  profileModuleOrder?: string[] | null;
  favoriteChampionSlugs?: string[] | null;
  favoriteGameTitle?: string | null;
  favoriteGameCoverUrl?: string | null;
  duoUserId?: number | null;
  memberSince?: string | null;
};

function buildDefaults(user: AuthUser | null): Account {
  const summoner = user?.summoner_name ?? "";
  const tag = user?.tagLine ?? "";
  const gameNick = summoner && tag ? `${summoner}#${tag}` : "";
  const nickname = summoner || user?.name || "";
  return {
    name: user?.name || nickname,
    slug: "",
    gameNick,
    bio: "",
    teamName: nickname ? `Time ${nickname}` : "",
    avatarSrc: "",
    bannerFileName: "",
    bannerFocusY: 16,
    email: user?.email ?? "",
    activeNameId: "preto",
    activeTitleSlugs: ["aprendiz"],
    primaryLane: null,
    secondaryLane: null,
  };
}

function cacheKey(userId: string | null) {
  return CACHE_PREFIX + (userId ?? "guest");
}

function readCache(userId: string | null, defaults: Account): Account {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(cacheKey(userId));
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<Account>;
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

function writeCache(userId: string | null, account: Account) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(cacheKey(userId), JSON.stringify(account));
  if (userId) {
    try {
      const raw = window.localStorage.getItem(TEAM_NAMES_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      map[userId] = account.teamName;
      window.localStorage.setItem(TEAM_NAMES_KEY, JSON.stringify(map));
    } catch {
      /* ignore */
    }
  }
  queueMicrotask(() => window.dispatchEvent(new Event(ACCOUNT_UPDATED_EVENT)));
}

async function fetchFromApi(): Promise<Account | null> {
  const token = authToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/account`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as Account;
}

async function putToApi(patch: Record<string, unknown>): Promise<Account | null> {
  const token = authToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/account`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) return null;
  return (await res.json()) as Account;
}

/** Troca a senha. Retorna null se ok, ou mensagem de erro. */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<string | null> {
  const token = authToken();
  if (!token) return "Sem autenticação.";
  const res = await fetch(`${API_BASE}/account/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
  if (res.ok) return null;
  // Tenta extrair erro estruturado do Laravel.
  try {
    const body = (await res.json()) as {
      errors?: Record<string, string[]>;
      message?: string;
    };
    if (body.errors?.current_password?.[0]) return body.errors.current_password[0];
    if (body.errors?.new_password?.[0]) return body.errors.new_password[0];
    if (body.message) return body.message;
  } catch {
    /* ignore */
  }
  return "Não foi possível trocar a senha.";
}

const FIELD_TO_API: Partial<Record<keyof Account, string>> = {
  name: "display_name",
  bio: "bio",
  teamName: "team_name",
  avatarSrc: "avatar_src",
  bannerFileName: "banner_filename",
  bannerFocusY: "banner_focus_y",
  email: "email",
  activeNameId: "active_name_id",
  activeTitleSlugs: "active_title_slugs",
  primaryLane: "primary_lane",
  secondaryLane: "secondary_lane",
  profileModuleOrder: "profile_module_order",
  favoriteChampionSlugs: "favorite_champion_slugs",
  favoriteGameTitle: "favorite_game_title",
  favoriteGameCoverUrl: "favorite_game_cover_url",
  duoUserId: "duo_user_id",
};

export function useCurrentUserId(): string | null {
  const { user } = useAuth();
  return user ? String(user.id) : null;
}

export function useAccount() {
  const { user, hydrated } = useAuth();
  const userId = user ? String(user.id) : null;
  const defaults = buildDefaults(user);
  const [account, setAccount] = useState<Account>(() =>
    readCache(userId, defaults),
  );

  useEffect(() => {
    if (!hydrated) return;
    setAccount(readCache(userId, defaults));

    let cancelled = false;
    fetchFromApi()
      .then((fresh) => {
        if (cancelled || !fresh) return;
        const merged = { ...defaults, ...fresh };
        setAccount(merged);
        writeCache(userId, merged);
      })
      .catch(() => {
        /* mantém o cache */
      });

    function refresh() {
      setAccount(readCache(userId, defaults));
    }
    window.addEventListener(ACCOUNT_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(ACCOUNT_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, userId]);

  const updateField = useCallback(
    <K extends keyof Account>(key: K, value: Account[K]) => {
      const next = { ...account, [key]: value };
      // Update otimista
      setAccount(next);
      writeCache(userId, next);

      // Persiste no backend em background — mapeia camelCase do front
      // pro snake_case esperado pela API.
      let body: Record<string, unknown> | null = null;
      if (key === "gameNick" && typeof value === "string") {
        // gameNick é "Avillis#000" → summoner_name + tagLine separados.
        const idx = value.indexOf("#");
        const summoner = idx === -1 ? value : value.slice(0, idx);
        const tag = idx === -1 ? "" : value.slice(idx + 1);
        body = { summoner_name: summoner.trim(), tagLine: tag.trim() };
      } else {
        const apiField = FIELD_TO_API[key];
        if (apiField) body = { [apiField]: value };
      }

      if (body) {
        void putToApi(body).then((fresh) => {
          if (fresh) {
            const merged = { ...defaults, ...fresh };
            setAccount(merged);
            writeCache(userId, merged);
          }
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [account, userId],
  );

  // Slug é separado porque precisa retornar erro de validação (formato +
  // unicidade) pro componente exibir inline. Os outros campos são fire-
  // and-forget.
  const updateSlug = useCallback(
    async (newSlug: string): Promise<string | null> => {
      const token = authToken();
      if (!token) return "Sem autenticação.";
      const res = await fetch(`${API_BASE}/account`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slug: newSlug }),
      });
      if (!res.ok) {
        try {
          const body = (await res.json()) as {
            errors?: Record<string, string[]>;
            message?: string;
          };
          if (body.errors?.slug?.[0]) return body.errors.slug[0];
          if (body.message) return body.message;
        } catch {
          /* ignore */
        }
        return "Não foi possível salvar o endereço.";
      }
      const fresh = (await res.json()) as Account;
      const merged = { ...defaults, ...fresh };
      setAccount(merged);
      writeCache(userId, merged);
      return null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId],
  );

  return { account, updateField, updateSlug };
}

// Read-only helper (inhouse views).
export function getTeamNameMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(TEAM_NAMES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function useTeamNames() {
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => {
    setMap(getTeamNameMap());
    function refresh() {
      setMap(getTeamNameMap());
    }
    window.addEventListener(ACCOUNT_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(ACCOUNT_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return map;
}
