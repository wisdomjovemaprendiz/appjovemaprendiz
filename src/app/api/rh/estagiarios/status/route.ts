import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StatusPayload = {
  student_id?: string;
  studentId?: string;
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
      message: "Apenas usuários ativos do RH podem alterar status de estagiários.",
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
      student_id: String(formData.get("student_id") || ""),
      status: String(formData.get("status") || ""),
      motivo: String(formData.get("motivo") || ""),
    };
  }

  return {};
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

    const studentId = String(
      body.student_id || body.studentId || body.id || "",
    ).trim();

    const status = String(body.status || "").trim().toLowerCase();
    const motivo = String(body.motivo || "").trim();

    if (!studentId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Estagiário não informado.",
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
      .from("students")
      .select("*")
      .eq("id", studentId)
      .maybeSingle();

    if (previousError) {
      return NextResponse.json(
        {
          ok: false,
          message: `Erro ao localizar estagiário: ${previousError.message}`,
        },
        { status: 500 },
      );
    }

    if (!previous) {
      return NextResponse.json(
        {
          ok: false,
          message: "Estagiário não encontrado.",
        },
        { status: 404 },
      );
    }

    const now = new Date().toISOString();

    const updateWithTimestamp = await supabase
      .from("students")
      .update({
        status,
        updated_at: now,
      })
      .eq("id", studentId)
      .select("*")
      .maybeSingle();

    let updated = updateWithTimestamp.data;
    let updateErrorMessage = updateWithTimestamp.error?.message || "";

    if (updateWithTimestamp.error) {
      const fallback = await supabase
        .from("students")
        .update({
          status,
        })
        .eq("id", studentId)
        .select("*")
        .maybeSingle();

      updated = fallback.data;
      updateErrorMessage = fallback.error?.message || "";
    }

    if (!updated) {
      return NextResponse.json(
        {
          ok: false,
          message: `Erro ao alterar status: ${updateErrorMessage || "registro não retornado."}`,
        },
        { status: 500 },
      );
    }

    await supabase.from("audit_logs").insert({
      acao: status === "inativo" ? "inativou_estagiario" : "reativou_estagiario",
      tabela: "students",
      entity_type: "estagiario",
      entity_id: studentId,
      valor_anterior: previous,
      valor_novo: updated,
      motivo:
        motivo ||
        (status === "inativo"
          ? "Estagiário inativado pelo painel RH."
          : "Estagiário reativado pelo painel RH."),
    });

    revalidatePath("/rh");
    revalidatePath("/rh/estagiarios");
    revalidatePath(`/rh/estagiarios/${studentId}/editar`);

    return NextResponse.json({
      ok: true,
      message:
        status === "inativo"
          ? "Estagiário inativado com sucesso."
          : "Estagiário reativado com sucesso.",
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? `Erro inesperado ao alterar status do estagiário: ${error.message}`
            : "Erro inesperado ao alterar status do estagiário.",
      },
      { status: 500 },
    );
  }
}