"use client";

import { ChevronLeft, ChevronRight, Flag, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { useToast } from "@/components/toast";
import { getMemberSlug } from "@/features/panel/members-data";
import { ImageLightbox } from "@/features/panel/components/image-lightbox";
import { renderWithMentions } from "@/features/panel/components/mention-text";
import { StyledName } from "@/features/panel/components/styled-name";
import { VideoPlayer } from "@/features/panel/components/video-player";
import { authToken, useAuth } from "@/features/panel/use-auth";
import { useBadernaMembers } from "@/features/panel/use-baderna-members";
import { formatPostDate, formatPostDateLong, type FeedPost } from "@/features/panel/use-posts";

export function PostCard({
  post,
  onLike,
  onDelete,
  expanded = false,
}: {
  post: FeedPost;
  onLike?: (id: number) => void;
  onDelete?: (id: number) => void;
  /** True na página permalink: imagem em resolução completa sem crop. */
  expanded?: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const media = post.imageUrl ?? post.gifUrl;
  const canDelete =
    onDelete && user && (user.id === post.author.id || user.is_admin);

  /** Compartilha o link do post. No mobile usa navigator.share (sheet
   *  nativo). No desktop copia pra clipboard e mostra um toast. */
  async function handleShare() {
    setMenuOpen(false);
    const url = `${window.location.origin}/post/${post.shortCode || post.id}`;
    const shareData = {
      title: "Baderna",
      text: post.content ? post.content.slice(0, 120) : "Post na Baderna",
      url,
    };
    // navigator.share existe em quase todo mobile e em alguns desktops; se a
    // origem não suporta (ex.: localhost http antigo), o catch derruba pra clipboard.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // AbortError = usuário cancelou o share sheet, não é erro real
        if ((err as Error)?.name === "AbortError") return;
        // qualquer outra falha cai pra clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.show("Link copiado!", "success");
    } catch {
      toast.show("Não foi possível copiar o link.");
    }
  }

  /** Copia o texto do post pro clipboard. */
  async function handleCopyText() {
    setMenuOpen(false);
    if (!post.content) return;
    try {
      await navigator.clipboard.writeText(post.content);
      toast.show("Texto copiado!", "success");
    } catch {
      toast.show("Não foi possível copiar o texto.");
    }
  }

  /** Reporta o post aos admins. Rate-limited no backend (3/h por usuário). */
  async function handleReport() {
    setMenuOpen(false);
    const token = authToken();
    if (!token) return;
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";
      const res = await fetch(`${apiBase}/posts/${post.id}/report`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        toast.show("Post reportado. Obrigado!", "success");
      } else if (res.status === 429) {
        toast.show("Você já reportou muitos posts recentemente. Tenta mais tarde.");
      } else {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        toast.show(body.error ?? "Não foi possível reportar o post.");
      }
    } catch {
      toast.show("Não foi possível reportar o post.");
    }
  }

  // Esconde "Reportar" e "Ver perfil" quando o post é seu — não faz sentido
  // reportar a si mesmo, e o autor já está visualmente óbvio no header.
  const isOwnPost = user?.id === post.author.id;

  // Pega o membro ATUAL pra puxar nickname/name/estilo de nome. O backend
  // salva snapshot no payload do post; aqui sobrescreve com a versão fresh
  // da lista de membros (vinculada por user_id).
  //  - m.nickname = summoner_name (exibido em cima, com estilo)
  //  - m.name     = display_name (nome real, exibido embaixo em cinza)
  //  - m.activeNameId = estilo escolhido pelo autor (StyledName)
  const members = useBadernaMembers();
  const liveMember = post.author.id
    ? members.find((m) => m.userId === post.author.id)
    : undefined;
  // Mapa de slug → membro pra resolver @menções no conteúdo
  const membersBySlug = new Map<string, { id: string; nickname: string }>();
  for (const m of members) membersBySlug.set(m.id, m);
  const fallbackNick = post.author.gameNick
    ? post.author.gameNick.split("#")[0]
    : post.author.name;
  const authorNick =
    liveMember?.nickname ?? fallbackNick ?? "Anônimo";
  const authorRealName = liveMember?.name ?? post.author.name ?? "";
  const authorStyleId = liveMember?.activeNameId ?? undefined;
  // Avatar: prefere o LIVE (do useBadernaMembers, refresh via API) ao
  // snapshot embutido no post — assim troca de avatar/nick atualiza na
  // hora em todo histórico.
  const authorAvatar = liveMember?.avatarSrc ?? post.author.avatarSrc;
  // Slug: liveMember.id JÁ É o slug canônico que o backend devolve.
  // Usar isso direto evita recálculo no front (que poderia divergir do
  // backend pra casos edge tipo "Pudim co canela"); só recai pro
  // computado quando o autor não tá mais na lista de membros (deletado).
  const authorSlug = liveMember?.id
    ?? (post.author.gameNick?.split("#")[0]
        ? getMemberSlug({ nickname: post.author.gameNick.split("#")[0] })
        : post.author.name
          ? getMemberSlug({ nickname: post.author.name })
          : "");

  // Click no card → permalink do post. Buttons/links internos param
  // propagação pra não disparar duas navegações.
  function handleCardClick(e: React.MouseEvent) {
    // Ignora clicks em mídia (deixa zoom no futuro), texto selecionado, etc.
    const target = e.target as HTMLElement;
    if (window.getSelection()?.toString()) return; // user selecionando texto
    if (target.closest("a, button")) return;
    router.push(`/post/${post.shortCode || post.id}`);
  }

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  function openDeleteConfirm() {
    setMenuOpen(false);
    setConfirmOpen(true);
  }

  function confirmDelete() {
    setConfirmOpen(false);
    onDelete?.(post.id);
  }

  return (
    <article
      onClick={handleCardClick}
      className="cursor-pointer rounded-[20px] bg-white p-[20px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#fafafa] sm:p-[24px]"
    >
      {/* Header: avatar + nome + nick + (menu). Sempre em linha. */}
      <div className="flex items-start gap-[12px] sm:gap-[14px]">
        {authorSlug ? (
          <Link
            href={`/membro/${authorSlug}`}
            className="relative h-[42px] w-[42px] flex-shrink-0 overflow-hidden rounded-full bg-[#ededed] transition-opacity hover:opacity-85 sm:h-[48px] sm:w-[48px]"
          >
            {authorAvatar ? (
              <Image
                src={authorAvatar}
                alt=""
                fill
                className="object-cover"
                sizes="48px"
                unoptimized
              />
            ) : null}
          </Link>
        ) : (
          <div className="relative h-[48px] w-[48px] flex-shrink-0 overflow-hidden rounded-full bg-[#ededed]">
            {authorAvatar ? (
              <Image
                src={authorAvatar}
                alt=""
                fill
                className="object-cover"
                sizes="48px"
                unoptimized
              />
            ) : null}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-[8px]">
            <div className="min-w-0 flex-1">
              {authorSlug ? (
                <Link
                  href={`/membro/${authorSlug}`}
                  className="block truncate-glow text-[14px] font-bold tracking-[-0.02em] text-[#0f0f0f] transition-opacity hover:opacity-80 sm:text-[15px]"
                >
                  <StyledName styleId={authorStyleId}>{authorNick}</StyledName>
                </Link>
              ) : (
                <span className="block truncate-glow text-[15px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
                  <StyledName styleId={authorStyleId}>{authorNick}</StyledName>
                </span>
              )}
              {/* Expanded: nome real embaixo do nick (estilo Twitter).
                  Compact (feed): inline com nome real + tempo. */}
              {expanded ? (
                authorRealName && authorSlug ? (
                  <Link
                    href={`/membro/${authorSlug}`}
                    className="mt-[2px] block truncate text-[12px] text-[#8d8d8d] transition-opacity hover:opacity-80 sm:text-[13px]"
                  >
                    {authorRealName}
                  </Link>
                ) : authorRealName ? (
                  <span className="mt-[2px] block truncate text-[12px] text-[#8d8d8d] sm:text-[13px]">
                    {authorRealName}
                  </span>
                ) : null
              ) : (
                <div className="mt-[2px] flex items-baseline gap-[6px] text-[12px] text-[#8d8d8d] sm:text-[13px]">
                  {authorRealName && authorSlug ? (
                    <Link
                      href={`/membro/${authorSlug}`}
                      className="truncate transition-opacity hover:opacity-80"
                    >
                      {authorRealName}
                    </Link>
                  ) : (
                    authorRealName && (
                      <span className="truncate">{authorRealName}</span>
                    )
                  )}
                  <span>·</span>
                  <span>{formatPostDate(post.createdAt)}</span>
                </div>
              )}
            </div>
            {/* Menu de 3 pontinhos: sempre aparece (Compartilhar é universal).
                Apagar só fica visível pra autor/admin. */}
            <div className="relative ml-auto" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Mais opções"
                className="flex h-[28px] w-[28px] items-center justify-center rounded-full text-[#8d8d8d] transition-colors hover:bg-[#f4f4f4]"
              >
                <MoreHorizontal className="h-[16px] w-[16px]" strokeWidth={2} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-[34px] z-10 min-w-[180px] overflow-hidden rounded-[12px] bg-white shadow-[0px_8px_40px_rgba(0,0,0,0.14)]">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex w-full items-center gap-[8px] px-[14px] py-[10px] text-[13px] font-semibold text-[#0f0f0f] transition-colors hover:bg-[#f4f4f4]"
                  >
                    {/* Mesmo ícone usado no botão Compartilhar do perfil */}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-[14px] w-[14px]"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20.7914 12.6074C21.0355 12.3981 21.1575 12.2935 21.2023 12.169C21.2415 12.0598 21.2415 11.9402 21.2023 11.831C21.1575 11.7065 21.0355 11.6018 20.7914 11.3926L12.3206 4.13196C11.9004 3.77176 11.6903 3.59166 11.5124 3.58725C11.3578 3.58342 11.2101 3.65134 11.1124 3.77122C11 3.90915 11 4.18589 11 4.73936V9.03462C8.86532 9.40807 6.91159 10.4897 5.45971 12.1139C3.87682 13.8845 3.00123 16.1759 3 18.551V19.1629C4.04934 17.8989 5.35951 16.8765 6.84076 16.1659C8.1467 15.5394 9.55842 15.1683 11 15.0705V19.2606C11 19.8141 11 20.0908 11.1124 20.2288C11.2101 20.3486 11.3578 20.4166 11.5124 20.4127C11.6903 20.4083 11.9004 20.2282 12.3206 19.868L20.7914 12.6074Z" />
                    </svg>
                    Compartilhar
                  </button>
                  {post.content && (
                    <button
                      type="button"
                      onClick={handleCopyText}
                      className="flex w-full items-center gap-[8px] border-t border-[#f4f4f4] px-[14px] py-[10px] text-[13px] font-semibold text-[#0f0f0f] transition-colors hover:bg-[#f4f4f4]"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-[14px] w-[14px]"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M16 8V5.2C16 4.0799 16 3.51984 15.782 3.09202C15.5903 2.71569 15.2843 2.40973 14.908 2.21799C14.4802 2 13.9201 2 12.8 2H5.2C4.0799 2 3.51984 2 3.09202 2.21799C2.71569 2.40973 2.40973 2.71569 2.21799 3.09202C2 3.51984 2 4.0799 2 5.2V12.8C2 13.9201 2 14.4802 2.21799 14.908C2.40973 15.2843 2.71569 15.5903 3.09202 15.782C3.51984 16 4.0799 16 5.2 16H8M11.2 22H18.8C19.9201 22 20.4802 22 20.908 21.782C21.2843 21.5903 21.5903 21.2843 21.782 20.908C22 20.4802 22 19.9201 22 18.8V11.2C22 10.0799 22 9.51984 21.782 9.09202C21.5903 8.71569 21.2843 8.40973 20.908 8.21799C20.4802 8 19.9201 8 18.8 8H11.2C10.0799 8 9.51984 8 9.09202 8.21799C8.71569 8.40973 8.40973 8.71569 8.21799 9.09202C8 9.51984 8 10.0799 8 11.2V18.8C8 19.9201 8 20.4802 8.21799 20.908C8.40973 21.2843 8.71569 21.5903 9.09202 21.782C9.51984 22 10.0799 22 11.2 22Z" />
                      </svg>
                      Copiar texto
                    </button>
                  )}
                  {!isOwnPost && authorSlug && (
                    <Link
                      href={`/membro/${authorSlug}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-[8px] border-t border-[#f4f4f4] px-[14px] py-[10px] text-[13px] font-semibold text-[#0f0f0f] transition-colors hover:bg-[#f4f4f4]"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-[14px] w-[14px]"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M16 18L19 15M19 15L22 18M19 15V21M12 15.5H7.5C6.10444 15.5 5.40665 15.5 4.83886 15.6722C3.56045 16.06 2.56004 17.0605 2.17224 18.3389C2 18.9067 2 19.6044 2 21M14.5 7.5C14.5 9.98528 12.4853 12 10 12C7.51472 12 5.5 9.98528 5.5 7.5C5.5 5.01472 7.51472 3 10 3C12.4853 3 14.5 5.01472 14.5 7.5Z" />
                      </svg>
                      Ver perfil do autor
                    </Link>
                  )}
                  {!isOwnPost && (
                    <button
                      type="button"
                      onClick={handleReport}
                      className="flex w-full items-center gap-[8px] border-t border-[#f4f4f4] px-[14px] py-[10px] text-[13px] font-semibold text-[#0f0f0f] transition-colors hover:bg-[#f4f4f4]"
                    >
                      <Flag className="h-[14px] w-[14px]" strokeWidth={2} />
                      Reportar
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={openDeleteConfirm}
                      className="flex w-full items-center gap-[8px] border-t border-[#f4f4f4] px-[14px] py-[10px] text-[13px] font-semibold text-[#c53030] transition-colors hover:bg-[#fff4f4]"
                    >
                      <svg
                        className="h-[14px] w-[14px]"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M16 6V5.2C16 4.0799 16 3.51984 15.782 3.09202C15.5903 2.71569 15.2843 2.40973 14.908 2.21799C14.4802 2 13.9201 2 12.8 2H11.2C10.0799 2 9.51984 2 9.09202 2.21799C8.71569 2.40973 8.40973 2.71569 8.21799 3.09202C8 3.51984 8 4.0799 8 5.2V6M3 6H21M19 6V17.2C19 18.8802 19 19.7202 18.673 20.362C18.3854 20.9265 17.9265 21.3854 17.362 21.673C16.7202 22 15.8802 22 14.2 22H9.8C8.11984 22 7.27976 22 6.63803 21.673C6.07354 21.3854 5.6146 20.9265 5.32698 20.362C5 19.7202 5 18.8802 5 17.2V6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Apagar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body: full-width no mobile (sem ml). Em sm:+ fica indentado sob o avatar
          (avatar 48 + gap 14 = 62) pra manter o visual estilo Twitter. */}
      <div className="mt-[16px] sm:ml-[62px]">
        {post.content && (
          <p className="whitespace-pre-wrap break-words text-[14px] leading-[1.45] text-[#0f0f0f] sm:text-[15px]">
            {renderWithMentions(post.content, membersBySlug)}
          </p>
        )}

        {media && (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label="Abrir imagem"
            className="mt-[12px] block w-full overflow-hidden rounded-[16px] bg-[#ededed]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={media}
              alt=""
              className={
                expanded
                  ? "h-auto w-full object-contain"
                  : "max-h-[520px] w-full object-cover"
              }
              loading="lazy"
            />
          </button>
        )}

        {lightboxOpen && media && (
          <ImageLightbox src={media} onClose={() => setLightboxOpen(false)} />
        )}

        {post.videoUrl && !media && (
          <div className="mt-[12px]">
            <VideoPlayer src={post.videoUrl} expanded={expanded} />
          </div>
        )}

        {/* Linha de ações: like + comentários + reações + bookmark. */}
        <div className="relative mt-[18px] flex items-center gap-x-[14px]">
          <LikeButton
            liked={post.liked}
            count={post.likesCount}
            onClick={() => onLike?.(post.id)}
          />
          <CommentButton
            count={post.commentsCount}
            href={`/post/${post.shortCode || post.id}`}
          />
          <PostReactions postId={post.id} />
          <BookmarkButton />
        </div>
        {/* Data em linha própria abaixo das ações — só na view expandida.
            Separada pra não comprimir o espaço das reações no mobile. */}
        {expanded && (
          <p className="mt-[10px] text-[12px] text-[#8d8d8d]">
            {formatPostDateLong(post.createdAt)}
          </p>
        )}
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/38 px-4 py-6 backdrop-blur-[2px]"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmOpen(false);
          }}
        >
          <div
            className="w-full max-w-[360px] overflow-hidden rounded-[20px] bg-white p-[24px] shadow-[0px_30px_90px_rgba(0,0,0,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[18px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
              Apagar post?
            </h3>
            <p className="mt-[8px] text-[13px] leading-[1.5] tracking-[-0.01em] text-[#7c7c7c]">
              Essa ação não pode ser desfeita. O post e seus comentários serão removidos.
            </p>
            <div className="mt-[20px] flex gap-[10px]">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="flex h-[44px] flex-1 items-center justify-center rounded-[14px] bg-[#ededed] text-[13px] font-bold tracking-[-0.02em] text-[#0f0f0f] transition-opacity hover:opacity-85"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex h-[44px] flex-1 items-center justify-center rounded-[14px] bg-[#c53030] text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-90"
              >
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

/**
 * Botão de comentários: ícone muda quando o post já tem comentários
 * (balão com 3 pontinhos) vs vazio (balão sem dots). Link pro permalink.
 */
function CommentButton({ count, href }: { count: number; href: string }) {
  return (
    <Link
      href={href}
      aria-label="Comentários"
      className="group flex items-center gap-[6px] text-[13px] font-semibold text-[#8d8d8d] transition-colors hover:text-[#ff4100]"
    >
      <span className="relative inline-flex h-[22px] w-[22px] items-center justify-center">
        <svg
          className="h-[20px] w-[20px]"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21 12C21 16.9706 16.9706 21 12 21C10.8029 21 9.6603 20.7663 8.61549 20.3419C8.41552 20.2607 8.31554 20.2201 8.23472 20.202C8.15566 20.1843 8.09715 20.1778 8.01613 20.1778C7.9333 20.1778 7.84309 20.1928 7.66265 20.2229L4.10476 20.8159C3.73218 20.878 3.54589 20.909 3.41118 20.8512C3.29328 20.8007 3.19933 20.7067 3.14876 20.5888C3.09098 20.4541 3.12203 20.2678 3.18413 19.8952L3.77711 16.3374C3.80718 16.1569 3.82222 16.0667 3.82221 15.9839C3.8222 15.9028 3.81572 15.8443 3.798 15.7653C3.77988 15.6845 3.73927 15.5845 3.65806 15.3845C3.23374 14.3397 3 13.1971 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>{count}</span>
    </Link>
  );
}

const REACTIONS_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

/** Normaliza mine: aceita array ou string legacy. */
function parseMine(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string" && raw) return [raw];
  return [];
}

/**
 * Aplica reactions do servidor preservando a ordem de inserção do estado
 * local. Emojis que ainda existem no servidor mantêm sua posição; emojis
 * novos (não presentes no local) vão pro fim; emojis que sumiram do servidor
 * (count=0) caem fora.
 */
function mergeReactions(
  prev: Record<string, number>,
  server: Record<string, number>,
): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const key of Object.keys(prev)) {
    if (server[key] !== undefined) merged[key] = server[key];
  }
  for (const key of Object.keys(server)) {
    if (!(key in merged)) merged[key] = server[key];
  }
  return merged;
}

/* ─── Categorias de emoji para o picker completo ─────────────────────────── */
const EMOJI_CATS = [
  {
    icon: "😀",
    label: "Smileys",
    emojis: [
      "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇",
      "🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝",
      "🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄",
      "😬","🤥","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵",
      "🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","😟","🙁",
      "😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱",
      "😖","😣","😞","😓","😩","😫","🤬","😤","😠","😡","🤡","👻","💀",
      "☠️","👽","👾","🤖","😺","😸","😹","😻","😼","😽","🙀","😿","😾",
    ],
  },
  {
    icon: "👋",
    label: "Gestos",
    emojis: [
      "👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙",
      "👈","👉","👆","🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏",
      "🙌","👐","🤲","🤝","🙏","✍️","💅","💪","🦾","🫡","🫠","🫣","🫢",
      "🧑","👦","👧","👨","👩","🧓","👴","👵","🙍","🙎","🙅","🙆","💁",
      "🙋","🧏","🙇","🤦","🤷","💆","💇","🚶","🧍","🧎","🏃","💃","🕺",
    ],
  },
  {
    icon: "🐶",
    label: "Animais",
    emojis: [
      "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷",
      "🐸","🐵","🙈","🙉","🙊","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇",
      "🐺","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🦟","🦗","🕷️","🦂",
      "🐢","🐍","🦎","🐙","🦑","🦐","🦀","🐡","🐠","🐟","🐬","🐳","🦈",
      "🐊","🐘","🦒","🦓","🦍","🦧","🦛","🦏","🐪","🐫","🦘","🐃","🐄",
      "🐎","🐖","🐑","🦙","🐐","🦌","🐕","🐩","🐈","🐓","🦃","🦚","🦜",
      "🦢","🕊️","🐇","🦝","🦨","🦡","🦦","🦥","🐁","🐀","🐿️","🦔","🐾",
      "🌵","🎄","🌲","🌳","🌴","🌱","🌿","☘️","🍀","🍃","🍂","🍁","🌾",
      "💐","🌷","🌹","🥀","🌺","🌸","🌼","🌻","🍄","🌊","🔥","💧","🌈",
      "❄️","☃️","⛄","⚡","🌪️","🌫️","☁️","⛅","🌤️","🌙","⭐","🌟","🌠",
    ],
  },
  {
    icon: "🍕",
    label: "Comida",
    emojis: [
      "🍇","🍈","🍉","🍊","🍋","🍌","🍍","🥭","🍎","🍏","🍐","🍑","🍒",
      "🍓","🫐","🥝","🍅","🥥","🥑","🍆","🥔","🥕","🌽","🌶️","🫑","🥒",
      "🥬","🥦","🧄","🧅","🍞","🥐","🥖","🫓","🥨","🥯","🥞","🧇","🧀",
      "🍖","🍗","🥩","🥓","🍔","🍟","🍕","🌭","🌮","🌯","🥙","🧆","🥚",
      "🍳","🥘","🍲","🥗","🍿","🧂","🍱","🍘","🍙","🍚","🍛","🍜","🍝",
      "🍠","🍢","🍣","🍤","🍥","🥮","🍡","🥟","🥠","🥡","🍦","🍧","🍨",
      "🍩","🍪","🎂","🍰","🧁","🥧","🍫","🍬","🍭","🍯","🧃","🥤","🧋",
      "☕","🍵","🧉","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🍾","🧊",
    ],
  },
  {
    icon: "⚽",
    label: "Atividades",
    emojis: [
      "⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🏓","🏸","🥊",
      "🥋","🛹","🛷","⛸️","🥌","🎯","🏹","🎣","🤿","🏋️","🤸","🤺","⛹️",
      "🤾","🏇","🧘","🧗","🚵","🚴","🏆","🥇","🥈","🥉","🏅","🎖️","🎫",
      "🎪","🎭","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🎷","🎺","🎸","🎻",
      "🎲","♟️","🎮","🕹️","🎰","🎳","🧩","🪆","🪅","🎴","🃏","🎉","🎊",
      "🎈","🎀","🎁","🎗️","🎟️","🏵️",
    ],
  },
  {
    icon: "✈️",
    label: "Viagem",
    emojis: [
      "🚗","🚕","🚙","🚌","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜",
      "🏍️","🛵","🚲","🛴","🛹","🚏","⛽","🚨","🚥","🚦","⚓","⛵","🚤",
      "🛥️","🚢","✈️","🛩️","🚁","🚀","🛸","🪂","💺","🌍","🌎","🌏","🗺️",
      "🧭","🏔️","⛰️","🌋","🗻","🏕️","🏖️","🏜️","🏝️","🏟️","🏛️","🏗️",
      "🏠","🏡","🏢","🏥","🏦","🏨","🏪","🏫","🏭","🏯","🏰","💒","🗼",
      "🗽","⛪","🕌","🕍","⛩️","🎌","🚩",
    ],
  },
  {
    icon: "💡",
    label: "Objetos",
    emojis: [
      "⌚","📱","💻","⌨️","🖥️","🖨️","🖱️","💽","💾","💿","📀","🧮","📷",
      "📸","📹","🎥","📞","☎️","📺","📻","🧭","⏱️","⏰","🕰️","⌛","⏳",
      "📡","🔋","🔌","💡","🔦","🕯️","🪔","🛋️","🚿","🛁","🪞","🛒","🚪",
      "🔑","🗝️","🔐","🔒","🔓","🔨","🪓","⛏️","🛠️","⚒️","🔧","🔩","⚙️",
      "⚖️","🔗","⛓️","🪝","🧲","🪜","💊","💉","🩸","🩹","🩺","💎","💍",
      "👑","💼","🧳","👜","👛","👓","🕶️","🥽","🌂","🎉","🎊","📦","📫",
      "📜","📊","📈","📉","📋","📁","📂","📌","📍","✂️","🗑️","🔬","🔭",
      "🧪","🧫","🧬","🔮","🪄","🧸","🖼️","🎭",
    ],
  },
  {
    icon: "❤️",
    label: "Símbolos",
    emojis: [
      "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹",
      "❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉️",
      "✡️","☯️","🛐","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓",
      "🆔","⚛️","☢️","☣️","📵","🚫","🚳","🚭","🚯","🚱","🚷","📛","🔞",
      "💯","✅","❎","✔️","☑️","🔘","🔴","🟠","🟡","🟢","🔵","🟣","🟤",
      "⚪","⚫","🔺","🔻","🔷","🔶","🔹","🔸","💠","🔲","🔳","▪️","▫️",
      "🎵","🎶","🎼","💤","🔔","🔕","🔇","🔈","🔉","🔊","📢","📣","🔔",
      "✨","🌟","💫","💥","💢","💨","💦","💧","💬","💭","🗯️","♻️","⚠️",
    ],
  },
];

/* ─── Picker de emoji completo com categorias ────────────────────────────── */
const PICKER_WIDTH = 360;
const VIEWPORT_MARGIN = 8;

function EmojiPicker({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  const [catIdx, setCatIdx] = useState(0);
  const pickerRef = useRef<HTMLDivElement>(null);
  // opacity:0 inicial pra não dar flash antes do useLayoutEffect posicionar
  const [pos, setPos] = useState<React.CSSProperties>({
    right: 0,
    opacity: 0,
  });

  // Mede o anchor (botão smiley = parent) e decide se o picker cabe abrindo
  // pra dentro (right-aligned) ou se precisa "encostar" na esquerda do viewport.
  useLayoutEffect(() => {
    const el = pickerRef.current;
    const anchor = el?.parentElement;
    if (!el || !anchor) return;
    const rect = anchor.getBoundingClientRect();
    // Posição que o picker teria com right:0 (right edge = anchor right edge)
    const wouldBeLeft = rect.right - PICKER_WIDTH;
    if (wouldBeLeft < VIEWPORT_MARGIN) {
      // Não cabe → alinha à esquerda do viewport com margem
      const offsetLeft = VIEWPORT_MARGIN - rect.left;
      setPos({ left: offsetLeft, right: "auto", opacity: 1 });
    } else {
      setPos({ right: 0, left: "auto", opacity: 1 });
    }
  }, []);

  return (
    <>
      {/* Overlay que fecha o picker ao clicar fora */}
      <div
        className="fixed inset-0 z-[30]"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div
        ref={pickerRef}
        style={pos}
        className="absolute bottom-full z-[40] mb-[10px] w-[360px] overflow-hidden rounded-[18px] bg-white shadow-[0px_12px_48px_rgba(0,0,0,0.18)] transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tabs de categoria. Border transparente nas inativas pra todas
            ocuparem o mesmo box e o emoji não pular 2px quando seleciona. */}
        <div className="flex overflow-x-auto border-b border-[#f0f0f0] scrollbar-none">
          {EMOJI_CATS.map((cat, i) => (
            <button
              key={i}
              type="button"
              title={cat.label}
              onClick={() => setCatIdx(i)}
              className={`flex-shrink-0 border-b-2 px-[10px] py-[8px] text-[18px] transition-colors ${
                catIdx === i
                  ? "border-[#ff4100] bg-[#fff6f3]"
                  : "border-transparent hover:bg-[#f8f8f8]"
              }`}
            >
              {cat.icon}
            </button>
          ))}
        </div>
        {/* Grid de emojis */}
        <div className="grid grid-cols-10 gap-[1px] overflow-y-auto p-[8px] [&::-webkit-scrollbar]:hidden [scrollbar-width:none]" style={{ maxHeight: "190px" }}>
          {EMOJI_CATS[catIdx].emojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onSelect(emoji);
              }}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-[6px] text-[18px] transition-colors hover:bg-[#f5f5f5] active:scale-90"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/**
 * Reações por post. Suporta múltiplas por usuário com qualquer emoji.
 *
 * Race condition resolvida com dois refs:
 *  - pendingRef (Set): bloqueia double-click no MESMO emoji enquanto o POST
 *    está em voo, mas não bloqueia emojis diferentes.
 *  - genRef (number): invalida respostas GET "velhas". Toda vez que react()
 *    é chamado o gerador incrementa. O sync() captura o gen atual e só aplica
 *    o resultado se nenhuma nova interação aconteceu enquanto o GET voava —
 *    evita que um GET tardio sobrescreva o estado otimista de um clique mais recente.
 */
function PostReactions({ postId }: { postId: number }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const pendingRef = useRef<Set<string>>(new Set());
  const genRef = useRef(0);

  function sync() {
    const token = authToken();
    if (!token) return;
    // Captura o gen ANTES do fetch — se outro react() chegar antes da resposta
    // chegar, genRef.current vai ser diferente e jogamos o resultado fora.
    const expectedGen = genRef.current;
    fetch(`${REACTIONS_API_BASE}/posts/${postId}/reactions`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (!body) return;
        if (genRef.current !== expectedGen) return; // resposta velha, descarta
        setCounts((prev) => mergeReactions(prev, body.reactions ?? {}));
        setMine(parseMine(body.mine));
      })
      .catch(() => {});
  }

  useEffect(() => {
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  function react(emoji: string) {
    if (pendingRef.current.has(emoji)) return;
    pendingRef.current.add(emoji);
    // Invalida qualquer GET em voo antes deste clique
    genRef.current++;
    setOpen(false);

    const isActive = mine.includes(emoji);
    // Optimistic update
    setCounts((prev) => {
      const next = { ...prev };
      if (isActive) {
        const val = (next[emoji] ?? 1) - 1;
        if (val <= 0) delete next[emoji];
        else next[emoji] = val;
      } else {
        next[emoji] = (next[emoji] ?? 0) + 1;
      }
      return next;
    });
    setMine((prev) =>
      isActive ? prev.filter((e) => e !== emoji) : [...prev, emoji],
    );

    const token = authToken();
    if (!token) {
      pendingRef.current.delete(emoji);
      return;
    }

    const myGen = genRef.current;
    // Se ESTE clique foi feito enquanto outros POSTs já estavam em voo,
    // a resposta deste pode chegar fora de ordem → não confia, faz sync depois.
    const hadConcurrent = pendingRef.current.size > 1;

    fetch(`${REACTIONS_API_BASE}/posts/${postId}/reactions`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ emoji }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        // Aplica a resposta do POST diretamente — economiza um GET extra.
        // Só aplica se: (a) não houve concorrência E (b) nenhuma nova interação
        // aconteceu depois deste clique. Caso contrário a resposta pode estar
        // "atrasada" e o sync no .finally vai pegar o estado canônico.
        if (!body || hadConcurrent || genRef.current !== myGen) return;
        setCounts((prev) => mergeReactions(prev, body.reactions ?? {}));
        setMine(parseMine(body.mine));
      })
      .catch(() => {})
      .finally(() => {
        pendingRef.current.delete(emoji);
        // Só faz GET de sync se houve concorrência — necessário pra evitar que
        // respostas POST fora de ordem deixem o estado inconsistente.
        if (pendingRef.current.size === 0 && hadConcurrent) {
          sync();
        }
      });
  }

  // Emojis com pelo menos 1 reação. NÃO ordena por contagem — preserva a
  // ordem de inserção (chaves de objeto em JS mantêm ordem de inserção)
  // pra que um emoji clicado não "pule de lugar" quando o count muda.
  const active = Object.entries(counts)
    .filter(([, c]) => c > 0)
    .map(([e]) => e);

  // Scroll horizontal pra lista de pills (sem wrap). Setinhas aparecem
  // só quando há overflow real (não polui a UI quando tem poucas reações).
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function updateScrollIndicators() {
    const el = scrollRef.current;
    if (!el) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }

  useEffect(() => {
    updateScrollIndicators();
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => updateScrollIndicators();
    el.addEventListener("scroll", onScroll);
    const ro = new ResizeObserver(updateScrollIndicators);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, []);

  // Recalcula quando a lista de reações muda (adicionar/remover).
  useEffect(() => {
    updateScrollIndicators();
  }, [active.length]);

  function scrollByDir(dir: -1 | 1) {
    scrollRef.current?.scrollBy({ left: dir * 140, behavior: "smooth" });
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-[4px]">
      {/* Setinha esquerda — SEMPRE renderizada, opacity controla visibilidade
          pra não causar layout shift quando aparece/some. */}
      {/* Setinha esquerda — só no desktop (sm:); no mobile as pills fazem wrap */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          scrollByDir(-1);
        }}
        aria-label="Rolar reações para a esquerda"
        aria-hidden={!canScrollLeft}
        tabIndex={canScrollLeft ? 0 : -1}
        className={`hidden sm:flex h-[22px] w-[18px] flex-shrink-0 items-center justify-center rounded-full text-[#8d8d8d] transition-opacity duration-150 hover:bg-[#f4f4f4] hover:text-[#ff4100] ${
          canScrollLeft ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <ChevronLeft className="h-[16px] w-[16px]" strokeWidth={2.5} />
      </button>

      {/* Pills: scroll horizontal em qualquer tela — toque nativo no mobile */}
      <div
        ref={scrollRef}
        className="flex min-w-0 flex-1 items-center gap-[5px] overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
      >
        {active.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              react(emoji);
            }}
            className={`flex h-[24px] flex-shrink-0 items-center gap-[4px] rounded-full px-[8px] text-[12px] font-semibold transition-colors ${
              mine.includes(emoji)
                ? "bg-[#fff1ea] text-[#ff4100] ring-1 ring-inset ring-[#ff4100]/30"
                : "bg-[#f2f2f2] text-[#6f6f6f] hover:bg-[#ebebeb]"
            }`}
          >
            <span className="text-[14px] leading-none">{emoji}</span>
            <span>{counts[emoji]}</span>
          </button>
        ))}
      </div>

      {/* Setinha direita — só no desktop (sm:) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          scrollByDir(1);
        }}
        aria-label="Rolar reações para a direita"
        aria-hidden={!canScrollRight}
        tabIndex={canScrollRight ? 0 : -1}
        className={`hidden sm:flex h-[22px] w-[18px] flex-shrink-0 items-center justify-center rounded-full text-[#8d8d8d] transition-opacity duration-150 hover:bg-[#f4f4f4] hover:text-[#ff4100] ${
          canScrollRight ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <ChevronRight className="h-[16px] w-[16px]" strokeWidth={2.5} />
      </button>

      {/* Botão smiley fixo, abre o picker */}
      <div className="relative flex-shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          aria-label="Reagir com emoji"
          className={`flex h-[24px] w-[24px] items-center justify-center rounded-full transition-colors ${
            open
              ? "bg-[#fff1ea] text-[#ff4100]"
              : "text-[#8d8d8d] hover:text-[#ff4100]"
          }`}
        >
          <svg
            className="h-[20px] w-[20px]"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14M15 9H15.01M9 9H9.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM15.5 9C15.5 9.27614 15.2761 9.5 15 9.5C14.7239 9.5 14.5 9.27614 14.5 9C14.5 8.72386 14.7239 8.5 15 8.5C15.2761 8.5 15.5 8.72386 15.5 9ZM9.5 9C9.5 9.27614 9.27614 9.5 9 9.5C8.72386 9.5 8.5 9.27614 8.5 9C8.5 8.72386 8.72386 8.5 9 8.5C9.27614 8.5 9.5 8.72386 9.5 9Z"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {open && (
          <EmojiPicker
            onSelect={(emoji) => react(emoji)}
            onClose={() => setOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Bookmark — placeholder visual. Toggle local apenas; sem persistência ainda.
 */
function BookmarkButton() {
  const [saved, setSaved] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setSaved((v) => !v);
      }}
      aria-label={saved ? "Remover dos salvos" : "Salvar post"}
      aria-pressed={saved}
      className="group flex items-center text-[#8d8d8d] transition-colors hover:text-[#ff4100]"
    >
      <span className="relative inline-flex h-[22px] w-[22px] items-center justify-center">
        <svg
          className={`h-[20px] w-[20px] ${saved ? "text-[#ff4100]" : ""}`}
          viewBox="0 0 24 24"
          fill={saved ? "currentColor" : "none"}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 7.8C5 6.11984 5 5.27976 5.32698 4.63803C5.6146 4.07354 6.07354 3.6146 6.63803 3.32698C7.27976 3 8.11984 3 9.8 3H14.2C15.8802 3 16.7202 3 17.362 3.32698C17.9265 3.6146 18.3854 4.07354 18.673 4.63803C19 5.27976 19 6.11984 19 7.8V21L12 17L5 21V7.8Z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}

/**
 * Botão de like com animação pop + celebrate ao curtir.
 */
function LikeButton({
  liked,
  count,
  onClick,
}: {
  liked: boolean;
  count: number;
  onClick: () => void;
}) {
  // Trigger pra animação: incrementa toda vez que o user curte. Usamos isso
  // como `key` no SVG filled pra forçar remount + replay da animação.
  const [animKey, setAnimKey] = useState(0);

  function handleClick() {
    // Só dispara animação na ação de CURTIR (não no descurtir).
    if (!liked) setAnimKey((k) => k + 1);
    onClick();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={liked ? "Descurtir" : "Curtir"}
      className="group flex items-center gap-[6px] text-[13px] font-semibold text-[#8d8d8d] transition-colors hover:text-[#ff4100]"
    >
      <span className="relative inline-flex h-[22px] w-[22px] items-center justify-center">
        {/* Outline quando não curtido */}
        {!liked && (
          <svg
            className="h-[20px] w-[20px] text-[#8d8d8d] transition-colors group-hover:text-[#ff4100]"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M11.9932 5.13581C9.9938 2.7984 6.65975 2.16964 4.15469 4.31001C1.64964 6.45038 1.29697 10.029 3.2642 12.5604C4.89982 14.6651 9.84977 19.1041 11.4721 20.5408C11.6536 20.7016 11.7444 20.7819 11.8502 20.8135C11.9426 20.8411 12.0437 20.8411 12.1361 20.8135C12.2419 20.7819 12.3327 20.7016 12.5142 20.5408C14.1365 19.1041 19.0865 14.6651 20.7221 12.5604C22.6893 10.029 22.3797 6.42787 19.8316 4.31001C17.2835 2.19216 13.9925 2.7984 11.9932 5.13581Z"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {/* Filled curtido — animação pop ao surgir via key */}
        {liked && (
          <svg
            key={animKey}
            className="heart-pop h-[20px] w-[20px] text-[#ff4100]"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M11.9932 5.13581C9.9938 2.7984 6.65975 2.16964 4.15469 4.31001C1.64964 6.45038 1.29697 10.029 3.2642 12.5604C4.89982 14.6651 9.84977 19.1041 11.4721 20.5408C11.6536 20.7016 11.7444 20.7819 11.8502 20.8135C11.9426 20.8411 12.0437 20.8411 12.1361 20.8135C12.2419 20.7819 12.3327 20.7016 12.5142 20.5408C14.1365 19.1041 19.0865 14.6651 20.7221 12.5604C22.6893 10.029 22.3797 6.42787 19.8316 4.31001C17.2835 2.19216 13.9925 2.7984 11.9932 5.13581Z"
            />
          </svg>
        )}
        {/* Raios celebrate centralizados no coração */}
        {liked && animKey > 0 && (
          <svg
            key={`celebrate-${animKey}`}
            className="heart-celebrate absolute left-1/2 top-1/2 h-[28px] w-[28px] -translate-x-1/2 -translate-y-1/2 text-[#ff4100]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="12" y1="2" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="2" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="22" y2="12" />
            <line x1="4.5" y1="4.5" x2="6.5" y2="6.5" />
            <line x1="17.5" y1="17.5" x2="19.5" y2="19.5" />
            <line x1="19.5" y1="4.5" x2="17.5" y2="6.5" />
            <line x1="6.5" y1="17.5" x2="4.5" y2="19.5" />
          </svg>
        )}
      </span>
      <span className={liked ? "text-[#ff4100]" : ""}>{count}</span>
    </button>
  );
}
