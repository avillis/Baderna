"use client";

import { useState } from "react";

import Image from "next/image";

import { authToken } from "@/features/panel/use-auth";
import { useStorePrices, writeStorePricesCache } from "@/features/panel/use-store-prices";
import { useToast } from "@/components/toast";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

export function AdminStorePricesCard() {
  const prices = useStorePrices();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [capa, setCapa] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [name, setName] = useState<string>("");

  // Sync local edit state from fetched prices (only when not editing)
  const capaVal = capa !== "" ? capa : String(prices.capa);
  const titleVal = title !== "" ? title : String(prices.title);
  const nameVal = name !== "" ? name : String(prices.name);

  async function handleSave() {
    if (saving) return;
    const parsedCapa = parseInt(capaVal, 10);
    const parsedTitle = parseInt(titleVal, 10);
    const parsedName = parseInt(nameVal, 10);
    if (isNaN(parsedCapa) || isNaN(parsedTitle) || isNaN(parsedName)) {
      toast.show("Valores inválidos.");
      return;
    }
    setSaving(true);
    try {
      const token = authToken();
      if (!token) { toast.show("Sem autenticação."); return; }
      const res = await fetch(`${API_BASE}/admin/store-prices`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ capa: parsedCapa, title: parsedTitle, name: parsedName }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast.show(err.error ?? "Erro ao salvar."); return;
      }
      const data = (await res.json()) as { capa: number; title: number; name: number };
      writeStorePricesCache(data);
      setCapa(""); setTitle(""); setName("");
      toast.show("Preços da loja atualizados!", "success");
    } catch {
      toast.show("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  function PriceInput({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
  }) {
    return (
      <div>
        <label className="mb-[6px] block text-[12px] font-semibold tracking-[-0.01em] text-[#7c7c7c]">
          {label}
        </label>
        <div className="flex h-[44px] items-center gap-[6px] rounded-[12px] border border-[#e8e3de] bg-[#fafafa] px-[12px]">
          <Image
            src="/images/coin/Coin_icon2.png"
            alt="moedas"
            width={16}
            height={16}
            className="shrink-0"
          />
          <input
            type="number"
            min={0}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent text-[14px] font-semibold tracking-[-0.02em] text-[#0f0f0f] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
      </div>
    );
  }

  return (
    <aside className="rounded-[var(--panel-radius-card)] bg-white p-6 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <h2 className="mb-[4px] text-[18px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
        Preços da Loja
      </h2>
      <p className="mb-[16px] text-[12px] leading-[1.5] tracking-[-0.01em] text-[#7c7c7c]">
        Custo de cada giro na roleta. Alterações aplicadas em tempo real.
      </p>

      <div className="space-y-[10px]">
        <PriceInput label="Capas" value={capaVal} onChange={setCapa} />
        <PriceInput label="Títulos" value={titleVal} onChange={setTitle} />
        <PriceInput label="Nomes" value={nameVal} onChange={setName} />
      </div>

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={saving}
        className="mt-[16px] flex h-[50px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#0f0f0f] text-[13px] font-bold tracking-[-0.02em] text-white transition-colors hover:bg-[#1f1f1f] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? (
          <>
            <svg className="capas-spinner h-[16px] w-[16px] [&_circle]:stroke-white" viewBox="25 25 50 50">
              <circle r="20" cy="50" cx="50" />
            </svg>
            Salvando...
          </>
        ) : "Salvar preços"}
      </button>
    </aside>
  );
}
