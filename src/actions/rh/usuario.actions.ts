"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient, supabaseConfigMissingMessage } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/server-auth";

export type UsuarioActionResult = {
  ok: boolean;
  message: string;
  id?: string;
};

const initialError = (message: string): UsuarioActionResult => ({
  ok: false,
  message,
});

function normalizeEmail(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isChecked(formData: FormData, name: string) {
  const value = formData.get(name);
  return value === "on" || value === "true" || value === "1";
}

function normalizeRole(value: FormDataEntryValue | null) {
  const role = String(value ?? "").trim();

  if (["rh_master", "rh_operador", "empresa", "estagiario"].includes(role)) {
    return role;
  }

  return "";
}

function roleLabel(role: string) {
  if (role === "rh_master") return "RH master";
  if (role === "rh_operador") return "RH operador";
  if (role === "empresa") return "Empresa";
  if (role === "estagiario") return "Estagiário";
  return role || "perfil não informado";
}

function humanizeAuthError(errorMessage: string | undefined | null) {
  const message = String(errorMessage || "").trim();
  const normalized = message.toLowerCase();

  if (
    normalized.includes("already") ||
    normalized.includes("exists") ||
    normalized.includes("registered") ||
    normalized.includes("duplicate") ||
    normalized.includes("email")
  ) {
    return "Já existe um usuário com este e-mail. Use outro e-mail ou edite o usuário já cadastrado.";
  }

  if (normalized.includes("password")) {
    return "A senha não foi aceita pelo Supabase. Use uma senha com pelo menos 6 caracteres e evite senhas muito simples.";
  }

  if (normalized.includes("invalid")) {
    return "Algum dado informado está inválido. Confira e-mail, senha e perfil do usuário.";
  }

  return message
    ? `Erro retornado pelo Supabase: ${message}`
    : "Não foi possível concluir a operação. Confira os dados e tente novamente.";
}

async function requireMaster() {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile) {
    return {
      ok: false,
      user,
      profile,
      message: "Sessão não encontrada. Faça login novamente.",
    };
  }

  if (profile.status !== "ativo" || profile.role !== "rh_master") {
    return {
      ok: false,
      user,
      profile,
      message: "Apenas o RH master pode administrar usuários.",
    };
  }

  return {
    ok: true,
    user,
    profile,
    message: "Autorizado.",
  };
}

async function findAuthUserByEmail(supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>, email: string) {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    throw new Error(`Erro ao consultar usuários do Supabase Auth: ${error.message}`);
  }

  return data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase()) || null;
}

async function findProfileByEmail(supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>, email: string) {
  const { data, error } = await supabase
    .from("app_profiles")
    .select("id, nome, email, role, status")
    .ilike("email", email)
    .limit(1);

  if (error) {
    throw new Error(`Erro ao consultar perfis de acesso: ${error.message}`);
  }

  return data?.[0] || null;
}

async function auditAction({
  action,
  entityId,
  previous,
  next,
  reason,
}: {
  action: string;
  entityId: string | null;
  previous?: unknown;
  next?: unknown;
  reason: string;
}) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) return;

  await supabase.from("audit_logs").insert({
    acao: action,
    tabela: "app_profiles",
    entity_type: "usuario",
    entity_id: entityId,
    valor_anterior: previous ?? null,
    valor_novo: next ?? null,
    motivo: reason,
  });
}

export async function criarUsuarioSistemaAction(
  _previousState: UsuarioActionResult,
  formData: FormData,
): Promise<UsuarioActionResult> {
  try {
    const auth = await requireMaster();

    if (!auth.ok || !auth.user) {
      return initialError(auth.message);
    }

    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return initialError(supabaseConfigMissingMessage());
    }

    const nome = String(formData.get("nome") ?? "").trim();
    const email = normalizeEmail(formData.get("email"));
    const password = String(formData.get("password") ?? "");
    const role = normalizeRole(formData.get("role"));
    const companyId = String(formData.get("company_id") ?? formData.get("entity_id") ?? "").trim();
    const studentId = String(formData.get("student_id") ?? formData.get("entity_id") ?? "").trim();
    const mustChangePassword = isChecked(formData, "must_change_password");

    if (!nome) {
      return initialError("Informe o nome do usuário.");
    }

    if (!email || !isValidEmail(email)) {
      return initialError("Informe um e-mail válido para o usuário.");
    }

    if (!role) {
      return initialError("Selecione um perfil de acesso válido.");
    }

    if (!password || password.length < 6) {
      return initialError("Informe uma senha inicial com pelo menos 6 caracteres.");
    }

    if (role === "empresa" && !companyId) {
      return initialError("Selecione a empresa vinculada a este acesso.");
    }

    if (role === "estagiario" && !studentId) {
      return initialError("Selecione o estagiário vinculado a este acesso.");
    }

    const existingProfile = await findProfileByEmail(supabase, email);

    if (existingProfile) {
      return initialError(
        `Este e-mail já está cadastrado para ${existingProfile.nome || "outro usuário"} (${roleLabel(
          existingProfile.role,
        )}). Use outro e-mail ou edite o acesso já existente.`,
      );
    }

    const existingAuthUser = await findAuthUserByEmail(supabase, email);

    if (existingAuthUser) {
      return initialError(
        "Este e-mail já existe no Supabase Auth, mas ainda não está livre para novo cadastro no sistema. Use outro e-mail ou regularize este acesso com o RH master.",
      );
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
      return initialError(humanizeAuthError(createError?.message));
    }

    const profilePayload = {
      id: created.user.id,
      email,
      nome,
      role,
      status: "ativo",
      company_id: role === "empresa" ? companyId : null,
      student_id: role === "estagiario" ? studentId : null,
      must_change_password: mustChangePassword,
      created_by: auth.user.id,
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase
      .from("app_profiles")
      .insert(profilePayload);

    if (profileError) {
      return initialError(
        `O usuário foi criado no Supabase, mas houve erro ao salvar o perfil no sistema: ${profileError.message}`,
      );
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

    await auditAction({
      action: "criou_usuario_sistema",
      entityId: created.user.id,
      next: profilePayload,
      reason: "Usuário criado pelo painel RH.",
    });

    revalidatePath("/rh/usuarios");
    revalidatePath("/rh");

    return {
      ok: true,
      id: created.user.id,
      message: `Usuário ${nome} criado com sucesso. Login: ${email}`,
    };
  } catch (error) {
    return initialError(
      error instanceof Error
        ? error.message
        : "Erro inesperado ao criar usuário.",
    );
  }
}

export async function redefinirSenhaUsuarioAction(
  _previousState: UsuarioActionResult,
  formData: FormData,
): Promise<UsuarioActionResult> {
  try {
    const auth = await requireMaster();

    if (!auth.ok) {
      return initialError(auth.message);
    }

    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return initialError(supabaseConfigMissingMessage());
    }

    const userId = String(formData.get("id") ?? formData.get("user_id") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const mustChangePassword = isChecked(formData, "must_change_password");

    if (!userId) {
      return initialError("Usuário não informado.");
    }

    if (!password || password.length < 6) {
      return initialError("Informe uma nova senha com pelo menos 6 caracteres.");
    }

    const { data: previous } = await supabase
      .from("app_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password,
    });

    if (updateError) {
      return initialError(humanizeAuthError(updateError.message));
    }

    const profilePatch = {
      must_change_password: mustChangePassword,
      senha_configurada_em: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from("app_profiles")
      .update(profilePatch)
      .eq("id", userId);

    await auditAction({
      action: "redefiniu_senha_usuario",
      entityId: userId,
      previous,
      next: {
        ...profilePatch,
        senha: "[REDEFINIDA]",
      },
      reason: "Senha redefinida pelo RH master.",
    });

    revalidatePath("/rh/usuarios");

    return {
      ok: true,
      id: userId,
      message: "Senha redefinida com sucesso.",
    };
  } catch (error) {
    return initialError(
      error instanceof Error
        ? error.message
        : "Erro inesperado ao redefinir senha.",
    );
  }
}

export async function alterarStatusUsuarioAction(
  _previousState: UsuarioActionResult,
  formData: FormData,
): Promise<UsuarioActionResult> {
  try {
    const auth = await requireMaster();

    if (!auth.ok || !auth.user) {
      return initialError(auth.message);
    }

    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return initialError(supabaseConfigMissingMessage());
    }

    const userId = String(formData.get("id") ?? formData.get("user_id") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();
    const motivo = String(formData.get("motivo") ?? "").trim();

    if (!userId) {
      return initialError("Usuário não informado.");
    }

    if (!["ativo", "bloqueado", "inativo"].includes(status)) {
      return initialError("Status inválido. Use ativo, bloqueado ou inativo.");
    }

    if (userId === auth.user.id && status !== "ativo") {
      return initialError("Você não pode bloquear ou inativar o próprio acesso logado.");
    }

    const { data: previous } = await supabase
      .from("app_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!previous) {
      return initialError("Perfil de usuário não encontrado.");
    }

    const patch = {
      status,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("app_profiles")
      .update(patch)
      .eq("id", userId);

    if (error) {
      return initialError(`Erro ao alterar status do usuário: ${error.message}`);
    }

    await auditAction({
      action: status === "ativo" ? "reativou_usuario" : "bloqueou_usuario",
      entityId: userId,
      previous,
      next: patch,
      reason:
        motivo ||
        (status === "ativo"
          ? "Usuário reativado pelo RH master."
          : "Usuário bloqueado pelo RH master."),
    });

    revalidatePath("/rh/usuarios");

    return {
      ok: true,
      id: userId,
      message:
        status === "ativo"
          ? "Usuário reativado com sucesso."
          : "Usuário bloqueado com sucesso.",
    };
  } catch (error) {
    return initialError(
      error instanceof Error
        ? error.message
        : "Erro inesperado ao alterar status.",
    );
  }
}