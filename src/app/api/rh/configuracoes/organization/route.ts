import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
      message: "Apenas o RH master pode alterar configurações do sistema.",
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

  const payload = {
    id: "default",
    nome_fantasia: emptyToNull(formData.get("nome_fantasia")),
    razao_social: emptyToNull(formData.get("razao_social")),
    cnpj: emptyToNull(formData.get("cnpj")),
    email: emptyToNull(formData.get("email")),
    telefone: emptyToNull(formData.get("telefone")),
    whatsapp: emptyToNull(formData.get("whatsapp")),
    site: emptyToNull(formData.get("site")),
    endereco: emptyToNull(formData.get("endereco")),
    bairro: emptyToNull(formData.get("bairro")),
    cidade: emptyToNull(formData.get("cidade")),
    estado: emptyToNull(formData.get("estado")),
    cep: emptyToNull(formData.get("cep")),
    representante_nome: emptyToNull(formData.get("representante_nome")),
    representante_cargo: emptyToNull(formData.get("representante_cargo")),
    observacoes: emptyToNull(formData.get("observacoes")),
    updated_at: new Date().toISOString(),
  };

  const { data: previous } = await supabase
    .from("rh_organization_settings")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  const { data, error } = await supabase
    .from("rh_organization_settings")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: `Erro ao salvar dados da Wisdom: ${error.message}`,
      },
      { status: 500 }
    );
  }

  await supabase.from("audit_logs").insert({
    acao: "atualizou_configuracoes_wisdom",
    tabela: "rh_organization_settings",
    entity_type: "configuracoes",
    entity_id: null,
    valor_anterior: previous,
    valor_novo: payload,
    motivo: "Dados institucionais do RH Wisdom atualizados.",
  });

  return NextResponse.json({
    ok: true,
    message: "Dados da Wisdom salvos com sucesso.",
    data,
  });
}