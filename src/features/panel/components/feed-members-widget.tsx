"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import { StyledName } from "@/features/panel/components/styled-name";
import { getMemberSlug } from "@/features/panel/members-data";
import { useBadernaMembers } from "@/features/panel/use-baderna-members";

export function FeedMembersWidget() {
  const members = useBadernaMembers();

  // 5 aleatórios — recalcula só quando o conjunto muda (não a cada render).
  const sample = useMemo(() => {
    if (members.length <= 5) return members;
    const shuffled = [...members].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  }, [members]);

  if (sample.length === 0) return null;

  return (
    <section className="rounded-[20px] bg-white p-[20px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <h3 className="text-[15px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
        Membros da Baderna
      </h3>
      <div className="mt-[14px] space-y-[10px]">
        {sample.map((m) => {
          const slug = getMemberSlug(m);
          return (
            <Link
              key={m.id}
              href={`/membro/${slug}`}
              className="flex items-center gap-[12px] rounded-[12px] p-[6px] transition-colors hover:bg-[#f7f7f7]"
            >
              <div className="relative h-[40px] w-[40px] flex-shrink-0 overflow-hidden rounded-full bg-[#ededed]">
                {m.avatarSrc ? (
                  <Image
                    src={m.avatarSrc}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="40px"
                    unoptimized
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate-glow text-[13px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
                  <StyledName styleId={m.activeNameId}>{m.name}</StyledName>
                </p>
                <p className="truncate text-[12px] text-[#8d8d8d]">
                  {m.rankName}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
      <Link
        href="/membros"
        className="mt-[14px] block text-center text-[12px] font-semibold text-[#4a4a4a] hover:opacity-70"
      >
        Ver todos
      </Link>
    </section>
  );
}
