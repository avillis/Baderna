"use client";

import { useCallback, useEffect, useState } from "react";

import { authToken, useAuth } from "@/features/panel/use-auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

const CACHE_KEY_PREFIX = "baderna:member-coins-cache:";
const ADMIN_CACHE_KEY = "baderna:member-coins-admin-cache";
const UPDATE_EVENT = "baderna:member-coins-updated";

type AdminMember = {
  id: number;
  name: string;
  summonerName: string | null;
  tagLine: string | null;
  avatarSrc: string | null;
  balance: number;
};

function readSelfCache(userId: string | null): number {
  if (typeof window === "undefined" || !userId) return 0;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY_PREFIX + userId);
    return raw ? (JSON.parse(raw) as number) : 0;
  } catch {
    return 0;
  }
}

function writeSelfCache(userId: string | null, balance: number) {
  if (typeof window === "undefined" || !userId) return;
  window.localStorage.setItem(CACHE_KEY_PREFIX + userId, JSON.stringify(balance));
  queueMicrotask(() => window.dispatchEvent(new Event(UPDATE_EVENT)));
}

function readAdminCache(): AdminMember[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ADMIN_CACHE_KEY);
    return raw ? (JSON.parse(raw) as AdminMember[]) : [];
  } catch {
    return [];
  }
}

function writeAdminCache(rows: AdminMember[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(rows));
  queueMicrotask(() => window.dispatchEvent(new Event(UPDATE_EVENT)));
}

async function fetchSelfBalance(): Promise<number | null> {
  const token = authToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/account/coins`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { balance: number };
  return body.balance;
}

async function fetchAdminList(): Promise<AdminMember[] | null> {
  const token = authToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/admin/member-coins`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as AdminMember[];
}

async function adminSetBalance(userId: number, balance: number): Promise<void> {
  const token = authToken();
  if (!token) return;
  await fetch(`${API_BASE}/admin/member-coins/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ balance }),
  });
}

// /account/coins/adjust foi removida do backend (vulnerabilidade
// self-credit). Função mantida só pra manter assinatura, sem efeito.


/**
 * Hook que retorna o saldo de moedas do USUÁRIO LOGADO + admin actions.
 *
 * - `getCoinsFor` aceita um memberKey (legacy: slug ou userId). Pra simplificar,
 *   se for o próprio usuário (matching userId), retorna o balance live. Caso
 *   contrário, busca no cache admin (que o admin modal preenche).
 * - `setCoinsFor` chama o endpoint admin se for outro usuário; se for o próprio,
 *   usa adjust (delta = next - prev).
 */
export function useMemberCoins() {
  const { user, hydrated } = useAuth();
  const userId = user ? String(user.id) : null;
  const [balance, setBalance] = useState<number>(() => readSelfCache(userId));
  const [adminMap, setAdminMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const row of readAdminCache()) map[String(row.id)] = row.balance;
    return map;
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!hydrated || !userId) return;

    setBalance(readSelfCache(userId));

    let cancelled = false;
    fetchSelfBalance()
      .then((b) => {
        if (cancelled || b === null) return;
        setBalance(b);
        writeSelfCache(userId, b);
      })
      .catch(() => {});

    function refresh() {
      if (userId) setBalance(readSelfCache(userId));
      const newMap: Record<string, number> = {};
      for (const row of readAdminCache()) newMap[String(row.id)] = row.balance;
      setAdminMap(newMap);
    }
    window.addEventListener(UPDATE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(UPDATE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [hydrated, userId]);

  // Carrega lista admin sob demanda (chamado pelo modal)
  const loadAdminList = useCallback(async (): Promise<AdminMember[]> => {
    const rows = (await fetchAdminList()) ?? readAdminCache();
    writeAdminCache(rows);
    const newMap: Record<string, number> = {};
    for (const row of rows) newMap[String(row.id)] = row.balance;
    setAdminMap(newMap);
    return rows;
  }, []);

  const setCoinsFor = useCallback(
    (memberId: string, coins: number) => {
      const sanitized = Math.max(0, Math.floor(coins));
      // Próprio usuário: apenas atualiza local. Débito real só vem via
      // backend (/account/unlocks debita atomicamente na compra). Self
      // adjust endpoint foi removido pra fechar self-credit ilimitado.
      if (memberId === userId) {
        setBalance(sanitized);
        writeSelfCache(userId, sanitized);
        return;
      }
      // Outro membro — admin set
      const id = Number(memberId);
      if (Number.isNaN(id)) return;
      const newMap = { ...adminMap, [memberId]: sanitized };
      setAdminMap(newMap);
      const cached = readAdminCache().map((r) =>
        r.id === id ? { ...r, balance: sanitized } : r,
      );
      writeAdminCache(cached);
      void adminSetBalance(id, sanitized);
    },
    [userId, adminMap, balance],
  );

  const getCoinsFor = useCallback(
    (memberId: string, fallback = 0): number => {
      if (!mounted) return fallback;
      if (memberId === userId) return balance;
      return adminMap[memberId] ?? fallback;
    },
    [mounted, userId, balance, adminMap],
  );

  /**
   * Atualiza o saldo LOCAL (sem bater na API) — pra UI otimista durante
   * o spin. O backend é a fonte de verdade real: chamadas ao /account/unlocks
   * debitam atomicamente, e o response é usado pra sincronizar via syncBalance.
   */
  const setLocalBalance = useCallback(
    (next: number) => {
      const sanitized = Math.max(0, Math.floor(next));
      setBalance(sanitized);
      writeSelfCache(userId, sanitized);
    },
    [userId],
  );

  /**
   * Sync com valor autoritativo vindo do backend (ex: response do /unlocks).
   */
  const syncBalance = useCallback(
    (fresh: number) => {
      setBalance(fresh);
      writeSelfCache(userId, fresh);
    },
    [userId],
  );

  return {
    coinsByMember: { ...adminMap, ...(userId ? { [userId]: balance } : {}) },
    getCoinsFor,
    setCoinsFor,
    setLocalBalance,
    syncBalance,
    loadAdminList,
    mounted,
  };
}
