"use client";

import { useCallback, useEffect, useState } from "react";

// 12h cooldown daily free spin (capas only). Each member has at most one
// pending free spin; they claim it by spinning the capas roulette.

const STORAGE_KEY = "baderna:daily-free-spin";
const UPDATE_EVENT = "baderna:daily-free-spin-updated";
const COOLDOWN_MS = 12 * 60 * 60 * 1000; // 12 hours

type Map = Record<string, number>; // memberId → ms timestamp of last claim

function readAll(): Map {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Map;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeAll(map: Map) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function useDailyFreeSpin(memberId: string): {
  isAvailable: boolean;
  msUntilNext: number;
  claim: () => void;
} {
  const [lastClaimed, setLastClaimed] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Load + listen for updates
  useEffect(() => {
    const map = readAll();
    setLastClaimed(map[memberId] ?? null);

    function refresh() {
      const next = readAll();
      setLastClaimed(next[memberId] ?? null);
    }

    window.addEventListener(UPDATE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(UPDATE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [memberId]);

  // Tick every second so the countdown UI updates; stop ticking once the
  // free spin is available again (no need to keep the timer running).
  useEffect(() => {
    if (lastClaimed === null) return;
    const remaining = lastClaimed + COOLDOWN_MS - Date.now();
    if (remaining <= 0) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [lastClaimed]);

  const nextAt = lastClaimed === null ? 0 : lastClaimed + COOLDOWN_MS;
  const isAvailable = lastClaimed === null || now >= nextAt;
  const msUntilNext = isAvailable ? 0 : nextAt - now;

  const claim = useCallback(() => {
    const map = readAll();
    map[memberId] = Date.now();
    writeAll(map);
    setLastClaimed(map[memberId]);
    setNow(Date.now());
  }, [memberId]);

  return { isAvailable, msUntilNext, claim };
}

export function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
