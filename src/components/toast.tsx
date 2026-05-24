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
        className="pointer-events-none fixed bottom-[24px] right-[24px] z-[9999] flex flex-col gap-[10px]"
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
      className={`pointer-events-auto flex min-w-[260px] max-w-[400px] items-center justify-between gap-[12px] rounded-[14px] px-[16px] py-[12px] text-[13px] font-semibold shadow-[0px_12px_40px_rgba(0,0,0,0.18)] transition-all duration-300 ease-out ${
        styles[toast.type]
      } ${animState}`}
    >
      {/* Espaçador da largura do X pra centralizar o texto de verdade. */}
      <span className="h-[20px] w-[20px] flex-shrink-0" aria-hidden="true" />
      <span className="flex-1 text-center">{toast.message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-80"
      >
        <X className="h-[14px] w-[14px]" strokeWidth={2.4} />
      </button>
    </div>
  );
}
