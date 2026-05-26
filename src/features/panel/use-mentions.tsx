"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useBadernaMembers } from "@/features/panel/use-baderna-members";
import type { BadernaMember } from "@/features/panel/members-data";

type InputLike = HTMLInputElement | HTMLTextAreaElement;

/** Match @slug no fim do texto antes do caret (slug = a-z0-9 + hifens). */
const TRIGGER_RE = /(?:^|\s)@([a-zA-Z0-9-]*)$/;
/** Cap alto pra mostrar todos os membros (dropdown é scrollável de qualquer
 *  jeito via max-h + overflow-y-auto). Mantém um limite só pra futuro-proof
 *  caso a comunidade cresça pra milhares. */
const MAX_RESULTS = 100;

export interface UseMentionsArgs {
  value: string;
  onChange: (next: string) => void;
  inputRef: React.RefObject<InputLike | null>;
  /** Opcional: classe extra no container do dropdown (z-index, posicionamento). */
  dropdownClassName?: string;
}

export interface UseMentionsReturn {
  /** Handler de teclado pra navegação no dropdown (Arrow/Enter/Tab/Esc).
   *  Plugar em `onKeyDown` do input. */
  onKeyDown: (e: React.KeyboardEvent) => void;
  /** Handler pra detectar mudança de caret (clique, teclas de navegação)
   *  sem alterar o valor. Plugar em `onSelect` / `onClick` do input. */
  onSelect: () => void;
  /** Nó React do dropdown (já posicionado). Renderizar como irmão do input
   *  dentro de um container `relative`. Retorna null quando fechado. */
  dropdown: React.ReactNode;
  /** Verdadeiro quando o dropdown está aberto — útil pro consumer decidir
   *  se Enter deve submeter o form ou se foi consumido aqui. */
  isOpen: boolean;
}

/**
 * Gerencia o autocomplete de @menções num input ou textarea.
 *
 * O consumer é dono do input (controlado): passa `value`, `onChange` e o
 * `inputRef`. O hook detecta padrões `@xxx` antes do caret, abre um dropdown
 * com membros filtrados e, ao selecionar, substitui o trecho `@xxx` por
 * `@{slug do membro} `.
 */
export function useMentions({
  value,
  onChange,
  inputRef,
  dropdownClassName,
}: UseMentionsArgs): UseMentionsReturn {
  const members = useBadernaMembers();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // Índice no `value` onde o `@` da menção atual começa
  const [matchStart, setMatchStart] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);

  // Filtra por slug, nickname e nome (case-insensitive)
  const results = useMemo<BadernaMember[]>(() => {
    if (!open) return [];
    const q = query.toLowerCase();
    if (!q) return members.slice(0, MAX_RESULTS);
    return members
      .filter(
        (m) =>
          m.id.toLowerCase().includes(q) ||
          m.nickname.toLowerCase().includes(q) ||
          (m.name ?? "").toLowerCase().includes(q),
      )
      .slice(0, MAX_RESULTS);
  }, [members, open, query]);

  // Reset do índice ativo sempre que a lista muda
  useEffect(() => {
    setActiveIdx(0);
  }, [results.length, query]);

  // Detecta menção próxima ao caret a cada mudança de valor ou caret
  const detect = useCallback(() => {
    const el = inputRef.current;
    if (!el) {
      if (open) setOpen(false);
      return;
    }
    const caret = el.selectionStart ?? value.length;
    const before = value.substring(0, caret);
    const m = before.match(TRIGGER_RE);
    if (m) {
      // Posição do @ no value (não no `before`, mas dá no mesmo aqui)
      const atIdx =
        before.length - m[0].length + (m[0].startsWith("@") ? 0 : 1);
      setOpen(true);
      setQuery(m[1]);
      setMatchStart(atIdx);
    } else if (open) {
      setOpen(false);
    }
  }, [inputRef, open, value]);

  // Roda detect() depois que o React aplica o novo valor no DOM
  useLayoutEffect(() => {
    detect();
  }, [value, detect]);

  // Substitui @query pelo @slug do membro escolhido + espaço
  const selectMember = useCallback(
    (member: BadernaMember) => {
      const el = inputRef.current;
      if (!el) return;
      const caret = el.selectionStart ?? value.length;
      const before = value.substring(0, matchStart);
      const after = value.substring(caret);
      const insertion = `@${member.id} `;
      const next = `${before}${insertion}${after}`;
      onChange(next);
      setOpen(false);
      // Caret depois do espaço; usa rAF pra esperar React aplicar `value`
      const newCaret = before.length + insertion.length;
      requestAnimationFrame(() => {
        try {
          el.focus();
          el.setSelectionRange(newCaret, newCaret);
        } catch {
          /* input desmontado */
        }
      });
    },
    [inputRef, matchStart, onChange, value],
  );

  // Refs estáveis pros handlers (evita stale closures dentro do onKeyDown)
  const resultsRef = useRef(results);
  const activeIdxRef = useRef(activeIdx);
  const openRef = useRef(open);
  useEffect(() => {
    resultsRef.current = results;
    activeIdxRef.current = activeIdx;
    openRef.current = open;
  });

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!openRef.current) return;
      const list = resultsRef.current;
      if (list.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => (i + 1) % list.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => (i - 1 + list.length) % list.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectMember(list[activeIdxRef.current]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    },
    [selectMember],
  );

  const onSelect = useCallback(() => {
    detect();
  }, [detect]);

  const dropdown =
    open && results.length > 0 ? (
      <div
        className={`absolute z-50 mt-[6px] max-h-[260px] w-[260px] overflow-y-auto rounded-[14px] bg-white py-[4px] shadow-[0px_12px_40px_rgba(0,0,0,0.16)] [&::-webkit-scrollbar]:hidden [scrollbar-width:none] ${
          dropdownClassName ?? "left-0 top-full"
        }`}
        // Evita que o input perca foco quando clica no dropdown
        onMouseDown={(e) => e.preventDefault()}
      >
        {results.map((m, i) => (
          <button
            key={m.id}
            type="button"
            onClick={() => selectMember(m)}
            onMouseEnter={() => setActiveIdx(i)}
            className={`flex w-full items-center gap-[10px] px-[12px] py-[6px] text-left transition-colors ${
              i === activeIdx ? "bg-[#fff1ea]" : "hover:bg-[#fafafa]"
            }`}
          >
            <div className="relative h-[28px] w-[28px] flex-shrink-0 overflow-hidden rounded-full bg-[#ededed]">
              {m.avatarSrc ? (
                <Image
                  src={m.avatarSrc}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="28px"
                  unoptimized
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
                {m.nickname}
              </div>
              <div className="truncate text-[11px] text-[#a4a4a4]">
                @{m.id}
              </div>
            </div>
          </button>
        ))}
      </div>
    ) : null;

  return { onKeyDown, onSelect, dropdown, isOpen: open };
}
