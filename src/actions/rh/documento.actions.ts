"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type DriveTrashResult = {
  ok: boolean;
  message: string;
};

async function sendToDriveTrash(fileId: string | null | undefined): Promise<DriveTrashResult> {
  if (!fileId) {
    return {
      ok: true,
      message: "Sem arquivo do Google Drive vinculado.",
    };
  }

  const appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_UPLOAD_URL;
  const appsScriptSecret = process.env.GOOGLE_APPS_SCRIPT_SECRET;

  if (!appsScriptUrl || !appsScriptSecret) {
    return {
      ok: false,
      message:
        "Apps Script não configurado. O registro será excluído do banco, mas o arquivo pode permanecer no Google Drive.",
    };
  }

  try {
    const response = await fetch(appsScriptUrl, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        secret: appsScriptSecret,
        action: "trashFile",
        fileId,
      }),
    });

    const result = (await response.json()) as { ok?: boolean; message?: string };

    return {
      ok: Boolean(response.ok && result.ok),
      message: result.message || "Resposta do Apps Script recebida.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Erro ao enviar arquivo para a lixeira do Google Drive.",
    };
  }
}

async function limparReferenciasConhecidas(documentId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  await Promise.allSettled([
    supabase
      .from("students")
      .update({ foto_document_id: null, foto_file_name: null })
      .eq("foto_document_id", documentId),

    supabase
      .from("financial_charges")
      .update({ comprovante_document_id: null })
      .eq("comprovante_document_id", documentId),

    supabase
      .from("financial_settings")
      .update({
        pix_qrcode_document_id: null,
        pix_qrcode_url: null,
        pix_qrcode_file_name: null,
      })
      .eq("pix_qrcode_document_id", documentId),

    supabase
      .from("rh_organization_settings")
      .update({ logo_document_id: null, logo_url: null, logo_file_name: null })
      .eq("logo_document_id", documentId),

    supabase
      .from("rh_organization_settings")
      .update({
        assinatura_document_id: null,
        assinatura_url: null,
        assinatura_file_name: null,
      })
      .eq("assinatura_document_id", documentId),

    supabase
      .from("documents")
      .update({ substitui_documento_id: null })
      .eq("substitui_documento_id", documentId),
  ]);
}

export async function excluirDocumentoAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const motivo = String(
    formData.get("motivo") ?? "Documento excluído pelo painel RH."
  ).trim();

  const supabase = getSupabaseAdminClient();

  if (!supabase || !id) {
    revalidatePath("/rh/documentos");
    return;
  }

  const { data: anterior, error: readError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (readError || !anterior) {
    await supabase.from("audit_logs").insert({
      acao: "falha_excluir_documento",
      tabela: "documents",
      entity_type: "documento",
      entity_id: id,
      valor_anterior: null,
      valor_novo: {
        erro: readError?.message || "Documento não encontrado.",
      },
      motivo: motivo || "Tentativa de excluir documento não localizado.",
    });

    revalidatePath("/rh/documentos");
    return;
  }

  const driveTrash = await sendToDriveTrash(
    typeof anterior.drive_file_id === "string" ? anterior.drive_file_id : null
  );

  await limparReferenciasConhecidas(id);

  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", id);

  if (deleteError) {
    await supabase.from("audit_logs").insert({
      acao: "falha_excluir_documento",
      tabela: "documents",
      entity_type: "documento",
      entity_id: id,
      valor_anterior: anterior,
      valor_novo: {
        erro: deleteError.message,
        drive_trash: driveTrash,
      },
      motivo: motivo || "Falha ao excluir documento pelo painel RH.",
    });

    revalidatePath("/rh/documentos");
    return;
  }

  await supabase.from("audit_logs").insert({
    acao: "excluiu_documento",
    tabela: "documents",
    entity_type: "documento",
    entity_id: id,
    valor_anterior: anterior,
    valor_novo: {
      excluido_do_banco: true,
      drive_trash: driveTrash,
    },
    motivo: motivo || "Documento excluído pelo painel RH.",
  });

  revalidatePath("/rh/documentos");
  revalidatePath("/rh");
  revalidatePath("/rh/configuracoes");
  revalidatePath("/rh/financeiro");
}
