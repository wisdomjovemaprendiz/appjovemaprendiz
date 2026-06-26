import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import {
  isAppsScriptDriveConfigured,
  uploadDocumentToAppsScriptDrive,
} from "@/lib/apps-script/apps-script-drive.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

const maxFileSize = 8 * 1024 * 1024;

function parseMoney(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function onlyDigits(value: string | null | undefined) {
  return String(value || "").replace(/\D/g, "");
}

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

  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";

  return "bin";
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

    const numeroControle = String(formData.get("numero_controle") ?? "").trim();
    const valorPago = parseMoney(formData.get("valor_pago"));
    const dataPagamento =
      String(formData.get("data_pagamento") ?? "").trim() ||
      new Date().toISOString().slice(0, 10);
    const formaPagamento = String(formData.get("forma_pagamento") ?? "").trim();
    const observacoes = String(formData.get("observacoes") ?? "").trim();
    const file = formData.get("comprovante");

    if (!numeroControle) {
      return NextResponse.json(
        {
          ok: false,
          message: "Informe o número de controle.",
        },
        { status: 400 }
      );
    }

    if (!valorPago || valorPago <= 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "Informe o valor pago.",
        },
        { status: 400 }
      );
    }

    const { data: charge, error: chargeError } = await supabase
      .from("financial_charges")
      .select("*")
      .eq("numero_controle", numeroControle)
      .maybeSingle();

    if (chargeError || !charge) {
      return NextResponse.json(
        {
          ok: false,
          message: "Parcela não localizada pelo número de controle.",
        },
        { status: 404 }
      );
    }

    if (charge.status === "pago") {
      return NextResponse.json(
        {
          ok: false,
          message: "Esta parcela já está marcada como paga.",
        },
        { status: 400 }
      );
    }

    if (charge.status === "cancelado") {
      return NextResponse.json(
        {
          ok: false,
          message: "Esta parcela está cancelada.",
        },
        { status: 400 }
      );
    }

    let comprovanteDocumentId: string | null = null;

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

      if (!allowedMimeTypes.has(file.type)) {
        return NextResponse.json(
          {
            ok: false,
            message: "Comprovante inválido. Envie PDF, JPEG ou PNG.",
          },
          { status: 400 }
        );
      }

      if (file.size > maxFileSize) {
        return NextResponse.json(
          {
            ok: false,
            message: "Comprovante acima do limite de 8 MB.",
          },
          { status: 400 }
        );
      }

      const { data: company } = await supabase
        .from("companies")
        .select("id, razao_social, nome_fantasia, cnpj")
        .eq("id", charge.company_id)
        .maybeSingle();

      const companyName =
        company?.nome_fantasia ||
        company?.razao_social ||
        `Empresa ${String(charge.company_id).slice(0, 8)}`;

      const cnpj = onlyDigits(company?.cnpj);
      const companyCode = cnpj ? `CNPJ-${cnpj}` : `EMPRESA-${String(charge.company_id).slice(0, 8)}`;
      const entityFolderName = `${companyCode} - ${sanitizeName(companyName, "EMPRESA")}`;

      const extension = getExtension(file.name, file.type);
      const finalFileName = [
        new Date().toISOString().slice(0, 10),
        numeroControle,
        "COMPROVANTE-PAGAMENTO",
        sanitizeName(file.name, "comprovante"),
      ].join("__") + `.${extension}`;

      const buffer = Buffer.from(await file.arrayBuffer());

      const uploaded = await uploadDocumentToAppsScriptDrive({
        buffer,
        fileName: finalFileName,
        mimeType: file.type,
        entityType: "empresa",
        entityId: charge.company_id,
        category: "comprovante_pagamento",
        entityTypeFolderName: "EMPRESAS",
        entityFolderName,
        categoryFolderName: "07_COMPROVANTES_PAGAMENTO",
      });

      const documentPayload = {
        entity_type: "empresa",
        entity_id: charge.company_id,
        category: "comprovante_pagamento",
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
          origem: "baixa_financeira",
          numero_controle: numeroControle,
          financial_charge_id: charge.id,
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
            message: `Comprovante enviado, mas houve erro ao registrar documento: ${documentError?.message || "registro não retornado"}`,
          },
          { status: 500 }
        );
      }

      comprovanteDocumentId = document.id;
    }

    const paymentPayload = {
      charge_id: charge.id,
      company_id: charge.company_id,
      valor_pago: valorPago,
      data_pagamento: dataPagamento,
      forma_pagamento: formaPagamento,
      observacoes,
      comprovante_document_id: comprovanteDocumentId,
    };

    const { error: paymentError } = await supabase
      .from("payments")
      .insert(paymentPayload);

    if (paymentError) {
      return NextResponse.json(
        {
          ok: false,
          message: `Erro ao registrar pagamento: ${paymentError.message}`,
        },
        { status: 500 }
      );
    }

    const chargePayload = {
      status: "pago",
      valor_pago: valorPago,
      data_pagamento: dataPagamento,
      forma_pagamento: formaPagamento,
      observacoes,
      comprovante_document_id: comprovanteDocumentId,
    };

    const { error: updateError } = await supabase
      .from("financial_charges")
      .update(chargePayload)
      .eq("id", charge.id);

    if (updateError) {
      return NextResponse.json(
        {
          ok: false,
          message: `Pagamento registrado, mas houve erro ao atualizar parcela: ${updateError.message}`,
        },
        { status: 500 }
      );
    }

    await supabase.from("audit_logs").insert({
      acao: "baixou_parcela_carne",
      tabela: "financial_charges",
      entity_type: "financeiro",
      entity_id: charge.id,
      valor_anterior: charge,
      valor_novo: {
        pagamento: paymentPayload,
        parcela: chargePayload,
      },
      motivo: observacoes || "Baixa de parcela por número de controle.",
    });

    return NextResponse.json({
      ok: true,
      message: comprovanteDocumentId
        ? "Pagamento baixado e comprovante anexado com sucesso."
        : "Pagamento baixado com sucesso.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao registrar baixa.",
      },
      { status: 500 }
    );
  }
}