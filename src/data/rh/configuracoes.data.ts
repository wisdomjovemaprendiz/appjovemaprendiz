import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type RhOrganizationSettings = {
  id: string;
  nome_fantasia: string | null;
  razao_social: string | null;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  site: string | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  representante_nome: string | null;
  representante_cargo: string | null;
  logo_document_id: string | null;
  logo_url: string | null;
  logo_file_name: string | null;
  assinatura_document_id: string | null;
  assinatura_url: string | null;
  assinatura_file_name: string | null;
  observacoes: string | null;
  updated_at: string | null;
};

export type SystemCatalogItem = {
  id: string;
  item_type: string;
  name: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  status: string;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
};

export type ConfiguracoesData = {
  organization: RhOrganizationSettings;
  catalogItems: SystemCatalogItem[];
};

const defaultOrganization: RhOrganizationSettings = {
  id: "default",
  nome_fantasia: "Wisdom Cursos e Estágios",
  razao_social: "RH Wisdom Opportunities LTDA",
  cnpj: "52.983.709/0001-58",
  email: "",
  telefone: "",
  whatsapp: "",
  site: "",
  endereco: "",
  bairro: "",
  cidade: "Salvador",
  estado: "BA",
  cep: "",
  representante_nome: "",
  representante_cargo: "",
  logo_document_id: null,
  logo_url: null,
  logo_file_name: null,
  assinatura_document_id: null,
  assinatura_url: null,
  assinatura_file_name: null,
  observacoes: "",
  updated_at: null,
};

export async function getConfiguracoesData(): Promise<{
  data: ConfiguracoesData;
  errorMessage?: string;
}> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      data: {
        organization: defaultOrganization,
        catalogItems: [],
      },
      errorMessage: "Supabase ainda não configurado.",
    };
  }

  const [organizationResult, catalogResult] = await Promise.all([
    supabase
      .from("rh_organization_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle(),
    supabase
      .from("system_catalog_items")
      .select("*")
      .order("item_type", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .limit(500),
  ]);

  return {
    data: {
      organization: organizationResult.data
        ? ({ ...defaultOrganization, ...organizationResult.data } as RhOrganizationSettings)
        : defaultOrganization,
      catalogItems: (catalogResult.data ?? []) as SystemCatalogItem[],
    },
    errorMessage: organizationResult.error?.message || catalogResult.error?.message,
  };
}