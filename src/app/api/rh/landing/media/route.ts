import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/server-auth";
import {
  isAppsScriptDriveConfigured,
  uploadDocumentToAppsScriptDrive,
} from "@/lib/apps-script/apps-script-drive.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function publicLandingMediaUrl(fileId: string | null | undefined) {
  if (!fileId) return null;
  return `/api/public/landing-media?file_id=${encodeURIComponent(fileId)}`;
}

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const maxFileSize = 6 * 1024 * 1024;

async function requireRh() {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile) {
    return {
      ok: false,
      user,
      profile,
      message: "Sessão não encontrada.",
    };
  }

  if (
    profile.status !== "ativo" ||
    !["rh_master", "rh_operador"].includes(profile.role)
  ) {
    return {
      ok: false,
      user,
      profile,
      message: "Apenas usuários do RH podem configurar mídias da landing page.",
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

function driveViewUrl(fileId: string | null | undefined) {
  if (!fileId) return null;
  return `https://drive.google.com/file/d/${fileId}/view`;
}

function emptyToNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

export async function GET() {
  const auth = await requireRh();

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

  const { data, error } = await supabase
    .from("landing_media")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: `Erro ao carregar imagens: ${error.message}`,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: data ?? [],
  });
}

export async function POST(request: Request) {
  const auth = await requireRh();

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

  const file = formData.get("file");
  const category = emptyToNull(formData.get("category")) || "galeria";
  const title = emptyToNull(formData.get("title"));
  const description = emptyToNull(formData.get("description"));
  const sortOrder = Number(formData.get("sort_order") ?? 0);

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
        message: "A imagem deve ter no máximo 6 MB.",
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

  const finalFileName = `${new Date().toISOString().slice(0, 10)}__LANDING__${sanitizeName(category, "GALERIA")}__${Date.now()}.${extension}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const uploaded = await uploadDocumentToAppsScriptDrive({
    buffer,
    fileName: finalFileName,
    mimeType: file.type,
    entityType: "landing",
    entityId: null,
    category,
    entityTypeFolderName: "LANDING_PAGE",
    entityFolderName: "MIDIAS",
    categoryFolderName: sanitizeName(category, "GALERIA").toUpperCase(),
  });

  const fileId = uploaded.file?.id || null;
  const publicUrl = driveThumbnailUrl(fileId) || uploaded.file?.url || null;
  const webViewLink = uploaded.file?.url || driveViewUrl(fileId) || publicUrl;

  const payload = {
    category,
    title,
    description,
    file_name: uploaded.file?.name || finalFileName,
    original_name: file.name,
    mime_type: file.type,
    file_size: file.size,
    storage_provider: "google_drive_apps_script",
    drive_file_id: fileId,
    drive_folder_id: uploaded.file?.folderId || null,
    public_url: publicUrl,
    web_view_link: webViewLink,
    status: "ativo",
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("landing_media")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: `Imagem enviada, mas houve erro ao salvar no banco: ${error.message}`,
      },
      { status: 500 }
    );
  }

  await supabase.from("audit_logs").insert({
    acao: "enviou_imagem_landing",
    tabela: "landing_media",
    entity_type: "landing",
    entity_id: data.id,
    valor_novo: payload,
    motivo: "Imagem da landing page enviada pelo painel RH.",
  });

  return NextResponse.json({
    ok: true,
    message: "Imagem enviada com sucesso.",
    data,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireRh();

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

  const body = await request.json();

  const id = String(body.id ?? "");
  const status = String(body.status ?? "");
  const sortOrder =
    body.sort_order === undefined || body.sort_order === null
      ? undefined
      : Number(body.sort_order);

  if (!id) {
    return NextResponse.json(
      {
        ok: false,
        message: "Imagem não informada.",
      },
      { status: 400 }
    );
  }

  const { data: previous } = await supabase
    .from("landing_media")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (["ativo", "arquivado"].includes(status)) {
    payload.status = status;
  }

  if (Number.isFinite(sortOrder)) {
    payload.sort_order = sortOrder;
  }

  if (typeof body.title === "string") {
    payload.title = body.title.trim() || null;
  }

  if (typeof body.description === "string") {
    payload.description = body.description.trim() || null;
  }

  if (typeof body.category === "string") {
    payload.category = body.category.trim() || "galeria";
  }

  if (previous?.drive_file_id) {
    payload.public_url = driveThumbnailUrl(previous.drive_file_id);
    payload.web_view_link = previous.web_view_link || driveViewUrl(previous.drive_file_id);
  }

  const { data, error } = await supabase
    .from("landing_media")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: `Erro ao atualizar imagem: ${error.message}`,
      },
      { status: 500 }
    );
  }

  await supabase.from("audit_logs").insert({
    acao: "atualizou_imagem_landing",
    tabela: "landing_media",
    entity_type: "landing",
    entity_id: id,
    valor_anterior: previous,
    valor_novo: payload,
    motivo: "Mídia da landing page atualizada pelo painel RH.",
  });

  return NextResponse.json({
    ok: true,
    message: "Imagem atualizada com sucesso.",
    data,
  });
}