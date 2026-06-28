import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/supabase/server-auth";
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
  "image/webp",
]);

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

function numberFromCurrency(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text) return 0;

  const normalized = text
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  const number = Number(normalized);

  return Number.isFinite(number) ? number : 0;
}

async function findChargeByCode(supabase: ReturnType<typeof getSupabaseAdminClient>, code: string) {
  if (!supabase) return null;

  const clean = code.trim();

  if (!clean) return null;

  const byShort = await supabase
    .from("financial_charges")
    .select("*")
    .eq("codigo_curto", clean.toUpperCase())
    .maybeSingle();

  if (byShort.data) return byShort.data;

  const byOldCode = await supabase
    .from("financial_charges")
    .select("*")
    .eq("numero_controle", clean)
    .maybeSingle();

  if (byOldCode.data) return byOldCode.data;

  return null;
}

export async function POST(request: Request) {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile || profile.status !== "ativo" || !["rh_master", "rh_operador"].includes(profile.role)) {
    return NextResponse.json(
      {
        ok: false,
        message: "Acesso não autorizado.",
      },
      { status: 403 }
    );
  }

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
  const valorPago = numberFromCurrency(formData.get("valor_pago"));
  const dataPagamento = String(formData.get("data_pagamento") ?? "").trim();
  const formaPagamento = String(formData.get("forma_pagamento") ?? "").trim() || "pix";
  const observacoes = String(formData.get("observacoes") ?? "").trim();
  const comprovante = formData.get("comprovante");

  if (!numeroControle) {
    return NextResponse.json(
      {
        ok: false,
        message: "Informe o código da parcela. Use o código curto impresso no carnê, exemplo: C01001.",
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

  if (!dataPagamento) {
    return NextResponse.json(
      {
        ok: false,
        message: "Informe a data do pagamento.",
      },
      { status: 400 }
    );
  }

  const charge = await findChargeByCode(supabase, numeroControle);

  if (!charge) {
    return NextResponse.json(
      {
        ok: false,
        message: "Parcela não encontrada. Confira o código impresso no carnê.",
      },
      { status: 404 }
    );
  }

  if (["pago", "cancelado"].includes(String(charge.status))) {
    return NextResponse.json(
      {
        ok: false,
        message: "Esta parcela já está paga ou cancelada.",
      },
      { status: 400 }
    );
  }

  let comprovanteDocumentId: string | null = null;

  if (comprovante instanceof File && comprovante.size > 0) {
    if (!allowedMimeTypes.has(comprovante.type)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Comprovante deve ser PDF, JPG, PNG ou WEBP.",
        },
        { status: 400 }
      );
    }

    if (comprovante.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        {
          ok: false,
          message: "Comprovante deve ter no máximo 8 MB.",
        },
        { status: 400 }
      );
    }

    if (!isAppsScriptDriveConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          message: "Google Drive via Apps Script ainda não configurado.",
        },
        { status: 500 }
      );
    }

    const { data: company } = await supabase
      .from("companies")
      .select("*")
      .eq("id", charge.company_id)
      .maybeSingle();

    const companyName =
      company?.nome_fantasia ||
      company?.razao_social ||
      "EMPRESA";

    const cnpj = onlyDigits(company?.cnpj);
    const companyCode = cnpj ? `CNPJ-${cnpj}` : `EMPRESA-${String(charge.company_id).slice(0, 8)}`;

    const extension =
      comprovante.type === "application/pdf"
        ? "pdf"
        : comprovante.type === "image/png"
          ? "png"
          : comprovante.type === "image/webp"
            ? "webp"
            : "jpg";

    const fileName = `${new Date().toISOString().slice(0, 10)}__${companyCode}__COMPROVANTE__${charge.codigo_curto || charge.numero_controle}.${extension}`;

    const uploaded = await uploadDocumentToAppsScriptDrive({
      buffer: Buffer.from(await comprovante.arrayBuffer()),
      fileName,
      mimeType: comprovante.type,
      entityType: "empresa",
      entityId: charge.company_id,
      category: "comprovante_pagamento",
      entityTypeFolderName: "EMPRESAS",
      entityFolderName: `${companyCode} - ${sanitizeName(companyName, "EMPRESA")}`,
      categoryFolderName: "07_COMPROVANTES_PAGAMENTO",
    });

    const documentPayload = {
      entity_type: "empresa",
      entity_id: charge.company_id,
      category: "comprovante_pagamento",
      file_name: uploaded.file?.name || fileName,
      original_name: comprovante.name || fileName,
      mime_type: comprovante.type,
      file_size: comprovante.size,
      storage_provider: "google_drive_apps_script",
      drive_file_id: uploaded.file?.id || null,
      drive_folder_id: uploaded.file?.folderId || null,
      drive_web_view_link: uploaded.file?.url || null,
      status: "ativo",
      version: 1,
      metadata: {
        origem: "baixa_financeira",
        charge_id: charge.id,
        codigo_curto: charge.codigo_curto || null,
        numero_controle: charge.numero_controle || null,
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
    acao: "baixou_pagamento_financeiro",
    tabela: "financial_charges",
    entity_type: "financeiro",
    entity_id: charge.id,
    valor_anterior: charge,
    valor_novo: {
      pagamento: paymentPayload,
      parcela: chargePayload,
    },
    motivo: `Baixa feita pelo código ${numeroControle}.`,
  });

  return NextResponse.json({
    ok: true,
    message: "Pagamento baixado com sucesso.",
    data: {
      charge_id: charge.id,
      codigo_curto: charge.codigo_curto,
      numero_controle: charge.numero_controle,
    },
  });
}