import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import {
  isAppsScriptDriveConfigured,
  uploadDocumentToAppsScriptDrive,
} from "@/lib/apps-script/apps-script-drive.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedMimeTypes = new Set(["image/jpeg", "image/png"]);
const maxFileSize = 2 * 1024 * 1024;

function onlyDigits(value: string | null | undefined) {
  return String(value || "").replace(/\D/g, "");
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

function driveImageUrl(fileId: string | null | undefined) {
  if (!fileId) return null;
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const estagiarioId = searchParams.get("estagiario_id");

  if (!estagiarioId) {
    return NextResponse.json(
      {
        ok: false,
        message: "Estagiário não informado.",
      },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("students")
    .select("id, nome, foto_url, foto_file_name, foto_atualizada_em")
    .eq("id", estagiarioId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: `Erro ao carregar foto: ${error.message}`,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    data,
  });
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

    const estagiarioId = String(formData.get("estagiario_id") ?? "").trim();
    const file = formData.get("foto");

    if (!estagiarioId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Salve o cadastro do estagiário antes de enviar a foto.",
        },
        { status: 400 }
      );
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "Selecione uma foto.",
        },
        { status: 400 }
      );
    }

    if (!allowedMimeTypes.has(file.type)) {
      return NextResponse.json(
        {
          ok: false,
          message: "A foto deve estar em JPEG ou PNG.",
        },
        { status: 400 }
      );
    }

    if (file.size > maxFileSize) {
      return NextResponse.json(
        {
          ok: false,
          message: "A foto comprimida deve ter no máximo 2 MB.",
        },
        { status: 400 }
      );
    }

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, nome, cpf, foto_document_id, foto_file_name")
      .eq("id", estagiarioId)
      .maybeSingle();

    if (studentError || !student) {
      return NextResponse.json(
        {
          ok: false,
          message: "Estagiário não localizado.",
        },
        { status: 404 }
      );
    }

    const cpf = onlyDigits(student.cpf);
    const studentCode = cpf ? `CPF-${cpf}` : `ESTAGIARIO-${String(student.id).slice(0, 8)}`;
    const entityFolderName = `${studentCode} - ${sanitizeName(student.nome, "ESTAGIARIO")}`;
    const finalFileName = `${new Date().toISOString().slice(0, 10)}__${studentCode}__FOTO__${Date.now()}.jpg`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const uploaded = await uploadDocumentToAppsScriptDrive({
      buffer,
      fileName: finalFileName,
      mimeType: "image/jpeg",
      entityType: "estagiario",
      entityId: estagiarioId,
      category: "foto_estagiario",
      entityTypeFolderName: "ESTAGIARIOS",
      entityFolderName,
      categoryFolderName: "00_FOTO",
    });

    const imageUrl =
      driveImageUrl(uploaded.file?.id || null) ||
      uploaded.file?.url ||
      null;

    const documentPayload = {
      entity_type: "estagiario",
      entity_id: estagiarioId,
      category: "foto_estagiario",
      file_name: uploaded.file?.name || finalFileName,
      original_name: file.name || finalFileName,
      mime_type: "image/jpeg",
      file_size: file.size,
      storage_provider: "google_drive_apps_script",
      drive_file_id: uploaded.file?.id || null,
      drive_folder_id: uploaded.file?.folderId || null,
      drive_web_view_link: imageUrl || uploaded.file?.url || null,
      drive_web_content_link: imageUrl || uploaded.file?.url || null,
      status: "ativo",
      version: 1,
      metadata: {
        origem: "foto_estagiario",
        compressed: true,
        uploaded_at: new Date().toISOString(),
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
          message: `Foto enviada, mas houve erro ao registrar documento: ${documentError?.message || "registro não retornado"}`,
        },
        { status: 500 }
      );
    }

    if (student.foto_document_id) {
      await supabase
        .from("documents")
        .update({
          status: "arquivado",
          metadata: {
            substituida_por: document.id,
            arquivado_em: new Date().toISOString(),
          },
        })
        .eq("id", student.foto_document_id);
    }

    const studentPayload = {
      foto_document_id: document.id,
      foto_url: imageUrl,
      foto_file_name: uploaded.file?.name || finalFileName,
      foto_atualizada_em: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("students")
      .update(studentPayload)
      .eq("id", estagiarioId);

    if (updateError) {
      return NextResponse.json(
        {
          ok: false,
          message: `Foto registrada como documento, mas houve erro ao atualizar estagiário: ${updateError.message}`,
        },
        { status: 500 }
      );
    }

    await supabase.from("audit_logs").insert({
      acao: "atualizou_foto_estagiario",
      tabela: "students",
      entity_type: "estagiario",
      entity_id: estagiarioId,
      valor_anterior: {
        foto_document_id: student.foto_document_id,
        foto_file_name: student.foto_file_name,
      },
      valor_novo: studentPayload,
      motivo: "Atualização da foto do estagiário.",
    });

    return NextResponse.json({
      ok: true,
      message: "Foto do estagiário atualizada com sucesso.",
      data: studentPayload,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao enviar foto.",
      },
      { status: 500 }
    );
  }
}