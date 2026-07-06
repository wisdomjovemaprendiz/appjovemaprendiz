import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalize(value: string | null | undefined) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function fileNameOnly(value: string | null | undefined) {
  const clean = String(value || "").trim();
  return clean.split(/[\\/]/g).pop() || clean;
}

function isImageLike(row: Record<string, any>) {
  const mime = String(row.mime_type || "").toLowerCase();
  const name = `${row.original_name || ""} ${row.file_name || ""}`.toLowerCase();

  return mime.startsWith("image/") || /\.(png|jpe?g|jfif|webp|gif)$/i.test(name);
}

function collectBodyValues(body: Record<string, any>) {
  const values: string[] = [];

  function pushValue(value: unknown) {
    if (value === null || value === undefined) return;

    if (Array.isArray(value)) {
      value.forEach(pushValue);
      return;
    }

    if (typeof value === "object") {
      Object.values(value).forEach(pushValue);
      return;
    }

    const text = String(value).trim();

    if (text) values.push(text);
  }

  Object.values(body).forEach(pushValue);

  return Array.from(new Set(values));
}

function looksLikeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function titleMatches(row: Record<string, any>, rawTitle: string, rawCardText: string) {
  const title = normalize(rawTitle);
  const cardText = normalize(rawCardText);
  const haystack = `${title} ${cardText}`;

  const original = normalize(row.original_name);
  const file = normalize(row.file_name);
  const originalBase = normalize(fileNameOnly(row.original_name));
  const fileBase = normalize(fileNameOnly(row.file_name));

  return Boolean(
    (original && haystack.includes(original)) ||
    (file && haystack.includes(file)) ||
    (originalBase && haystack.includes(originalBase)) ||
    (fileBase && haystack.includes(fileBase))
  );
}

async function sendToDriveTrash(fileId: string | null | undefined) {
  if (!fileId) {
    return {
      ok: true,
      message: "Sem arquivo do Drive vinculado.",
    };
  }

  const appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_UPLOAD_URL;
  const appsScriptSecret = process.env.GOOGLE_APPS_SCRIPT_SECRET;

  if (!appsScriptUrl || !appsScriptSecret) {
    return {
      ok: false,
      message: "Apps Script não configurado. O registro será removido do sistema.",
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

    const result = await response.json();

    return {
      ok: Boolean(response.ok && result.ok),
      message: result.message || "Resposta do Apps Script recebida.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Erro ao enviar arquivo para lixeira.",
    };
  }
}

export async function POST(request: Request) {
  const { user, profile } = await getCurrentProfile();

  if (
    !user ||
    !profile ||
    profile.status !== "ativo" ||
    !["rh_master", "rh_operador"].includes(profile.role)
  ) {
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

  const body = await request.json();

  const confirmText = String(body.confirm_text ?? body.confirmText ?? "").trim();

  if (confirmText !== "EXCLUIR") {
    return NextResponse.json(
      {
        ok: false,
        message: "Digite EXCLUIR para confirmar.",
      },
      { status: 400 }
    );
  }

  const bodyValues = collectBodyValues(body);

  const explicitDocumentIds = [
    body.document_id,
    body.documentId,
    body.id,
    body.media_id,
    body.mediaId,
    body.image_id,
    body.imageId,
    body.documento_id,
    body.documentoId,
    body.arquivo_id,
    body.arquivoId,
    body.fileRecordId,
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  const uuidCandidates = Array.from(
    new Set([
      ...explicitDocumentIds,
      ...bodyValues.filter(looksLikeUuid),
    ])
  );

  const explicitFileIds = [
    body.file_id,
    body.fileId,
    body.drive_file_id,
    body.driveFileId,
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  const title = String(body.title ?? body.name ?? "").trim();
  const cardText = String(body.card_text ?? body.cardText ?? "").trim();

  const { data: allRows, error } = await supabase
    .from("documents")
    .select("*")
    .limit(3000);

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: `Erro ao buscar imagem: ${error.message}`,
      },
      { status: 500 }
    );
  }

  const images = (allRows || [])
    .filter((item) => String(item.status || "ativo") !== "excluido")
    .filter(isImageLike);

  const matched =
    images.find((item) => uuidCandidates.includes(String(item.id))) ||
    images.find((item) => explicitFileIds.includes(String(item.drive_file_id))) ||
    images.find((item) => titleMatches(item, title, cardText));

  if (!matched) {
    return NextResponse.json(
      {
        ok: false,
        message: "Não consegui localizar essa imagem no banco. O botão Arquivar desta imagem não está expondo o ID no HTML. Vou precisar substituir o componente de galeria em vez de apenas corrigir por fora.",
        debug: {
          explicitDocumentIds,
          uuidCandidates,
          explicitFileIds,
          title,
        },
      },
      { status: 404 }
    );
  }

  const trashResult = await sendToDriveTrash(matched.drive_file_id);

  await supabase.from("audit_logs").insert({
    acao: "excluiu_imagem_landing",
    tabela: "documents",
    entity_type: "landing",
    entity_id: matched.id,
    valor_anterior: matched,
    valor_novo: {
      drive_trash: trashResult,
    },
    motivo: "Imagem excluída definitivamente pelo card da galeria da landing.",
  });

  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", matched.id);

  if (deleteError) {
    return NextResponse.json(
      {
        ok: false,
        message: `Erro ao excluir imagem: ${deleteError.message}`,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: trashResult.ok
      ? "Imagem excluída e enviada para a lixeira do Google Drive."
      : "Imagem excluída do sistema. O arquivo pode permanecer no Google Drive porque o Apps Script não confirmou a lixeira.",
    deleted_id: matched.id,
    drive: trashResult,
  });
}