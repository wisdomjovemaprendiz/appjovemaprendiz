import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function publicLandingMediaUrl(fileId: string | null | undefined) {
  if (!fileId) return null;
  return `/api/public/landing-media?file_id=${encodeURIComponent(fileId)}`;
}

function isImageLike(row: Record<string, any>) {
  const mime = String(row.mime_type || "").toLowerCase();
  const name = `${row.original_name || ""} ${row.file_name || ""}`.toLowerCase();

  return (
    mime.startsWith("image/") ||
    /\.(png|jpe?g|jfif|webp|gif)$/i.test(name)
  );
}

export async function GET() {
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

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: `Erro ao carregar imagens: ${error.message}`,
      },
      { status: 500 }
    );
  }

  const media = (data || [])
    .filter((item) => String(item.status || "ativo") !== "excluido")
    .filter(isImageLike)
    .map((item) => {
      const imageUrl =
        publicLandingMediaUrl(item.drive_file_id) ||
        item.drive_web_content_link ||
        item.drive_web_view_link ||
        null;

      return {
        id: item.id,
        document_id: item.id,
        drive_file_id: item.drive_file_id,
        original_name: item.original_name,
        file_name: item.file_name,
        category: item.category,
        entity_type: item.entity_type,
        status: item.status || "ativo",
        mime_type: item.mime_type,
        file_size: item.file_size,
        image_url: imageUrl,
      };
    });

  return NextResponse.json({
    ok: true,
    data: media,
  });
}