import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type LandingSettings = {
  id: string;
  public_enabled: boolean;

  hero_badge: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;

  primary_cta_label: string | null;
  primary_cta_url: string | null;
  secondary_cta_label: string | null;
  secondary_cta_url: string | null;

  video_url: string | null;
  video_embed_url: string | null;
  video_provider: string | null;

  company_section_title: string | null;
  company_section_text: string | null;

  instagram_url: string | null;
  whatsapp_url: string | null;
  rh_login_url: string | null;
  empresa_portal_url: string | null;
  estagiario_portal_url: string | null;
  empresa_cadastro_url: string | null;

  facts_section_title: string | null;
  facts_section_text: string | null;

  updated_at: string | null;
};

export type LandingMedia = {
  id: string;
  category: string;
  title: string | null;
  description: string | null;
  file_name: string | null;
  original_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  storage_provider: string | null;
  drive_file_id: string | null;
  drive_folder_id: string | null;
  public_url: string | null;
  web_view_link: string | null;
  status: string;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
};

export type LandingUpdate = {
  id: string;
  title: string;
  description: string | null;
  post_url: string;
  image_url: string | null;
  badge: string | null;
  status: string;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
};

export type LandingData = {
  settings: LandingSettings;
  media: LandingMedia[];
  updates: LandingUpdate[];
};

const defaultSettings: LandingSettings = {
  id: "default",
  public_enabled: true,

  hero_badge: "RH Wisdom • Gestão de Estágios",
  hero_title: "Intermediação de estágios com segurança para empresas e estudantes",
  hero_subtitle:
    "A Wisdom conecta empresas a estagiários preparados, organiza contratos, documentos, vencimentos, financeiro e acompanha todo o processo de estágio.",

  primary_cta_label: "Cadastrar empresa",
  primary_cta_url: "/empresa/cadastro",
  secondary_cta_label: "Falar com o RH",
  secondary_cta_url: "https://wa.me/5571985486088",

  video_url: null,
  video_embed_url: null,
  video_provider: null,

  company_section_title: "Sua empresa com estágios mais organizados",
  company_section_text:
    "Conte com o RH Wisdom para estruturar o processo de estágio, orientar a documentação, acompanhar prazos e facilitar a gestão com estudantes, empresas e instituições de ensino.",

  instagram_url: "https://www.instagram.com/wisdomcursoseestagios",
  whatsapp_url: "https://wa.me/5571985486088",
  rh_login_url: "/login",
  empresa_portal_url: "/empresa",
  estagiario_portal_url: "/estagiario",
  empresa_cadastro_url: "/empresa/cadastro",

  facts_section_title: "Informações importantes sobre estágio",
  facts_section_text:
    "O estágio é uma oportunidade de aprendizagem prática, com regras próprias, documentação adequada e acompanhamento entre estudante, empresa e instituição de ensino.",

  updated_at: null,
};

export async function getLandingPublicData(): Promise<LandingData> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      settings: defaultSettings,
      media: [],
      updates: [],
    };
  }

  const [settingsResult, mediaResult, updatesResult] = await Promise.all([
    supabase
      .from("landing_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle(),
    supabase
      .from("landing_media")
      .select("*")
      .eq("status", "ativo")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("landing_updates")
      .select("*")
      .eq("status", "ativo")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  return {
    settings: settingsResult.data
      ? ({ ...defaultSettings, ...settingsResult.data } as LandingSettings)
      : defaultSettings,
    media: (mediaResult.data ?? []) as LandingMedia[],
    updates: (updatesResult.data ?? []) as LandingUpdate[],
  };
}

export async function getLandingRhData(): Promise<
  LandingData & { errorMessage?: string }
> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      settings: defaultSettings,
      media: [],
      updates: [],
      errorMessage: "Supabase ainda não configurado.",
    };
  }

  const [settingsResult, mediaResult, updatesResult] = await Promise.all([
    supabase
      .from("landing_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle(),
    supabase
      .from("landing_media")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("landing_updates")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return {
    settings: settingsResult.data
      ? ({ ...defaultSettings, ...settingsResult.data } as LandingSettings)
      : defaultSettings,
    media: (mediaResult.data ?? []) as LandingMedia[],
    updates: (updatesResult.data ?? []) as LandingUpdate[],
    errorMessage:
      settingsResult.error?.message ||
      mediaResult.error?.message ||
      updatesResult.error?.message,
  };
}