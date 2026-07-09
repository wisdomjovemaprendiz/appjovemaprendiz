"use client";

import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type StatusState = {
  type: "loading" | "ready" | "success" | "error";
  message: string;
};

function validatePassword({
  password,
  confirmPassword,
  email,
}: {
  password: string;
  confirmPassword: string;
  email: string;
}) {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push("mínimo de 12 caracteres");
  }

  if (!/[A-ZÀ-Ý]/.test(password)) {
    errors.push("uma letra maiúscula");
  }

  if (!/[a-zà-ÿ]/.test(password)) {
    errors.push("uma letra minúscula");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("um número");
  }

  if (!/[^A-Za-zÀ-ÿ0-9]/.test(password)) {
    errors.push("um símbolo");
  }

  if (password !== confirmPassword) {
    errors.push("as duas senhas precisam ser iguais");
  }

  const emailUser = email.split("@")[0]?.toLowerCase();

  if (emailUser && emailUser.length >= 4 && password.toLowerCase().includes(emailUser)) {
    errors.push("a senha não pode conter parte do e-mail");
  }

  return errors;
}

export function ResetPasswordClient() {
  const [status, setStatus] = useState<StatusState>({
    type: "loading",
    message: "Validando o link de recuperação...",
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return null;
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }, []);

  useEffect(() => {
    if (!supabase) {
      setStatus({
        type: "error",
        message:
          "A recuperação de senha ainda não está configurada. Fale com o RH master.",
      });
      return;
    }

    const recoveryClient = supabase;

    let active = true;

    async function prepareRecoverySession() {
      try {
        const currentUrl = new URL(window.location.href);
        const code = currentUrl.searchParams.get("code");

        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const hashError = hashParams.get("error_description");

        if (hashError) {
          setStatus({
            type: "error",
            message:
              "O link de recuperação é inválido ou expirou. Solicite um novo link.",
          });
          return;
        }

        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          await recoveryClient.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          window.history.replaceState(null, "", "/auth/redefinir-senha");
        }

        if (code) {
          await recoveryClient.auth.exchangeCodeForSession(code);
          window.history.replaceState(null, "", "/auth/redefinir-senha");
        }

        const { data } = await recoveryClient.auth.getSession();

        if (!active) return;

        if (data.session?.user) {
          setEmail(data.session.user.email || "");
          setStatus({
            type: "ready",
            message: "Link validado. Agora crie uma nova senha segura.",
          });
          return;
        }

        setStatus({
          type: "error",
          message:
            "Não foi possível validar o link de recuperação. Solicite um novo link.",
        });
      } catch {
        if (!active) return;

        setStatus({
          type: "error",
          message:
            "O link de recuperação é inválido ou expirou. Solicite um novo link.",
        });
      }
    }

    const {
      data: { subscription },
    } = recoveryClient.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session?.user) {
        setEmail(session.user.email || "");
        setStatus({
          type: "ready",
          message: "Link validado. Agora crie uma nova senha segura.",
        });
      }
    });

    void prepareRecoverySession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setStatus({
        type: "error",
        message:
          "A recuperação de senha ainda não está configurada. Fale com o RH master.",
      });
      return;
    }

    const errors = validatePassword({
      password,
      confirmPassword,
      email,
    });

    if (errors.length > 0) {
      setStatus({
        type: "error",
        message: `A nova senha precisa ter: ${errors.join(", ")}.`,
      });
      return;
    }

    setIsSubmitting(true);

    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      setIsSubmitting(false);
      setStatus({
        type: "error",
        message:
          "Sua sessão de recuperação expirou. Solicite um novo link de recuperação.",
      });
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setIsSubmitting(false);

    if (error) {
      setStatus({
        type: "error",
        message:
          "Não foi possível redefinir a senha. Solicite um novo link e tente novamente.",
      });
      return;
    }

    await supabase.auth.signOut();

    setStatus({
      type: "success",
      message: "Senha redefinida com sucesso. Redirecionando para o login...",
    });

    window.setTimeout(() => {
      window.location.href = "/login?mensagem=senha_atualizada";
    }, 1000);
  }

  const isReady = status.type === "ready" || status.type === "error";

  return (
    <section className="w-full max-w-[540px] rounded-[2rem] bg-white p-8 shadow-2xl shadow-slate-300/80 ring-1 ring-slate-100 sm:p-10">
      <div className="mb-7 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 shadow-sm">
          <KeyRound className="h-8 w-8" />
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-red-600">
            Nova senha
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-blue-950">
            Redefinir acesso
          </h1>
        </div>
      </div>

      <div
        className={`mb-6 rounded-2xl border px-4 py-4 text-sm font-black ${
          status.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : status.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-blue-200 bg-blue-50 text-blue-800"
        }`}
        aria-live="polite"
      >
        {status.message}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">Nova senha</span>
          <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
            <Lock className="h-5 w-5 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              required
              disabled={!isReady || status.type === "success"}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Crie uma senha forte"
              className="min-w-0 flex-1 border-0 bg-transparent text-sm font-bold text-blue-950 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-blue-950"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              title={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </span>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">
            Confirmar nova senha
          </span>
          <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
            <Lock className="h-5 w-5 text-slate-400" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              disabled={!isReady || status.type === "success"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repita a nova senha"
              className="min-w-0 flex-1 border-0 bg-transparent text-sm font-bold text-blue-950 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((current) => !current)}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-blue-950"
              aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
              title={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </span>
        </label>

        <div className="rounded-2xl bg-slate-50 px-4 py-4 text-xs font-bold leading-relaxed text-slate-600">
          A senha deve ter no mínimo 12 caracteres, letra maiúscula, letra
          minúscula, número, símbolo e não pode conter parte do e-mail.
        </div>

        <button
          type="submit"
          disabled={!isReady || isSubmitting || status.type === "success"}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-base font-black text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <CheckCircle2 className="h-5 w-5" />
          {isSubmitting ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>

      <Link
        href="/login"
        className="mt-6 inline-flex items-center gap-2 text-sm font-black text-blue-700 transition hover:text-red-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para o login
      </Link>
    </section>
  );
}