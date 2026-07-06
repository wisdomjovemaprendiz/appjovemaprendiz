import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type EmpresaFinanceiroOption = {
  id: string;
  label: string;
  detail?: string | null;
};

export type PaymentBookletItem = {
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
  motivo_cancelamento: string | null;
  cancelado_em: string | null;
  criado_em: string | null;
  company_name: string;
  company_document: string | null;
};

export type FinancialChargeItem = {
  id: string;
  company_id: string | null;
  booklet_id: string | null;
  competencia: string | null;
  descricao: string | null;
  valor: number | null;
  vencimento: string | null;
  status: "pendente" | "pago" | "atrasado" | "cancelado";
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
  comprovante_document_id: string | null;
  motivo_cancelamento: string | null;
  cancelado_em: string | null;
  motivo_estorno: string | null;
  estornado_em: string | null;
  criado_em: string | null;
  company_name: string;
  company_document: string | null;
  comprovante_url: string | null;
  comprovante_nome: string | null;
};

export type FinanceiroStats = {
  totalPendente: number;
  totalPago: number;
  totalAtrasado: number;
  quantidadePendente: number;
  quantidadePago: number;
  quantidadeAtrasado: number;
  quantidadeCarnes: number;
  vencendoEm7Dias: number;
};

function toNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isOverdue(item: { status: string | null; vencimento: string | null }) {
  if (!item.vencimento || item.status === "pago" || item.status === "cancelado") {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(`${item.vencimento}T00:00:00`);
  return due.getTime() < today.getTime();
}

function isDueSoon(item: { status: string | null; vencimento: string | null }) {
  if (!item.vencimento || item.status === "pago" || item.status === "cancelado") {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(`${item.vencimento}T00:00:00`);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return diffDays >= 0 && diffDays <= 7;
}

export async function getFinanceiroOptions(): Promise<{
  empresas: EmpresaFinanceiroOption[];
  errorMessage?: string;
}> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      empresas: [],
      errorMessage: "Supabase ainda não configurado.",
    };
  }

  const { data, error } = await supabase
    .from("companies")
    .select("id, razao_social, nome_fantasia, cnpj")
    .eq("status", "ativo")
    .order("criado_em", { ascending: false })
    .limit(300);

  if (error) {
    return {
      empresas: [],
      errorMessage: `Erro ao carregar empresas: ${error.message}`,
    };
  }

  return {
    empresas: (data ?? []).map((empresa) => ({
      id: empresa.id,
      label:
        empresa.nome_fantasia ||
        empresa.razao_social ||
        "Empresa sem nome definido",
      detail: empresa.cnpj ? `CNPJ: ${empresa.cnpj}` : null,
    })),
  };
}

function isRemovedFromList(item: { status?: string | null; motivo_cancelamento?: string | null }) {
  const reason = String(item.motivo_cancelamento || "");
  return reason.includes("[EXCLUIDO_DA_LISTA]") || String(item.status || "").toLowerCase() === "excluido";
}

export async function getFinanceiroData(): Promise<{
  carnes: PaymentBookletItem[];
  charges: FinancialChargeItem[];
  stats: FinanceiroStats;
  errorMessage?: string;
}> {
  const supabase = getSupabaseAdminClient();

  const emptyStats: FinanceiroStats = {
    totalPendente: 0,
    totalPago: 0,
    totalAtrasado: 0,
    quantidadePendente: 0,
    quantidadePago: 0,
    quantidadeAtrasado: 0,
    quantidadeCarnes: 0,
    vencendoEm7Dias: 0,
  };

  if (!supabase) {
    return {
      carnes: [],
      charges: [],
      stats: emptyStats,
      errorMessage:
        "Supabase ainda não configurado. Preencha o .env.local para carregar o financeiro.",
    };
  }

  const { data: carnesRaw, error: carnesError } = await supabase
    .from("payment_booklets")
    .select(
      "id, company_id, titulo, descricao, quantidade_parcelas, valor_parcela, vencimento_primeira, periodicidade, desconto_tipo, desconto_valor, instrucoes_pagamento, observacoes, status, motivo_cancelamento, cancelado_em, criado_em"
    )
    .order("criado_em", { ascending: false })
    .limit(200);

  const { data: chargesRaw, error: chargesError } = await supabase
    .from("financial_charges")
    .select(
      "id, company_id, booklet_id, competencia, descricao, valor, vencimento, status, data_pagamento, valor_pago, forma_pagamento, observacoes, parcela_numero, total_parcelas, numero_controle, desconto_tipo, desconto_valor, valor_com_desconto, instrucoes_pagamento, comprovante_document_id, motivo_cancelamento, cancelado_em, motivo_estorno, estornado_em, criado_em"
    )
    .order("vencimento", { ascending: true })
    .limit(700);

  if (carnesError || chargesError) {
    return {
      carnes: [],
      charges: [],
      stats: emptyStats,
      errorMessage:
        carnesError?.message ||
        chargesError?.message ||
        "Erro ao carregar financeiro.",
    };
  }

  const carnesRows = carnesRaw ?? [];
  const chargeRows = chargesRaw ?? [];

  const companyIds = Array.from(
    new Set([
      ...carnesRows.map((item) => item.company_id).filter(Boolean),
      ...chargeRows.map((item) => item.company_id).filter(Boolean),
    ])
  ) as string[];

  const companyMap = new Map<string, { name: string; document: string | null }>();

  if (companyIds.length > 0) {
    const { data: companies } = await supabase
      .from("companies")
      .select("id, razao_social, nome_fantasia, cnpj")
      .in("id", companyIds);

    for (const company of companies ?? []) {
      companyMap.set(company.id, {
        name:
          company.nome_fantasia ||
          company.razao_social ||
          "Empresa sem nome definido",
        document: company.cnpj ?? null,
      });
    }
  }

  const documentIds = Array.from(
    new Set(
      chargeRows
        .map((item) => item.comprovante_document_id)
        .filter(Boolean)
    )
  ) as string[];

  const documentMap = new Map<string, { url: string | null; name: string | null }>();

  if (documentIds.length > 0) {
    const { data: documents } = await supabase
      .from("documents")
      .select("id, original_name, file_name, drive_web_view_link, drive_web_content_link")
      .in("id", documentIds);

    for (const document of documents ?? []) {
      documentMap.set(document.id, {
        url: document.drive_web_view_link || document.drive_web_content_link || null,
        name: document.original_name || document.file_name || null,
      });
    }
  }

  const carnes = carnesRows.map((item) => {
    const company = item.company_id ? companyMap.get(item.company_id) : null;

    return {
      ...item,
      company_name: company?.name ?? "Empresa não informada",
      company_document: company?.document ?? null,
    };
  }) as PaymentBookletItem[];

  const charges = chargeRows.map((item) => {
    const company = item.company_id ? companyMap.get(item.company_id) : null;
    const document = item.comprovante_document_id
      ? documentMap.get(item.comprovante_document_id)
      : null;

    const status = isOverdue(item) ? "atrasado" : item.status;

    return {
      ...item,
      status,
      company_name: company?.name ?? "Empresa não informada",
      company_document: company?.document ?? null,
      comprovante_url: document?.url ?? null,
      comprovante_nome: document?.name ?? null,
    };
  }) as FinancialChargeItem[];

  const stats = charges.reduce(
    (acc, item) => {
      const value = toNumber(item.valor);

      if (item.status === "pago") {
        acc.totalPago += toNumber(item.valor_pago ?? item.valor);
        acc.quantidadePago += 1;
        return acc;
      }

      if (item.status === "cancelado") {
        return acc;
      }

      if (item.status === "atrasado" || isOverdue(item)) {
        acc.totalAtrasado += value;
        acc.quantidadeAtrasado += 1;
        return acc;
      }

      acc.totalPendente += value;
      acc.quantidadePendente += 1;

      if (isDueSoon(item)) {
        acc.vencendoEm7Dias += 1;
      }

      return acc;
    },
    { ...emptyStats, quantidadeCarnes: carnes.filter((item) => item.status !== "cancelado").length }
  );

  return {
    carnes,
    charges,
    stats,
  };
}