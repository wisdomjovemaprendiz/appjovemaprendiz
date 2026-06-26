"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient, supabaseConfigMissingMessage } from "@/lib/supabase/server";
import type { ActionResult } from "./action-utils";

export async function registrarDecisaoMatchAction(formData: FormData): Promise<ActionResult> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      ok: false,
      message: supabaseConfigMissingMessage(),
    };
  }

  const companyId = String(formData.get("company_id") ?? "");
  const studentId = String(formData.get("student_id") ?? "");
  const decisao = String(formData.get("decisao") ?? "");
  const observacao = String(formData.get("observacao") ?? "").trim();

  if (!companyId || !studentId || !decisao) {
    return {
      ok: false,
      message: "Empresa, estagiário e decisão são obrigatórios.",
    };
  }

  const payload = {
    company_id: companyId,
    student_id: studentId,
    decisao,
    observacao,
    atualizado_em: new Date().toISOString(),
  };

  const { data: anterior } = await supabase
    .from("match_decisions")
    .select("*")
    .eq("company_id", companyId)
    .eq("student_id", studentId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("match_decisions")
    .upsert(payload, { onConflict: "company_id,student_id" })
    .select("id")
    .single();

  if (error) {
    return {
      ok: false,
      message: `Erro ao registrar decisão: ${error.message}`,
    };
  }

  await supabase.from("audit_logs").insert({
    acao: "registrou_decisao_match",
    tabela: "match_decisions",
    entity_type: "match",
    entity_id: data.id,
    valor_anterior: anterior,
    valor_novo: payload,
    motivo: observacao || `Decisão registrada: ${decisao}`,
  });

  revalidatePath("/rh/match");
  revalidatePath("/rh");

  return {
    ok: true,
    id: data.id,
    message: "Decisão registrada com sucesso.",
  };
}