"use client";

import { useCallback } from "react";

import { authToken } from "@/features/panel/use-auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

const MEMBERS_CACHE = "baderna:members-cache";
const MEMBERS_UPDATE_EVENT = "baderna:members-updated";

type CachedMember = { id: string; userId: number };

function lookupUserId(slug: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MEMBERS_CACHE);
    if (!raw) return null;
    const list = JSON.parse(raw) as CachedMember[];
    const match = list.find((m) => m.id === slug);
    return match?.userId ?? null;
  } catch {
    return null;
  }
}

async function softDeleteUser(userId: number): Promise<boolean> {
  const token = authToken();
  if (!token) return false;
  const res = await fetch(`${API_BASE}/admin/members/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  return res.ok;
}

async function restoreUser(userId: number): Promise<boolean> {
  const token = authToken();
  if (!token) return false;
  const res = await fetch(`${API_BASE}/admin/members/${userId}/restore`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  return res.ok;
}

/**
 * Admin pode marcar membros como deletados. Não controlamos mais uma lista
 * local — `/api/members` já retorna só os não-deletados, então `deletedIds`
 * fica sempre `[]` e os componentes que filtravam por ele continuam funcionando.
 */
export function useDeletedMembers() {
  const deleteMember = useCallback(async (slug: string) => {
    const userId = lookupUserId(slug);
    if (!userId) return;
    const ok = await softDeleteUser(userId);
    if (ok && typeof window !== "undefined") {
      // Remove o cache pra forçar refetch.
      window.localStorage.removeItem(MEMBERS_CACHE);
      window.dispatchEvent(new Event(MEMBERS_UPDATE_EVENT));
    }
  }, []);

  const restoreMember = useCallback(async (slug: string) => {
    const userId = lookupUserId(slug);
    if (!userId) return;
    const ok = await restoreUser(userId);
    if (ok && typeof window !== "undefined") {
      window.localStorage.removeItem(MEMBERS_CACHE);
      window.dispatchEvent(new Event(MEMBERS_UPDATE_EVENT));
    }
  }, []);

  return {
    deletedIds: [] as string[],
    isDeleted: (_id: string) => false,
    deleteMember,
    restoreMember,
  };
}
