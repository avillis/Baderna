"use client";

import { useEffect, useState } from "react";

import { authToken } from "@/features/panel/use-auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

export type BpEvent = {
  type: "flex" | "inhouse";
  result: "win" | "loss";
  bp: number;
  date: string | null;
  matchId?: string;
  shortCode?: string;
  teamName?: string;
};

export type BpLogRow = {
  userId: number;
  nickname: string;
  name: string;
  avatarSrc: string | null;
  activeNameId: string | null;
  slug: string;
  flexWins: number;
  flexLosses: number;
  flexBp: number;
  inhouseWins: number;
  inhouseLosses: number;
  inhouseBp: number;
  totalBp: number;
  events: BpEvent[];
};

export type BpLogConfig = {
  flexWin: number;
  flexLoss: number;
  inhouseWin: number;
  inhouseLoss: number;
};

type BpLogResponse = {
  config: BpLogConfig;
  rows: BpLogRow[];
};

export function useBadernaPointsLog() {
  const [rows, setRows] = useState<BpLogRow[]>([]);
  const [config, setConfig] = useState<BpLogConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = authToken();
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch(`${API_BASE}/admin/bp-log`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: BpLogResponse | null) => {
        if (cancelled) return;
        if (!data) {
          setLoading(false);
          return;
        }
        setRows(data.rows ?? []);
        setConfig(data.config ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { rows, config, loading };
}
