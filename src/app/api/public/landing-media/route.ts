import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/jfif",
  "image/png",
  "image/webp",
  "image/gif",
]);

function safeFileName(value: string | null | undefined) {
  return String(value || "imagem-landing")
    .replace(/[\\/:*?"<>|#%{}~&]/g, "-")
    .replace(/\s+/g, "-")
    .substring(0, 160);
}

function normalizeMimeType(value: string | null | undefined) {
  const mimeType = String(value || "application/octet-stream").toLowerCase();

  if (mimeType === "image/jpg" || mimeType === "image/jfif") {
    return "image/jpeg";
  }

  return mimeType;
}

function isLandingMedia(row: Record<string, any> | null | undefined) {
  if (!row) return false;

  const status = String(row.status || "ativo").toLowerCase();
  if (["excluido", "excluida", "deleted", "trash", "lixeira", "arquivado"].includes(status)) {
    return false;
  }

  const entityType = String(row.entity_type || "").toLowerCase();
  const category = String(row.category || "").toLowerCase();

  if (entityType === "landing") return true;

  return [
    "landing",
    "galeria",
    "gallery",
    "landing_gallery",
    "landing_galeria",
    "foto_landing",
    "imagem_landing",
    "estrutura",
    "alunos",
    "oportunidades",
    "empresas",
    "empresa",
    "preview",
    "atualizacoes",
    "atualizações",
  ].includes(category);
}

function extractBase64(payload: any) {
  return (
    payload?.file?.base64 ||
    payload?.base64 ||
    payload?.data?.base64 ||
    payload?.arquivo?.base64 ||
    payload?.result?.file?.base64 ||
    null
  );
}

function extractMimeType(payload: any, fallback: string | null | undefined) {
  return (
    payload?.file?.mimeType ||
    payload?.file?.mime_type ||
    payload?.mimeType ||
    payload?.mime_type ||
    payload?.data?.mimeType ||
    fallback ||
    "application/octet-stream"
  );
}

function extractFileName(payload: any, fallback: string | null | undefined) {
  return (
    payload?.file?.name ||
    payload?.file?.fileName ||
    payload?.name ||
    payload?.fileName ||
    payload?.data?.name ||
    fallback ||
    "imagem-landing"
  );
}

async function callAppsScript(payload: Record<string, any>) {
  const appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_UPLOAD_URL;

  if (!appsScriptUrl) {
    throw new Error("GOOGLE_APPS_SCRIPT_UPLOAD_URL não configurado.");
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

  let lastText = "";
  let lastStatus = 0;

  for (const attempt of attempts) {
    const response = await fetch(appsScriptUrl, {
      method: "POST",
      cache: "no-store",
      headers: attempt.headers,
      body: attempt.body,
    });

    lastStatus = response.status;
    lastText = await response.text();

    let json: any = null;

    try {
      json = JSON.parse(lastText);
    } catch {
      json = null;
    }

    if (response.ok && json) {
      return json;
    }
  }

  throw new Error(`Apps Script não retornou JSON válido. Status: ${lastStatus}. Resposta: ${lastText.slice(0, 240)}`);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileId = String(searchParams.get("file_id") ?? "").trim();
  const documentId = String(searchParams.get("document_id") ?? "").trim();

  if (!fileId && !documentId) {
    return new NextResponse("Arquivo não informado.", {
      status: 400,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return new NextResponse("Supabase ainda não configurado.", {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    });
  }

  let query = supabase
    .from("documents")
    .select("*")
    .limit(10);

  if (documentId) {
    query = query.eq("id", documentId);
  } else {
    query = query.eq("drive_file_id", fileId);
  }

  const { data: docs, error } = await query;

  if (error) {
    return new NextResponse(`Erro ao validar imagem: ${error.message}`, {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const document = (docs || []).find(isLandingMedia);

  if (!document) {
    return new NextResponse("Imagem pública da landing não encontrada ou não está ativa.", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const finalFileId = String(document.drive_file_id || fileId || "").trim();

  if (!finalFileId) {
    return new NextResponse("Imagem sem ID do Google Drive.", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const appsScriptSecret = process.env.GOOGLE_APPS_SCRIPT_SECRET;

  if (!appsScriptSecret) {
    return new NextResponse("GOOGLE_APPS_SCRIPT_SECRET não configurado.", {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    });
  }

  let result: any = null;

  try {
    result = await callAppsScript({
      secret: appsScriptSecret,
      action: "getFileBase64",
      fileId: finalFileId,
    });
  } catch (error) {
    return new NextResponse(
      error instanceof Error ? error.message : "Erro ao buscar imagem no Google Drive.",
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  const base64 = extractBase64(result);

  if (!base64) {
    return new NextResponse(result?.message || result?.error || "Apps Script não retornou base64 da imagem.", {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const mimeType = normalizeMimeType(extractMimeType(result, document.mime_type));

  if (!allowedMimeTypes.has(mimeType)) {
    return new NextResponse(`Tipo de imagem não permitido: ${mimeType}`, {
      status: 415,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const buffer = Buffer.from(String(base64), "base64");

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(buffer.length),
      "Cache-Control": "no-store, max-age=0",
      "Content-Disposition": `inline; filename="${safeFileName(extractFileName(result, document.file_name || document.original_name))}"`,
    },
  });
}
