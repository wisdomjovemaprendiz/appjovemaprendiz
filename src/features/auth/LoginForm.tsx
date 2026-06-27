"use client";

import { loginAction, type AuthActionState } from "@/actions/auth.actions";
import { LockKeyhole, LogIn, Mail } from "lucide-react";
import { useActionState } from "react";

const initialState: AuthActionState = {
  ok: false,
  message: "",
};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state.message ? (
        <div
          className={`rounded-2xl border p-4 text-sm font-black ${
            state.ok
              ? "border-green-100 bg-green-50 text-green-700"
              : "border-red-100 bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <label className="grid gap-2">
        <span className="text-sm font-black text-blue-950">E-mail</span>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="seuemail@exemplo.com"
            className="h-12 w-full rounded-xl border border-slate-200 pl-12 pr-4 text-sm font-bold outline-none focus:border-blue-500"
          />
        </div>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-black text-blue-950">Senha</span>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="Digite sua senha"
            className="h-12 w-full rounded-xl border border-slate-200 pl-12 pr-4 text-sm font-bold outline-none focus:border-blue-500"
          />
        </div>
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="btn-wisdom-red inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-black disabled:cursor-not-allowed disabled:opacity-70"
      >
        <LogIn className="h-5 w-5" />
        {isPending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}