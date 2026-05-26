"use client";

import { useCallback, useEffect, useState } from "react";
import { authToken } from "@/features/panel/use-auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";
const CACHE_KEY = "baderna:notifications-cache";
export const NOTIFICATIONS_UPDATED_EVENT = "baderna:notifications-updated";

export interface NotificationData {
  author_avatar?: string;
  action_url: string;
  message: string;
}

export interface AppNotification {
  id: string;
  read_at: string | null;
  data: NotificationData;
}

type ApiNotificationResponse = {
  unread_count: number;
  notifications: AppNotification[];
};

function readCacheRaw(): ApiNotificationResponse {
  if (typeof window === "undefined") return { unread_count: 0, notifications: [] };
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return { unread_count: 0, notifications: [] };
    return JSON.parse(raw) as ApiNotificationResponse;
  } catch {
    return { unread_count: 0, notifications: [] };
  }
}

function writeCache(data: ApiNotificationResponse) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  queueMicrotask(() => window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT)));
}

async function fetchAll(): Promise<ApiNotificationResponse | null> {
  const token = authToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/notifications`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) return null;
  return (await res.json()) as ApiNotificationResponse;
}

async function postMarkAsRead(id: string): Promise<boolean> {
  const token = authToken();
  if (!token) return false;
  const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return res.ok;
}

async function deleteOne(id: string): Promise<boolean> {
  const token = authToken();
  if (!token) return false;
  const res = await fetch(`${API_BASE}/notifications/${id}`, {
    method: "DELETE",
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  return res.ok;
}

export function useNotifications() {
  const [data, setData] = useState<ApiNotificationResponse>(() => readCacheRaw());

  const loadFromServer = useCallback(async () => {
    const fresh = await fetchAll();
    if (fresh) {
      setData(fresh);
      writeCache(fresh);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadFromServer().catch(() => {});

    // Polling nativo em background a cada 15 segundos
    const intervalId = setInterval(() => {
      if (!cancelled) loadFromServer();
    }, 15000);

    function refresh() {
      setData(readCacheRaw());
    }
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    
    return () => {
      cancelled = true;
      clearInterval(intervalId);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [loadFromServer]);

  const markAsRead = useCallback(
    async (id: string) => {
      // 1. Update Otimista: Muda na tela na hora sem esperar a API
      const target = data.notifications.find((n) => n.id === id);
      if (!target || target.read_at) return;

      const nextData = {
        unread_count: Math.max(0, data.unread_count - 1),
        notifications: data.notifications.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        ),
      };
      
      setData(nextData);
      writeCache(nextData);

      // 2. Persiste no backend silenciosamente
      await postMarkAsRead(id);
    },
    [data]
  );

  const remove = useCallback(
    async (id: string) => {
      // Optimistic: tira da lista na hora. Se nao-lida, decrementa o badge.
      const target = data.notifications.find((n) => n.id === id);
      if (!target) return;

      const nextData = {
        unread_count: target.read_at
          ? data.unread_count
          : Math.max(0, data.unread_count - 1),
        notifications: data.notifications.filter((n) => n.id !== id),
      };

      setData(nextData);
      writeCache(nextData);

      await deleteOne(id);
    },
    [data]
  );

  const removeAll = useCallback(async () => {
    if (data.notifications.length === 0) return;
    const ids = data.notifications.map((n) => n.id);

    // Optimistic: zera tudo na hora
    const empty: ApiNotificationResponse = { unread_count: 0, notifications: [] };
    setData(empty);
    writeCache(empty);

    // Persiste no backend em paralelo (silencioso — se falhar, o próximo
    // polling dos 15s vai ressincronizar)
    await Promise.allSettled(ids.map((id) => deleteOne(id)));
  }, [data.notifications]);

  return {
    notifications: data.notifications,
    unreadCount: data.unread_count,
    markAsRead,
    remove,
    removeAll,
    refresh: loadFromServer,
  };
}