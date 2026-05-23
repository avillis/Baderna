"use client";

import { useCallback, useEffect, useState } from "react";

import type { InhouseMatchResult } from "@/features/panel/inhouse-builder-logic";
import { authToken } from "@/features/panel/use-auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

const CACHE_KEY = "baderna:inhouses-cache";
export const INHOUSES_UPDATED_EVENT = "baderna:inhouses-updated";

export type Inhouse = InhouseMatchResult & {
  id: string;
  shortCode: string;
  createdAt: number;
  createdBy?: number;
};

type ApiInhouse = {
  id: string;
  shortCode: string;
  payload: InhouseMatchResult;
  createdAt: number;
  createdBy?: number;
};

// Mantida pra compat; agora o short code vem do backend.
export function matchIdFromInhouseId(id: string): string {
  // O id agora é "inhouse-<dbId>" e o code do backend é a fonte real;
  // esse hash fica como fallback no UI raro de não termos o shortCode.
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const code = ((h >>> 0).toString(36) + "00000000").slice(0, 8).toUpperCase();
  return `${code.slice(0, 4)}-${code.slice(4, 8)}`;
}

function unwrap(api: ApiInhouse): Inhouse {
  return {
    ...api.payload,
    id: api.id,
    shortCode: api.shortCode,
    createdAt: api.createdAt,
    createdBy: api.createdBy,
  };
}

function readCacheRaw(): ApiInhouse[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as ApiInhouse[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function readCache(): Inhouse[] {
  return readCacheRaw().map(unwrap);
}

function writeCache(list: ApiInhouse[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(list));
  queueMicrotask(() => window.dispatchEvent(new Event(INHOUSES_UPDATED_EVENT)));
}

async function fetchAll(): Promise<ApiInhouse[] | null> {
  const token = authToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/inhouses`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) return null;
  return (await res.json()) as ApiInhouse[];
}

async function postInhouse(payload: InhouseMatchResult): Promise<ApiInhouse | null> {
  const token = authToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/inhouses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ payload }),
  });
  if (!res.ok) return null;
  return (await res.json()) as ApiInhouse;
}

async function patchInhouse(
  shortCode: string,
  payload: Partial<InhouseMatchResult>,
): Promise<ApiInhouse | null> {
  const token = authToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/inhouses/${encodeURIComponent(shortCode)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ payload }),
  });
  if (!res.ok) return null;
  return (await res.json()) as ApiInhouse;
}

async function deleteInhouse(shortCode: string): Promise<boolean> {
  const token = authToken();
  if (!token) return false;
  const res = await fetch(`${API_BASE}/inhouses/${encodeURIComponent(shortCode)}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return res.ok;
}

export function useInhouses(): {
  inhouses: Inhouse[];
  addInhouse: (result: InhouseMatchResult) => Promise<string>;
  updateInhouse: (id: string, patch: Partial<Inhouse>) => Promise<void>;
  removeInhouse: (idOrShortCode: string) => Promise<void>;
  getInhouse: (id: string) => Inhouse | undefined;
} {
  const [rawList, setRawList] = useState<ApiInhouse[]>(() => readCacheRaw());
  const [inhouses, setInhouses] = useState<Inhouse[]>(() =>
    readCacheRaw().map(unwrap),
  );

  useEffect(() => {
    let cancelled = false;
    fetchAll()
      .then((list) => {
        if (cancelled || !list) return;
        setRawList(list);
        setInhouses(list.map(unwrap));
        writeCache(list);
      })
      .catch(() => {});

    function refresh() {
      setInhouses(readCache());
    }
    window.addEventListener(INHOUSES_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(INHOUSES_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const addInhouse = useCallback(
    async (result: InhouseMatchResult): Promise<string> => {
      const created = await postInhouse(result);
      if (!created) return "";
      const nextRaw = [created, ...rawList];
      setRawList(nextRaw);
      const nextList = nextRaw.map(unwrap);
      setInhouses(nextList);
      writeCache(nextRaw);
      return created.id;
    },
    [rawList],
  );

  // Update local — patch é só aplicado ao cache. Persistir patches granulares
  // exigiria endpoint adicional; por ora não temos.
  const updateInhouse = useCallback(
    async (id: string, patch: Partial<Inhouse>) => {
      // 1) Update otimista — local state + cache na hora pra UI responder.
      const target = inhouses.find((i) => i.id === id);
      if (!target) return;

      const nextList = inhouses.map((i) =>
        i.id === id ? { ...i, ...patch } : i,
      );
      setInhouses(nextList);

      const payloadPatch: Partial<InhouseMatchResult> = {};
      if (patch.players !== undefined) payloadPatch.players = patch.players;
      if (patch.blueLeaderId !== undefined)
        payloadPatch.blueLeaderId = patch.blueLeaderId;
      if (patch.redLeaderId !== undefined)
        payloadPatch.redLeaderId = patch.redLeaderId;
      if (patch.mode !== undefined) payloadPatch.mode = patch.mode;

      const nextRaw = rawList.map((r) =>
        r.id === id ? { ...r, payload: { ...r.payload, ...payloadPatch } } : r,
      );
      setRawList(nextRaw);
      writeCache(nextRaw);

      // 2) Persiste no backend em background.
      if (target.shortCode && Object.keys(payloadPatch).length > 0) {
        const fresh = await patchInhouse(target.shortCode, payloadPatch);
        if (fresh) {
          const reconciled = rawList.map((r) =>
            r.id === fresh.id ? fresh : r,
          );
          setRawList(reconciled);
          setInhouses(reconciled.map(unwrap));
          writeCache(reconciled);
        }
      }
    },
    [inhouses, rawList],
  );

  const removeInhouse = useCallback(
    async (idOrShortCode: string) => {
      // Aceita "inhouse-N" ou shortCode direto.
      const target = inhouses.find(
        (i) => i.id === idOrShortCode || i.shortCode === idOrShortCode,
      );
      const code = target?.shortCode ?? idOrShortCode;
      const ok = await deleteInhouse(code);
      if (!ok) return;
      const nextRaw = rawList.filter((r) => r.shortCode !== code);
      setRawList(nextRaw);
      setInhouses(nextRaw.map(unwrap));
      writeCache(nextRaw);
    },
    [rawList, inhouses],
  );

  const getInhouse = useCallback(
    (id: string) => inhouses.find((i) => i.id === id || i.shortCode === id),
    [inhouses],
  );

  return { inhouses, addInhouse, updateInhouse, removeInhouse, getInhouse };
}
