"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient, supabaseConfigMissingMessage } from "@/lib/supabase/server";
import { requireRhMaster } from "@/lib/supabase/server-auth";
import type { ActionResult } from "./action-utils";

function emptyToNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function validateRole(role: string) {
  return ["rh_master", "rh_operador", "empresa", "estagiario"].includes(role);
}

export async function criarUsuarioSistemaAction(formData: FormData): Promise<ActionResult> {
  const auth = await requireRhMaster();

  if (!auth.ok || !auth.user) {
    return {
      ok: false,
      message: auth.message,
    };
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      ok: false,
      message: supabaseConfigMissingMessage(),
    };
  }

  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "");
  const companyId = emptyToNull(formData.get("company_id"));
  const studentId = emptyToNull(formData.get("student_id"));

  if (!nome || !email || !password || !role) {
    return {
      ok: false,
      message: "Nome, e-mail, senha e perfil são obrigatórios.",
    };
  }

  if (password.length < 6) {
    return {
      ok: false,
      message: "A senha deve ter pelo menos 6 caracteres.",
    };
  }

  if (!validateRole(role)) {
    return {
      ok: false,
      message: "Perfil de acesso inválido.",
    };
  }

  if (role === "empresa" && !companyId) {
    return {
      ok: false,
      message: "Selecione a empresa vinculada ao usuário.",
    };
  }

  if (role === "estagiario" && !studentId) {
    return {
      ok: false,
      message: "Selecione o estagiário vinculado ao usuário.",
    };
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      nome,
      role,
    },
  });

  if (createError || !created.user) {
    return {
      ok: false,
      message: `Erro ao criar usuário: ${createError?.message || "usuário não retornado"}`,
    };
  }

  const profilePayload = {
    id: created.user.id,
    email,
    nome,
    role,
    status: "ativo",
    company_id: role === "empresa" ? companyId : null,
    student_id: role === "estagiario" ? studentId : null,
    must_change_password: true,
    created_by: auth.user.id,
    updated_at: new Date().toISOString(),
  };

  const { error: profileError } = await supabase
    .from("app_profiles")
    .upsert(profilePayload, { onConflict: "id" });

  if (profileError) {
    return {
      ok: false,
      message: `Usuário criado, mas houve erro ao salvar perfil: ${profileError.message}`,
    };
  }

  if (role === "empresa" && companyId) {
    await supabase
      .from("companies")
      .update({
        auth_user_id: created.user.id,
        senha_configurada_em: new Date().toISOString(),
      })
      .eq("id", companyId);
  }

  if (role === "estagiario" && studentId) {
    await supabase
      .from("students")
      .update({
        auth_user_id: created.user.id,
        senha_configurada_em: new Date().toISOString(),
      })
      .eq("id", studentId);
  }

  await supabase.from("audit_logs").insert({
    acao: "criou_usuario_sistema",
    tabela: "app_profiles",
    entity_type: "usuario",
    entity_id: created.user.id,
    valor_novo: profilePayload,
    motivo: "Usuário criado pelo RH master.",
  });

  revalidatePath("/rh/usuarios");
  revalidatePath("/rh");

  return {
    ok: true,
    id: created.user.id,
    message: "Usuário criado com sucesso. A troca de senha será obrigatória no primeiro acesso.",
  };
}

export async function redefinirSenhaUsuarioAction(formData: FormData): Promise<ActionResult> {
  const auth = await requireRhMaster();

  if (!auth.ok) {
    return {
      ok: false,
      message: auth.message,
    };
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      ok: false,
      message: supabaseConfigMissingMessage(),
    };
  }

  const userId = String(formData.get("id") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!userId || !password) {
    return {
      ok: false,
      message: "Usuário e nova senha são obrigatórios.",
    };
  }

  if (password.length < 6) {
    return {
      ok: false,
      message: "A senha deve ter pelo menos 6 caracteres.",
    };
  }

  const { data: anterior } = await supabase
    .from("app_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password,
  });

  if (error) {
    return {
      ok: false,
      message: `Erro ao redefinir senha: ${error.message}`,
    };
  }

  await supabase
    .from("app_profiles")
    .update({
      must_change_password: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  await supabase.from("audit_logs").insert({
    acao: "redefiniu_senha_usuario",
    tabela: "app_profiles",
    entity_type: "usuario",
    entity_id: userId,
    valor_anterior: anterior,
    valor_novo: {
      must_change_password: true,
    },
    motivo: "Senha redefinida pelo RH master.",
  });

  revalidatePath("/rh/usuarios");

  return {
    ok: true,
    id: userId,
    message: "Senha redefinida com sucesso.",
  };
}

export async function alterarStatusUsuarioAction(formData: FormData): Promise<ActionResult> {
  const auth = await requireRhMaster();

  if (!auth.ok) {
    return {
      ok: false,
      message: auth.message,
    };
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      ok: false,
      message: supabaseConfigMissingMessage(),
    };
  }

  const userId = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const motivo = String(formData.get("motivo") ?? "").trim();

  if (!userId || !["ativo", "inativo", "bloqueado"].includes(status)) {
    return {
      ok: false,
      message: "Usuário ou status inválido.",
    };
  }

  if (!motivo) {
    return {
      ok: false,
      message: "Informe o motivo da alteração.",
    };
  }

  const { data: anterior } = await supabase
    .from("app_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  const payload = {
    status,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("app_profiles")
    .update(payload)
    .eq("id", userId);

  if (error) {
    return {
      ok: false,
      message: `Erro ao alterar status: ${error.message}`,
    };
  }

  await supabase.from("audit_logs").insert({
    acao: "alterou_status_usuario",
    tabela: "app_profiles",
    entity_type: "usuario",
    entity_id: userId,
    valor_anterior: anterior,
    valor_novo: payload,
    motivo,
  });

  revalidatePath("/rh/usuarios");

  return {
    ok: true,
    id: userId,
    message: "Status alterado com sucesso.",
  };
}