import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type OrganizationLogoSettings = {
  id: string;
  logo_document_id: string | null;
  logo_url: string | null;
  logo_file_name: string | null;
};

type LogoDocument = {
  id: string;
  entity_type: string | null;
  category: string | null;
  file_name: string | null;
  original_name: string | null;
  mime_type: string | null;
  drive_file_id: string | null;
  status: string | null;
  metadata: Record<string, unknown> | null;
};

type AppsScriptFileResponse = {
  ok?: boolean;
  message?: string;
  file?: {
    base64?: string;
    mimeType?: string;
    name?: string;
  };
};

const allowedImageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function createAdminClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function safeFileName(value: string | null | undefined) {
  return String(value || "logo-wisdom")
    .replace(/[\\/:*?"<>|#%{}~&]/g, "-")
    .replace(/\s+/g, "-")
    .substring(0, 160);
}

function fallbackLogo(request: Request) {
  const response = NextResponse.redirect(new URL("/logo-wisdom.png", request.url), 307);

  response.headers.set("Cache-Control", "public, max-age=300, s-maxage=300");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");

  return response;
}

function parseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function readSettings(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("rh_organization_settings")
    .select("id, logo_document_id, logo_url, logo_file_name")
    .eq("id", "default")
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao ler rh_organization_settings: ${error.message}`);
  }

  return (data ?? null) as OrganizationLogoSettings | null;
}

async function readLogoDocument(supabase: SupabaseClient, documentId: string) {
  const { data, error } = await supabase
    .from("documents")
    .select("id, entity_type, category, file_name, original_name, mime_type, drive_file_id, status, metadata")
    .eq("id", documentId)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao ler documents: ${error.message}`);
  }

  return (data ?? null) as LogoDocument | null;
}

function validateLogoDocument(document: LogoDocument | null) {
  if (!document) {
    return "documento vinculado à logomarca não encontrado.";
  }

  if (document.entity_type !== "geral") {
    return "documento não pertence à área institucional geral.";
  }

  if (document.category !== "configuracao_logo") {
    return "documento não está categorizado como configuracao_logo.";
  }

  if (document.status !== "ativo") {
    return "documento institucional não está ativo.";
  }

  if (!document.drive_file_id?.trim()) {
    return "documento institucional não possui drive_file_id.";
  }

  const mimeType = String(document.mime_type || "").trim().toLowerCase();

  if (mimeType && !allowedImageMimeTypes.has(mimeType)) {
    return "documento institucional não é uma imagem permitida.";
  }

  const assetType =
    document.metadata && typeof document.metadata === "object"
      ? document.metadata.asset_type
      : null;

  if (assetType && assetType !== "logo") {
    return "metadata do documento não identifica asset_type logo.";
  }

  return null;
}

async function fetchLogoFromAppsScript({
  fileId,
  fallbackFileName,
}: {
  fileId: string;
  fallbackFileName?: string | null;
}) {
  const appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_UPLOAD_URL;
  const appsScriptSecret = process.env.GOOGLE_APPS_SCRIPT_SECRET;

  if (!appsScriptUrl || !appsScriptSecret) {
    return null;
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

  const raw = await response.text();
  const result = parseJson<AppsScriptFileResponse>(raw);

  if (!response.ok || !result?.ok || !result.file?.base64) {
    console.warn(
      "Logomarca institucional não carregada pelo Apps Script:",
      result?.message || response.statusText,
    );
    return null;
  }

  const mimeType = String(result.file.mimeType || "image/png")
    .trim()
    .toLowerCase();

  if (!allowedImageMimeTypes.has(mimeType)) {
    console.warn("Logomarca institucional recusada por MIME type:", mimeType);
    return null;
  }

  const cleanBase64 = String(result.file.base64).replace(
    /^data:[^;]+;base64,/,
    "",
  );

  const buffer = Buffer.from(cleanBase64, "base64");

  if (buffer.length === 0) {
    return null;
  }

  const fileName = safeFileName(result.file.name || fallbackFileName);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(buffer.length),
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();

    if (!supabase) {
      return fallbackLogo(request);
    }

    const settings = await readSettings(supabase);

    if (!settings?.logo_document_id) {
      return fallbackLogo(request);
    }

    const document = await readLogoDocument(supabase, settings.logo_document_id);
    const validationError = validateLogoDocument(document);

    if (validationError || !document?.drive_file_id) {
      console.warn("Logomarca institucional não servida:", validationError);
      return fallbackLogo(request);
    }

    const imageResponse = await fetchLogoFromAppsScript({
      fileId: document.drive_file_id,
      fallbackFileName:
        settings.logo_file_name || document.file_name || document.original_name,
    });

    return imageResponse || fallbackLogo(request);
  } catch (error) {
    console.error("Erro ao carregar logomarca institucional pública:", error);
    return fallbackLogo(request);
  }
}