"use client";

import Image from "next/image";
import { useState } from "react";

import { forgotPassword } from "@/features/panel/use-auth";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    await forgotPassword(email.trim());
    setSubmitting(false);
    // Resposta sempre "ok" — back não revela se o email existe (anti enumeration).
    setSent(true);
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
                Recuperar senha
              </h1>
              <p className="mt-[6px] text-[13px] leading-[1.5] text-[#7c7c7c]">
                Coloca o email da conta e a gente manda um link pra você
                redefinir a senha.
              </p>
            </div>

            {sent ? (
              <div className="w-full rounded-[16px] bg-white p-[20px] text-center shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                <p className="text-[14px] font-semibold tracking-[-0.02em] text-[#0f0f0f]">
                  Email enviado ✓
                </p>
                <p className="mt-[8px] text-[12px] leading-[1.5] text-[#7c7c7c]">
                  Se esse email existe na nossa base, você vai receber um link
                  em alguns minutos. Confere também o spam.
                </p>
                <a
                  href="/entrar"
                  className="mt-[16px] inline-block text-[13px] font-bold text-[#ff4100] hover:underline"
                >
                  Voltar pro login
                </a>
              </div>
            ) : (
              <form className="w-full space-y-4" onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="Seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-full border-none bg-[#ededed] py-4 pl-6 pr-12 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff4100]/20"
                />
                <button
                  type="submit"
                  disabled={submitting || !email.trim()}
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
                    "Enviar link de recuperação"
                  )}
                </button>
                <div className="text-center text-sm text-gray-600">
                  Lembrou da senha?{" "}
                  <a
                    href="/entrar"
                    className="ml-1 font-medium text-[#ff4100] hover:underline"
                  >
                    Voltar
                  </a>
                </div>
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
