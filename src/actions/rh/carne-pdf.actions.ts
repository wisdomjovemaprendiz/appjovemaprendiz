"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient, supabaseConfigMissingMessage } from "@/lib/supabase/server";
import type { ActionResult } from "./action-utils";

export async function registrarPdfCarneAction(formData: FormData): Promise<ActionResult> {
  const carneId = String(formData.get("carne_id") ?? "");
  const fileName = String(formData.get("file_name") ?? "");
  const motivo = String(
    formData.get("motivo") ?? "Emissão de PDF de carnê pelo painel financeiro."
  );

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      ok: false,
      message: supabaseConfigMissingMessage(),
    };
  }

  if (!carneId) {
    return {
      ok: false,
      message: "Carnê não informado.",
    };
  }

  const nomeArquivo =
    fileName ||
    `carne-${carneId}-${new Date().toISOString().slice(0, 10)}.pdf`;

  const payload = {
    entity_type: "carne",
    entity_id: carneId,
    pdf_type: "financeiro_carne",
    category: "financeiro",
    file_name: nomeArquivo,
    storage_provider: "local_browser",
    status: "emitido",
    metadata: {
      origem: "painel_financeiro",
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

  const { data: carne } = await supabase
    .from("payment_booklets")
    .select("*")
    .eq("id", carneId)
    .maybeSingle();

  await supabase.from("audit_logs").insert({
    acao: "gerou_pdf_carne",
    tabela: "generated_pdfs",
    entity_type: "carne",
    entity_id: carneId,
    valor_anterior: carne,
    valor_novo: {
      pdf_id: pdf.id,
      ...payload,
    },
    motivo,
  });

  revalidatePath("/rh/financeiro");
  revalidatePath(`/rh/financeiro/carnes/${carneId}/pdf`);
  revalidatePath("/rh");

  return {
    ok: true,
    id: pdf.id,
    message: "Emissão do carnê registrada com sucesso.",
  };
}