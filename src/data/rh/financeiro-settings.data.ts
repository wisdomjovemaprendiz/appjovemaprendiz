import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type FinancialSettings = {
  id: string;
  instrucoes_pagamento_padrao: string | null;
  pix_recebedor_nome: string | null;
  pix_chave: string | null;
  pix_observacoes: string | null;
  pix_qrcode_document_id: string | null;
  pix_qrcode_url: string | null;
  pix_qrcode_file_name: string | null;
  atualizado_em: string | null;
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

export async function getFinanceiroSettings(): Promise<{
  data: FinancialSettings;
  errorMessage?: string;
}> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      data: defaultSettings,
      errorMessage: "Supabase ainda não configurado.",
    };
  }

  const { data, error } = await supabase
    .from("financial_settings")
    .select(
      "id, instrucoes_pagamento_padrao, pix_recebedor_nome, pix_chave, pix_observacoes, pix_qrcode_document_id, pix_qrcode_url, pix_qrcode_file_name, atualizado_em"
    )
    .eq("id", "default")
    .maybeSingle();

  if (error) {
    return {
      data: defaultSettings,
      errorMessage: `Erro ao carregar configurações financeiras: ${error.message}`,
    };
  }

  return {
    data: data ? (data as FinancialSettings) : defaultSettings,
  };
}