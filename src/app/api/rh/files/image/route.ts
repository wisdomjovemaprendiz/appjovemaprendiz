import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedImageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function safeFileName(value: string | null | undefined) {
  return String(value || "imagem")
    .replace(/[\\/:*?"<>|#%{}~&]/g, "-")
    .replace(/\s+/g, "-")
    .substring(0, 160);
}

export async function GET(request: Request) {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile || profile.status !== "ativo") {
    return new NextResponse("Acesso não autorizado.", {
      status: 403,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  const { searchParams } = new URL(request.url);
  const fileId = String(searchParams.get("file_id") ?? "").trim();

  if (!fileId) {
    return new NextResponse("Arquivo não informado.", {
      status: 400,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  const appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_UPLOAD_URL;
  const appsScriptSecret = process.env.GOOGLE_APPS_SCRIPT_SECRET;

  if (!appsScriptUrl || !appsScriptSecret) {
    return new NextResponse("Google Drive via Apps Script não configurado.", {
      status: 500,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  const response = await fetch(appsScriptUrl, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      secret: appsScriptSecret,
      action: "getFileBase64",
      fileId,
    }),
  });

  const result = await response.json();

  if (!response.ok || !result.ok || !result.file?.base64) {
    return new NextResponse(result.message || "Não foi possível carregar a imagem.", {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  const mimeType = String(result.file.mimeType || "application/octet-stream");

  if (!allowedImageMimeTypes.has(mimeType)) {
    return new NextResponse("O arquivo não é uma imagem permitida.", {
      status: 415,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  const buffer = Buffer.from(String(result.file.base64), "base64");

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(buffer.length),
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": `inline; filename="${safeFileName(result.file.name)}"`,
    },
  });
}