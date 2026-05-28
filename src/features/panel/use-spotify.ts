"use client";

import { useCallback, useEffect, useState } from "react";
import { authToken } from "@/features/panel/use-auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

export type SpotifyTrack = {
  id: string;
  name: string;
  artist: string;
  album: string | null;
  image: string | null;
  url: string | null;
  preview: string | null;
  playedAt?: string;
};

export type SpotifyData = {
  connected: boolean;
  topTracks: SpotifyTrack[];
  topTracksRange: "short" | "medium";
  recentlyPlayed: SpotifyTrack[];
};

function authHeaders() {
  const token = authToken();
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/** Hook for the authenticated user's own Spotify data (Minha Conta). */
export function useMySpotify() {
  const [data, setData] = useState<SpotifyData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = authToken();
    if (!token) { setLoading(false); return; }
    try {
      const r = await fetch(`${API_BASE}/spotify/me`, { headers: authHeaders() });
      if (r.ok) setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /** Redirect user to Spotify OAuth consent screen. */
  const connect = useCallback(async () => {
    const r = await fetch(`${API_BASE}/spotify/redirect`, { headers: authHeaders() });
    if (!r.ok) return;
    const { url } = await r.json();
    window.location.href = url;
  }, []);

  /** Remove stored tokens. */
  const disconnect = useCallback(async () => {
    await fetch(`${API_BASE}/spotify/disconnect`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    setData({ connected: false, topTracks: [], recentlyPlayed: [] });
  }, []);

  return { data, loading, connect, disconnect, reload: load };
}

/** Hook for a public member's Spotify data (profile page). */
export function useMemberSpotify(slug: string | null) {
  const [data, setData] = useState<SpotifyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    fetch(`${API_BASE}/spotify/user/${slug}`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, [slug]);

  return { data, loading };
}
