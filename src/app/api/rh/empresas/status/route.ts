import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StatusPayload = {
  company_id?: string;
  companyId?: string;
  id?: string;
  status?: string;
  motivo?: string;
};

async function requireRh() {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile) {
    return {
      ok: false,
      message: "Sessão não encontrada. Faça login novamente.",
      profile: null,
    };
  }

  const role = String(profile.role || "");
  const status = String(profile.status || "");

  if (status !== "ativo" || !["rh_master", "rh_operador"].includes(role)) {
    return {
      ok: false,
      message: "Apenas usuários ativos do RH podem alterar status de empresas.",
      profile,
    };
  }

  return {
    ok: true,
    message: "Autorizado.",
    profile,
  };
}

async function readBody(request: Request): Promise<StatusPayload> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return (await request.json().catch(() => ({}))) as StatusPayload;
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();

    return {
      company_id: String(formData.get("company_id") || ""),
      status: String(formData.get("status") || ""),
      motivo: String(formData.get("motivo") || ""),
    };
  }

  return {};
}

async function updateCompanyStatus({
  supabase,
  companyId,
  status,
}: {
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  companyId: string;
  status: string;
}) {
  if (!supabase) {
    return {
      data: null,
      errorMessage: "Supabase ainda não configurado.",
    };
  }

  const now = new Date().toISOString();

  const withUpdatedAt = await supabase
    .from("companies")
    .update({
      status,
      updated_at: now,
    })
    .eq("id", companyId)
    .select("*")
    .maybeSingle();

  if (!withUpdatedAt.error) {
    return {
      data: withUpdatedAt.data,
      errorMessage: null,
    };
  }

  const withoutUpdatedAt = await supabase
    .from("companies")
    .update({
      status,
    })
    .eq("id", companyId)
    .select("*")
    .maybeSingle();

  if (!withoutUpdatedAt.error) {
    return {
      data: withoutUpdatedAt.data,
      errorMessage: null,
    };
  }

  return {
    data: null,
    errorMessage:
      withoutUpdatedAt.error.message || withUpdatedAt.error.message || "Erro ao alterar status.",
  };
}

export async function POST(request: Request) {
  try {
    const auth = await requireRh();

    if (!auth.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: auth.message,
        },
        { status: 403 },
      );
    }

    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return NextResponse.json(
        {
          ok: false,
          message: "Supabase ainda não configurado.",
        },
        { status: 500 },
      );
    }

    const body = await readBody(request);

    const companyId = String(
      body.company_id || body.companyId || body.id || "",
    ).trim();

    const status = String(body.status || "").trim().toLowerCase();
    const motivo = String(body.motivo || "").trim();

    if (!companyId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Empresa não informada.",
        },
        { status: 400 },
      );
    }

    if (!["ativo", "inativo"].includes(status)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Status inválido. Use ativo ou inativo.",
        },
        { status: 400 },
      );
    }

    const { data: previous, error: previousError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .maybeSingle();

    if (previousError) {
      return NextResponse.json(
        {
          ok: false,
          message: `Erro ao localizar empresa: ${previousError.message}`,
        },
        { status: 500 },
      );
    }

    if (!previous) {
      return NextResponse.json(
        {
          ok: false,
          message: "Empresa não encontrada.",
        },
        { status: 404 },
      );
    }

    const updateResult = await updateCompanyStatus({
      supabase,
      companyId,
      status,
    });

    if (updateResult.errorMessage || !updateResult.data) {
      return NextResponse.json(
        {
          ok: false,
          message: `Erro ao alterar status: ${updateResult.errorMessage}`,
        },
        { status: 500 },
      );
    }

    await supabase.from("audit_logs").insert({
      acao: status === "inativo" ? "inativou_empresa" : "reativou_empresa",
      tabela: "companies",
      entity_type: "empresa",
      entity_id: companyId,
      valor_anterior: previous,
      valor_novo: updateResult.data,
      motivo:
        motivo ||
        (status === "inativo"
          ? "Empresa inativada pelo painel RH."
          : "Empresa reativada pelo painel RH."),
    });

    revalidatePath("/rh");
    revalidatePath("/rh/empresas");
    revalidatePath("/rh/financeiro");

    return NextResponse.json({
      ok: true,
      message:
        status === "inativo"
          ? "Empresa inativada com sucesso."
          : "Empresa reativada com sucesso.",
      data: updateResult.data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? `Erro inesperado ao alterar status: ${error.message}`
            : "Erro inesperado ao alterar status da empresa.",
      },
      { status: 500 },
    );
  }
}