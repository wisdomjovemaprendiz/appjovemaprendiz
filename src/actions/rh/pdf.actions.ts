"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient, supabaseConfigMissingMessage } from "@/lib/supabase/server";
import type { ActionResult } from "./action-utils";

export async function registrarPdfContratoAction(formData: FormData): Promise<ActionResult> {
  const contratoId = String(formData.get("contrato_id") ?? "");
  const fileName = String(formData.get("file_name") ?? "");
  const motivo = String(
    formData.get("motivo") ?? "Emissão de PDF do contrato pelo painel RH."
  );

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      ok: false,
      message: supabaseConfigMissingMessage(),
    };
  }

  if (!contratoId) {
    return {
      ok: false,
      message: "Contrato não informado.",
    };
  }

  const nomeArquivo =
    fileName ||
    `contrato-estagio-${contratoId}-${new Date().toISOString().slice(0, 10)}.pdf`;

  const payload = {
    entity_type: "contrato",
    entity_id: contratoId,
    pdf_type: "contrato_estagio",
    category: "contrato",
    file_name: nomeArquivo,
    storage_provider: "local_browser",
    status: "emitido",
    metadata: {
      origem: "painel_rh",
      observacao:
        "PDF gerado pela página de impressão. Arquivo salvo localmente pelo navegador do usuário.",
    },
  };

  const { data: pdf, error } = await supabase
    .from("generated_pdfs")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return {
      ok: false,
      message: `Erro ao registrar emissão do PDF: ${error.message}`,
    };
  }

  const { data: anterior } = await supabase
    .from("internship_contracts")
    .select("*")
    .eq("id", contratoId)
    .maybeSingle();

  await supabase
    .from("internship_contracts")
    .update({
      status: "gerado",
    })
    .eq("id", contratoId);

  await supabase.from("audit_logs").insert({
    acao: "gerou_pdf_contrato",
    tabela: "generated_pdfs",
    entity_type: "contrato",
    entity_id: contratoId,
    valor_anterior: anterior,
    valor_novo: {
      pdf_id: pdf.id,
      ...payload,
      contrato_status: "gerado",
    },
    motivo,
  });

  revalidatePath("/rh/contratos");
  revalidatePath(`/rh/contratos/${contratoId}/pdf`);
  revalidatePath("/rh");

  return {
    ok: true,
    id: pdf.id,
    message: "Emissão do PDF registrada com sucesso.",
  };
}