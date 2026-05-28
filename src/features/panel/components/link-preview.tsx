"use client";

import { useEffect, useState } from "react";

import { authToken } from "@/features/panel/use-auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

type PreviewData = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
};

export function LinkPreview({ url }: { url: string }) {
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = authToken();
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/link-preview?url=${encodeURIComponent(url)}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: PreviewData | null) => {
        setData(json);
      })
      .catch(() => {
        setData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [url]);

  if (loading) {
    return (
      <div className="mt-[12px] animate-pulse rounded-[16px] border border-[#ededed] overflow-hidden">
        <div className="h-[160px] bg-[#f4f4f4]" />
        <div className="p-[14px] flex flex-col gap-[8px]">
          <div className="h-[10px] w-[60px] rounded bg-[#ededed]" />
          <div className="h-[14px] w-[80%] rounded bg-[#ededed]" />
          <div className="h-[12px] w-full rounded bg-[#ededed]" />
        </div>
      </div>
    );
  }

  if (!data || (!data.title && !data.image)) {
    return null;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="mt-[12px] block rounded-[16px] overflow-hidden border border-[#ededed] transition-colors hover:border-[#d8d8d8] hover:bg-[#fafafa]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {data.image && (
        <img
          src={data.image}
          alt=""
          className="w-full object-cover max-h-[200px]"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      <div className="p-[14px]">
        {data.siteName && (
          <p className="text-[11px] text-[#8d8d8d] mb-[4px]">
            {data.siteName}
          </p>
        )}
        {data.title && (
          <p className="text-[14px] font-semibold text-[#0f0f0f] leading-snug">
            {data.title}
          </p>
        )}
        {data.description && (
          <p className="mt-[4px] text-[12px] text-[#7c7c7c] line-clamp-2 leading-relaxed">
            {data.description}
          </p>
        )}
      </div>
    </a>
  );
}
