type UploadToAppsScriptInput = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  entityType: string;
  entityId?: string | null;
  category?: string | null;
  entityTypeFolderName?: string;
  entityFolderName?: string;
  categoryFolderName?: string;
};

type AppsScriptUploadResponse = {
  ok: boolean;
  message?: string;
  file?: {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    url: string;
    folderId: string;
    folderName: string;
    storageProvider: string;
  };
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    throw new Error(`Variável ${name} não configurada no .env.local.`);
  }

  return value;
}

export function isAppsScriptDriveConfigured() {
  return Boolean(
    process.env.GOOGLE_APPS_SCRIPT_UPLOAD_URL &&
      process.env.GOOGLE_APPS_SCRIPT_SECRET
  );
}

export async function uploadDocumentToAppsScriptDrive({
  buffer,
  fileName,
  mimeType,
  entityType,
  entityId,
  category,
  entityTypeFolderName,
  entityFolderName,
  categoryFolderName,
}: UploadToAppsScriptInput): Promise<AppsScriptUploadResponse> {
  const uploadUrl = getRequiredEnv("GOOGLE_APPS_SCRIPT_UPLOAD_URL");
  const secret = getRequiredEnv("GOOGLE_APPS_SCRIPT_SECRET");

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      secret,
      fileName,
      mimeType,
      entityType,
      entityId: entityId || "",
      category: category || "documentos",
      entityTypeFolderName,
      entityFolderName,
      categoryFolderName,
      base64: buffer.toString("base64"),
    }),
  });

  const text = await response.text();

  let data: AppsScriptUploadResponse;

  try {
    data = JSON.parse(text) as AppsScriptUploadResponse;
  } catch {
    throw new Error("O serviço de documentos não retornou uma resposta válida.");
  }

  if (!data.ok) {
    throw new Error(data.message || "Erro ao enviar documento.");
  }

  if (!data.file?.id || !data.file?.url) {
    throw new Error("O serviço de documentos não retornou os dados do arquivo.");
  }

  return data;
}