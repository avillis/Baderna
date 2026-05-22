"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { getChampionAvatarSrc } from "@/features/panel/champion-avatar";
import { useMemberCoins } from "@/features/panel/use-member-coins";

type Row = {
  id: number;
  name: string;
  summonerName: string | null;
  avatarSrc: string | null;
  balance: number;
};

export function MemberCoinsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const { setCoinsFor, loadAdminList } = useMemberCoins();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    // Fetcha lista de todos os usuários do backend
    void loadAdminList().then((list) => {
      setRows(
        list.map((m) => ({
          id: m.id,
          name: m.name,
          summonerName: m.summonerName,
          avatarSrc: (m as { avatarSrc?: string | null }).avatarSrc ?? null,
          balance: m.balance,
        })),
      );
    });

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, loadAdminList]);

  function handleChange(id: number, value: number) {
    const sanitized = Math.max(0, Math.floor(value));
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, balance: sanitized } : r)),
    );
    setCoinsFor(String(id), sanitized);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#ededed] text-[13px] font-bold tracking-[-0.02em] text-[#0f0f0f] transition-colors hover:bg-[#e3e3e3]"
      >
        Ver saldos
      </button>

      {mounted &&
        isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/38 px-4 py-6 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative flex max-h-[86vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0px_30px_90px_rgba(0,0,0,0.18)]"
            >
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Fechar"
                className="absolute right-[20px] top-[20px] z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#ff4100] text-white transition-opacity hover:opacity-85"
              >
                <X className="h-[16px] w-[16px]" strokeWidth={2.4} />
              </button>

              <div className="border-b border-[#ededed] px-[28px] pt-[28px] pb-[20px]">
                <h2 className="text-[24px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
                  Saldo de moedas
                </h2>
                <p className="mt-[4px] text-[13px] tracking-[-0.01em] text-[#7c7c7c]">
                  Edite o saldo de cada membro. Salvo automaticamente.
                </p>
              </div>

              <ul className="flex-1 overflow-y-auto px-[20px] py-[16px]">
                {rows.length === 0 ? (
                  <li className="py-[40px] text-center text-[13px] text-[#8d8d8d]">
                    Nenhum membro cadastrado ainda.
                  </li>
                ) : (
                  rows.map((member) => {
                    const seed =
                      member.summonerName?.toLowerCase() ?? String(member.id);
                    const avatar =
                      member.avatarSrc || getChampionAvatarSrc(seed);
                    return (
                      <li
                        key={member.id}
                        className="flex items-center gap-[14px] rounded-[14px] px-[10px] py-[8px] transition-colors hover:bg-[#fafafa]"
                      >
                        <div className="relative h-[36px] w-[36px] shrink-0 overflow-hidden rounded-full">
                          <img
                            src={avatar}
                            alt={member.summonerName ?? member.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
                            {member.summonerName ?? member.name}
                          </p>
                          <p className="truncate text-[12px] font-medium text-[#8d8d8d]">
                            {member.name}
                          </p>
                        </div>

                        <div className="flex items-center gap-[8px] rounded-full bg-[#ededed] px-[12px] py-[6px]">
                          <Image
                            src="/images/coin/Coin_icon2.png"
                            alt="moedas"
                            width={18}
                            height={18}
                            className="shrink-0"
                          />
                          <input
                            type="number"
                            min={0}
                            value={member.balance}
                            onChange={(e) =>
                              handleChange(member.id, Number(e.target.value) || 0)
                            }
                            className="w-[80px] bg-transparent text-right text-[14px] font-bold tracking-[-0.02em] text-[#0f0f0f] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
