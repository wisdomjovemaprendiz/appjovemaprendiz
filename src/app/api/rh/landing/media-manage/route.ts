import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function publicLandingMediaUrl(fileId: string | null | undefined) {
  if (!fileId) return null;
  return `/api/public/landing-media?file_id=${encodeURIComponent(fileId)}`;
}

async function requireRh() {
  const { user, profile } = await getCurrentProfile();

  if (
    !user ||
    !profile ||
    profile.status !== "ativo" ||
    !["rh_master", "rh_operador"].includes(profile.role)
  ) {
    return {
      ok: false,
      message: "Acesso não autorizado.",
      user: null,
      profile: null,
    };
  }

  return {
    ok: true,
    message: "Autorizado.",
    user,
    profile,
  };
}

async function callAppsScript(payload: Record<string, any>) {
  const appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_UPLOAD_URL;

  if (!appsScriptUrl) {
    return {
      ok: false,
      message: "GOOGLE_APPS_SCRIPT_UPLOAD_URL não configurado.",
    };
  }

  const attempts = [
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    },
    {
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    },
  ];

  let lastMessage = "";

  for (const attempt of attempts) {
    try {
      const response = await fetch(appsScriptUrl, {
        method: "POST",
        cache: "no-store",
        headers: attempt.headers,
        body: attempt.body,
      });

      const text = await response.text();
      lastMessage = text;

      let result: any = null;

      try {
        result = JSON.parse(text);
      } catch {
        result = null;
      }

      if (response.ok && result) {
        return {
          ok: Boolean(result.ok ?? true),
          message: result.message || "Apps Script executado.",
          result,
        };
      }
    } catch (error) {
      lastMessage = error instanceof Error ? error.message : "Erro desconhecido no Apps Script.";
    }
  }

  return {
    ok: false,
    message: lastMessage || "Apps Script não respondeu corretamente.",
  };
}

async function sendToDriveTrash(fileId: string | null | undefined) {
  if (!fileId) {
    return {
      ok: true,
      message: "Sem arquivo do Drive vinculado.",
    };
  }

  const appsScriptSecret = process.env.GOOGLE_APPS_SCRIPT_SECRET;

  if (!appsScriptSecret) {
    return {
      ok: false,
      message: "GOOGLE_APPS_SCRIPT_SECRET não configurado.",
    };
  }

  return callAppsScript({
    secret: appsScriptSecret,
    action: "trashFile",
    fileId,
  });
}

function activeStatus(value: unknown) {
  return String(value || "ativo").toLowerCase() === "ativo";
}

function normalizeMediaItem(item: Record<string, any>) {
  const imageUrl =
    publicLandingMediaUrl(item.drive_file_id) ||
    item.drive_web_content_link ||
    item.drive_web_view_link ||
    item.public_url ||
    item.image_url ||
    null;

  return {
    id: item.id,
    document_id: item.document_id || item.linked_document_id || item.documentId || null,
    drive_file_id: item.drive_file_id,
    original_name: item.original_name,
    file_name: item.file_name,
    title: item.title || item.original_name || item.file_name || "Imagem",
    description: item.description || null,
    category: item.category || "galeria",
    entity_type: item.entity_type || "landing",
    status: item.status || "ativo",
    mime_type: item.mime_type,
    file_size: item.file_size,
    public_url: imageUrl,
    image_url: imageUrl,
    web_view_link: item.web_view_link || item.drive_web_view_link || null,
    drive_web_view_link: item.drive_web_view_link || item.web_view_link || null,
    created_at: item.created_at || null,
    updated_at: item.updated_at || null,
  };
}

async function writeAuditLog(
  supabase: any,
  payload: {
    action: string;
    entityId: string;
    before: Record<string, any> | null;
    after: Record<string, any> | null;
    reason: string;
    userId?: string | null;
  }
) {
  const attempts = [
    {
      acao: payload.action,
      tabela: "landing_media",
      entity_type: "landing",
      entity_id: payload.entityId,
      valor_anterior: payload.before,
      valor_novo: payload.after,
      motivo: payload.reason,
      user_id: payload.userId || null,
    },
    {
      action: payload.action,
      table_name: "landing_media",
      entity_type: "landing",
      entity_id: payload.entityId,
      previous_value: payload.before,
      new_value: payload.after,
      reason: payload.reason,
      user_id: payload.userId || null,
    },
    {
      action: payload.action,
      entity_type: "landing",
      entity_id: payload.entityId,
      metadata: {
        table_name: "landing_media",
        previous_value: payload.before,
        new_value: payload.after,
        reason: payload.reason,
        user_id: payload.userId || null,
      },
    },
  ];

  for (const attempt of attempts) {
    const { error } = await supabase.from("audit_logs").insert(attempt as any);
    if (!error) return;
  }
}

function getIds(body: any) {
  return {
    id: String(body.id || "").trim(),
    landingMediaId: String(body.landing_media_id || body.landingMediaId || body.id || "").trim(),
    documentId: String(body.document_id || body.documentId || "").trim(),
    driveFileId: String(body.drive_file_id || body.driveFileId || "").trim(),
  };
}

async function findLandingMedia(supabase: any, ids: ReturnType<typeof getIds>) {
  const candidates = [ids.landingMediaId, ids.id].filter(Boolean);

  for (const candidate of candidates) {
    const { data, error } = await supabase
      .from("landing_media")
      .select("*")
      .eq("id", candidate)
      .maybeSingle();

    if (!error && data) return data;
  }

  if (ids.documentId) {
    const columns = ["document_id", "linked_document_id"];

    for (const column of columns) {
      const { data, error } = await supabase
        .from("landing_media")
        .select("*")
        .eq(column, ids.documentId)
        .maybeSingle();

      if (!error && data) return data;
    }
  }

  if (ids.driveFileId) {
    const { data, error } = await supabase
      .from("landing_media")
      .select("*")
      .eq("drive_file_id", ids.driveFileId)
      .maybeSingle();

    if (!error && data) return data;
  }

  return null;
}

async function findDocument(supabase: any, ids: ReturnType<typeof getIds>, landingMedia: Record<string, any> | null) {
  const documentCandidates = [
    ids.documentId,
    landingMedia?.document_id,
    landingMedia?.linked_document_id,
    landingMedia?.documentId,
  ].filter(Boolean);

  for (const candidate of documentCandidates) {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", candidate)
      .maybeSingle();

    if (!error && data) return data;
  }

  const driveCandidates = [
    ids.driveFileId,
    landingMedia?.drive_file_id,
  ].filter(Boolean);

  for (const candidate of driveCandidates) {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("drive_file_id", candidate)
      .maybeSingle();

    if (!error && data) return data;
  }

  return null;
}

export async function GET() {
  const auth = await requireRh();

  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, message: auth.message },
      { status: 403 }
    );
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "Supabase ainda não configurado." },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("landing_media")
    .select("*")
    .eq("status", "ativo")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    return NextResponse.json(
      { ok: false, message: `Erro ao carregar imagens: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: (data || []).filter((item) => activeStatus(item.status)).map(normalizeMediaItem),
  });
}

export async function PATCH(request: Request) {
  const auth = await requireRh();

  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, message: auth.message },
      { status: 403 }
    );
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "Supabase ainda não configurado." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const ids = getIds(body);
  const reason = String(body.motivo || body.reason || "Imagem arquivada na configuração da landing.").trim();

  const landingMedia = await findLandingMedia(supabase, ids);

  if (!landingMedia) {
    return NextResponse.json(
      { ok: false, message: "Imagem da landing não encontrada na tabela landing_media." },
      { status: 404 }
    );
  }

  const { data: updated, error } = await supabase
    .from("landing_media")
    .update({
      status: "arquivado",
      updated_at: new Date().toISOString(),
    })
    .eq("id", landingMedia.id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, message: `Erro ao arquivar imagem: ${error.message}` },
      { status: 500 }
    );
  }

  const document = await findDocument(supabase, ids, landingMedia);

  if (document) {
    await supabase
      .from("documents")
      .update({
        status: "arquivado",
        metadata: {
          ...(document.metadata || {}),
          archived_at: new Date().toISOString(),
          archived_reason: reason,
        },
      })
      .eq("id", document.id);
  }

  await writeAuditLog(supabase, {
    action: "arquivou_imagem_landing",
    entityId: landingMedia.id,
    before: landingMedia,
    after: updated || { status: "arquivado" },
    reason,
    userId: auth.user?.id || null,
  });

  return NextResponse.json({
    ok: true,
    message: "Imagem arquivada com sucesso.",
    data: updated ? normalizeMediaItem(updated) : null,
  });
}

async function deleteHandler(request: Request) {
  const auth = await requireRh();

  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, message: auth.message },
      { status: 403 }
    );
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "Supabase ainda não configurado." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const ids = getIds(body);
  const confirmText = String(body.confirm_text || body.confirmText || "").trim();
  const reason = String(body.motivo || body.reason || "Imagem excluída da galeria da landing.").trim();

  if (!ids.id && !ids.landingMediaId && !ids.documentId && !ids.driveFileId) {
    return NextResponse.json(
      { ok: false, message: "Imagem não informada." },
      { status: 400 }
    );
  }

  if (confirmText !== "EXCLUIR") {
    return NextResponse.json(
      { ok: false, message: "Digite EXCLUIR para confirmar." },
      { status: 400 }
    );
  }

  const landingMedia = await findLandingMedia(supabase, ids);

  if (!landingMedia) {
    return NextResponse.json(
      { ok: false, message: "Imagem da landing não encontrada na tabela landing_media." },
      { status: 404 }
    );
  }

  const document = await findDocument(supabase, ids, landingMedia);
  const driveFileId = ids.driveFileId || landingMedia.drive_file_id || document?.drive_file_id || null;
  const driveResult = await sendToDriveTrash(driveFileId);

  await writeAuditLog(supabase, {
    action: "excluiu_imagem_landing",
    entityId: landingMedia.id,
    before: {
      landing_media: landingMedia,
      document,
    },
    after: {
      deleted: true,
      drive_trash_result: driveResult,
    },
    reason,
    userId: auth.user?.id || null,
  });

  const { error: deleteLandingError } = await supabase
    .from("landing_media")
    .delete()
    .eq("id", landingMedia.id);

  if (deleteLandingError) {
    const { error: softLandingError } = await supabase
      .from("landing_media")
      .update({
        status: "excluido",
        updated_at: new Date().toISOString(),
      })
      .eq("id", landingMedia.id);

    if (softLandingError) {
      return NextResponse.json(
        {
          ok: false,
          message: `Não foi possível remover a imagem da landing: ${softLandingError.message}`,
          details: deleteLandingError.message,
        },
        { status: 500 }
      );
    }
  }

  if (document) {
    const { error: deleteDocumentError } = await supabase
      .from("documents")
      .delete()
      .eq("id", document.id);

    if (deleteDocumentError) {
      await supabase
        .from("documents")
        .update({
          status: "excluido",
          metadata: {
            ...(document.metadata || {}),
            deleted_at: new Date().toISOString(),
            delete_reason: reason,
            delete_fallback_reason: deleteDocumentError.message,
          },
        })
        .eq("id", document.id);
    }
  }

  return NextResponse.json({
    ok: true,
    removed: true,
    message: "Imagem removida da landing com sucesso.",
    drive: driveResult,
  });
}

export async function DELETE(request: Request) {
  return deleteHandler(request);
}

export async function POST(request: Request) {
  const cloned = request.clone();
  const body = await cloned.json().catch(() => ({}));
  const action = String(body.action || "").toLowerCase();

  if (action === "delete" || action === "excluir") {
    return deleteHandler(request);
  }

  if (action === "archive" || action === "arquivar") {
    return PATCH(request);
  }

  return NextResponse.json(
    { ok: false, message: "Ação inválida. Use archive ou delete." },
    { status: 400 }
  );
}
