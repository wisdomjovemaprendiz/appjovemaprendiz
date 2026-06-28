import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type RelatorioRow = Record<string, unknown>;

export type RelatorioOrganizacao = {
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  telefone: string;
  whatsapp: string;
  email: string;
  endereco: string;
  cidade: string;
  estado: string;
  logo_url: string | null;
};

export type RelatoriosData = {
  generatedAt: string;
  errors: string[];
  organization: RelatorioOrganizacao;
  companies: RelatorioRow[];
  students: RelatorioRow[];
  contracts: RelatorioRow[];
  charges: RelatorioRow[];
  documents: RelatorioRow[];
  reminders: RelatorioRow[];
};

async function safeSelect(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  table: string,
  limit = 5000
): Promise<{ data: RelatorioRow[]; error?: string }> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .limit(limit);

  if (error) {
    return {
      data: [],
      error: `${table}: ${error.message}`,
    };
  }

  return {
    data: (data ?? []) as RelatorioRow[],
  };
}

function getValue(row: RelatorioRow | null | undefined, keys: string[], fallback = "") {
  if (!row) return fallback;

  for (const key of keys) {
    const value = row[key];

    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return String(value);
    }
  }

  return fallback;
}

function protectedImageUrl(fileId: string | null | undefined) {
  if (!fileId) return null;
  return `/api/rh/files/image?file_id=${encodeURIComponent(fileId)}`;
}

function normalizeImageUrl(value: string | null | undefined) {
  const url = String(value || "").trim();

  if (!url) return null;

  if (url.startsWith("/api/rh/files/image") || url.startsWith("/")) {
    return url;
  }

  const fileIdFromView = url.match(/\/d\/([^/]+)/)?.[1];
  const fileIdFromQuery = url.match(/[?&]id=([^&]+)/)?.[1];
  const fileId = fileIdFromView || fileIdFromQuery;

  if (fileId) {
    return protectedImageUrl(fileId);
  }

  return url;
}

function buildEndereco(row: RelatorioRow | null | undefined) {
  return [
    getValue(row, ["endereco", "logradouro"]),
    getValue(row, ["numero"]),
    getValue(row, ["bairro"]),
    getValue(row, ["cidade"]),
    getValue(row, ["estado", "uf"]),
  ]
    .filter(Boolean)
    .join(" - ");
}

export async function getRelatoriosData(): Promise<{
  data: RelatoriosData;
  errorMessage?: string;
}> {
  const supabase = getSupabaseAdminClient();

  const empty: RelatoriosData = {
    generatedAt: new Date().toISOString(),
    errors: [],
    organization: {
      nome_fantasia: "Wisdom Cursos e Estágios",
      razao_social: "RH Wisdom Opportunities LTDA",
      cnpj: "52.983.709/0001-58",
      telefone: "",
      whatsapp: "",
      email: "",
      endereco: "",
      cidade: "Salvador",
      estado: "BA",
      logo_url: "/logo-wisdom.png",
    },
    companies: [],
    students: [],
    contracts: [],
    charges: [],
    documents: [],
    reminders: [],
  };

  if (!supabase) {
    return {
      data: empty,
      errorMessage: "Supabase ainda não configurado.",
    };
  }

  const [
    orgResult,
    companiesResult,
    studentsResult,
    contractsResult,
    chargesResult,
    documentsResult,
    remindersResult,
  ] = await Promise.all([
    supabase
      .from("rh_organization_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle(),
    safeSelect(supabase, "companies"),
    safeSelect(supabase, "students"),
    safeSelect(supabase, "internship_contracts"),
    safeSelect(supabase, "financial_charges"),
    safeSelect(supabase, "documents"),
    safeSelect(supabase, "completion_reminders"),
  ]);

  const errors = [
    orgResult.error ? `rh_organization_settings: ${orgResult.error.message}` : null,
    companiesResult.error,
    studentsResult.error,
    contractsResult.error,
    chargesResult.error,
    documentsResult.error,
    remindersResult.error,
  ].filter(Boolean) as string[];

  const org = (orgResult.data ?? {}) as RelatorioRow;

  return {
    data: {
      generatedAt: new Date().toISOString(),
      errors,
      organization: {
        nome_fantasia: getValue(org, ["nome_fantasia"], "Wisdom Cursos e Estágios"),
        razao_social: getValue(org, ["razao_social"], "RH Wisdom Opportunities LTDA"),
        cnpj: getValue(org, ["cnpj"], "52.983.709/0001-58"),
        telefone: getValue(org, ["telefone"]),
        whatsapp: getValue(org, ["whatsapp"]),
        email: getValue(org, ["email"]),
        endereco: buildEndereco(org),
        cidade: getValue(org, ["cidade"], "Salvador"),
        estado: getValue(org, ["estado"], "BA"),
        logo_url: normalizeImageUrl(getValue(org, ["logo_url"])) || "/logo-wisdom.png",
      },
      companies: companiesResult.data,
      students: studentsResult.data,
      contracts: contractsResult.data,
      charges: chargesResult.data,
      documents: documentsResult.data,
      reminders: remindersResult.data,
    },
    errorMessage: errors.length > 0 ? errors.join(" | ") : undefined,
  };
}