"use client";

import { useEffect, useRef, useState } from "react";
import { PanelShell } from "@/features/panel/components/panel-shell";

const RULES = [
  { id: "r01", short: "A Bíblia",         full: "Não faça nada que não esteja na Bíblia." },
  { id: "r02", short: "Borboyote",        full: "Seja um inimigo declarado da Borboyote." },
  { id: "r03", short: "O Sales",          full: "Trate o Sales como se ele fosse uma pessoa normal." },
  { id: "r04", short: "Flex alheia",      full: "É terminantemente proibido intar a flex alheia." },
  { id: "r05", short: "Respeito",         full: "Respeite as mulheres e as crianças." },
  { id: "r06", short: "Laicidade",        full: "O grupo é laico." },
  { id: "r07", short: "João",             full: "Fvck João." },
  { id: "r08", short: "Wilson & álcool",  full: "Mantenha bebidas alcoólicas longe do Wilson." },
  { id: "r09", short: "Muros",            full: "É proibido pular muros." },
  { id: "r10", short: "ADMs",             full: "Respeite os ADMs." },
  { id: "r11", short: "Wilson",           full: "Jamais ajude o Wilson." },
  { id: "r12", short: "Fotos",            full: "Proibido mandar foto de MERDA (sujeito a banimento instantâneo)." },
  { id: "r13", short: "Lema",             full: "O nosso lema é: ousadia e alegria." },
  { id: "r15", short: "Amigas da Alice",  full: "Mantenha as amigas da Alice longe do João." },
  { id: "r16", short: "Decência",         full: "Seja uma pessoa decente, por favor." },
  { id: "r17", short: "Alex G. & Rml",   full: "Fvck Alex G. Fvck Rml." },
  { id: "r18", short: "Para né",          full: "Aaah meu, para, né?!" },
  { id: "r19", short: "Ditadura",         full: "Grupo controlado pela Ditadura Socialista do STF e do PT." },
  { id: "r20", short: "Picantes",         full: "Perguntinhas picantes permitidas somente após as 21h." },
  { id: "r21", short: "Call",             full: "Não bater punheta em call ou adjacências." },
];

export default function RegrasPage() {
  const [activeId, setActiveId] = useState<string>("r01");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <PanelShell showBanner={false}>
      <div className="pt-[1.5vh] sm:pt-[6vh]">
        <div className="flex gap-[48px] xl:gap-[64px]">

          {/* ── Left sticky nav ── */}
          <aside className="hidden w-[160px] shrink-0 md:block">
            <div className="sticky top-[60px]">
              <p className="mb-[10px] text-[12px] font-bold tracking-[-0.02em] text-[#c9bfba]">
                Regras
              </p>
              <nav className="flex flex-col gap-[2px]">
                {RULES.map((rule) => {
                  const isActive = activeId === rule.id;
                  return (
                    <button
                      key={rule.id}
                      type="button"
                      onClick={() => scrollTo(rule.id)}
                      className={`rounded-[8px] px-[8px] py-[5px] text-left text-[13px] font-semibold tracking-[-0.02em] transition-colors ${
                        isActive
                          ? "bg-[#f5f0ee] text-[#0f0f0f]"
                          : "text-[#b0a8a4] hover:text-[#0f0f0f]"
                      }`}
                    >
                      <span className="shrink-0 text-[10px] tabular-nums opacity-50">
                        {rule.id.slice(1)}
                      </span>
                      {" "}{rule.short}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* ── Main content ── */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-[32px] xl:gap-[40px]">
              {RULES.map((rule, i) => (
                <section
                  key={rule.id}
                  id={rule.id}
                  ref={(el) => { sectionRefs.current[rule.id] = el; }}
                  className="scroll-mt-[80px]"
                >
                  <div className="flex items-baseline gap-[14px] xl:gap-[20px]">
                    <span className="shrink-0 text-[12px] font-bold tabular-nums text-[#c9bfba] xl:text-[14px]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-[15px] font-semibold leading-snug tracking-[-0.02em] text-[#0f0f0f] xl:text-[20px] xl:tracking-[-0.03em]">
                      {rule.full}
                    </p>
                  </div>
                  <div className="mt-[20px] h-px bg-[#f0eae7] xl:mt-[28px]" />
                </section>
              ))}
            </div>

            <div className="pb-[40px]" />
          </div>

        </div>
      </div>
    </PanelShell>
  );
}
