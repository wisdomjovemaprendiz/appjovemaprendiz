"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

function getId(formData: FormData) {
  return String(formData.get("id") ?? "");
}

async function auditReminderAction({
  id,
  acao,
  valor_novo,
  motivo,
}: {
  id: string;
  acao: string;
  valor_novo: Record<string, unknown>;
  motivo: string;
}) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) return;

  await supabase.from("audit_logs").insert({
    acao,
    tabela: "completion_reminders",
    entity_type: "pendencia",
    entity_id: id,
    valor_novo,
    motivo,
  });
}

export async function resolverPendenciaAction(formData: FormData) {
  const id = getId(formData);
  const supabase = getSupabaseAdminClient();

  if (!supabase || !id) {
    revalidatePath("/rh/pendencias");
    revalidatePath("/rh");
    return;
  }

  const payload = {
    ativo: false,
    resolvido: true,
    resolvido_em: new Date().toISOString(),
  };

  await supabase.from("completion_reminders").update(payload).eq("id", id);

  await auditReminderAction({
    id,
    acao: "resolveu_pendencia_cadastral",
    valor_novo: payload,
    motivo: "Pendência marcada como resolvida pelo painel RH.",
  });

  revalidatePath("/rh/pendencias");
  revalidatePath("/rh");
}

export async function lembrarPendenciaDepoisAction(formData: FormData) {
  const id = getId(formData);
  const dias = Number(formData.get("dias") ?? 7);
  const supabase = getSupabaseAdminClient();

  if (!supabase || !id) {
    revalidatePath("/rh/pendencias");
    revalidatePath("/rh");
    return;
  }

  const lembrarEm = new Date();
  lembrarEm.setDate(lembrarEm.getDate() + (Number.isFinite(dias) ? dias : 7));

  const payload = {
    ativo: true,
    lembrar_em: lembrarEm.toISOString(),
  };

  await supabase.from("completion_reminders").update(payload).eq("id", id);

  await auditReminderAction({
    id,
    acao: "adiou_pendencia_cadastral",
    valor_novo: payload,
    motivo: `Pendência adiada por ${dias || 7} dias.`,
  });

  revalidatePath("/rh/pendencias");
  revalidatePath("/rh");
}

export async function ignorarPendenciaAction(formData: FormData) {
  const id = getId(formData);
  const supabase = getSupabaseAdminClient();

  if (!supabase || !id) {
    revalidatePath("/rh/pendencias");
    revalidatePath("/rh");
    return;
  }

  const payload = {
    ativo: false,
    ignorar_definitivo: true,
  };

  await supabase.from("completion_reminders").update(payload).eq("id", id);

  await auditReminderAction({
    id,
    acao: "ignorou_pendencia_cadastral",
    valor_novo: payload,
    motivo: "Usuário escolheu não lembrar mais esta pendência.",
  });

  revalidatePath("/rh/pendencias");
  revalidatePath("/rh");
}
