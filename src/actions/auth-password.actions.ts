"use server";

import { createClient } from "@supabase/supabase-js";

export type PasswordResetRequestState = {
  status: "idle" | "success" | "error";
  message: string;
};

const GENERIC_SUCCESS_MESSAGE =
  "Se este e-mail estiver cadastrado no sistema, enviaremos um link seguro para redefinição de senha.";

function getAppUrl() {
  const explicitUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL;

  if (explicitUrl) {
    return explicitUrl.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function solicitarRecuperacaoSenhaAction(
  _previousState: PasswordResetRequestState,
  formData: FormData,
): Promise<PasswordResetRequestState> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  if (!isValidEmail(email)) {
    return {
      status: "error",
      message: "Informe um e-mail válido para receber o link de recuperação.",
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      status: "error",
      message:
        "A recuperação de senha ainda não está configurada. Fale com o RH master.",
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const redirectTo = `${getAppUrl()}/auth/redefinir-senha`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    console.error("Falha ao solicitar recuperação de senha:", error.message);
  }

  // Segurança: nunca revelar se o e-mail existe ou não no sistema.
  return {
    status: "success",
    message: GENERIC_SUCCESS_MESSAGE,
  };
}