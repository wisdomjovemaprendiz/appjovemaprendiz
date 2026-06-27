import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/server-auth";
import {
  isAppsScriptDriveConfigured,
  uploadDocumentToAppsScriptDrive,
} from "@/lib/apps-script/apps-script-drive.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const maxFileSize = 4 * 1024 * 1024;

async function requireMaster() {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile) {
    return {
      ok: false,
      user,
      profile,
      message: "Sessão não encontrada.",
    };
  }

  if (profile.role !== "rh_master" || profile.status !== "ativo") {
    return {
      ok: false,
      user,
      profile,
      message: "Apenas o RH master pode alterar logomarca e assinatura.",
    };
  }

  return {
    ok: true,
    user,
    profile,
    message: "Autorizado.",
  };
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

function driveThumbnailUrl(fileId: string | null | undefined) {
  if (!fileId) return null;
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
}

export async function POST(request: Request) {
  const auth = await requireMaster();

  if (!auth.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: auth.message,
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

  if (!isAppsScriptDriveConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        message: "Google Drive via Apps Script ainda não configurado.",
      },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const assetType = String(formData.get("asset_type") ?? "");
  const file = formData.get("file");

  if (!["logo", "assinatura"].includes(assetType)) {
    return NextResponse.json(
      {
        ok: false,
        message: "Tipo de arquivo inválido.",
      },
      { status: 400 }
    );
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      {
        ok: false,
        message: "Selecione uma imagem.",
      },
      { status: 400 }
    );
  }

  if (!allowedMimeTypes.has(file.type)) {
    return NextResponse.json(
      {
        ok: false,
        message: "A imagem deve estar em JPG, PNG ou WEBP.",
      },
      { status: 400 }
    );
  }

  if (file.size > maxFileSize) {
    return NextResponse.json(
      {
        ok: false,
        message: "A imagem deve ter no máximo 4 MB.",
      },
      { status: 400 }
    );
  }

  const extension =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";

  const fileName = `${new Date().toISOString().slice(0, 10)}__WISDOM__${assetType.toUpperCase()}__${Date.now()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const uploaded = await uploadDocumentToAppsScriptDrive({
    buffer,
    fileName,
    mimeType: file.type,
    entityType: "geral",
    entityId: null,
    category: `configuracao_${assetType}`,
    entityTypeFolderName: "CONFIGURACOES",
    entityFolderName: "RH_WISDOM",
    categoryFolderName: assetType === "logo" ? "LOGOMARCA" : "ASSINATURA",
  });

  const fileId = uploaded.file?.id || null;
  const publicUrl = driveThumbnailUrl(fileId) || uploaded.file?.publicUrl || uploaded.file?.url || null;

  const documentPayload = {
    entity_type: "geral",
    entity_id: null,
    category: `configuracao_${assetType}`,
    file_name: uploaded.file?.name || fileName,
    original_name: file.name,
    mime_type: file.type,
    file_size: file.size,
    storage_provider: "google_drive_apps_script",
    drive_file_id: fileId,
    drive_folder_id: uploaded.file?.folderId || null,
    drive_web_view_link: uploaded.file?.url || publicUrl,
    drive_web_content_link: publicUrl,
    status: "ativo",
    version: 1,
    metadata: {
      origem: "configuracoes_sistema",
      asset_type: assetType,
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
        message: `Arquivo enviado, mas houve erro ao registrar documento: ${documentError?.message || "registro não retornado"}`,
      },
      { status: 500 }
    );
  }

  const settingsPayload =
    assetType === "logo"
      ? {
          logo_document_id: document.id,
          logo_url: publicUrl,
          logo_file_name: uploaded.file?.name || fileName,
          updated_at: new Date().toISOString(),
        }
      : {
          assinatura_document_id: document.id,
          assinatura_url: publicUrl,
          assinatura_file_name: uploaded.file?.name || fileName,
          updated_at: new Date().toISOString(),
        };

  const { data: previous } = await supabase
    .from("rh_organization_settings")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  const { data: settings, error: settingsError } = await supabase
    .from("rh_organization_settings")
    .update(settingsPayload)
    .eq("id", "default")
    .select("*")
    .single();

  if (settingsError) {
    return NextResponse.json(
      {
        ok: false,
        message: `Documento salvo, mas houve erro ao atualizar configurações: ${settingsError.message}`,
      },
      { status: 500 }
    );
  }

  await supabase.from("audit_logs").insert({
    acao: assetType === "logo" ? "atualizou_logomarca_wisdom" : "atualizou_assinatura_wisdom",
    tabela: "rh_organization_settings",
    entity_type: "configuracoes",
    entity_id: null,
    valor_anterior: previous,
    valor_novo: settingsPayload,
    motivo: "Arquivo institucional atualizado nas configurações.",
  });

  return NextResponse.json({
    ok: true,
    message: assetType === "logo" ? "Logomarca atualizada com sucesso." : "Assinatura atualizada com sucesso.",
    data: settings,
  });
}