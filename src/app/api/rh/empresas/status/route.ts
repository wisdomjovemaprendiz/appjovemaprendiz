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
      message: "Apenas usuários do RH podem alterar status de empresas.",
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

  const body = await request.json();

  const companyId = String(body.company_id ?? "").trim();
  const status = String(body.status ?? "").trim();
  const motivo = String(body.motivo ?? "").trim();

  if (!companyId) {
    return NextResponse.json(
      {
        ok: false,
        message: "Empresa não informada.",
      },
      { status: 400 }
    );
  }

  if (!["ativo", "inativo"].includes(status)) {
    return NextResponse.json(
      {
        ok: false,
        message: "Status inválido.",
      },
      { status: 400 }
    );
  }

  const { data: previous } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .maybeSingle();

  if (!previous) {
    return NextResponse.json(
      {
        ok: false,
        message: "Empresa não encontrada.",
      },
      { status: 404 }
    );
  }

  const payload = {
    status,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("companies")
    .update(payload)
    .eq("id", companyId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: `Erro ao alterar status: ${error.message}`,
      },
      { status: 500 }
    );
  }

  await supabase.from("audit_logs").insert({
    acao: status === "inativo" ? "inativou_empresa" : "reativou_empresa",
    tabela: "companies",
    entity_type: "empresa",
    entity_id: companyId,
    valor_anterior: previous,
    valor_novo: payload,
    motivo: motivo || `Status alterado para ${status}.`,
  });

  return NextResponse.json({
    ok: true,
    message: status === "inativo" ? "Empresa inativada com sucesso." : "Empresa reativada com sucesso.",
    data,
  });
}