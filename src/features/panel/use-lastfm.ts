"use client";

import { useCallback, useEffect, useState } from "react";
import { authToken } from "@/features/panel/use-auth";
import type { SpotifyTrack } from "@/features/panel/use-spotify";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

// LastFmTrack é compatível com SpotifyTrack para reutilizar o track-picker modal.
export type LastFmTrack = SpotifyTrack & { nowPlaying?: boolean };

export type LastFmData = {
  connected: boolean;
  username?: string;
  topTracks: LastFmTrack[];
  topTracksRange: "short" | "medium";
  recentlyPlayed: LastFmTrack[];
};

function authHeaders() {
  const token = authToken();
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/** Hook para os dados Last.fm do usuário autenticado (Minha Conta). */
export function useMyLastFm() {
  const [data, setData] = useState<LastFmData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const token = authToken();
    if (!token) { setLoading(false); return; }
    try {
      const r = await fetch(`${API_BASE}/lastfm/me`, { headers: authHeaders() });
      if (r.ok) setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /** Salva ou remove o username Last.fm. Passa null para desconectar. */
  const saveUsername = useCallback(async (username: string | null) => {
    setSaving(true);
    try {
      const r = await fetch(`${API_BASE}/lastfm/username`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ username: username || null }),
      });
      if (r.ok) setData(await r.json());
    } finally {
      setSaving(false);
    }
  }, []);

  return { data, loading, saving, saveUsername, reload: load };
}

/** Hook para os dados Last.fm públicos de um membro (página de perfil). */
export function useMemberLastFm(slug: string | null) {
  const [data, setData] = useState<LastFmData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    fetch(`${API_BASE}/lastfm/user/${slug}`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, [slug]);

  return { data, loading };
}
