"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";

import { getChampionTileSrc } from "@/features/panel/champion-avatar";
import { useFeaturedChampions } from "@/features/panel/use-featured-champions";
import { FeaturedChampionsModal } from "@/features/panel/components/featured-champions-modal";

export function FeaturedChampions({
  memberId,
  targetUserId,
}: {
  memberId?: string;
  targetUserId?: number | null;
}) {
  const { champions, setChampions, isOwn } = useFeaturedChampions(
    memberId,
    targetUserId,
  );
  const [open, setOpen] = useState(false);

  // Perfil de outro membro sem mains escolhidos → não mostra nada.
  if (!isOwn && champions.length === 0) return null;

  return (
    <div className="mt-[20px] px-[16px] sm:px-0 sm:pl-[42px]">
      <div className="mb-[10px] flex items-center gap-[8px] text-[12px] font-bold tracking-[-0.02em] text-[#989898]">
        Mains
        {isOwn && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Editar mains"
            className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#ededed] text-[#0f0f0f] transition-colors hover:bg-[#e3e3e3]"
          >
            <Pencil className="h-[12px] w-[12px]" strokeWidth={2.2} />
          </button>
        )}
      </div>

      {champions.length > 0 ? (
        <div className="flex gap-[10px]">
          {champions.map((file) => (
            <div
              key={file}
              className="h-[56px] w-[56px] overflow-hidden rounded-[14px] bg-[#ededed] ring-1 ring-[#ece1db]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getChampionTileSrc(file)}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      ) : isOwn ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-[44px] items-center justify-center rounded-[14px] bg-[#ededed] px-[16px] text-[13px] font-bold tracking-[-0.02em] text-[#0f0f0f] transition-colors hover:bg-[#e3e3e3]"
        >
          + Escolher mains
        </button>
      ) : null}

      {open && (
        <FeaturedChampionsModal
          initial={champions}
          onClose={() => setOpen(false)}
          onSave={(c) => {
            setChampions(c);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}
