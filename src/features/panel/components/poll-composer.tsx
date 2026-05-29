"use client";

import { Plus, X } from "lucide-react";
import { useRef, useState } from "react";

import { useToast } from "@/components/toast";
import { uploadPostImage } from "@/features/panel/use-posts";

export type PollEditorOption = {
  key: string;
  text: string;
  imageUrl: string | null;
};

export type PollEditorState = {
  title: string;
  multiple: boolean;
  days: number;
  hours: number;
  minutes: number;
  options: PollEditorOption[];
};

export const MAX_POLL_OPTIONS = 6;
export const MIN_POLL_OPTIONS = 2;
const MAX_OPTION_LEN = 25;
const MAX_TITLE_LEN = 200;

let optionKeySeq = 0;
function newOptionKey(): string {
  optionKeySeq += 1;
  return `opt-${optionKeySeq}`;
}

export function makeEmptyPoll(): PollEditorState {
  return {
    title: "",
    multiple: false,
    days: 1,
    hours: 0,
    minutes: 0,
    options: [
      { key: newOptionKey(), text: "", imageUrl: null },
      { key: newOptionKey(), text: "", imageUrl: null },
    ],
  };
}

/** Total em minutos, com clamp [5, 10080] (5min..7d). 0 → default 1 dia. */
export function pollDurationMinutes(p: PollEditorState): number {
  const total = p.days * 1440 + p.hours * 60 + p.minutes;
  if (total <= 0) return 1440;
  return Math.max(5, Math.min(10080, total));
}

/** Enquete válida pra postar: >=2 opções com texto. Título é opcional
 *  (a pergunta pode ir no texto do post, estilo Twitter). */
export function isPollValid(p: PollEditorState): boolean {
  const filled = p.options.filter((o) => o.text.trim().length > 0);
  return filled.length >= MIN_POLL_OPTIONS;
}

function rangeOptions(max: number) {
  return Array.from({ length: max + 1 }, (_, i) => i);
}

export function PollComposer({
  value,
  onChange,
  onRemove,
}: {
  value: PollEditorState;
  onChange: (next: PollEditorState) => void;
  onRemove: () => void;
}) {
  const toast = useToast();
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingOptionKey = useRef<string | null>(null);

  function patch(partial: Partial<PollEditorState>) {
    onChange({ ...value, ...partial });
  }

  function setOption(key: string, partial: Partial<PollEditorOption>) {
    patch({
      options: value.options.map((o) => (o.key === key ? { ...o, ...partial } : o)),
    });
  }

  function addOption() {
    if (value.options.length >= MAX_POLL_OPTIONS) return;
    patch({ options: [...value.options, { key: newOptionKey(), text: "", imageUrl: null }] });
  }

  function removeOption(key: string) {
    if (value.options.length <= MIN_POLL_OPTIONS) return;
    patch({ options: value.options.filter((o) => o.key !== key) });
  }

  function triggerImagePick(key: string) {
    pendingOptionKey.current = key;
    fileInputRef.current?.click();
  }

  async function handleFile(file: File) {
    const key = pendingOptionKey.current;
    pendingOptionKey.current = null;
    if (!key) return;
    setUploadingKey(key);
    try {
      const url = await uploadPostImage(file);
      if (!url) throw new Error("Falha no upload.");
      setOption(key, { imageUrl: url });
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setUploadingKey(null);
    }
  }

  const selectClass =
    "w-full appearance-none rounded-[12px] border border-[#e6e0dd] bg-white px-[12px] py-[10px] text-[13px] font-semibold tracking-[-0.02em] text-[#0f0f0f] outline-none focus:ring-2 focus:ring-[#ff4100]/20";

  return (
    <div className="rounded-[16px] border border-[#e6e0dd] p-[14px]">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
      />

      {/* Título da enquete */}
      <input
        type="text"
        value={value.title}
        onChange={(e) => patch({ title: e.target.value.slice(0, MAX_TITLE_LEN) })}
        placeholder="Pergunta da enquete (opcional)"
        className="mb-[12px] w-full border-none bg-transparent text-[15px] font-semibold tracking-[-0.01em] text-[#0f0f0f] outline-none placeholder:text-[#a89e99]"
      />

      {/* Opções */}
      <div className="flex flex-col gap-[10px]">
        {value.options.map((opt, i) => {
          const removable = value.options.length > MIN_POLL_OPTIONS;
          const isLast = i === value.options.length - 1;
          const canAdd = isLast && value.options.length < MAX_POLL_OPTIONS;
          return (
            <div key={opt.key} className="flex items-center gap-[8px]">
              {/* Botão/preview de imagem da opção */}
              <button
                type="button"
                onClick={() => triggerImagePick(opt.key)}
                disabled={uploadingKey === opt.key}
                aria-label="Imagem da opção"
                className="relative flex h-[44px] w-[44px] shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#ededed] text-[#8d8d8d] transition-colors hover:bg-[#e3e3e3] disabled:opacity-60"
              >
                {opt.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={opt.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : uploadingKey === opt.key ? (
                  <svg
                    className="capas-spinner h-[16px] w-[16px] [&_circle]:stroke-[#ff4100]"
                    viewBox="25 25 50 50"
                  >
                    <circle r="20" cy="50" cx="50" />
                  </svg>
                ) : (
                  <svg
                    className="h-[24px] w-[24px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <clipPath id="poll-img-icon-clip">
                        <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
                      </clipPath>
                    </defs>
                    <rect
                      x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="5"
                      ry="5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <g clipPath="url(#poll-img-icon-clip)">
                      <circle cx="8.5" cy="9" r="1.6" stroke="currentColor" strokeWidth="1.5" />
                      <path
                        d="M21 15.5L16.5 11L6 21.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  </svg>
                )}
                {opt.imageUrl && (
                  <span
                    role="button"
                    aria-label="Remover imagem"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOption(opt.key, { imageUrl: null });
                    }}
                    className="absolute right-[2px] top-[2px] flex h-[16px] w-[16px] items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X className="h-[9px] w-[9px]" strokeWidth={2.6} />
                  </span>
                )}
              </button>

              {/* Texto da opção */}
              <div className="relative flex flex-1 items-center rounded-[12px] border border-[#e6e0dd] px-[12px] focus-within:border-[#ff4100]/40 focus-within:ring-2 focus-within:ring-[#ff4100]/15">
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => setOption(opt.key, { text: e.target.value.slice(0, MAX_OPTION_LEN) })}
                  placeholder={`Opção ${i + 1}`}
                  className="min-w-0 flex-1 border-none bg-transparent py-[11px] text-[14px] tracking-[-0.01em] text-[#0f0f0f] outline-none placeholder:text-[#a89e99]"
                />
                <span className="ml-[8px] shrink-0 text-[11px] font-medium text-[#b0a8a4]">
                  {opt.text.length}/{MAX_OPTION_LEN}
                </span>
              </div>

              {/* Adicionar (na última linha) ou remover */}
              {canAdd ? (
                <button
                  type="button"
                  onClick={addOption}
                  aria-label="Adicionar opção"
                  className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full text-[#0f0f0f] transition-colors hover:bg-[#ededed]"
                >
                  <Plus className="h-[18px] w-[18px]" strokeWidth={2.4} />
                </button>
              ) : removable ? (
                <button
                  type="button"
                  onClick={() => removeOption(opt.key)}
                  aria-label="Remover opção"
                  className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full text-[#b0a8a4] transition-colors hover:bg-[#f0e9e5] hover:text-[#c53030]"
                >
                  <X className="h-[16px] w-[16px]" strokeWidth={2.4} />
                </button>
              ) : (
                <span className="h-[28px] w-[28px] shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Duração */}
      <div className="mt-[16px] border-t border-[#f0e9e5] pt-[14px]">
        <p className="mb-[8px] text-[12px] font-semibold tracking-[-0.02em] text-[#8d8d8d]">
          Duração da enquete
        </p>
        <div className="grid grid-cols-3 gap-[8px]">
          <label className="flex flex-col gap-[4px]">
            <span className="text-[11px] font-medium text-[#b0a8a4]">Dias</span>
            <select
              value={value.days}
              onChange={(e) => patch({ days: Number(e.target.value) })}
              className={selectClass}
            >
              {rangeOptions(7).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-[4px]">
            <span className="text-[11px] font-medium text-[#b0a8a4]">Horas</span>
            <select
              value={value.hours}
              onChange={(e) => patch({ hours: Number(e.target.value) })}
              className={selectClass}
            >
              {rangeOptions(23).map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-[4px]">
            <span className="text-[11px] font-medium text-[#b0a8a4]">Minutos</span>
            <select
              value={value.minutes}
              onChange={(e) => patch({ minutes: Number(e.target.value) })}
              className={selectClass}
            >
              {rangeOptions(59).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Múltipla escolha + remover */}
      <div className="mt-[14px] flex items-center justify-between gap-[12px]">
        <label className="flex cursor-pointer items-center gap-[10px]">
          <div
            role="checkbox"
            aria-checked={value.multiple}
            onClick={() => patch({ multiple: !value.multiple })}
            className={`relative h-[20px] w-[36px] shrink-0 cursor-pointer rounded-[6px] transition-colors duration-[400ms] ${
              value.multiple ? "bg-[#ff4100]" : "bg-[#ededed]"
            }`}
          >
            <span
              className="absolute bottom-[2px] left-[2px] h-[16px] w-[16px] rounded-[4px] bg-white shadow transition-all duration-[400ms]"
              style={{ transform: value.multiple ? "translateX(16px)" : "rotate(270deg)" }}
            />
          </div>
          <span className="text-[12px] font-semibold tracking-[-0.02em] text-[#8d8d8d]">
            Permitir marcar mais de uma opção
          </span>
        </label>

        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-[12px] font-bold tracking-[-0.02em] text-[#e0245e] transition-opacity hover:opacity-80"
        >
          Remover enquete
        </button>
      </div>
    </div>
  );
}
