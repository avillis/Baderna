"use client";

import { X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastType = "error" | "success" | "info";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
  dismissing: boolean;
};

type ToastContextType = {
  show: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback silencioso pra não quebrar componentes que rodam fora do
    // provider (ex: testes, ou árvores que esqueceram de wrap).
    return { show: () => {} };
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    // Marca como dismissing pra animar saída. Remove de fato após 300ms.
    setToasts((curr) =>
      curr.map((t) => (t.id === id ? { ...t, dismissing: true } : t)),
    );
    window.setTimeout(() => {
      setToasts((curr) => curr.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const show = useCallback(
    (message: string, type: ToastType = "error") => {
      const id = ++idRef.current;
      setToasts((curr) => [...curr, { id, message, type, dismissing: false }]);
      window.setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-[16px] bottom-[24px] z-[9999] flex flex-col items-center gap-[10px] xl:inset-x-auto xl:right-[24px] xl:items-end"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  // Entrada: slide de baixo pra cima.
  // Saída (dismissing=true): slide pra baixo + fade out.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(r);
  }, []);

  const styles: Record<ToastType, string> = {
    error: "bg-[#c53030] text-white",
    success: "bg-[#2f855a] text-white",
    info: "bg-[#0f0f0f] text-white",
  };

  const animState = toast.dismissing
    ? "translate-y-[24px] opacity-0"
    : entered
      ? "translate-y-0 opacity-100"
      : "translate-y-[24px] opacity-0";

  return (
    <div
      className={`pointer-events-auto relative flex w-full max-w-[400px] items-center rounded-[14px] px-[16px] py-[12px] text-[13px] font-semibold shadow-[0px_12px_40px_rgba(0,0,0,0.18)] transition-all duration-300 ease-out xl:w-auto xl:min-w-[260px] ${
        styles[toast.type]
      } ${animState}`}
    >
      {/* Texto ocupa a largura toda e centraliza; o X fica absoluto à direita
          pra não puxar o texto pro lado. O px-[24px] simétrico dá folga e
          evita o texto encostar no botão. */}
      <span className="block w-full px-[24px] text-center">{toast.message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute right-[12px] top-1/2 flex h-[20px] w-[20px] -translate-y-1/2 items-center justify-center rounded-full text-white transition-opacity hover:opacity-80"
      >
        <X className="h-[14px] w-[14px]" strokeWidth={2.4} />
      </button>
    </div>
  );
}
