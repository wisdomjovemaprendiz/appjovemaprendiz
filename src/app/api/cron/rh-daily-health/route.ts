import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type MetricValue = number | string | boolean | null;

type HealthError = {
  metric: string;
  message: string;
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIsoDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return false;
  }

  const authorization = request.headers.get("authorization") || "";

  return authorization === `Bearer ${secret}`;
}

async function safeMetric(
  errors: HealthError[],
  metricName: string,
  callback: () => Promise<MetricValue>,
) {
  try {
    return await callback();
  } catch (error) {
    errors.push({
      metric: metricName,
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao coletar mÃƒÂ©trica.",
    });

    return null;
  }
}

export async function GET(request: Request) {
  const startedAt = Date.now();

  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: "Acesso nÃƒÂ£o autorizado ÃƒÂ  rotina automÃƒÂ¡tica.",
      },
      { status: 401 },
    );
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        message: "Supabase Admin nÃƒÂ£o configurado.",
      },
      { status: 500 },
    );
  }

  
  const supabaseAdmin = supabase;
const errors: HealthError[] = [];

  const metrics: Record<string, MetricValue> = {
    app: "rh-wisdom-estagios",
    rotina: "rh_daily_health",
    data_referencia: todayIsoDate(),
  };

  async function countTable(table: string) {
    const { count, error } = await supabaseAdmin.from(table)
      .select("id", { count: "exact", head: true });

    if (error) throw error;

    return count ?? 0;
  }

  async function countByStatus(table: string, status: string) {
    const { count, error } = await supabaseAdmin.from(table)
      .select("id", { count: "exact", head: true })
      .eq("status", status);

    if (error) throw error;

    return count ?? 0;
  }

  async function countInsuranceDueSoon() {
    const { count, error } = await supabaseAdmin.from("students")
      .select("id", { count: "exact", head: true })
      .eq("status", "ativo")
      .not("data_vencimento_seguro", "is", null)
      .lte("data_vencimento_seguro", addDaysIsoDate(30));

    if (error) throw error;

    return count ?? 0;
  }

  async function countStudentsThirdYear() {
    const { count, error } = await supabaseAdmin.from("students")
      .select("id", { count: "exact", head: true })
      .eq("status", "ativo")
      .ilike("serie_ano", "%3%");

    if (error) throw error;

    return count ?? 0;
  }

  metrics.empresas_total = await safeMetric(errors, "empresas_total", () =>
    countTable("companies"),
  );

  metrics.empresas_ativas = await safeMetric(errors, "empresas_ativas", () =>
    countByStatus("companies", "ativo"),
  );

  metrics.estagiarios_total = await safeMetric(errors, "estagiarios_total", () =>
    countTable("students"),
  );

  metrics.estagiarios_ativos = await safeMetric(errors, "estagiarios_ativos", () =>
    countByStatus("students", "ativo"),
  );

  metrics.estagiarios_terceiro_ano = await safeMetric(
    errors,
    "estagiarios_terceiro_ano",
    countStudentsThirdYear,
  );

  metrics.seguros_vencidos_ou_30_dias = await safeMetric(
    errors,
    "seguros_vencidos_ou_30_dias",
    countInsuranceDueSoon,
  );

  metrics.documentos_total = await safeMetric(errors, "documentos_total", () =>
    countTable("documents"),
  );

  metrics.configuracao_institucional = await safeMetric(
    errors,
    "configuracao_institucional",
    async () => {
      const { count, error } = await supabaseAdmin.from("rh_organization_settings")
        .select("id", { count: "exact", head: true })
        .eq("id", "default");

      if (error) throw error;

      return count && count > 0 ? "ok" : "nao_configurada";
    },
  );

  const durationMs = Date.now() - startedAt;
  const status = errors.length > 0 ? "warning" : "ok";

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  await supabaseAdmin.from("system_health_checks")
    .delete()
    .lt("executed_at", ninetyDaysAgo.toISOString());

  const { data, error } = await supabaseAdmin.from("system_health_checks")
    .insert({
      source: "vercel_cron",
      status,
      metrics,
      errors,
      duration_ms: durationMs,
    })
    .select("id, executed_at, status")
    .single();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "A rotina consultou o Supabase, mas nÃƒÂ£o conseguiu registrar o histÃƒÂ³rico.",
        error: error.message,
        metrics,
        errors,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Rotina diÃƒÂ¡ria de saÃƒÂºde executada com sucesso.",
    check: data,
    metrics,
    errors,
    duration_ms: durationMs,
  });
}