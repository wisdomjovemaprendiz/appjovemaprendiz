import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { FinancialSettings } from "./financeiro-settings.data";

export type CarnePdfBooklet = {
  id: string;
  company_id: string | null;
  titulo: string | null;
  descricao: string | null;
  quantidade_parcelas: number | null;
  valor_parcela: number | null;
  vencimento_primeira: string | null;
  periodicidade: string | null;
  desconto_tipo: string | null;
  desconto_valor: number | null;
  instrucoes_pagamento: string | null;
  observacoes: string | null;
  status: string | null;
  criado_em: string | null;
};

export type CarnePdfCompany = {
  id: string;
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
};

export type CarnePdfParcela = {
  id: string;
  booklet_id: string | null;
  company_id: string | null;
  competencia: string | null;
  descricao: string | null;
  valor: number | null;
  vencimento: string | null;
  status: string | null;
  data_pagamento: string | null;
  valor_pago: number | null;
  forma_pagamento: string | null;
  observacoes: string | null;
  parcela_numero: number | null;
  total_parcelas: number | null;
  numero_controle: string | null;
  desconto_tipo: string | null;
  desconto_valor: number | null;
  valor_com_desconto: number | null;
  instrucoes_pagamento: string | null;
};

export type CarnePdfHistoricoItem = {
  id: string;
  file_name: string | null;
  pdf_type: string | null;
  category: string | null;
  storage_provider: string | null;
  status: string | null;
  created_at: string | null;
};

export type CarnePdfData = {
  carne: CarnePdfBooklet;
  empresa: CarnePdfCompany | null;
  parcelas: CarnePdfParcela[];
  settings: FinancialSettings;
};

const defaultSettings: FinancialSettings = {
  id: "default",
  instrucoes_pagamento_padrao:
    "Efetuar o pagamento até a data de vencimento. Após o pagamento, enviar o comprovante para conferência e baixa.",
  pix_recebedor_nome: "",
  pix_chave: "",
  pix_observacoes: "",
  pix_qrcode_document_id: null,
  pix_qrcode_url: null,
  pix_qrcode_file_name: null,
  atualizado_em: null,
};

export async function getCarnePdfById(id: string): Promise<{
  data: CarnePdfData | null;
  errorMessage?: string;
}> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      data: null,
      errorMessage: "Supabase ainda não configurado.",
    };
  }

  const { data: carne, error: carneError } = await supabase
    .from("payment_booklets")
    .select(
      "id, company_id, titulo, descricao, quantidade_parcelas, valor_parcela, vencimento_primeira, periodicidade, desconto_tipo, desconto_valor, instrucoes_pagamento, observacoes, status, criado_em"
    )
    .eq("id", id)
    .single();

  if (carneError || !carne) {
    return {
      data: null,
      errorMessage: `Erro ao carregar carnê: ${carneError?.message || "registro não encontrado"}`,
    };
  }

  const { data: parcelas, error: parcelasError } = await supabase
    .from("financial_charges")
    .select(
      "id, booklet_id, company_id, competencia, descricao, valor, vencimento, status, data_pagamento, valor_pago, forma_pagamento, observacoes, parcela_numero, total_parcelas, numero_controle, desconto_tipo, desconto_valor, valor_com_desconto, instrucoes_pagamento"
    )
    .eq("booklet_id", id)
    .order("parcela_numero", { ascending: true });

  if (parcelasError) {
    return {
      data: null,
      errorMessage: `Erro ao carregar parcelas: ${parcelasError.message}`,
    };
  }

  let empresa: CarnePdfCompany | null = null;

  if (carne.company_id) {
    const { data } = await supabase
      .from("companies")
      .select(
        "id, razao_social, nome_fantasia, cnpj, endereco, bairro, cidade, estado, email, telefone, nome_responsavel"
      )
      .eq("id", carne.company_id)
      .maybeSingle();

    empresa = data as CarnePdfCompany | null;
  }

  const { data: settings } = await supabase
    .from("financial_settings")
    .select(
      "id, instrucoes_pagamento_padrao, pix_recebedor_nome, pix_chave, pix_observacoes, pix_qrcode_document_id, pix_qrcode_url, pix_qrcode_file_name, atualizado_em"
    )
    .eq("id", "default")
    .maybeSingle();

  return {
    data: {
      carne: carne as CarnePdfBooklet,
      empresa,
      parcelas: (parcelas ?? []) as CarnePdfParcela[],
      settings: settings ? (settings as FinancialSettings) : defaultSettings,
    },
  };
}

export async function getHistoricoPdfsCarne(id: string): Promise<{
  data: CarnePdfHistoricoItem[];
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
    .eq("entity_type", "carne")
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
    data: (data ?? []) as CarnePdfHistoricoItem[],
  };
}