import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import {
  isAppsScriptDriveConfigured,
  uploadDocumentToAppsScriptDrive,
} from "@/lib/apps-script/apps-script-drive.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedQrMimeTypes = new Set(["image/jpeg", "image/png"]);
const maxQrSize = 3 * 1024 * 1024;

function sanitizeName(value: string | null | undefined, fallback = "arquivo") {
  return String(value || fallback)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\\/:*?"<>|#%{}~&]/g, "-")
    .replace(/[^a-zA-Z0-9._ -]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 120) || fallback;
}

function getExtension(fileName: string, mimeType: string) {
  const byName = fileName.split(".").pop();

  if (byName && byName.length <= 5 && byName !== fileName) {
    return byName.toLowerCase();
  }

  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";

  return "png";
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return NextResponse.json(
        {
          ok: false,
          message: "Supabase ainda não configurado.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();

    const instrucoesPagamentoPadrao = String(
      formData.get("instrucoes_pagamento_padrao") ?? ""
    ).trim();

    const pixRecebedorNome = String(formData.get("pix_recebedor_nome") ?? "").trim();
    const pixChave = String(formData.get("pix_chave") ?? "").trim();
    const pixObservacoes = String(formData.get("pix_observacoes") ?? "").trim();

    const file = formData.get("pix_qrcode");

    let qrDocumentId: string | null = null;
    let qrUrl: string | null = null;
    let qrFileName: string | null = null;

    if (file instanceof File && file.size > 0) {
      if (!isAppsScriptDriveConfigured()) {
        return NextResponse.json(
          {
            ok: false,
            message: "Serviço de documentos ainda não configurado.",
          },
          { status: 500 }
        );
      }

      if (!allowedQrMimeTypes.has(file.type)) {
        return NextResponse.json(
          {
            ok: false,
            message: "O QR Code deve estar em JPEG ou PNG.",
          },
          { status: 400 }
        );
      }

      if (file.size > maxQrSize) {
        return NextResponse.json(
          {
            ok: false,
            message: "O QR Code deve ter no máximo 3 MB.",
          },
          { status: 400 }
        );
      }

      const extension = getExtension(file.name, file.type);
      const finalFileName = `CONFIG_PIX_QRCODE__${new Date().toISOString().slice(0, 10)}__${Date.now()}__${sanitizeName(file.name)}.${extension}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const uploaded = await uploadDocumentToAppsScriptDrive({
        buffer,
        fileName: finalFileName,
        mimeType: file.type,
        entityType: "configuracao_financeira",
        entityId: "financeiro",
        category: "pix_qrcode",
        entityTypeFolderName: "CONFIGURACOES",
        entityFolderName: "FINANCEIRO",
        categoryFolderName: "PIX_QRCODE",
      });

      const documentPayload = {
        entity_type: "configuracao_financeira",
        entity_id: null,
        category: "pix_qrcode",
        file_name: uploaded.file?.name || finalFileName,
        original_name: file.name,
        mime_type: file.type,
        file_size: file.size,
        storage_provider: "google_drive_apps_script",
        drive_file_id: uploaded.file?.id || null,
        drive_folder_id: uploaded.file?.folderId || null,
        drive_web_view_link: uploaded.file?.url || null,
        drive_web_content_link: uploaded.file?.url || null,
        status: "ativo",
        version: 1,
        metadata: {
          origem: "configuracoes_financeiras",
          uploaded_at: new Date().toISOString(),
        },
      };

      const { data: document, error: documentError } = await supabase
        .from("documents")
        .insert(documentPayload)
        .select("id")
        .single();

      if (documentError || !document) {
        return NextResponse.json(
          {
            ok: false,
            message: `QR Code enviado, mas houve erro ao registrar documento: ${documentError?.message || "registro não retornado"}`,
          },
          { status: 500 }
        );
      }

      qrDocumentId = document.id;
      qrUrl = uploaded.file?.url || null;
      qrFileName = uploaded.file?.name || finalFileName;
    }

    const existing = await supabase
      .from("financial_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    const current = existing.data;

    const payload = {
      id: "default",
      instrucoes_pagamento_padrao:
        instrucoesPagamentoPadrao ||
        "Efetuar o pagamento até a data de vencimento. Após o pagamento, enviar o comprovante para conferência e baixa.",
      pix_recebedor_nome: pixRecebedorNome,
      pix_chave: pixChave,
      pix_observacoes: pixObservacoes,
      pix_qrcode_document_id: qrDocumentId || current?.pix_qrcode_document_id || null,
      pix_qrcode_url: qrUrl || current?.pix_qrcode_url || null,
      pix_qrcode_file_name: qrFileName || current?.pix_qrcode_file_name || null,
      atualizado_em: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("financial_settings")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          message: `Erro ao salvar configurações: ${error.message}`,
        },
        { status: 500 }
      );
    }

    await supabase.from("audit_logs").insert({
      acao: "atualizou_configuracoes_financeiras",
      tabela: "financial_settings",
      entity_type: "financeiro_config",
      entity_id: null,
      valor_anterior: current,
      valor_novo: payload,
      motivo: "Atualização das configurações financeiras.",
    });

    return NextResponse.json({
      ok: true,
      message: "Configurações financeiras salvas com sucesso.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao salvar configurações.",
      },
      { status: 500 }
    );
  }
}