import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function thumbnail(fileId: string) {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
}

function view(fileId: string) {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

async function requireRh() {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile) {
    return {
      ok: false,
      message: "Sessão não encontrada.",
    };
  }

  if (
    profile.status !== "ativo" ||
    !["rh_master", "rh_operador"].includes(profile.role)
  ) {
    return {
      ok: false,
      message: "Apenas usuários do RH podem reparar as imagens.",
    };
  }

  return {
    ok: true,
    message: "Autorizado.",
  };
}

export async function POST() {
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

  const { data: media, error } = await supabase
    .from("landing_media")
    .select("id, drive_file_id, public_url, web_view_link")
    .not("drive_file_id", "is", null);

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: `Erro ao buscar imagens: ${error.message}`,
      },
      { status: 500 }
    );
  }

  let repaired = 0;

  for (const item of media ?? []) {
    if (!item.drive_file_id) continue;

    const payload = {
      public_url: thumbnail(item.drive_file_id),
      web_view_link: item.web_view_link || view(item.drive_file_id),
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("landing_media")
      .update(payload)
      .eq("id", item.id);

    if (!updateError) {
      repaired += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    message: `${repaired} imagem(ns) reparada(s).`,
  });
}