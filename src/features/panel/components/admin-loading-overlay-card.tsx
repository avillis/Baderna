"use client";

import { useProfileLoadingToggle } from "@/features/panel/use-profile-loading-toggle";

/**
 * Card de admin que liga/desliga o overlay "Carregando perfil…" (Braum)
 * globalmente neste browser. Persiste em localStorage; reage em tempo real
 * pra todos os overlays montados na hora.
 */
export function AdminLoadingOverlayCard() {
  const { disabled, hydrated, toggle } = useProfileLoadingToggle();

  return (
    <aside className="rounded-[var(--panel-radius-card)] bg-white p-6 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <h2 className="mb-2 text-[18px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
        Tela de carregamento
      </h2>
      <p className="mb-4 text-[12px] font-medium text-[#8d8d8d]">
        Liga/desliga o overlay do Braum que aparece enquanto o perfil carrega.
        A preferência fica salva neste browser.
      </p>

      <button
        type="button"
        onClick={toggle}
        disabled={!hydrated}
        className={`flex h-[44px] w-full items-center justify-center rounded-[14px] text-[13px] font-bold tracking-[-0.02em] transition-colors disabled:opacity-50 ${
          disabled
            ? "bg-[#ff4100] text-white hover:opacity-90"
            : "bg-[#ededed] text-[#0f0f0f] hover:bg-[#e0e0e0]"
        }`}
      >
        {disabled ? "Reativar tela de carregamento" : "Desativar tela de carregamento"}
      </button>

      <p className="mt-3 text-[11px] font-semibold text-[#a59c95]">
        Status atual:{" "}
        <span className={disabled ? "text-[#ff4100]" : "text-[#2f855a]"}>
          {disabled ? "Desativada" : "Ativa"}
        </span>
      </p>
    </aside>
  );
}
