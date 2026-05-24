"use client";

import { useEffect, useRef, useState } from "react";

const THRESHOLD = 80;
const MAX = 130;

/**
 * Pull-to-refresh global. Quando o usuário arrasta pra baixo a partir
 * do topo da página em um dispositivo touch, aparece um spinner; ao
 * ultrapassar o threshold e soltar, recarrega a página.
 *
 * Não interfere em scroll normal — só ativa quando window.scrollY === 0
 * e o gesto começa pra baixo no topo.
 */
export function PullToRefresh() {
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (refreshing) return;
      // Algum modal/lightbox abriu e travou o scroll do body — não dispara
      // o pull-to-refresh por cima dele (senão arrastar a imagem recarrega).
      if (document.body.style.overflow === "hidden") {
        startY.current = null;
        return;
      }
      if (window.scrollY > 0) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0].clientY;
    }

    function onTouchMove(e: TouchEvent) {
      if (startY.current === null || refreshing) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        setPull(0);
        return;
      }
      // Resistência: dampening pra parecer "elástico"
      const damped = Math.min(MAX, dy * 0.55);
      setPull(damped);
    }

    function onTouchEnd() {
      if (startY.current === null) return;
      startY.current = null;
      if (pull >= THRESHOLD && !refreshing) {
        setRefreshing(true);
        // Pequeno delay pra animação ser visível antes do reload.
        window.setTimeout(() => window.location.reload(), 250);
      } else {
        setPull(0);
      }
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [pull, refreshing]);

  const visible = pull > 0 || refreshing;
  const progress = Math.min(1, pull / THRESHOLD);
  // Translada o indicador conforme o pull; quando refreshing fica fixo no top.
  const translateY = refreshing ? 40 : Math.min(60, pull);

  return (
    <div
      aria-hidden={!visible}
      className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex justify-center xl:hidden"
      style={{
        transform: `translateY(${translateY - 40}px)`,
        opacity: visible ? 1 : 0,
        transition: refreshing
          ? "transform 200ms ease-out"
          : pull === 0
            ? "transform 200ms ease-out, opacity 150ms ease-out"
            : "none",
      }}
    >
      <div className="mt-[12px] flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
        <svg
          className={refreshing ? "capas-spinner" : ""}
          viewBox="25 25 50 50"
          style={{
            width: 16,
            height: 16,
            color: "#ff4100",
            transform: refreshing ? undefined : `rotate(${progress * 360}deg)`,
            transition: refreshing ? undefined : "none",
          }}
        >
          {refreshing ? (
            <circle r="20" cy="50" cx="50" />
          ) : (
            <circle
              r="20"
              cy="50"
              cx="50"
              fill="none"
              stroke="#ff4100"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 20}
              strokeDashoffset={2 * Math.PI * 20 * (1 - progress)}
            />
          )}
        </svg>
      </div>
    </div>
  );
}
