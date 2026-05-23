"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { resetPassword } from "@/features/panel/use-auth";

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f7f7]" />}>
      <RedefinirSenhaInner />
    </Suspense>
  );
}

function RedefinirSenhaInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const mismatch = password.length > 0 && confirm.length > 0 && password !== confirm;
  const tooShort = password.length > 0 && password.length < 6;
  const ok =
    !!token && !!email && password.length >= 6 && password === confirm && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ok) return;
    setSubmitting(true);
    setError(null);
    const err = await resetPassword(token, email, password);
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    setDone(true);
    window.setTimeout(() => router.push("/entrar"), 1800);
  }

  // Sem token na URL → manda pra recuperar.
  if (!token || !email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f7] p-4 text-center">
        <div className="max-w-[320px]">
          <h1 className="text-[20px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
            Link inválido
          </h1>
          <p className="mt-[8px] text-[13px] text-[#7c7c7c]">
            O link que você usou não tem as informações necessárias. Pede um
            novo abaixo.
          </p>
          <a
            href="/recuperar-senha"
            className="mt-[16px] inline-block text-[13px] font-bold text-[#ff4100] hover:underline"
          >
            Pedir novo link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-white">
      <div className="relative flex w-full flex-col bg-[#f7f7f7] md:w-1/2">
        <div className="flex items-start justify-between px-4 py-6 sm:px-6 sm:py-8">
          <Image
            src="/logo.svg"
            alt="Baderna Logo"
            width={120}
            height={40}
            className="h-10 w-auto"
            priority
          />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6 md:px-24">
          <div className="flex w-full max-w-[320px] flex-col items-center gap-6">
            <div className="text-center">
              <h1 className="text-[24px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
                Nova senha
              </h1>
              <p className="mt-[6px] text-[13px] leading-[1.5] text-[#7c7c7c]">
                Pra <strong className="font-semibold text-[#0f0f0f]">{email}</strong>
              </p>
            </div>

            {done ? (
              <div className="w-full rounded-[16px] bg-white p-[20px] text-center shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                <p className="text-[14px] font-semibold tracking-[-0.02em] text-[#0f0f0f]">
                  Senha redefinida ✓
                </p>
                <p className="mt-[8px] text-[12px] leading-[1.5] text-[#7c7c7c]">
                  Redirecionando pra tela de login…
                </p>
              </div>
            ) : (
              <form className="w-full space-y-4" onSubmit={handleSubmit}>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Nova senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    className="w-full rounded-full border-none bg-[#ededed] py-4 pl-6 pr-12 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff4100]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-[#0f0f0f]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    ) : (
                      <Eye className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    )}
                  </button>
                </div>

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirmar nova senha"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                  className={`w-full rounded-full border-none bg-[#ededed] py-4 pl-6 pr-12 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
                    mismatch ? "focus:ring-[#c53030]/30" : "focus:ring-[#ff4100]/20"
                  }`}
                />

                {tooShort && (
                  <p className="text-center text-[12px] font-medium text-[#8d8d8d]">
                    Mínimo 6 caracteres.
                  </p>
                )}
                {mismatch && (
                  <p className="text-center text-[12px] font-medium text-[#c53030]">
                    As senhas não coincidem.
                  </p>
                )}
                {error && (
                  <p className="text-center text-[13px] font-semibold text-[#c53030]">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!ok}
                  className="flex w-full items-center justify-center rounded-full bg-[#ff4100] px-6 py-4 text-sm font-medium text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#ff4100]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <svg
                      className="capas-spinner h-[22px] w-[22px] [&_circle]:stroke-white"
                      viewBox="25 25 50 50"
                    >
                      <circle r="20" cy="50" cx="50" />
                    </svg>
                  ) : (
                    "Redefinir senha"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="hidden flex-1 md:flex">
        <iframe
          src="/batata-letters.html"
          className="h-full w-full border-none"
          title="Batata Letters Animation"
        />
      </div>
    </div>
  );
}
