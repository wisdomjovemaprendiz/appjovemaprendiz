import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type EmpresaListItem = {
  id: string;
  razao_social: string | null;
  nome_fantasia: string | null;
  nome_responsavel: string | null;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
  bairro: string | null;
  status: "ativo" | "inativo" | "arquivado";
  criado_em: string;
};

export type EmpresaDetail = EmpresaListItem & {
  ramo_atuacao: string | null;
  endereco: string | null;
  estado: string | null;
  cep: string | null;
  perfil_candidato: string | null;
  funcoes_estagiario: string | null;
  valor_bolsa: number | null;
  observacoes: string | null;
  skills_desejadas: string[];
  funcoes_sugeridas: string[];
};

export async function getEmpresas(): Promise<{
  data: EmpresaListItem[];
  errorMessage?: string;
}> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      data: [],
      errorMessage:
        "Supabase ainda não configurado. Preencha o .env.local para carregar empresas reais.",
    };
  }

  const { data, error } = await supabase
    .from("companies")
    .select(
      "id, razao_social, nome_fantasia, nome_responsavel, cnpj, email, telefone, cidade, bairro, status, criado_em"
    )
    .order("criado_em", { ascending: false })
    .limit(50);

  if (error) {
    return {
      data: [],
      errorMessage: `Erro ao carregar empresas: ${error.message}`,
    };
  }

  return {
    data: (data ?? []) as EmpresaListItem[],
  };
}

export async function getEmpresaById(id: string): Promise<{
  data: EmpresaDetail | null;
  errorMessage?: string;
}> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      data: null,
      errorMessage: "Supabase ainda não configurado.",
    };
  }

  const { data: empresa, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return {
      data: null,
      errorMessage: `Erro ao carregar empresa: ${error.message}`,
    };
  }

  const { data: skills } = await supabase
    .from("company_skill_requirements")
    .select("nome_skill")
    .eq("company_id", id);

  const nomes = Array.from(
    new Set((skills ?? []).map((item) => item.nome_skill).filter(Boolean))
  );

  return {
    data: {
      ...(empresa as EmpresaListItem),
      ramo_atuacao: empresa.ramo_atuacao,
      endereco: empresa.endereco,
      estado: empresa.estado,
      cep: empresa.cep,
      perfil_candidato: empresa.perfil_candidato,
      funcoes_estagiario: empresa.funcoes_estagiario,
      valor_bolsa: empresa.valor_bolsa,
      observacoes: empresa.observacoes,
      skills_desejadas: nomes,
      funcoes_sugeridas: [],
    },
  };
}
