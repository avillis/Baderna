"use client";

import { useEffect, useState } from "react";

import { authToken } from "@/features/panel/use-auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";
const CACHE_KEY = "baderna:store-prices-cache";
const UPDATE_EVENT = "baderna:store-prices-updated";

export type StorePrices = { capa: number; title: number; name: number };

const DEFAULTS: StorePrices = { capa: 10, title: 50, name: 80 };

function readCache(): StorePrices {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return DEFAULTS;
    const p = JSON.parse(raw) as Partial<StorePrices>;
    return {
      capa: typeof p.capa === "number" ? p.capa : DEFAULTS.capa,
      title: typeof p.title === "number" ? p.title : DEFAULTS.title,
      name: typeof p.name === "number" ? p.name : DEFAULTS.name,
    };
  } catch {
    return DEFAULTS;
  }
}

export function writeStorePricesCache(prices: StorePrices) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(prices));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function useStorePrices(): StorePrices {
  const [prices, setPrices] = useState<StorePrices>(() => readCache());

  useEffect(() => {
    const token = authToken();
    if (!token) return;

    let cancelled = false;
    fetch(`${API_BASE}/store-prices`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: Partial<StorePrices> | null) => {
        if (cancelled || !body) return;
        const p: StorePrices = {
          capa: typeof body.capa === "number" ? body.capa : DEFAULTS.capa,
          title: typeof body.title === "number" ? body.title : DEFAULTS.title,
          name: typeof body.name === "number" ? body.name : DEFAULTS.name,
        };
        setPrices(p);
        writeStorePricesCache(p);
      })
      .catch(() => {});

    function refresh() {
      setPrices(readCache());
    }
    window.addEventListener(UPDATE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(UPDATE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return prices;
}
