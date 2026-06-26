import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type FinanceiroPdfData = {
  cobranca: {
    id: string;
    company_id: string | null;
    contract_id: string | null;
    competencia: string | null;
    descricao: string | null;
    valor: number | null;
    vencimento: string | null;
    status: string | null;
    data_pagamento: string | null;
    valor_pago: number | null;
    forma_pagamento: string | null;
    observacoes: string | null;
    criado_em: string | null;
  };
  empresa: {
    razao_social: string | null;
    nome_fantasia: string | null;
    cnpj: string | null;
    endereco: string | null;
    bairro: string | null;
    cidade: string | null;
    estado: string | null;
    email: string | null;
    telefone: string | null;
    nome_responsavel: string | null;
  } | null;
};

export type FinanceiroPdfHistoricoItem = {
  id: string;
  file_name: string | null;
  pdf_type: string | null;
  category: string | null;
  storage_provider: string | null;
  status: string | null;
  created_at: string | null;
};

export async function getFinanceiroPdfById(id: string): Promise<{
  data: FinanceiroPdfData | null;
  errorMessage?: string;
}> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      data: null,
      errorMessage: "Supabase ainda não configurado.",
    };
  }

  const { data: cobranca, error } = await supabase
    .from("financial_charges")
    .select(
      "id, company_id, contract_id, competencia, descricao, valor, vencimento, status, data_pagamento, valor_pago, forma_pagamento, observacoes, criado_em"
    )
    .eq("id", id)
    .single();

  if (error || !cobranca) {
    return {
      data: null,
      errorMessage: `Erro ao carregar cobrança: ${error?.message || "registro não encontrado"}`,
    };
  }

  let empresa = null;

  if (cobranca.company_id) {
    const { data } = await supabase
      .from("companies")
      .select(
        "razao_social, nome_fantasia, cnpj, endereco, bairro, cidade, estado, email, telefone, nome_responsavel"
      )
      .eq("id", cobranca.company_id)
      .maybeSingle();

    empresa = data;
  }

  return {
    data: {
      cobranca,
      empresa,
    },
  };
}

export async function getHistoricoPdfsFinanceiro(id: string): Promise<{
  data: FinanceiroPdfHistoricoItem[];
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
    .from("generated_pdfs")
    .select("id, file_name, pdf_type, category, storage_provider, status, created_at")
    .eq("entity_type", "financeiro")
    .eq("entity_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return {
      data: [],
      errorMessage: `Erro ao carregar histórico de PDFs: ${error.message}`,
    };
  }

  return {
    data: (data ?? []) as FinanceiroPdfHistoricoItem[],
  };
}