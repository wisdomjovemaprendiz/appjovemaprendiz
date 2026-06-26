import { google } from "googleapis";
import { Readable } from "stream";

type UploadToDriveInput = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  entityType: string;
  entityId?: string | null;
  category?: string | null;
};

type UploadToDriveResult = {
  fileId: string;
  folderId: string;
  webViewLink: string | null;
  webContentLink: string | null;
};

function getEnvValue(name: string) {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    return null;
  }

  return value;
}

function escapeDriveQueryValue(value: string) {
  return value.replace(/'/g, "\\'");
}

export function isGoogleDriveConfigured() {
  return Boolean(
    getEnvValue("GOOGLE_DRIVE_CLIENT_EMAIL") &&
      getEnvValue("GOOGLE_DRIVE_PRIVATE_KEY") &&
      getEnvValue("GOOGLE_DRIVE_ROOT_FOLDER_ID")
  );
}

function getDriveClient() {
  const clientEmail = getEnvValue("GOOGLE_DRIVE_CLIENT_EMAIL");
  const privateKey = getEnvValue("GOOGLE_DRIVE_PRIVATE_KEY");
  const rootFolderId = getEnvValue("GOOGLE_DRIVE_ROOT_FOLDER_ID");

  if (!clientEmail || !privateKey || !rootFolderId) {
    throw new Error(
      "Google Drive não configurado. Preencha GOOGLE_DRIVE_CLIENT_EMAIL, GOOGLE_DRIVE_PRIVATE_KEY e GOOGLE_DRIVE_ROOT_FOLDER_ID no .env.local."
    );
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  return {
    drive: google.drive({ version: "v3", auth }),
    rootFolderId,
  };
}

async function getOrCreateFolder({
  name,
  parentId,
}: {
  name: string;
  parentId: string;
}) {
  const { drive } = getDriveClient();

  const safeName = escapeDriveQueryValue(name);

  const existing = await drive.files.list({
    q: [
      "mimeType='application/vnd.google-apps.folder'",
      `name='${safeName}'`,
      `'${parentId}' in parents`,
      "trashed=false",
    ].join(" and "),
    fields: "files(id, name)",
    pageSize: 1,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const found = existing.data.files?.[0];

  if (found?.id) {
    return found.id;
  }

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
    supportsAllDrives: true,
  });

  if (!created.data.id) {
    throw new Error(`Não foi possível criar a pasta ${name} no Google Drive.`);
  }

  return created.data.id;
}

export async function uploadDocumentToGoogleDrive({
  buffer,
  fileName,
  mimeType,
  entityType,
  entityId,
  category,
}: UploadToDriveInput): Promise<UploadToDriveResult> {
  const { drive, rootFolderId } = getDriveClient();

  const year = String(new Date().getFullYear());
  const safeEntityType = entityType || "geral";
  const safeEntityId = entityId || "sem-vinculo";
  const safeCategory = category || "documentos";

  const yearFolderId = await getOrCreateFolder({
    name: year,
    parentId: rootFolderId,
  });

  const entityTypeFolderId = await getOrCreateFolder({
    name: safeEntityType,
    parentId: yearFolderId,
  });

  const entityFolderId = await getOrCreateFolder({
    name: safeEntityId,
    parentId: entityTypeFolderId,
  });

  const categoryFolderId = await getOrCreateFolder({
    name: safeCategory,
    parentId: entityFolderId,
  });

  const uploaded = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [categoryFolderId],
      mimeType,
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: "id, webViewLink, webContentLink",
    supportsAllDrives: true,
  });

  if (!uploaded.data.id) {
    throw new Error("Upload para o Google Drive não retornou ID do arquivo.");
  }

  return {
    fileId: uploaded.data.id,
    folderId: categoryFolderId,
    webViewLink: uploaded.data.webViewLink ?? null,
    webContentLink: uploaded.data.webContentLink ?? null,
  };
}