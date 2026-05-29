"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { authToken } from "@/features/panel/use-auth";
import { getChampionAvatarSrc } from "@/features/panel/champion-avatar";
import { StyledName } from "@/features/panel/components/styled-name";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

export type BirthdayMember = {
  id: number;
  nickname: string;
  name: string;
  avatarSrc: string | null;
  slug: string | null;
  activeNameId: string | null;
  birthdayDay: number;
  birthdayMonth: number;
  birthdayYear: number | null;
  birthdayHidden: boolean;
  daysUntil: number;
  isToday: boolean;
  age: number | null;
};

const MONTHS_FULL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function useBirthdays() {
  const [members, setMembers] = useState<BirthdayMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = authToken();
    if (!token) { setLoading(false); return; }
    fetch(`${API_BASE}/birthdays`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { setMembers(data as BirthdayMember[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { members, loading };
}

function MemberAvatar({
  src,
  nick,
  size = 64,
}: {
  src: string | null;
  nick: string;
  size?: number;
}) {
  const [errored, setErrored] = useState(false);
  const fallback = getChampionAvatarSrc(nick.toLowerCase().replace(/\s/g, ""));
  const imgSrc = src && !errored ? src : fallback;
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full bg-[#ededed]"
      style={{ width: size, height: size }}
    >
      <Image
        src={imgSrc}
        alt={nick}
        fill
        className="object-cover"
        sizes={`${size}px`}
        unoptimized
        onError={() => setErrored(true)}
      />
    </div>
  );
}

function DaysChip({ daysUntil, isToday }: { daysUntil: number; isToday: boolean }) {
  if (isToday) {
    return (
      <span className="inline-flex h-[36px] items-center gap-[4px] rounded-[12px] bg-[#fff3e8] px-[14px] text-[12px] font-bold tracking-[-0.02em] text-[#e05a00]">
        🎉 Hoje!
      </span>
    );
  }
  if (daysUntil === 1) {
    return (
      <span className="inline-flex h-[36px] items-center rounded-[12px] bg-[#fff3e8] px-[14px] text-[12px] font-bold tracking-[-0.02em] text-[#e05a00]">
        Amanhã
      </span>
    );
  }
  return (
    <span className="inline-flex h-[36px] items-center rounded-[12px] bg-[#ededed] px-[14px] text-[12px] font-bold tracking-[-0.02em] text-[#6f6f6f]">
      em {daysUntil} dias
    </span>
  );
}

function BirthdayCard({ member }: { member: BirthdayMember }) {
  const href = member.slug ? `/membro/${member.slug}` : "#";
  const dateShort = `${member.birthdayDay} de ${MONTHS_FULL[member.birthdayMonth - 1]}`;

  const ageText = member.isToday
    ? member.age !== null ? `faz ${member.age} anos hoje 🥳` : "aniversário hoje 🥳"
    : member.age !== null
      ? `vai fazer ${member.age + 1} anos`
      : null;

  return (
    <Link
      href={href}
      className="flex flex-col items-center rounded-[var(--panel-radius-card)] bg-white px-[20px] py-[28px] text-center shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)] transition-transform duration-200 hover:scale-[1.02]"
    >
      <MemberAvatar src={member.avatarSrc} nick={member.nickname} size={72} />

      <StyledName
        styleId={member.activeNameId ?? undefined}
        className="mt-[14px] text-[15px] font-bold tracking-[-0.03em] text-[#0f0f0f]"
      >
        {member.nickname}
      </StyledName>
      <p className="mt-[4px] text-[12px] font-semibold text-[#9d9d9d]">
        {dateShort}
      </p>
      {ageText && (
        <p className="mt-[4px] text-[12px] font-semibold text-[#b0a8a4]">
          {ageText}
        </p>
      )}
      <div className="mt-auto pt-[16px]">
        <DaysChip daysUntil={member.daysUntil} isToday={member.isToday} />
      </div>
    </Link>
  );
}

export function AniversariosClient() {
  const { members, loading } = useBirthdays();

  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center py-[80px]">
          <svg
            className="capas-spinner h-[32px] w-[32px] [&_circle]:stroke-[#ff4100]"
            viewBox="25 25 50 50"
          >
            <circle r="20" cy="50" cx="50" />
          </svg>
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center gap-[12px] rounded-[var(--panel-radius-card)] bg-white px-6 py-[60px] text-center shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
          <span className="text-[48px]">🎂</span>
          <p className="text-[16px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
            Nenhum aniversário cadastrado ainda
          </p>
          <p className="max-w-[320px] text-[13px] font-medium text-[#9d9d9d]">
            Adicione o seu em{" "}
            <Link href="/minha-conta" className="text-[#ff4100] hover:underline">
              Minha Conta
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-[16px] sm:grid-cols-4 xl:grid-cols-5">
          {members.map((m) => (
            <BirthdayCard key={m.id} member={m} />
          ))}
        </div>
      )}
    </div>
  );
}
