import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function emptyToNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function moneyToNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text) return null;

  const normalized = text
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  const number = Number(normalized);

  return Number.isFinite(number) ? number : null;
}

async function requireRh() {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile) {
    return {
      ok: false,
      message: "Sessão não encontrada.",
      profile: null,
    };
  }

  if (
    profile.status !== "ativo" ||
    !["rh_master", "rh_operador"].includes(profile.role)
  ) {
    return {
      ok: false,
      message: "Apenas usuários do RH podem cadastrar empresas.",
      profile,
    };
  }

  return {
    ok: true,
    message: "Autorizado.",
    profile,
  };
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
  const companyId = emptyToNull(formData.get("company_id"));

  const payload = {
    responsavel_nome: emptyToNull(formData.get("responsavel_nome")),
    cnpj: emptyToNull(formData.get("cnpj")),
    razao_social: emptyToNull(formData.get("razao_social")),
    nome_fantasia: emptyToNull(formData.get("nome_fantasia")),
    ramo_atuacao: emptyToNull(formData.get("ramo_atuacao")),
    email: emptyToNull(formData.get("email")),
    telefone: emptyToNull(formData.get("telefone")),
    whatsapp: emptyToNull(formData.get("whatsapp")),
    cep: emptyToNull(formData.get("cep")),
    endereco: emptyToNull(formData.get("endereco")),
    numero: emptyToNull(formData.get("numero")),
    complemento: emptyToNull(formData.get("complemento")),
    bairro: emptyToNull(formData.get("bairro")),
    cidade: emptyToNull(formData.get("cidade")),
    estado: emptyToNull(formData.get("estado")),
    perfil_candidato: emptyToNull(formData.get("perfil_candidato")),
    valor_bolsa: moneyToNumber(formData.get("valor_bolsa")),
    observacoes: emptyToNull(formData.get("observacoes")),
    updated_at: new Date().toISOString(),
  };

  if (!payload.razao_social && !payload.nome_fantasia) {
    return NextResponse.json(
      {
        ok: false,
        message: "Informe a razão social ou o nome fantasia da empresa.",
      },
      { status: 400 }
    );
  }

  let previous = null;
  let result;

  if (companyId) {
    const { data: previousData } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .maybeSingle();

    previous = previousData;

    result = await supabase
      .from("companies")
      .update(payload)
      .eq("id", companyId)
      .select("*")
      .single();
  } else {
    result = await supabase
      .from("companies")
      .insert({
        ...payload,
        status: "ativo",
      })
      .select("*")
      .single();
  }

  if (result.error || !result.data) {
    return NextResponse.json(
      {
        ok: false,
        message: `Erro ao salvar empresa: ${result.error?.message || "registro não retornado"}`,
      },
      { status: 500 }
    );
  }

  await supabase.from("audit_logs").insert({
    acao: companyId ? "atualizou_empresa" : "criou_empresa",
    tabela: "companies",
    entity_type: "empresa",
    entity_id: result.data.id,
    valor_anterior: previous,
    valor_novo: payload,
    motivo: companyId
      ? "Empresa atualizada pelo cadastro."
      : "Empresa criada pelo cadastro.",
  });

  return NextResponse.json({
    ok: true,
    message: companyId
      ? "Empresa atualizada com sucesso."
      : "Empresa cadastrada com sucesso.",
    data: result.data,
  });
}