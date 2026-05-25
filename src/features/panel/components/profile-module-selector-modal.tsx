"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useToast } from "@/components/toast";

import type { ProfileModuleId } from "@/features/panel/components/profile-modules";
import {
  ALL_CONFIGURABLE_MODULE_IDS,
  LOL_LOCKED_MODULE_IDS,
} from "@/features/panel/components/profile-modules";

type ModuleMeta = {
  id: ProfileModuleId;
  label: string;
  description: string;
  lol?: true;
};

export const MODULE_META: ModuleMeta[] = [
  {
    id: "lol-rank",
    label: "Ranking LoL",
    description: "Seu elo atual na fila flex.",
    lol: true,
  },
  {
    id: "featured-champion",
    label: "Campeão mais jogado",
    description: "Champ com mais partidas no histórico.",
    lol: true,
  },
  {
    id: "top-champions",
    label: "Top 3 favoritos",
    description: "3 champs que você escolhe à mão.",
    lol: true,
  },
  {
    id: "collection",
    label: "Coleção",
    description: "Capas, títulos e estilos desbloqueados.",
  },
  {
    id: "participation",
    label: "Participação",
    description: "Posts, comentários e mural.",
  },
  {
    id: "duo",
    label: "Duo favorito",
    description: "Parceiro da Baderna em destaque.",
  },
  {
    id: "community-highlight",
    label: "Destaque",
    description: "Badge dado pelo admin.",
  },
  {
    id: "favorite-game",
    label: "Jogo favorito",
    description: "Seu jogo atual com capa.",
  },
  {
    id: "member-since",
    label: "Tempo de casa",
    description: "Há quantos meses você está na Baderna.",
  },
  {
    id: "showcase",
    label: "Vitrine",
    description: "3 itens da coleção em destaque.",
  },
];


// ── Picker inline (abre dentro do slot) ───────────────────────────────────

function ModulePicker({
  current,
  hasRiotId,
  occupied: occupiedRaw,
  onChange,
  onClose,
}: {
  current: ProfileModuleId | null;
  hasRiotId: boolean;
  occupied: ProfileModuleId[];
  onChange: (id: ProfileModuleId) => void;
  onClose: () => void;
}) {
  const occupied = new Set(occupiedRaw);
  return (
    <div className="mt-[8px] overflow-hidden rounded-[14px] border border-[#f0f0f0] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.10)]">
      <div className="max-h-[260px] overflow-y-auto p-[6px]">
        {MODULE_META.map((mod) => {
          const locked = LOL_LOCKED_MODULE_IDS.has(mod.id) && !hasRiotId;
          const taken = occupied.has(mod.id) && mod.id !== current;
          const active = mod.id === current;
          return (
            <button
              key={mod.id}
              type="button"
              disabled={locked || taken}
              onClick={() => {
                onChange(mod.id);
                onClose();
              }}
              className={`flex w-full items-center gap-[10px] rounded-[10px] px-[12px] py-[9px] text-left transition-colors ${
                active
                  ? "bg-[#0f0f0f] text-white"
                  : locked || taken
                    ? "cursor-not-allowed opacity-40"
                    : "hover:bg-[#f5f5f5]"
              }`}
            >
              <span className={`flex-1 text-[12px] font-bold tracking-[-0.02em] ${active ? "text-white" : "text-[#0f0f0f]"}`}>
                {mod.label}
              </span>
              {mod.lol && (
                <span className={`inline-flex h-[28px] w-[28px] items-center justify-center rounded-full ${active ? "bg-white/20" : "bg-[#fff0ec]"}`}>
                  <Image
                    src="/icons/lol_logo.png"
                    alt="League of Legends"
                    width={18}
                    height={18}
                    className="h-[18px] w-[18px] object-contain"
                  />
                </span>
              )}
              {taken && (
                <span className="rounded-full bg-[#f0f0f0] px-[7px] py-[2px] text-[10px] font-medium text-[#8d8d8d]">
                  em uso
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Linha de slot ─────────────────────────────────────────────────────────

function SlotRow({
  number,
  fixed,
  fixedLabel,
  fixedReason,
  current,
  hasRiotId,
  allSelected,
  onSelect,
}: {
  number: number;
  fixed?: boolean;
  fixedLabel?: string;
  fixedReason?: string;
  current?: ProfileModuleId | null;
  hasRiotId: boolean;
  allSelected: ProfileModuleId[];
  onSelect?: (id: ProfileModuleId) => void;
}) {
  const [open, setOpen] = useState(false);
  const meta = current ? MODULE_META.find((m) => m.id === current) : null;

  return (
    <div className="mb-[6px]">
      <div
        className={`flex items-center gap-[12px] rounded-[14px] px-[16px] py-[12px] ${
          fixed ? "bg-[#f7f7f7]" : "bg-[#f0f0f0] cursor-pointer hover:bg-[#e8e8e8]"
        }`}
        onClick={() => !fixed && setOpen((v) => !v)}
      >
        {/* Número */}
        <div className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${fixed ? "bg-[#e0e0e0] text-[#8d8d8d]" : "bg-[#0f0f0f] text-white"}`}>
          {number}
        </div>

        {/* Label */}
        <div className="flex-1 min-w-0">
          {fixed ? (
            <>
              <p className="text-[13px] font-bold tracking-[-0.02em] text-[#8d8d8d]">
                {fixedLabel}
              </p>
              {fixedReason && (
                <p className="mt-[1px] text-[11px] font-medium text-[#c0c0c0]">
                  {fixedReason}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-[13px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
                {meta?.label ?? "Escolher módulo…"}
              </p>
              {meta && (
                <p className="mt-[1px] truncate text-[11px] font-medium text-[#8d8d8d]">
                  {meta.description}
                </p>
              )}
            </>
          )}
        </div>

        {/* Lock / chevron */}
        {fixed ? (
          <svg viewBox="0 0 24 24" fill="none" className="h-[14px] w-[14px] shrink-0 text-[#c0c0c0]" stroke="currentColor" strokeWidth={2.2}>
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" className={`h-[14px] w-[14px] shrink-0 text-[#8d8d8d] transition-transform ${open ? "rotate-180" : ""}`} stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        )}
      </div>

      {open && onSelect && (
        <ModulePicker
          current={current ?? null}
          hasRiotId={hasRiotId}
          occupied={allSelected}
          onChange={onSelect}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

// ── Modal principal ───────────────────────────────────────────────────────

type Props = {
  currentOrder: string[];
  hasRiotId: boolean;
  onSave: (order: ProfileModuleId[]) => Promise<boolean> | boolean;
  onClose: () => void;
};

export function ProfileModuleSelectorModal({
  currentOrder,
  hasRiotId,
  onSave,
  onClose,
}: Props) {
  const toast = useToast();
  const validIds = new Set<string>(ALL_CONFIGURABLE_MODULE_IDS);

  // Para LoL: 2 slots configuráveis (slots 3 e 4)
  // Para não-LoL: 3 slots configuráveis (slots 1, 3 e 4)
  const slotCount = hasRiotId ? 2 : 3;
  const normalizeOrder = (raw: string[]): ProfileModuleId[] => {
    const filtered = raw.filter((id): id is ProfileModuleId => validIds.has(id));
    return filtered.slice(0, slotCount);
  };

  const [selected, setSelected] = useState<(ProfileModuleId | null)[]>(() => {
    const norm = normalizeOrder(currentOrder);
    return Array.from({ length: slotCount }, (_, i) => norm[i] ?? null);
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function setSlot(i: number, id: ProfileModuleId) {
    setSelected((prev) => {
      const next = [...prev];
      next[i] = id;
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const ok = await onSave(
        selected.filter((id): id is ProfileModuleId => id !== null),
      );
      if (!ok) {
        toast.show("Não foi possível salvar os cards.");
        return;
      }
      toast.show("Cards salvos.", "success");
      onClose();
    } catch {
      toast.show("Não foi possível salvar os cards.");
    } finally {
      setSaving(false);
    }
  }

  const allSelected = selected.filter((id): id is ProfileModuleId => id !== null);

  // Monta os 4 slots para exibição:
  //   LoL:     [FIXO lane] [FIXO baderna] [config[0]] [config[1]]
  //   não-LoL: [config[0]] [FIXO baderna] [config[1]] [config[2]]
  const slots = hasRiotId
    ? [
        { fixed: true, label: "Posição / Lane", reason: "Fixo para jogadores LoL", configIdx: null },
        { fixed: true, label: "Rank da Baderna", reason: "Sempre fixo", configIdx: null },
        { fixed: false, configIdx: 0 },
        { fixed: false, configIdx: 1 },
      ]
    : [
        { fixed: false, configIdx: 0 },
        { fixed: true, label: "Rank da Baderna", reason: "Sempre fixo", configIdx: null },
        { fixed: false, configIdx: 1 },
        { fixed: false, configIdx: 2 },
      ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[3px]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative mx-4 w-full max-w-[440px] overflow-hidden rounded-[28px] bg-white shadow-[0_32px_80px_rgba(0,0,0,0.22)]">
        {/* Header */}
        <div className="flex items-center justify-between px-[24px] pt-[24px] pb-[16px]">
          <div>
            <p className="text-[17px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
              Editar cards
            </p>
            <p className="mt-[2px] text-[12px] font-medium tracking-[-0.02em] text-[#8d8d8d]">
              4 slots fixos · {slotCount === 2 ? "2" : "3"} configuráveis
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#ff4100] text-white transition-opacity hover:opacity-90"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-[14px] w-[14px]" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Slots */}
        <div className="px-[16px] pb-[8px]">
          {slots.map((slot, idx) =>
            slot.fixed ? (
              <SlotRow
                key={idx}
                number={idx + 1}
                fixed
                fixedLabel={slot.label}
                fixedReason={slot.reason}
                hasRiotId={hasRiotId}
                allSelected={allSelected}
              />
            ) : (
              <SlotRow
                key={idx}
                number={idx + 1}
                current={slot.configIdx !== null ? selected[slot.configIdx] : null}
                hasRiotId={hasRiotId}
                allSelected={allSelected}
                onSelect={(id) => slot.configIdx !== null && setSlot(slot.configIdx, id)}
              />
            ),
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#f0f0f0] px-[24px] py-[18px]">
          <p className="text-[11px] font-medium text-[#8d8d8d]">
            Clique em um slot para trocar
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex h-[40px] items-center justify-center gap-[8px] rounded-[12px] bg-[#0f0f0f] px-[20px] text-[13px] font-bold tracking-[-0.02em] text-white hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <svg
                  className="capas-spinner h-[16px] w-[16px] [&_circle]:stroke-white"
                  viewBox="25 25 50 50"
                >
                  <circle r="20" cy="50" cx="50" />
                </svg>
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
