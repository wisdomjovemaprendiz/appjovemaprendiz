"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function arquivarDocumentoAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const motivo = String(
    formData.get("motivo") ?? "Documento arquivado pelo painel RH."
  );

  const supabase = getSupabaseAdminClient();

  if (!supabase || !id) {
    revalidatePath("/rh/documentos");
    return;
  }

  const { data: anterior } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  const payload = {
    status: "arquivado",
    archived_at: new Date().toISOString(),
    archived_reason: motivo,
  };

  await supabase.from("documents").update(payload).eq("id", id);

  await supabase.from("audit_logs").insert({
    acao: "arquivou_documento",
    tabela: "documents",
    entity_type: "documento",
    entity_id: id,
    valor_anterior: anterior,
    valor_novo: payload,
    motivo,
  });

  revalidatePath("/rh/documentos");
  revalidatePath("/rh");
}