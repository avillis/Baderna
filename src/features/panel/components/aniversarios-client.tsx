"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { authToken } from "@/features/panel/use-auth";
import { getChampionAvatarSrc } from "@/features/panel/champion-avatar";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

export type BirthdayMember = {
  id: number;
  nickname: string;
  name: string;
  avatarSrc: string | null;
  slug: string | null;
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
      <span className="inline-flex items-center gap-[4px] rounded-full bg-[#fff3e8] px-[10px] py-[4px] text-[11px] font-bold text-[#e05a00]">
        🎉 Hoje!
      </span>
    );
  }
  if (daysUntil === 1) {
    return (
      <span className="inline-flex items-center rounded-full bg-[#fff3e8] px-[10px] py-[4px] text-[11px] font-bold text-[#e05a00]">
        Amanhã
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-[#ededed] px-[10px] py-[4px] text-[11px] font-bold text-[#6f6f6f]">
      em {daysUntil} dias
    </span>
  );
}

function HeroCard({ member }: { member: BirthdayMember }) {
  const dateLabel = member.birthdayYear
    ? `${member.birthdayDay} de ${MONTHS_FULL[member.birthdayMonth - 1]} de ${member.birthdayYear}`
    : `${member.birthdayDay} de ${MONTHS_FULL[member.birthdayMonth - 1]}`;

  const [avatarErrored, setAvatarErrored] = useState(false);
  const fallback = getChampionAvatarSrc(member.nickname.toLowerCase().replace(/\s/g, ""));
  const imgSrc = member.avatarSrc && !avatarErrored ? member.avatarSrc : fallback;

  return (
    <div className="rounded-[var(--panel-radius-card)] bg-[#ff4100] p-[28px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <p className="mb-[16px] text-[13px] font-bold tracking-[-0.02em] text-white/80">
        {member.isToday ? "🎉 Aniversário hoje!" : "Próximo aniversário"}
      </p>

      <div className="flex items-center gap-[16px]">
        <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-full ring-[3px] ring-white/40">
          <Image
            src={imgSrc}
            alt={member.nickname}
            fill
            className="object-cover"
            sizes="68px"
            unoptimized
            onError={() => setAvatarErrored(true)}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[22px] font-bold tracking-[-0.03em] text-white">
            {member.nickname}
          </p>
          <p className="truncate text-[13px] font-semibold text-white/70">
            {dateLabel}
            {member.age !== null && !member.isToday && (
              <span className="ml-[6px]">· vai fazer {member.age + 1} anos</span>
            )}
            {member.age !== null && member.isToday && (
              <span className="ml-[6px]">· {member.age} anos 🥳</span>
            )}
          </p>
        </div>
      </div>

      {!member.isToday && (
        <div className="mt-[20px] flex items-center gap-[10px]">
          <div className="h-[4px] flex-1 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${Math.max(4, 100 - Math.min(member.daysUntil, 365) / 3.65)}%` }}
            />
          </div>
          <span className="text-[13px] font-bold text-white">
            {member.daysUntil === 1 ? "amanhã" : `${member.daysUntil} dias`}
          </span>
        </div>
      )}
    </div>
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

      <p className="mt-[14px] text-[15px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
        {member.nickname}
      </p>
      <p className="mt-[4px] text-[12px] font-semibold text-[#9d9d9d]">
        {dateShort}
      </p>
      {ageText && (
        <p className="mt-[4px] text-[12px] font-semibold text-[#b0a8a4]">
          {ageText}
        </p>
      )}
      <div className="mt-[12px]">
        <DaysChip daysUntil={member.daysUntil} isToday={member.isToday} />
      </div>
    </Link>
  );
}

export function AniversariosClient() {
  const { members, loading } = useBirthdays();
  const hero = members[0] ?? null;

  return (
    <div className="pt-[1.5vh] sm:pt-[6vh]">
      <div className="mb-[24px]">
        <h1 className="text-[26px] font-bold tracking-[-0.04em] text-[#0f0f0f]">
          Aniversários
        </h1>
        <p className="mt-[4px] text-[14px] font-medium text-[#8d8d8d]">
          Celebre com quem faz parte da Baderna.
        </p>
      </div>

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
        <div className="flex flex-col gap-[24px]">
          {/* Hero — próximo ou de hoje */}
          {hero && <HeroCard member={hero} />}

          {/* Grid 3 colunas */}
          <div>
            <h2 className="mb-[14px] text-[15px] font-bold tracking-[-0.02em] text-[#6f6f6f]">
              Todos os aniversários
            </h2>
            <div className="grid grid-cols-2 gap-[16px] sm:grid-cols-3">
              {members.map((m) => (
                <BirthdayCard key={m.id} member={m} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
