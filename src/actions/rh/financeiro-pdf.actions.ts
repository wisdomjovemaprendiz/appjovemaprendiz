"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient, supabaseConfigMissingMessage } from "@/lib/supabase/server";
import type { ActionResult } from "./action-utils";

export async function registrarPdfFinanceiroAction(formData: FormData): Promise<ActionResult> {
  const cobrancaId = String(formData.get("cobranca_id") ?? "");
  const fileName = String(formData.get("file_name") ?? "");
  const pdfType = String(formData.get("pdf_type") ?? "financeiro_cobranca");
  const motivo = String(
    formData.get("motivo") ?? "Emissão de documento financeiro pelo painel RH."
  );

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      ok: false,
      message: supabaseConfigMissingMessage(),
    };
  }

  if (!cobrancaId) {
    return {
      ok: false,
      message: "Cobrança não informada.",
    };
  }

  const nomeArquivo =
    fileName ||
    `financeiro-${cobrancaId}-${new Date().toISOString().slice(0, 10)}.pdf`;

  const payload = {
    entity_type: "financeiro",
    entity_id: cobrancaId,
    pdf_type: pdfType,
    category: "financeiro",
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
      message: `Erro ao registrar emissão: ${error.message}`,
    };
  }

  const { data: cobranca } = await supabase
    .from("financial_charges")
    .select("*")
    .eq("id", cobrancaId)
    .maybeSingle();

  await supabase.from("audit_logs").insert({
    acao: "gerou_pdf_financeiro",
    tabela: "generated_pdfs",
    entity_type: "financeiro",
    entity_id: cobrancaId,
    valor_anterior: cobranca,
    valor_novo: {
      pdf_id: pdf.id,
      ...payload,
    },
    motivo,
  });

  revalidatePath("/rh/financeiro");
  revalidatePath(`/rh/financeiro/${cobrancaId}/pdf`);
  revalidatePath("/rh");

  return {
    ok: true,
    id: pdf.id,
    message: "Emissão registrada com sucesso.",
  };
}