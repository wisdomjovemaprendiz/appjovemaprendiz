"use server";

import { redirect } from "next/navigation";
import {
  createSupabaseServerAuthClient,
  getCurrentProfile,
  homeForRole,
} from "@/lib/supabase/server-auth";

export type AuthActionState = {
  ok: boolean;
  message: string;
};

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      ok: false,
      message: "Informe e-mail e senha.",
    };
  }

  const supabase = await createSupabaseServerAuthClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      ok: false,
      message: "E-mail ou senha inválidos.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      message: "Não foi possível confirmar a sessão.",
    };
  }

  const { data: profile } = await supabase
    .from("app_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();

    return {
      ok: false,
      message: "Usuário sem perfil de acesso. Fale com o RH master.",
    };
  }

  if (profile.status !== "ativo") {
    await supabase.auth.signOut();

    return {
      ok: false,
      message: "Usuário inativo ou bloqueado.",
    };
  }

  await supabase.from("security_events").insert({
    user_id: user.id,
    email,
    event_type: "login_success",
    metadata: {
      role: profile.role,
    },
  });

  if (profile.must_change_password) {
    redirect("/auth/alterar-senha");
  }

  redirect(homeForRole(profile.role));
}

export async function logoutAction() {
  const supabase = await createSupabaseServerAuthClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function changePasswordAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!password || password.length < 6) {
    return {
      ok: false,
      message: "A nova senha deve ter pelo menos 6 caracteres.",
    };
  }

  if (password !== confirmPassword) {
    return {
      ok: false,
      message: "As senhas não conferem.",
    };
  }

  const supabase = await createSupabaseServerAuthClient();
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile) {
    return {
      ok: false,
      message: "Sessão não encontrada. Faça login novamente.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return {
      ok: false,
      message: `Erro ao alterar senha: ${error.message}`,
    };
  }

  await supabase
    .from("app_profiles")
    .update({
      must_change_password: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  await supabase.from("security_events").insert({
    user_id: user.id,
    email: profile.email,
    event_type: "password_changed",
    metadata: {
      role: profile.role,
    },
  });

  redirect(homeForRole(profile.role));
}