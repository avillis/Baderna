"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type MobileNavValue = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

const MobileNavContext = createContext<MobileNavValue | null>(null);

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Fecha ao trocar de rota.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Trava o scroll do body + Escape fecha, enquanto o drawer tá aberto.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <MobileNavContext.Provider value={{ open, setOpen }}>
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  const ctx = useContext(MobileNavContext);
  if (!ctx) {
    throw new Error("useMobileNav precisa estar dentro de <MobileNavProvider>");
  }
  return ctx;
}

/** Largura do drawer mobile — também é o quanto a página é empurrada. */
export const MOBILE_DRAWER_WIDTH = 280;
const MOBILE_CARD_RADIUS = 25;
const MOBILE_STAGE_COLOR = "#ece8e4";

/**
 * Card da página: opaco (tapa o <MobileMenu/> atrás dele) e empurrado pra
 * direita quando o drawer abre, revelando o menu. Usa `left` (e não
 * `transform`) de propósito: o header fixo lá dentro continua ancorado na
 * viewport e não desliza junto. O overflow horizontal é cortado pelo PanelShell.
 */
export function MobilePushRegion({
  children,
  bgClassName = "bg-[#f7f7f7]",
}: {
  children: ReactNode;
  /** Mesmo fundo da página: o card precisa ser opaco pra tapar o menu atrás
   *  dele quando o drawer está fechado. */
  bgClassName?: string;
}) {
  const { open, setOpen } = useMobileNav();
  return (
    <div
      className={cn(
        "relative z-[30] min-h-screen transition-[left,border-radius] duration-300 ease-out xl:left-0 xl:rounded-none",
        bgClassName,
        open
          ? "left-[280px] rounded-l-[25px]"
          : "left-0",
      )}
    >
      {children}

      {/* Cantos arredondados do card "em cima e em baixo", ancorados na
          viewport (a página rola no body, então o card sozinho só arredondaria
          no topo/fundo do documento). São máscaras côncavas fixas na borda
          esquerda do card (x=280): pintam a cor do stage fora do arco e deixam
          o card aparecer dentro dele. A sombra agora é uma faixa separada,
          então não precisamos mais de preenchimento reto cinza nos cantos. */}
      {open && (
        <>
          <span
            aria-hidden
            className="pointer-events-none fixed top-0 z-[36] xl:hidden"
            style={{
              left: MOBILE_DRAWER_WIDTH,
              width: MOBILE_CARD_RADIUS,
              height: MOBILE_CARD_RADIUS,
              background:
                `radial-gradient(circle at bottom right, transparent ${MOBILE_CARD_RADIUS - 0.5}px, ${MOBILE_STAGE_COLOR} ${MOBILE_CARD_RADIUS}px)`,
            }}
          />
          <span
            aria-hidden
            className="pointer-events-none fixed bottom-0 z-[36] xl:hidden"
            style={{
              left: MOBILE_DRAWER_WIDTH,
              width: MOBILE_CARD_RADIUS,
              height: MOBILE_CARD_RADIUS,
              background:
                `radial-gradient(circle at top right, transparent ${MOBILE_CARD_RADIUS - 0.5}px, ${MOBILE_STAGE_COLOR} ${MOBILE_CARD_RADIUS}px)`,
            }}
          />
        </>
      )}

      {/* Captura toques na página empurrada pra fechar o drawer. Fica colado na
          caixa do card (que já está deslocada 280px à direita), então não cobre
          o menu revelado à esquerda. */}
      <button
        type="button"
        aria-label="Fechar menu"
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
        className={cn(
          "absolute inset-0 z-[40] bg-transparent xl:hidden",
          open ? "" : "pointer-events-none",
        )}
      />
    </div>
  );
}
