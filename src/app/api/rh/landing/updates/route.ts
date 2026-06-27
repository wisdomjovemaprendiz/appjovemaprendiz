import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireRh() {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile) {
    return {
      ok: false,
      user,
      profile,
      message: "Sessão não encontrada.",
    };
  }

  if (
    profile.status !== "ativo" ||
    !["rh_master", "rh_operador"].includes(profile.role)
  ) {
    return {
      ok: false,
      user,
      profile,
      message: "Apenas usuários do RH podem configurar atualizações.",
    };
  }

  return {
    ok: true,
    user,
    profile,
    message: "Autorizado.",
  };
}

function emptyToNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

export async function POST(request: Request) {
  const auth = await requireRh();

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

  const formData = await request.formData();

  const title = emptyToNull(formData.get("title"));
  const postUrl = emptyToNull(formData.get("post_url"));

  if (!title || !postUrl) {
    return NextResponse.json(
      {
        ok: false,
        message: "Título e URL da postagem são obrigatórios.",
      },
      { status: 400 }
    );
  }

  const payload = {
    title,
    description: emptyToNull(formData.get("description")),
    post_url: postUrl,
    image_url: emptyToNull(formData.get("image_url")),
    badge: emptyToNull(formData.get("badge")) || "Instagram",
    status: "ativo",
    sort_order: Number(formData.get("sort_order") ?? 0),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("landing_updates")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: `Erro ao salvar atualização: ${error.message}`,
      },
      { status: 500 }
    );
  }

  await supabase.from("audit_logs").insert({
    acao: "criou_atualizacao_landing",
    tabela: "landing_updates",
    entity_type: "landing",
    entity_id: data.id,
    valor_novo: payload,
    motivo: "Atualização manual da landing criada pelo painel RH.",
  });

  return NextResponse.json({
    ok: true,
    message: "Atualização cadastrada com sucesso.",
    data,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireRh();

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

  const body = await request.json();
  const id = String(body.id ?? "");

  if (!id) {
    return NextResponse.json(
      {
        ok: false,
        message: "Atualização não informada.",
      },
      { status: 400 }
    );
  }

  const { data: previous } = await supabase
    .from("landing_updates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.status === "string") {
    payload.status = body.status === "ativo" ? "ativo" : "arquivado";
  }

  if (typeof body.sort_order === "number") {
    payload.sort_order = body.sort_order;
  }

  const { data, error } = await supabase
    .from("landing_updates")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: `Erro ao atualizar postagem: ${error.message}`,
      },
      { status: 500 }
    );
  }

  await supabase.from("audit_logs").insert({
    acao: "atualizou_atualizacao_landing",
    tabela: "landing_updates",
    entity_type: "landing",
    entity_id: id,
    valor_anterior: previous,
    valor_novo: payload,
    motivo: "Atualização manual da landing alterada pelo painel RH.",
  });

  return NextResponse.json({
    ok: true,
    message: "Atualização modificada com sucesso.",
    data,
  });
}