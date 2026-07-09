"use client";

import {
  solicitarRecuperacaoSenhaAction,
  type PasswordResetRequestState,
} from "@/actions/auth-password.actions";
import { ArrowLeft, Mail, Send } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

const initialState: PasswordResetRequestState = {
  status: "idle",
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
      <Send className="h-5 w-5" />
      {pending ? "Enviando..." : "Enviar link seguro"}
    </button>
  );
}

export function PasswordResetRequestForm() {
  const [state, formAction] = useActionState(
    solicitarRecuperacaoSenhaAction,
    initialState,
  );

  return (
    <section className="w-full max-w-[520px] rounded-[2rem] bg-white p-8 shadow-2xl shadow-slate-300/80 ring-1 ring-slate-100 sm:p-10">
      <p className="text-xs font-black uppercase tracking-[0.35em] text-red-600">
        Recuperação segura
      </p>

      <h1 className="mt-3 text-3xl font-black tracking-tight text-blue-950">
        Esqueci minha senha
      </h1>

      <p className="mt-3 text-sm font-bold leading-relaxed text-slate-500">
        Informe o e-mail cadastrado no sistema. Caso ele exista, enviaremos um
        link seguro para redefinir a senha.
      </p>

      {state.message ? (
        <div
          className={`mt-6 rounded-2xl border px-4 py-4 text-sm font-black ${
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
          aria-live="polite"
        >
          {state.message}
        </div>
      ) : null}

      <form action={formAction} className="mt-7 space-y-5">
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

        <SubmitButton />
      </form>

      <Link
        href="/login"
        className="mt-6 inline-flex items-center gap-2 text-sm font-black text-blue-700 transition hover:text-red-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para o login
      </Link>

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-xs font-bold leading-relaxed text-amber-800">
        Por segurança, o sistema não confirma se o e-mail existe. O link de
        recuperação só funciona pelo e-mail recebido e tem validade controlada
        pelo Supabase Auth.
      </div>
    </section>
  );
}