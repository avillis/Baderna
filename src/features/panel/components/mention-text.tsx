"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import type { BadernaMember } from "@/features/panel/members-data";

/** Captura @slug isolado (preserva o caractere imediatamente antes do @ pra
 *  reinserir no resultado). */
const MENTION_RE = /(^|[^a-zA-Z0-9_])@([a-z0-9-]{1,40})/g;

/**
 * Renderiza um conteúdo de post/comentário convertendo menções `@slug` em
 * links pro perfil. Mantém o resto do texto intacto (incluindo quebras de
 * linha quando o pai usa `whitespace-pre-wrap`).
 *
 * - Resolve `@slug` contra `membersBySlug` (Map<slug, BadernaMember>).
 *   Se o slug não bate com ninguém conhecido, deixa o `@slug` como texto puro.
 */
export function renderWithMentions(
  content: string,
  membersBySlug: Map<string, Pick<BadernaMember, "id" | "nickname">>,
): ReactNode {
  if (!content) return null;
  if (!content.includes("@")) return content;

  const out: ReactNode[] = [];
  let lastIdx = 0;
  let key = 0;

  for (const m of content.matchAll(MENTION_RE)) {
    const fullMatchStart = m.index ?? 0;
    const prefixChar = m[1]; // caractere antes do @ (ou string vazia)
    const slug = m[2].toLowerCase();
    const member = membersBySlug.get(slug);
    if (!member) continue; // não conhecida → trata como texto comum

    // Empurra o texto entre a última menção e esta (inclui o prefixChar)
    out.push(content.substring(lastIdx, fullMatchStart + prefixChar.length));

    out.push(
      <Link
        key={`m-${key++}`}
        href={`/membro/${member.id}`}
        className="font-semibold text-[#ff4100] hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        @{member.nickname}
      </Link>,
    );

    lastIdx = fullMatchStart + m[0].length;
  }

  // Resto do texto após a última menção (ou tudo, se nenhuma foi encontrada)
  out.push(content.substring(lastIdx));

  return out.map((node, i) => <Fragment key={i}>{node}</Fragment>);
}
