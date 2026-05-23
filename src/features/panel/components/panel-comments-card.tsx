"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowUp, X } from "lucide-react";

import { getChampionAvatarSrc } from "@/features/panel/champion-avatar";
import { getMemberSlug } from "@/features/panel/members-data";
import { panelProfile } from "@/features/panel/panel-data";
import { useAccount } from "@/features/panel/use-account";
import { useAuth } from "@/features/panel/use-auth";
import { formatCommentDate, useComments } from "@/features/panel/use-comments";

export function PanelCommentsCard({
  memberId,
  targetUserId,
}: {
  memberId: string;
  /** user_id do dono do perfil — quando bate com user logado, é seu perfil. */
  targetUserId?: number | null;
}) {
  const { comments, addComment, removeComment } = useComments(memberId);
  const { user } = useAuth();
  const { account } = useAccount();
  const [draft, setDraft] = useState("");

  const isOwnProfile =
    user != null && targetUserId != null && user.id === targetUserId;

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const body = draft.trim();
    if (!body) return;
    const author =
      account.gameNick.split("#")[0] || user?.name || panelProfile.displayName;
    const avatar =
      account.avatarSrc ||
      panelProfile.avatarSrc ||
      getChampionAvatarSrc(
        account.gameNick.split("#")[0]?.toLowerCase() || "guest",
      );
    addComment(body, author, avatar);
    setDraft("");
  }

  return (
    <section className="flex h-full min-h-[471px] flex-col rounded-[var(--panel-radius-card)] bg-white px-[28px] py-[34px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <h2 className="text-[16px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
        Comentários
      </h2>
      <p className="mt-[4px] text-[15px] font-medium tracking-[-0.03em] text-[#cccccc]">
        Deixe um comentário no perfil.
      </p>

      <div className="mt-[28px] flex flex-1 flex-col border-t border-[#efebe8] pt-[18px]">
        <div className="relative h-[372px] overflow-hidden">
          <div className="no-scrollbar h-full overflow-y-auto pr-[8px] pb-[64px] overscroll-contain">
            {comments.length === 0 ? (
              <p className="flex h-full items-center justify-center text-[13px] font-medium tracking-[-0.02em] text-[#b0a8a4]">
                Nenhum comentário ainda...
              </p>
            ) : (
              <div className="space-y-[18px]">
                {comments.map((comment) => {
                  const profileHref = `/membro/${getMemberSlug({ nickname: comment.author })}`;
                  return (
                  <article
                    key={comment.id}
                    className="group relative border-b border-[#f3efec] pb-[16px] last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-start gap-[12px]">
                      <Link
                        href={profileHref}
                        aria-label={`Ver perfil de ${comment.author}`}
                        className="shrink-0 transition-opacity hover:opacity-80"
                      >
                        {comment.authorAvatar ? (
                          <div className="relative h-[42px] w-[42px] overflow-hidden rounded-full bg-[#efeae6]">
                            <Image
                              src={comment.authorAvatar}
                              alt={comment.author}
                              fill
                              className="object-cover"
                              sizes="42px"
                            />
                          </div>
                        ) : (
                          <div className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#efeae6] text-[15px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
                            {comment.author.charAt(0)}
                          </div>
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={profileHref}
                          className="inline-block max-w-full truncate text-[13px] font-bold tracking-[-0.03em] text-[#0f0f0f] transition-opacity hover:opacity-70"
                        >
                          {comment.author}
                        </Link>
                        <p className="mt-[2px] text-[11px] font-medium tracking-[-0.03em] text-[#adadad]">
                          {formatCommentDate(comment.createdAt)}
                        </p>
                        <p className="mt-[10px] text-[13px] font-medium leading-[1.45] tracking-[-0.02em] text-[#666666]">
                          {comment.body}
                        </p>
                      </div>

                      {/* Mostra X se: você é dono do perfil OU você é o autor */}
                      {(isOwnProfile ||
                        (user != null &&
                          comment.authorId != null &&
                          comment.authorId === user.id)) && (
                        <button
                          type="button"
                          onClick={() => removeComment(comment.id)}
                          aria-label="Excluir comentário"
                          className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full text-[#b0a8a4] opacity-0 transition-opacity hover:bg-[#fee2e2] hover:text-[#c53030] group-hover:opacity-100"
                        >
                          <X className="h-[12px] w-[12px]" strokeWidth={2.4} />
                        </button>
                      )}
                    </div>
                  </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[54px] bg-gradient-to-t from-white via-white/68 to-transparent" />
        </div>

        <form onSubmit={handleSubmit} className="mt-auto pt-[18px]">
          <div className="flex items-center gap-[12px] rounded-full bg-[#EDEDED] pl-[18px] pr-[10px] py-[10px]">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Fazer um comentário..."
              className="min-w-0 flex-1 bg-transparent text-[13px] font-medium tracking-[-0.02em] text-[#0f0f0f] outline-none placeholder:text-[#a4a4a4]"
            />

            <button
              type="submit"
              aria-label="Enviar comentário"
              disabled={!draft.trim()}
              className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#ff4100] text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowUp className="h-[16px] w-[16px] translate-x-[0.5px]" strokeWidth={2.4} />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

