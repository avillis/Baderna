"use client";

import { useEffect, useState, useCallback } from "react";

import { TITLES, type Title, type TitleRarity } from "@/features/panel/titles-data";
import { authToken } from "@/features/panel/use-auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

const CACHE_KEY = "baderna:titles-cache";
const UPDATE_EVENT = "baderna:titles-updated";

const UNREMOVABLE_IDS = new Set(["aprendiz"]);

type ApiTitle = {
  slug: string;
  label: string;
  rarity: TitleRarity;
  created_by_user_id: number | null;
};

function readCache(): ApiTitle[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ApiTitle[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCache(titles: ApiTitle[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(titles));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

async function fetchTitles(): Promise<ApiTitle[]> {
  const token = authToken();
  if (!token) throw new Error("Sem token");
  const res = await fetch(`${API_BASE}/titles`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error(`API respondeu ${res.status}`);
  return (await res.json()) as ApiTitle[];
}

/**
 * Fonte de verdade pros títulos: combina os defaults hardcoded em
 * `titles-data.ts` com o que vem da API. Stale-while-revalidate: usa cache
 * imediato, atualiza em background.
 */
export function useTitles() {
  const [apiTitles, setApiTitles] = useState<ApiTitle[]>(() => readCache());

  useEffect(() => {
    let cancelled = false;
    fetchTitles()
      .then((titles) => {
        if (cancelled) return;
        setApiTitles(titles);
        writeCache(titles);
      })
      .catch(() => {
        /* mantém o cache que já estava */
      });

    function onUpdate() {
      setApiTitles(readCache());
    }
    window.addEventListener(UPDATE_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener(UPDATE_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const addTitle = useCallback(
    async (label: string, rarity: TitleRarity): Promise<string> => {
      const token = authToken();
      const res = await fetch(`${API_BASE}/admin/titles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ label, rarity }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string; message?: string; errors?: Record<string, string[]> }
          | null;
        const firstErr = body?.errors
          ? Object.values(body.errors)[0]?.[0]
          : null;
        throw new Error(
          firstErr ?? body?.error ?? body?.message ?? `API respondeu ${res.status}`,
        );
      }
      const created = (await res.json()) as ApiTitle;
      const next = [...apiTitles, created];
      setApiTitles(next);
      writeCache(next);
      return created.slug;
    },
    [apiTitles],
  );

  const removeTitle = useCallback(
    async (slug: string) => {
      if (UNREMOVABLE_IDS.has(slug)) return;
      const token = authToken();
      const res = await fetch(`${API_BASE}/admin/titles/${encodeURIComponent(slug)}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `API respondeu ${res.status}`);
      }
      const next = apiTitles.filter((t) => t.slug !== slug);
      setApiTitles(next);
      writeCache(next);
    },
    [apiTitles],
  );

  // Defaults hardcoded continuam sendo a base; API entrega títulos custom
  // E pode também ter "removidos" (defaults escondidos via flag).
  // Como a API hoje só lista não-removidos, basta deduplicar por slug:
  // qualquer slug presente na API sobrescreve o default (caso de renomear).
  const apiSlugs = new Set(apiTitles.map((t) => t.slug));
  const defaults = TITLES.filter((t) => !apiSlugs.has(t.id));
  const apiAsTitles: Title[] = apiTitles.map((t) => ({
    id: t.slug,
    label: t.label,
    rarity: t.rarity,
  }));
  const allTitles = [...defaults, ...apiAsTitles];

  // Apenas títulos custom (vindos da API) ainda são removíveis. Defaults
  // ficam blindados na UI (admin não pode apagar).
  const customSlugs = new Set(
    apiTitles.filter((t) => t.created_by_user_id !== null).map((t) => t.slug),
  );

  return {
    titles: allTitles,
    customTitles: apiAsTitles,
    addTitle,
    removeTitle,
    isRemovable: (id: string) => !UNREMOVABLE_IDS.has(id) && customSlugs.has(id),
  };
}
