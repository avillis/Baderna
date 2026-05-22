"use client";

import { useCallback, useEffect, useState } from "react";

// Log of every spin a member has made — what they won, how much it cost,
// whether it was a refunded duplicate, and the balance right after.

const STORAGE_KEY = "baderna:member-purchase-history";
const UPDATE_EVENT = "baderna:member-purchase-history-updated";
const MAX_ENTRIES = 500;

export type PurchaseKind = "capa" | "titulo" | "nome";

export type PurchaseEntry = {
  id: string;
  timestamp: number;
  kind: PurchaseKind;
  itemId: string;
  itemLabel: string;
  rarity: string;
  cost: number;
  refunded: boolean;
  free?: boolean;
  balanceAfter: number;
};

type HistoryMap = Record<string, PurchaseEntry[]>;

function readAll(): HistoryMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as HistoryMap;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeAll(map: HistoryMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function useMemberPurchaseHistory(memberId: string): {
  entries: PurchaseEntry[];
  log: (entry: Omit<PurchaseEntry, "id" | "timestamp">) => void;
  clear: () => void;
} {
  const [entries, setEntries] = useState<PurchaseEntry[]>([]);

  useEffect(() => {
    const all = readAll();
    setEntries(all[memberId] ?? []);

    function refresh() {
      const next = readAll();
      setEntries(next[memberId] ?? []);
    }

    window.addEventListener(UPDATE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(UPDATE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [memberId]);

  const log = useCallback(
    (entry: Omit<PurchaseEntry, "id" | "timestamp">) => {
      const full: PurchaseEntry = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        timestamp: Date.now(),
      };
      const all = readAll();
      const list = all[memberId] ?? [];
      // Newest first, capped to MAX_ENTRIES so localStorage stays tiny.
      all[memberId] = [full, ...list].slice(0, MAX_ENTRIES);
      writeAll(all);
      // Optimistic local update so the modal updates immediately.
      setEntries(all[memberId]);
    },
    [memberId],
  );

  const clear = useCallback(() => {
    const all = readAll();
    delete all[memberId];
    writeAll(all);
    setEntries([]);
  }, [memberId]);

  return { entries, log, clear };
}
