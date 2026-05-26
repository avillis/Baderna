"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Beta public key da Giphy. Suficiente pra MVP — tem rate limit baixo mas
// não exige cadastro. Troca por uma key própria em produção via env.
const GIPHY_KEY =
  process.env.NEXT_PUBLIC_GIPHY_API_KEY ?? "dc6zaTOxFJmzC";

type Gif = {
  id: string;
  url: string;
  previewUrl: string;
};

async function search(query: string): Promise<Gif[]> {
  const endpoint = query
    ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=24&rating=pg-13`
    : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=24&rating=pg-13`;

  const res = await fetch(endpoint);
  if (!res.ok) return [];
  const data = (await res.json()) as {
    data?: Array<{
      id: string;
      images: {
        fixed_height: { url: string };
        fixed_height_small: { url: string };
      };
    }>;
  };
  return (data.data ?? []).map((g) => ({
    id: g.id,
    url: g.images.fixed_height.url,
    previewUrl: g.images.fixed_height_small?.url ?? g.images.fixed_height.url,
  }));
}

/**
 * Painel inline de Giphy (não é modal). Renderiza logo abaixo do composer
 * quando aberto. Tem busca + grade de previews.
 */
export function GiphyPickerInline({
  open,
  onSelect,
}: {
  open: boolean;
  onSelect: (url: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      search(query)
        .then((list) => setGifs(list))
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [open, query]);

  if (!open) return null;

  return (
    <div className="mt-[12px] overflow-hidden rounded-[16px] border border-[#ededed] bg-[#fafafa]">
      <div className="border-b border-[#ededed] p-[12px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-[18px] top-1/2 h-[16px] w-[16px] -translate-y-1/2 text-[#b0a8a4]" strokeWidth={2} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar GIFs no Giphy..."
            autoFocus
            className="w-full rounded-full border-none bg-white py-[10px] pl-[44px] pr-[16px] text-[13px] font-medium text-[#0f0f0f] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)] outline-none placeholder:text-[#b0a8a4] focus:ring-2 focus:ring-[#ff4100]/20"
          />
        </div>
      </div>

      <div className="grid max-h-[340px] grid-cols-2 gap-[8px] overflow-y-auto p-[12px] sm:grid-cols-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {loading && gifs.length === 0 && (
          <p className="col-span-full py-[28px] text-center text-[13px] text-[#8d8d8d]">
            Carregando GIFs...
          </p>
        )}
        {!loading && gifs.length === 0 && (
          <p className="col-span-full py-[28px] text-center text-[13px] text-[#8d8d8d]">
            Nenhum GIF encontrado.
          </p>
        )}
        {gifs.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => onSelect(g.url)}
            className="group relative overflow-hidden rounded-[12px] bg-[#ededed] transition-transform hover:scale-[1.03]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={g.previewUrl}
              alt=""
              className="aspect-video w-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
