import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedTypes = new Set([
  "educational_institution",
  "insurance_provider",
  "document_category",
  "contract_model",
  "contract_clause",
  "financial_parameter",
]);

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
      message: "Apenas o RH master pode alterar cadastros de configuração.",
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

  const formData = await request.formData();
  const itemType = String(formData.get("item_type") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!allowedTypes.has(itemType)) {
    return NextResponse.json(
      {
        ok: false,
        message: "Tipo de configuração inválido.",
      },
      { status: 400 }
    );
  }

  if (!name) {
    return NextResponse.json(
      {
        ok: false,
        message: "Informe o nome.",
      },
      { status: 400 }
    );
  }

  const metadataText = String(formData.get("metadata") ?? "").trim();
  let metadata: Record<string, unknown> | null = null;

  if (metadataText) {
    try {
      metadata = JSON.parse(metadataText);
    } catch {
      metadata = {
        texto: metadataText,
      };
    }
  }

  const payload = {
    item_type: itemType,
    name,
    description: emptyToNull(formData.get("description")),
    metadata,
    status: "ativo",
    sort_order: Number(formData.get("sort_order") ?? 0),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("system_catalog_items")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: `Erro ao cadastrar item: ${error.message}`,
      },
      { status: 500 }
    );
  }

  await supabase.from("audit_logs").insert({
    acao: "criou_item_configuracao",
    tabela: "system_catalog_items",
    entity_type: "configuracoes",
    entity_id: data.id,
    valor_novo: payload,
    motivo: "Item de configuração criado pelo RH master.",
  });

  return NextResponse.json({
    ok: true,
    message: "Item cadastrado com sucesso.",
    data,
  });
}

export async function PATCH(request: Request) {
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

  const body = await request.json();
  const id = String(body.id ?? "");

  if (!id) {
    return NextResponse.json(
      {
        ok: false,
        message: "Item não informado.",
      },
      { status: 400 }
    );
  }

  const { data: previous } = await supabase
    .from("system_catalog_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.status === "string") {
    payload.status = body.status;
  }

  if (typeof body.sort_order === "number") {
    payload.sort_order = body.sort_order;
  }

  if (typeof body.name === "string") {
    payload.name = body.name.trim();
  }

  if (typeof body.description === "string") {
    payload.description = body.description.trim() || null;
  }

  const { data, error } = await supabase
    .from("system_catalog_items")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: `Erro ao atualizar item: ${error.message}`,
      },
      { status: 500 }
    );
  }

  await supabase.from("audit_logs").insert({
    acao: "atualizou_item_configuracao",
    tabela: "system_catalog_items",
    entity_type: "configuracoes",
    entity_id: id,
    valor_anterior: previous,
    valor_novo: payload,
    motivo: "Item de configuração atualizado pelo RH master.",
  });

  return NextResponse.json({
    ok: true,
    message: "Item atualizado com sucesso.",
    data,
  });
}