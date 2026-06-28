import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function countRows(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  table: string,
  column: string,
  value: string
) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq(column, value);

  if (error) {
    return {
      count: 0,
      error: error.message,
    };
  }

  return {
    count: count ?? 0,
    error: null,
  };
}

export async function POST(request: Request) {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile) {
    return NextResponse.json(
      {
        ok: false,
        message: "Sessão não encontrada.",
      },
      { status: 403 }
    );
  }

  if (profile.status !== "ativo" || profile.role !== "rh_master") {
    return NextResponse.json(
      {
        ok: false,
        message: "Apenas o RH master pode excluir empresas inativas.",
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
  const confirmText = String(body.confirm_text ?? "").trim();

  if (!companyId) {
    return NextResponse.json(
      {
        ok: false,
        message: "Empresa não informada.",
      },
      { status: 400 }
    );
  }

  if (confirmText !== "EXCLUIR") {
    return NextResponse.json(
      {
        ok: false,
        message: "Digite EXCLUIR para confirmar a exclusão definitiva.",
      },
      { status: 400 }
    );
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .maybeSingle();

  if (companyError || !company) {
    return NextResponse.json(
      {
        ok: false,
        message: "Empresa não encontrada.",
      },
      { status: 404 }
    );
  }

  if (String(company.status) === "ativo") {
    return NextResponse.json(
      {
        ok: false,
        message: "Empresa ativa não pode ser excluída. Inative primeiro.",
      },
      { status: 400 }
    );
  }

  const contracts = await countRows(supabase, "internship_contracts", "company_id", companyId);
  const charges = await countRows(supabase, "financial_charges", "company_id", companyId);
  const booklets = await countRows(supabase, "payment_booklets", "company_id", companyId);

  const blockers = [
    contracts.count > 0 ? `${contracts.count} contrato(s)` : null,
    charges.count > 0 ? `${charges.count} cobrança(s)` : null,
    booklets.count > 0 ? `${booklets.count} carnê(s)` : null,
  ].filter(Boolean);

  if (blockers.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        message: `Esta empresa tem histórico vinculado: ${blockers.join(", ")}. Por segurança, mantenha inativa em vez de excluir.`,
      },
      { status: 400 }
    );
  }

  await supabase.from("audit_logs").insert({
    acao: "excluiu_empresa_inativa",
    tabela: "companies",
    entity_type: "empresa",
    entity_id: companyId,
    valor_anterior: company,
    valor_novo: null,
    motivo: "Exclusão definitiva de empresa inativa solicitada pelo RH master.",
  });

  await supabase
    .from("match_decisions")
    .delete()
    .eq("company_id", companyId);

  await supabase
    .from("company_skill_requirements")
    .delete()
    .eq("company_id", companyId);

  await supabase
    .from("completion_reminders")
    .delete()
    .eq("entity_type", "empresa")
    .eq("entity_id", companyId);

  await supabase
    .from("documents")
    .delete()
    .eq("entity_type", "empresa")
    .eq("entity_id", companyId);

  await supabase
    .from("company_vacancies")
    .delete()
    .eq("company_id", companyId);

  const { error: deleteError } = await supabase
    .from("companies")
    .delete()
    .eq("id", companyId);

  if (deleteError) {
    return NextResponse.json(
      {
        ok: false,
        message: `Erro ao excluir empresa: ${deleteError.message}`,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Empresa inativa excluída definitivamente.",
  });
}