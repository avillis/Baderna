"use client";

import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_INHOUSE_POINTS,
  type InhousePoints,
} from "@/features/panel/inhouse-points";
import { authToken } from "@/features/panel/use-auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

const CACHE_KEY = "baderna:inhouse-points-cache";
const UPDATE_EVENT = "baderna:inhouse-points-updated";

type Mode = keyof InhousePoints;
type Outcome = "win" | "loss";

function cloneDefaults(): InhousePoints {
  return {
    flex: { ...DEFAULT_INHOUSE_POINTS.flex },
    inhouse: { ...DEFAULT_INHOUSE_POINTS.inhouse },
  };
}

function normalize(input: Partial<InhousePoints> | null): InhousePoints {
  return {
    flex: {
      win: input?.flex?.win ?? DEFAULT_INHOUSE_POINTS.flex.win,
      loss: input?.flex?.loss ?? DEFAULT_INHOUSE_POINTS.flex.loss,
    },
    inhouse: {
      win: input?.inhouse?.win ?? DEFAULT_INHOUSE_POINTS.inhouse.win,
      loss: input?.inhouse?.loss ?? DEFAULT_INHOUSE_POINTS.inhouse.loss,
    },
  };
}

function readCache(): InhousePoints {
  if (typeof window === "undefined") return cloneDefaults();
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return cloneDefaults();
    return normalize(JSON.parse(raw) as Partial<InhousePoints>);
  } catch {
    return cloneDefaults();
  }
}

function writeCache(points: InhousePoints) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(points));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

async function fetchFromApi(): Promise<InhousePoints> {
  const token = authToken();
  if (!token) throw new Error("Sem token");
  const res = await fetch(`${API_BASE}/inhouse-points`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error(`API respondeu ${res.status}`);
  return normalize((await res.json()) as Partial<InhousePoints>);
}

async function putToApi(points: InhousePoints): Promise<InhousePoints> {
  const token = authToken();
  const res = await fetch(`${API_BASE}/admin/inhouse-points`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(points),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `API respondeu ${res.status}`);
  }
  return normalize((await res.json()) as Partial<InhousePoints>);
}

export function useInhousePoints() {
  const [points, setPoints] = useState<InhousePoints>(readCache);

  useEffect(() => {
    let cancelled = false;
    fetchFromApi()
      .then((fresh) => {
        if (cancelled) return;
        setPoints(fresh);
        writeCache(fresh);
      })
      .catch(() => {
        /* mantém o cache */
      });

    function onUpdate() {
      setPoints(readCache());
    }
    window.addEventListener(UPDATE_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener(UPDATE_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const update = useCallback(
    async (mode: Mode, outcome: Outcome, value: number) => {
      // BP pode ser NEGATIVO (derrota tira pontos). NÃO usar Math.max(0,...)
      // aqui — isso zerava qualquer valor negativo antes de salvar.
      const sanitized = Math.round(value);
      const next: InhousePoints = {
        ...points,
        [mode]: { ...points[mode], [outcome]: sanitized },
      };
      setPoints(next);
      writeCache(next);
      try {
        const saved = await putToApi(next);
        setPoints(saved);
        writeCache(saved);
      } catch {
        /* ignore */
      }
    },
    [points],
  );

  return { points, update };
}
