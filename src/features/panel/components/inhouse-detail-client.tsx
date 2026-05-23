"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { InhouseDetail } from "@/features/panel/components/inhouse-lobby-board";
import { authToken } from "@/features/panel/use-auth";
import {
  matchIdFromInhouseId,
  useInhouses,
  type Inhouse,
} from "@/features/panel/use-inhouses";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

type ApiInhouse = {
  id: string;
  shortCode: string;
  payload: Inhouse;
  createdAt: number;
  createdBy?: number;
};

function unwrap(api: ApiInhouse): Inhouse {
  return {
    ...api.payload,
    id: api.id,
    shortCode: api.shortCode,
    createdAt: api.createdAt,
    createdBy: api.createdBy,
  };
}

async function fetchOne(shortCode: string): Promise<Inhouse | null> {
  try {
    const token = authToken();
    if (!token) return null;
    const res = await fetch(
      `${API_BASE}/inhouses/${encodeURIComponent(shortCode)}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as ApiInhouse;
    return unwrap(body);
  } catch {
    return null;
  }
}

export function InhouseDetailClient({ matchId }: { matchId: string }) {
  const { inhouses } = useInhouses();
  const normalised = matchId.toUpperCase();

  // Tenta achar no cache da lista primeiro (instantâneo).
  const fromList = useMemo(
    () =>
      inhouses.find(
        (i) =>
          i.shortCode === normalised ||
          matchIdFromInhouseId(i.id) === normalised,
      ),
    [inhouses, normalised],
  );

  // Se não tem na lista, busca direto pelo shortCode (mais rápido que
  // esperar o `useInhouses` carregar a lista inteira).
  const [direct, setDirect] = useState<Inhouse | null>(null);
  const [loading, setLoading] = useState(!fromList);

  useEffect(() => {
    if (fromList) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchOne(normalised).then((fresh) => {
      if (cancelled) return;
      setDirect(fresh);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [normalised, fromList]);

  const inhouse = fromList || direct;

  if (loading && !inhouse) {
    return (
      <section className="-mt-4 -mb-10 flex h-screen w-full flex-col items-center justify-center px-4 text-center sm:-mt-6 xl:-mt-[45px]">
        <svg className="capas-spinner h-[40px] w-[40px] text-[#ff4100]" viewBox="25 25 50 50">
          <circle r="20" cy="50" cx="50" />
        </svg>
      </section>
    );
  }

  if (!inhouse) {
    return (
      <section className="-mt-4 -mb-10 flex h-screen w-full flex-col items-center justify-center px-4 text-center sm:-mt-6 xl:-mt-[45px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/gifs/sad-riot.gif"
          alt=""
          className="mb-[18px] h-[180px] w-[180px] object-contain"
        />
        <p className="text-[16px] font-semibold tracking-[-0.02em] text-[#0f0f0f]">
          Inhouse não encontrado.
        </p>
        <p className="mt-[6px] text-[13px] text-[#7c7c7c]">
          O link pode ter expirado ou esse inhouse foi removido.
        </p>
        <Link
          href="/inhouse"
          className="mt-[18px] inline-flex h-[50px] items-center justify-center gap-[6px] rounded-[18px] bg-[#0f0f0f] px-6 text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-85"
        >
          <ChevronLeft className="h-[16px] w-[16px]" strokeWidth={2.4} />
          Voltar para lista
        </Link>
      </section>
    );
  }

  return <InhouseDetail inhouse={inhouse} />;
}
