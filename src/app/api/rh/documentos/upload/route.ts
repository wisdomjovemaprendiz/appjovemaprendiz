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

const entityTypeLabels: Record<string, string> = {
  empresa: "EMPRESAS",
  estagiario: "ESTAGIARIOS",
  contrato: "CONTRATOS",
  geral: "GERAL",
};

const categoryConfig: Record<string, { label: string; folder: string; code: string }> = {
  documentos_pessoais: {
    label: "Documentos pessoais",
    folder: "01_DOCUMENTOS_PESSOAIS",
    code: "DOC-PESSOAIS",
  },
  comprovante_residencia: {
    label: "Comprovante de residência",
    folder: "02_COMPROVANTE_RESIDENCIA",
    code: "COMPROVANTE-RESIDENCIA",
  },
  declaracao_escolar: {
    label: "Declaração escolar",
    folder: "03_DECLARACAO_ESCOLAR",
    code: "DECLARACAO-ESCOLAR",
  },
  cartao_cnpj: {
    label: "Cartão CNPJ",
    folder: "01_CARTAO_CNPJ",
    code: "CARTAO-CNPJ",
  },
  contrato_social: {
    label: "Contrato social",
    folder: "02_CONTRATO_SOCIAL",
    code: "CONTRATO-SOCIAL",
  },
  contrato_assinado: {
    label: "Contrato assinado",
    folder: "04_CONTRATOS_ASSINADOS",
    code: "CONTRATO-ASSINADO",
  },
  apolice_seguro: {
    label: "Apólice/seguro",
    folder: "05_APOLICE_SEGURO",
    code: "APOLICE-SEGURO",
  },
  financeiro: {
    label: "Financeiro",
    folder: "06_FINANCEIRO",
    code: "FINANCEIRO",
  },
  outros: {
    label: "Outros",
    folder: "99_OUTROS",
    code: "OUTROS",
  },
};

function onlyDigits(value: string | null | undefined) {
  return String(value || "").replace(/\D/g, "");
}

function sanitizeName(value: string | null | undefined, fallback = "SEM-NOME") {
  const cleaned = String(value || fallback)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\\/:*?"<>|#%{}~&]/g, "-")
    .replace(/[^a-zA-Z0-9._ -]+/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || fallback;
}

function sanitizeFilePart(value: string | null | undefined, fallback = "arquivo") {
  return sanitizeName(value, fallback)
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 120);
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

async function resolveEntityInfo({
  supabase,
  entityType,
  entityId,
}: {
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>;
  entityType: string;
  entityId: string;
}) {
  if (entityType === "empresa" && entityId) {
    const { data } = await supabase
      .from("companies")
      .select("razao_social, nome_fantasia, cnpj")
      .eq("id", entityId)
      .maybeSingle();

    const nome = data?.nome_fantasia || data?.razao_social || `Empresa ${entityId.slice(0, 8)}`;
    const cnpj = onlyDigits(data?.cnpj);
    const codigo = cnpj ? `CNPJ-${cnpj}` : `EMPRESA-${entityId.slice(0, 8)}`;

    return {
      displayName: nome,
      entityFolderName: `${codigo} - ${sanitizeName(nome)}`,
      entityCode: codigo,
    };
  }

  if (entityType === "estagiario" && entityId) {
    const { data } = await supabase
      .from("students")
      .select("nome, cpf, escola")
      .eq("id", entityId)
      .maybeSingle();

    const nome = data?.nome || `Estagiario ${entityId.slice(0, 8)}`;
    const cpf = onlyDigits(data?.cpf);
    const codigo = cpf ? `CPF-${cpf}` : `ESTAGIARIO-${entityId.slice(0, 8)}`;

    return {
      displayName: nome,
      entityFolderName: `${codigo} - ${sanitizeName(nome)}`,
      entityCode: codigo,
    };
  }

  if (entityType === "contrato" && entityId) {
    const { data: contrato } = await supabase
      .from("internship_contracts")
      .select("numero_contrato, student_id, company_id")
      .eq("id", entityId)
      .maybeSingle();

    let aluno = "Estagiario";
    let empresa = "Empresa";

    if (contrato?.student_id) {
      const { data } = await supabase
        .from("students")
        .select("nome")
        .eq("id", contrato.student_id)
        .maybeSingle();

      aluno = data?.nome || aluno;
    }

    if (contrato?.company_id) {
      const { data } = await supabase
        .from("companies")
        .select("razao_social, nome_fantasia")
        .eq("id", contrato.company_id)
        .maybeSingle();

      empresa = data?.nome_fantasia || data?.razao_social || empresa;
    }

    const codigo = contrato?.numero_contrato
      ? `CONTRATO-${sanitizeFilePart(contrato.numero_contrato)}`
      : `CONTRATO-${entityId.slice(0, 8)}`;

    return {
      displayName: `${aluno} - ${empresa}`,
      entityFolderName: `${codigo} - ${sanitizeName(aluno)} - ${sanitizeName(empresa)}`,
      entityCode: codigo,
    };
  }

  return {
    displayName: "Documentos gerais",
    entityFolderName: "GERAL",
    entityCode: "GERAL",
  };
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

    if (!isAppsScriptDriveConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          message: "Serviço de documentos ainda não configurado.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();

    const entityType = String(formData.get("entity_type") ?? "");
    const entityId = String(formData.get("entity_id") ?? "");
    const category = String(formData.get("category") ?? "outros");
    const files = formData
      .getAll("files")
      .filter((item): item is File => item instanceof File);

    if (!entityType) {
      return NextResponse.json(
        {
          ok: false,
          message: "Informe o tipo de vínculo.",
        },
        { status: 400 }
      );
    }

    if (entityType !== "geral" && !entityId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Selecione o registro vinculado.",
        },
        { status: 400 }
      );
    }

    if (files.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "Selecione pelo menos um arquivo.",
        },
        { status: 400 }
      );
    }

    const categoryInfo = categoryConfig[category] || categoryConfig.outros;
    const entityInfo = await resolveEntityInfo({
      supabase,
      entityType,
      entityId,
    });

    const uploadedDocuments = [];
    const date = new Date().toISOString().slice(0, 10);
    const entityTypeFolderName = entityTypeLabels[entityType] || "GERAL";

    for (let index = 0; index < files.length; index++) {
      const file = files[index];

      if (!allowedMimeTypes.has(file.type)) {
        return NextResponse.json(
          {
            ok: false,
            message: `Tipo de arquivo não permitido: ${file.name}`,
          },
          { status: 400 }
        );
      }

      if (file.size > maxFileSize) {
        return NextResponse.json(
          {
            ok: false,
            message: `Arquivo acima do limite de 8 MB: ${file.name}`,
          },
          { status: 400 }
        );
      }

      const extension = getExtension(file.name, file.type);
      const originalBaseName = sanitizeFilePart(file.name.replace(/\.[^.]+$/, ""), "arquivo");
      const sequence = String(index + 1).padStart(2, "0");

      const finalFileName = [
        date,
        entityInfo.entityCode,
        categoryInfo.code,
        sequence,
        originalBaseName,
      ].join("__") + `.${extension}`;

      const buffer = Buffer.from(await file.arrayBuffer());

      const uploaded = await uploadDocumentToAppsScriptDrive({
        buffer,
        fileName: finalFileName,
        mimeType: file.type,
        entityType,
        entityId: entityId || null,
        category,
        entityTypeFolderName,
        entityFolderName: entityInfo.entityFolderName,
        categoryFolderName: categoryInfo.folder,
      });

      const payload = {
        entity_type: entityType,
        entity_id: entityId || null,
        category,
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
          origem: "painel_rh",
          entity_display_name: entityInfo.displayName,
          entity_folder_name: entityInfo.entityFolderName,
          category_label: categoryInfo.label,
          category_folder_name: categoryInfo.folder,
          uploaded_at: new Date().toISOString(),
        },
      };

      const { data: document, error } = await supabase
        .from("documents")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        return NextResponse.json(
          {
            ok: false,
            message: `Arquivo enviado, mas houve erro ao salvar o registro: ${error.message}`,
          },
          { status: 500 }
        );
      }

      await supabase.from("audit_logs").insert({
        acao: "enviou_documento",
        tabela: "documents",
        entity_type: "documento",
        entity_id: document.id,
        valor_novo: payload,
        motivo: "Upload de documento pelo painel RH.",
      });

      uploadedDocuments.push({
        id: document.id,
        fileName: payload.file_name,
        originalName: payload.original_name,
        link: payload.drive_web_view_link,
      });
    }

    return NextResponse.json({
      ok: true,
      message:
        uploadedDocuments.length === 1
          ? "Documento enviado e registrado com sucesso."
          : `${uploadedDocuments.length} documentos enviados e registrados com sucesso.`,
      documents: uploadedDocuments,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao enviar documento.",
      },
      { status: 500 }
    );
  }
}