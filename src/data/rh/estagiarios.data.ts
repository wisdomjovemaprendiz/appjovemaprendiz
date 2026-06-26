import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type EstagiarioListItem = {
  id: string;
  nome: string | null;
  data_nascimento: string | null;
  cpf: string | null;
  telefone: string | null;
  email: string | null;
  serie_ano: string | null;
  turno: string | null;
  escola: string | null;
  endereco: string | null;
  empresa_atual: string | null;
  funcao: string | null;
  valor_bolsa: number | null;
  data_vencimento_seguro: string | null;
  foto_document_id: string | null;
  foto_url: string | null;
  foto_file_name: string | null;
  foto_atualizada_em: string | null;
  observacoes: string | null;
  status: string | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

export type EstagiarioDetail = EstagiarioListItem & {
  skills?: string[];
  [key: string]: unknown;
};

function normalizeStudent(row: Record<string, unknown>): EstagiarioListItem {
  return {
    id: String(row.id),
    nome: (row.nome as string | null) ?? null,
    data_nascimento: (row.data_nascimento as string | null) ?? null,
    cpf: (row.cpf as string | null) ?? null,
    telefone: (row.telefone as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    serie_ano: (row.serie_ano as string | null) ?? null,
    turno: (row.turno as string | null) ?? null,
    escola: (row.escola as string | null) ?? null,
    endereco: (row.endereco as string | null) ?? null,
    empresa_atual: (row.empresa_atual as string | null) ?? null,
    funcao: (row.funcao as string | null) ?? null,
    valor_bolsa: row.valor_bolsa === null || row.valor_bolsa === undefined ? null : Number(row.valor_bolsa),
    data_vencimento_seguro: (row.data_vencimento_seguro as string | null) ?? null,
    foto_document_id: (row.foto_document_id as string | null) ?? null,
    foto_url: (row.foto_url as string | null) ?? null,
    foto_file_name: (row.foto_file_name as string | null) ?? null,
    foto_atualizada_em: (row.foto_atualizada_em as string | null) ?? null,
    observacoes: (row.observacoes as string | null) ?? null,
    status: (row.status as string | null) ?? "ativo",
    criado_em: ((row.criado_em || row.created_at) as string | null) ?? null,
    atualizado_em: ((row.atualizado_em || row.updated_at) as string | null) ?? null,
  };
}

export async function getEstagiarios(): Promise<{
  data: EstagiarioListItem[];
  errorMessage?: string;
}> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      data: [],
      errorMessage: "Supabase ainda não configurado.",
    };
  }

  const { data, error } = await supabase
    .from("students")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(500);

  if (error) {
    return {
      data: [],
      errorMessage: `Erro ao carregar estagiários: ${error.message}`,
    };
  }

  return {
    data: ((data ?? []) as Array<Record<string, unknown>>).map(normalizeStudent),
  };
}

export async function getEstagiarioById(id: string): Promise<{
  data: EstagiarioDetail | null;
  errorMessage?: string;
}> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      data: null,
      errorMessage: "Supabase ainda não configurado.",
    };
  }

  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return {
      data: null,
      errorMessage: `Erro ao carregar estagiário: ${error.message}`,
    };
  }

  if (!data) {
    return {
      data: null,
      errorMessage: "Estagiário não encontrado.",
    };
  }

  let skills: string[] = [];

  const { data: skillRows } = await supabase
    .from("student_skills")
    .select("skill_id")
    .eq("student_id", id);

  skills = (skillRows ?? []).map((item) => item.skill_id).filter(Boolean);

  return {
    data: {
      ...normalizeStudent(data as Record<string, unknown>),
      ...(data as Record<string, unknown>),
      skills,
    },
  };
}