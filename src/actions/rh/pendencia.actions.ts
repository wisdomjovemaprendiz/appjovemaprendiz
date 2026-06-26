"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient, supabaseConfigMissingMessage } from "@/lib/supabase/server";
import type { ActionResult } from "./action-utils";

async function updatePendencia({
  id,
  payload,
  acao,
  motivo,
}: {
  id: string;
  payload: Record<string, unknown>;
  acao: string;
  motivo: string;
}): Promise<ActionResult> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      ok: false,
      message: supabaseConfigMissingMessage(),
    };
  }

  if (!id) {
    return {
      ok: false,
      message: "Pendência não informada.",
    };
  }

  const { data: anterior } = await supabase
    .from("completion_reminders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("completion_reminders")
    .update({
      ...payload,
      motivo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return {
      ok: false,
      message: `Erro ao atualizar pendência: ${error.message}`,
    };
  }

  await supabase.from("audit_logs").insert({
    acao,
    tabela: "completion_reminders",
    entity_type: "pendencia",
    entity_id: id,
    valor_anterior: anterior,
    valor_novo: {
      ...payload,
      motivo,
    },
    motivo,
  });

  revalidatePath("/rh/pendencias");
  revalidatePath("/rh");

  return {
    ok: true,
    id,
    message: "Pendência atualizada com sucesso.",
  };
}

export async function resolverPendenciaAction(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  const motivo =
    String(formData.get("motivo") ?? "").trim() ||
    "Pendência marcada como resolvida pelo painel RH.";

  return updatePendencia({
    id,
    acao: "resolveu_pendencia",
    motivo,
    payload: {
      status: "resolvido",
      resolvido_em: new Date().toISOString(),
    },
  });
}

export async function adiarPendenciaAction(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  const dias = Number(formData.get("dias") ?? 7);
  const motivo =
    String(formData.get("motivo") ?? "").trim() ||
    "Pendência adiada pelo painel RH.";

  const date = new Date();
  date.setDate(date.getDate() + (Number.isFinite(dias) && dias > 0 ? dias : 7));

  return updatePendencia({
    id,
    acao: "adiou_pendencia",
    motivo,
    payload: {
      status: "adiado",
      lembrar_em: date.toISOString(),
    },
  });
}

export async function ignorarPendenciaAction(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  const motivo =
    String(formData.get("motivo") ?? "").trim() ||
    "Pendência ignorada pelo painel RH.";

  return updatePendencia({
    id,
    acao: "ignorou_pendencia",
    motivo,
    payload: {
      status: "ignorado",
      ignorado_em: new Date().toISOString(),
    },
  });
}