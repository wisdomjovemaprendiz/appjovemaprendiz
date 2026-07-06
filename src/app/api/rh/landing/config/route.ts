import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/server-auth";
import { normalizeLandingVideoUrl } from "@/lib/landing/video";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function publicLandingMediaUrl(fileId: string | null | undefined) {
  if (!fileId) return null;
  return `/api/public/landing-media?file_id=${encodeURIComponent(fileId)}`;
}

async function requireRh() {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile) {
    return {
      ok: false,
      user,
      profile,
      message: "Sessão não encontrada.",
    };
  }

  if (
    profile.status !== "ativo" ||
    !["rh_master", "rh_operador"].includes(profile.role)
  ) {
    return {
      ok: false,
      user,
      profile,
      message: "Apenas usuários do RH podem configurar a landing page.",
    };
  }

  return {
    ok: true,
    user,
    profile,
    message: "Autorizado.",
  };
}

function emptyToNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

export async function POST(request: Request) {
  const auth = await requireRh();

  if (!auth.ok || !auth.user) {
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

  const formData = await request.formData();
  const video = normalizeLandingVideoUrl(emptyToNull(formData.get("video_url")));

  const payload = {
    id: "default",
    public_enabled: String(formData.get("public_enabled") ?? "false") === "true",

    hero_badge: emptyToNull(formData.get("hero_badge")),
    hero_title: emptyToNull(formData.get("hero_title")),
    hero_subtitle: emptyToNull(formData.get("hero_subtitle")),

    primary_cta_label: emptyToNull(formData.get("primary_cta_label")),
    primary_cta_url: emptyToNull(formData.get("primary_cta_url")),
    secondary_cta_label: emptyToNull(formData.get("secondary_cta_label")),
    secondary_cta_url: emptyToNull(formData.get("secondary_cta_url")),

    video_url: video.originalUrl,
    video_embed_url: video.embedUrl,
    video_provider: video.provider,

    company_section_title: emptyToNull(formData.get("company_section_title")),
    company_section_text: emptyToNull(formData.get("company_section_text")),

    instagram_url: emptyToNull(formData.get("instagram_url")),
    whatsapp_url: emptyToNull(formData.get("whatsapp_url")),
    rh_login_url: emptyToNull(formData.get("rh_login_url")),
    empresa_portal_url: emptyToNull(formData.get("empresa_portal_url")),
    estagiario_portal_url: emptyToNull(formData.get("estagiario_portal_url")),
    empresa_cadastro_url: emptyToNull(formData.get("empresa_cadastro_url")),

    facts_section_title: emptyToNull(formData.get("facts_section_title")),
    facts_section_text: emptyToNull(formData.get("facts_section_text")),

    updated_at: new Date().toISOString(),
  };

  const { data: previous } = await supabase
    .from("landing_settings")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  const { data, error } = await supabase
    .from("landing_settings")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: `Erro ao salvar configurações: ${error.message}`,
      },
      { status: 500 }
    );
  }

  await supabase.from("audit_logs").insert({
    acao: "atualizou_landing_page",
    tabela: "landing_settings",
    entity_type: "landing",
    entity_id: null,
    valor_anterior: previous,
    valor_novo: payload,
    motivo: "Configuração da landing page atualizada pelo painel RH.",
  });

  return NextResponse.json({
    ok: true,
    message: "Configurações da landing page salvas com sucesso.",
    data,
  });
}