"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

import { useAuth } from "@/features/panel/use-auth";
import { useToast } from "@/components/toast";

// Wrapper com Suspense — useSearchParams() exige isso no Next.js 16+
export default function EntrarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f7f7]" />}>
      <EntrarPageInner />
    </Suspense>
  );
}

function EntrarPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const { login, register, token, hydrated } = useAuth();
  const toast = useToast();

  // Já está logado? Manda direto pra rota de destino.
  useEffect(() => {
    if (hydrated && token) router.replace(next);
  }, [hydrated, token, next, router]);

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [summonerName, setSummonerName] = useState("");
  const [tagLine, setTagLine] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        const result = await register({
          name: name.trim(),
          email: email.trim(),
          password,
          summoner_name: summonerName.trim(),
          tag_line: tagLine.trim(),
        });
        // Cadastro pendente de aprovação — não navega, volta pro login.
        if (result && "pending" in result) {
          toast.show(
            result.message ??
              "Cadastro recebido! Sua conta está aguardando aprovação de um admin.",
          );
          setIsLogin(true);
          return;
        }
      }
      router.push(next);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Left side */}
      <div className="relative flex w-full flex-col bg-[#f7f7f7] md:w-1/2">
        <style>{`
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus,
          input:-webkit-autofill:active {
              -webkit-box-shadow: 0 0 0 100px #ededed inset !important;
              -webkit-text-fill-color: black !important;
              border-radius: 9999px !important;
              background-clip: padding-box !important;
          }
        `}</style>
        {/* Header */}
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

        {/* Form Container */}
        <div className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6 md:px-24">
          <div className="flex w-full max-w-[320px] flex-col items-center gap-6">
            <form className="w-full space-y-4" onSubmit={handleSubmit}>
              {!isLogin && (
                <>
                  <div>
                    <input
                      type="text"
                      placeholder="Seu nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-full border-none bg-[#ededed] px-6 py-4 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff4100]/20"
                      required
                    />
                  </div>
                  <div>
                    <p className="mb-2 px-2 text-xs font-medium text-gray-400">
                      Riot ID (opcional) — só se você joga Lol
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nome do jogo"
                        value={summonerName}
                        onChange={(e) => setSummonerName(e.target.value)}
                        className="min-w-0 flex-1 rounded-full border-none bg-[#ededed] px-6 py-4 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff4100]/20"
                      />
                      <div className="relative w-[110px] shrink-0">
                        <span className="pointer-events-none absolute left-[18px] top-1/2 -translate-y-1/2 text-sm text-gray-400">
                          #
                        </span>
                        <input
                          type="text"
                          placeholder="BR1"
                          value={tagLine}
                          onChange={(e) => setTagLine(e.target.value)}
                          maxLength={5}
                          className="w-full rounded-full border-none bg-[#ededed] py-4 pl-[34px] pr-4 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff4100]/20"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
              <div>
                <input
                  type="email"
                  placeholder="Seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-full border-none bg-[#ededed] px-6 py-4 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff4100]/20"
                  required
                />
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={isLogin ? undefined : 8}
                  className="w-full rounded-full border-none bg-[#ededed] py-4 pl-6 pr-12 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff4100]/20"
                  required
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
              {isLogin && (
                <div className="text-right">
                  <a
                    href="/recuperar-senha"
                    className="text-[12px] font-medium text-[#8d8d8d] hover:text-[#ff4100]"
                  >
                    Esqueci minha senha
                  </a>
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center rounded-full bg-[#ff4100] px-6 py-4 text-sm font-medium text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#ff4100]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <svg
                    className="capas-spinner h-[22px] w-[22px] [&_circle]:stroke-white"
                    viewBox="25 25 50 50"
                  >
                    <circle r="20" cy="50" cx="50" />
                  </svg>
                ) : isLogin ? (
                  "Entrar"
                ) : (
                  "Criar conta"
                )}
              </button>
            </form>
            <div className="text-sm text-gray-600">
              {isLogin ? (
                <>
                  Ainda não tem conta?{" "}
                  <button
                    onClick={() => setIsLogin(false)}
                    className="ml-1 font-medium text-[#ff4100] hover:underline"
                  >
                    Criar conta
                  </button>
                </>
              ) : (
                <>
                  Já possui uma conta?{" "}
                  <button
                    onClick={() => setIsLogin(true)}
                    className="ml-1 font-medium text-[#ff4100] hover:underline"
                  >
                    Entrar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right side - iframe for Batata Letters */}
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
