import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EntityType = "empresa" | "estagiario";

function isEntityType(value: string | null): value is EntityType {
  return value === "empresa" || value === "estagiario";
}

function roleForEntity(entityType: EntityType) {
  return entityType === "empresa" ? "empresa" : "estagiario";
}

function tableForEntity(entityType: EntityType) {
  return entityType === "empresa" ? "companies" : "students";
}

function idColumnForProfile(entityType: EntityType) {
  return entityType === "empresa" ? "company_id" : "student_id";
}

async function requireMaster() {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile) {
    return {
      ok: false,
      user,
      profile,
      message: "Sessão não encontrada.",
    };
  }

  if (profile.role !== "rh_master" || profile.status !== "ativo") {
    return {
      ok: false,
      user,
      profile,
      message: "Apenas o RH master pode criar ou redefinir acessos.",
    };
  }

  return {
    ok: true,
    user,
    profile,
    message: "Autorizado.",
  };
}

async function loadEntity(entityType: EntityType, entityId: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) return null;

  if (entityType === "empresa") {
    const { data } = await supabase
      .from("companies")
      .select("id, razao_social, nome_fantasia, email, auth_user_id, senha_configurada_em")
      .eq("id", entityId)
      .maybeSingle();

    if (!data) return null;

    return {
      id: data.id,
      nome: data.nome_fantasia || data.razao_social || "Empresa sem nome",
      email: data.email || "",
      auth_user_id: data.auth_user_id || null,
      senha_configurada_em: data.senha_configurada_em || null,
    };
  }

  const { data } = await supabase
    .from("students")
    .select("id, nome, email, auth_user_id, senha_configurada_em, foto_url")
    .eq("id", entityId)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    nome: data.nome || "Estagiário sem nome",
    email: data.email || "",
    auth_user_id: data.auth_user_id || null,
    senha_configurada_em: data.senha_configurada_em || null,
    foto_url: data.foto_url || null,
  };
}

async function loadProfile(entityType: EntityType, entityId: string, authUserId?: string | null) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) return null;

  if (authUserId) {
    const { data } = await supabase
      .from("app_profiles")
      .select("*")
      .eq("id", authUserId)
      .maybeSingle();

    if (data) return data;
  }

  const column = idColumnForProfile(entityType);

  const { data } = await supabase
    .from("app_profiles")
    .select("*")
    .eq(column, entityId)
    .maybeSingle();

  return data || null;
}

export async function GET(request: Request) {
  const auth = await requireMaster();

  if (!auth.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: auth.message,
      },
      { status: 403 }
    );
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        message: "Supabase ainda não configurado.",
      },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entity_type");
  const entityId = searchParams.get("entity_id");

  if (!isEntityType(entityType) || !entityId) {
    return NextResponse.json(
      {
        ok: false,
        message: "Entidade inválida.",
      },
      { status: 400 }
    );
  }

  const entity = await loadEntity(entityType, entityId);

  if (!entity) {
    return NextResponse.json(
      {
        ok: false,
        message: "Cadastro não localizado.",
      },
      { status: 404 }
    );
  }

  const profile = await loadProfile(entityType, entityId, entity.auth_user_id);

  return NextResponse.json({
    ok: true,
    data: {
      entity,
      profile,
      role: roleForEntity(entityType),
      has_access: Boolean(profile),
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireMaster();

  if (!auth.ok || !auth.user) {
    return NextResponse.json(
      {
        ok: false,
        message: auth.message,
      },
      { status: 403 }
    );
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        message: "Supabase ainda não configurado.",
      },
      { status: 500 }
    );
  }

  const formData = await request.formData();

  const entityTypeValue = String(formData.get("entity_type") ?? "");
  const entityId = String(formData.get("entity_id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const mustChangePassword = String(formData.get("must_change_password") ?? "true") === "true";

  if (!isEntityType(entityTypeValue) || !entityId) {
    return NextResponse.json(
      {
        ok: false,
        message: "Entidade inválida.",
      },
      { status: 400 }
    );
  }

  if (!nome || !email) {
    return NextResponse.json(
      {
        ok: false,
        message: "Nome e e-mail são obrigatórios.",
      },
      { status: 400 }
    );
  }

  const entity = await loadEntity(entityTypeValue, entityId);

  if (!entity) {
    return NextResponse.json(
      {
        ok: false,
        message: "Cadastro não localizado.",
      },
      { status: 404 }
    );
  }

  const existingProfile = await loadProfile(
    entityTypeValue,
    entityId,
    entity.auth_user_id
  );

  const role = roleForEntity(entityTypeValue);
  const idColumn = idColumnForProfile(entityTypeValue);
  const entityTable = tableForEntity(entityTypeValue);

  let userId = existingProfile?.id || entity.auth_user_id || null;

  if (userId) {
    const updatePayload: {
      email: string;
      email_confirm: boolean;
      user_metadata: Record<string, string>;
      password?: string;
    } = {
      email,
      email_confirm: true,
      user_metadata: {
        nome,
        role,
      },
    };

    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          {
            ok: false,
            message: "A senha deve ter pelo menos 6 caracteres.",
          },
          { status: 400 }
        );
      }

      updatePayload.password = password;
    }

    const { error: updateUserError } = await supabase.auth.admin.updateUserById(
      userId,
      updatePayload
    );

    if (updateUserError) {
      return NextResponse.json(
        {
          ok: false,
          message: `Erro ao atualizar usuário: ${updateUserError.message}`,
        },
        { status: 500 }
      );
    }
  } else {
    if (!password || password.length < 6) {
      return NextResponse.json(
        {
          ok: false,
          message: "Informe uma senha inicial com pelo menos 6 caracteres.",
        },
        { status: 400 }
      );
    }

    const { data: created, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          nome,
          role,
        },
      });

    if (createError || !created.user) {
      return NextResponse.json(
        {
          ok: false,
          message: `Erro ao criar usuário: ${createError?.message || "usuário não retornado"}`,
        },
        { status: 500 }
      );
    }

    userId = created.user.id;
  }

  const profilePayload = {
    id: userId,
    email,
    nome,
    role,
    status: "ativo",
    company_id: entityTypeValue === "empresa" ? entityId : null,
    student_id: entityTypeValue === "estagiario" ? entityId : null,
    must_change_password: mustChangePassword,
    created_by: auth.user.id,
    updated_at: new Date().toISOString(),
  };

  const { error: profileError } = await supabase
    .from("app_profiles")
    .upsert(profilePayload, { onConflict: "id" });

  if (profileError) {
    return NextResponse.json(
      {
        ok: false,
        message: `Usuário criado, mas houve erro ao salvar perfil: ${profileError.message}`,
      },
      { status: 500 }
    );
  }

  const entityPayload = {
    auth_user_id: userId,
    senha_configurada_em: new Date().toISOString(),
  };

  const { error: entityUpdateError } = await supabase
    .from(entityTable)
    .update(entityPayload)
    .eq("id", entityId);

  if (entityUpdateError) {
    return NextResponse.json(
      {
        ok: false,
        message: `Acesso criado, mas houve erro ao vincular cadastro: ${entityUpdateError.message}`,
      },
      { status: 500 }
    );
  }

  await supabase.from("audit_logs").insert({
    acao: existingProfile ? "atualizou_acesso_vinculado" : "criou_acesso_vinculado",
    tabela: "app_profiles",
    entity_type: entityTypeValue,
    entity_id: entityId,
    valor_anterior: existingProfile,
    valor_novo: {
      profile: profilePayload,
      cadastro: entityPayload,
    },
    motivo: existingProfile
      ? "Acesso vinculado atualizado pelo RH master."
      : "Acesso vinculado criado pelo RH master.",
  });

  return NextResponse.json({
    ok: true,
    message: existingProfile
      ? "Acesso atualizado com sucesso."
      : "Acesso criado com sucesso.",
    data: {
      id: userId,
      email,
      nome,
      role,
      must_change_password: mustChangePassword,
    },
  });
}