"use client";

import { useCallback, useEffect, useState } from "react";

import { authToken } from "@/features/panel/use-auth";

// Histórico de compras (spins) do membro logado — persistido no backend.
// O label e a raridade são resolvidos no frontend (pelo slug) e enviados
// junto, então o histórico sobrevive a deploy/cache/troca de dispositivo.

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

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

function authHeaders(): Record<string, string> {
  const token = authToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchHistory(): Promise<PurchaseEntry[]> {
  if (!authToken()) return [];
  const res = await fetch(`${API_BASE}/account/purchase-history`, {
    headers: { Accept: "application/json", ...authHeaders() },
  });
  if (!res.ok) return [];
  return (await res.json()) as PurchaseEntry[];
}

async function postEntry(entry: Omit<PurchaseEntry, "id" | "timestamp">): Promise<void> {
  if (!authToken()) return;
  await fetch(`${API_BASE}/account/purchase-history`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({
      kind: entry.kind,
      itemId: entry.itemId,
      itemLabel: entry.itemLabel,
      rarity: entry.rarity,
      cost: entry.cost,
      refunded: entry.refunded,
      free: entry.free ?? false,
      balanceAfter: entry.balanceAfter,
    }),
  }).catch(() => {});
}

export function useMemberPurchaseHistory(_memberId: string): {
  entries: PurchaseEntry[];
  log: (entry: Omit<PurchaseEntry, "id" | "timestamp">) => void;
  clear: () => void;
} {
  const [entries, setEntries] = useState<PurchaseEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchHistory()
      .then((list) => {
        if (!cancelled) setEntries(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const log = useCallback((entry: Omit<PurchaseEntry, "id" | "timestamp">) => {
    // Update otimista (modal atualiza na hora) + persiste no backend.
    const optimistic: PurchaseEntry = {
      ...entry,
      id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
    };
    setEntries((prev) => [optimistic, ...prev].slice(0, 500));
    void postEntry(entry);
  }, []);

  // Limpa apenas a visão local (não há endpoint de delete — histórico é
  // permanente por design).
  const clear = useCallback(() => setEntries([]), []);

  return { entries, log, clear };
}
