"use client";

import { loginAction, type AuthActionState } from "@/actions/auth.actions";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

type LoginFormClientProps = {
  errorMessage?: string | null;
  successMessage?: string | null;
  logoUrl?: string | null;
  organizationName?: string | null;
};

const initialState: AuthActionState = {
  ok: true,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-base font-black text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <ArrowRight className="h-5 w-5" />
      {pending ? "Entrando..." : "Entrar"}
    </button>
  );
}

function LogoBox({
  logoUrl,
  organizationName,
}: {
  logoUrl?: string | null;
  organizationName?: string | null;
}) {
  const [failed, setFailed] = useState(false);

  if (!logoUrl || failed) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-blue-50 text-lg font-black text-blue-950 shadow-sm">
        RH
      </div>
    );
  }

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <img
        src={logoUrl}
        alt={`Logo ${organizationName || "RH Wisdom"}`}
        className="h-full w-full object-contain p-2"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function LoginFormClient({
  errorMessage,
  successMessage,
  logoUrl,
  organizationName,
}: LoginFormClientProps) {
  const [state, formAction] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  const actionMessage = state.message || "";
  const visibleMessage = actionMessage || errorMessage || successMessage || "";
  const isErrorMessage = Boolean(actionMessage ? !state.ok : errorMessage);
  const isSuccessMessage = Boolean(!isErrorMessage && visibleMessage);

  return (
    <section className="w-full max-w-[480px] rounded-[2rem] bg-white p-8 shadow-2xl shadow-slate-300/80 ring-1 ring-slate-100 sm:p-10">
      <div className="mb-8 flex items-center gap-4">
        <LogoBox logoUrl={logoUrl} organizationName={organizationName} />

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-red-600">
            Login seguro
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-blue-950">
            Entrar no sistema
          </h1>
          <p className="mt-1 truncate text-sm font-bold text-slate-500">
            {organizationName || "Sistema RH Wisdom"}
          </p>
        </div>
      </div>

      {visibleMessage ? (
        <div
          className={`mb-5 rounded-2xl border px-4 py-4 text-sm font-black ${
            isErrorMessage
              ? "border-red-200 bg-red-50 text-red-700"
              : isSuccessMessage
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-700"
          }`}
          aria-live="polite"
        >
          {visibleMessage}
        </div>
      ) : null}

      <form action={formAction} className="space-y-5">
        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">E-mail</span>
          <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
            <Mail className="h-5 w-5 text-slate-400" />
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="seuemail@exemplo.com"
              className="min-w-0 flex-1 border-0 bg-transparent text-sm font-bold text-blue-950 outline-none placeholder:text-slate-400"
            />
          </span>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">Senha</span>
          <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
            <Lock className="h-5 w-5 text-slate-400" />
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Digite sua senha"
              className="min-w-0 flex-1 border-0 bg-transparent text-sm font-bold text-blue-950 outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-blue-950"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              title={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </span>
        </label>

        <div className="flex items-center justify-end">
          <Link
            href="/auth/esqueci-senha"
            className="text-sm font-black text-blue-700 transition hover:text-red-600"
          >
            Esqueci minha senha
          </Link>
        </div>

        <SubmitButton />
      </form>
    </section>
  );
}