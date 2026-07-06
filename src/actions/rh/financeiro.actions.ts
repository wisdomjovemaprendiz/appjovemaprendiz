"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient, supabaseConfigMissingMessage } from "@/lib/supabase/server";
import { emptyToNull, numberOrNull, type ActionResult } from "./action-utils";

function parseMoney(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();

  return numberOrNull(normalized);
}

function addMonths(dateString: string, months: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, day));
  return date.toISOString().slice(0, 10);
}

function competenciaFromDate(dateString: string) {
  const [year, month] = dateString.split("-");
  return `${month}/${year}`;
}

function onlyDigits(value: string | null | undefined) {
  return String(value || "").replace(/\D/g, "");
}

type FinanceiroCompanyLookup = {
  cnpj: string | null;
  razao_social: string | null;
  nome_fantasia: string | null;
};

function calculateDiscountedValue({
  valor,
  descontoTipo,
  descontoValor,
}: {
  valor: number;
  descontoTipo: string;
  descontoValor: number | null;
}) {
  if (!descontoValor || descontoValor <= 0 || descontoTipo === "nenhum") {
    return null;
  }

  if (descontoTipo === "percentual") {
    const result = valor - valor * (descontoValor / 100);
    return Math.max(0, Number(result.toFixed(2)));
  }

  if (descontoTipo === "valor") {
    return Math.max(0, Number((valor - descontoValor).toFixed(2)));
  }

  return null;
}

export async function criarCarneAction(formData: FormData): Promise<ActionResult> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      ok: false,
      message: supabaseConfigMissingMessage(),
    };
  }

  const companyId = emptyToNull(formData.get("company_id"));
  const titulo = emptyToNull(formData.get("titulo")) || "Carnê de mensalidades";
  const descricao = emptyToNull(formData.get("descricao")) || "Mensalidade de estágio";
  const quantidadeParcelas = Number(formData.get("quantidade_parcelas") ?? 1);
  const valorParcela = parseMoney(formData.get("valor_parcela"));
  const vencimentoPrimeira = emptyToNull(formData.get("vencimento_primeira"));
  const vencimentoPrimeiraTexto = String(vencimentoPrimeira ?? "").trim();
  const descontoTipo = emptyToNull(formData.get("desconto_tipo")) || "nenhum";
  const descontoValor = parseMoney(formData.get("desconto_valor"));
  const instrucoesPagamento =
    emptyToNull(formData.get("instrucoes_pagamento")) ||
    "Efetuar o pagamento até a data de vencimento. Após o pagamento, enviar o comprovante para conferência e baixa.";
  const observacoes = emptyToNull(formData.get("observacoes"));

  if (!companyId) {
    return {
      ok: false,
      message: "Selecione a empresa.",
    };
  }

  if (!Number.isFinite(quantidadeParcelas) || quantidadeParcelas < 1 || quantidadeParcelas > 36) {
    return {
      ok: false,
      message: "Informe uma quantidade de parcelas entre 1 e 36.",
    };
  }

  if (!valorParcela || valorParcela <= 0) {
    return {
      ok: false,
      message: "Informe o valor da parcela.",
    };
  }

  if (!vencimentoPrimeira) {
    return {
      ok: false,
      message: "Informe o primeiro vencimento.",
    };
  }

  const { data: company } = await supabase
    .from("companies")
    .select("cnpj, razao_social, nome_fantasia")
    .eq("id", companyId)
    .maybeSingle();

  const bookletPayload = {
    company_id: companyId,
    titulo,
    descricao,
    quantidade_parcelas: quantidadeParcelas,
    valor_parcela: valorParcela,
    vencimento_primeira: vencimentoPrimeira,
    periodicidade: "mensal",
    desconto_tipo: descontoTipo,
    desconto_valor: descontoValor,
    instrucoes_pagamento: instrucoesPagamento,
    observacoes,
    status: "ativo",
  };

  const { data: booklet, error: bookletError } = await supabase
    .from("payment_booklets")
    .insert(bookletPayload)
    .select("id")
    .single();

  if (bookletError || !booklet) {
    return {
      ok: false,
      message: `Erro ao criar carnê: ${bookletError?.message || "registro não retornado"}`,
    };
  }

  const year = new Date().getFullYear();
  const companyCode = onlyDigits((company as FinanceiroCompanyLookup | null)?.cnpj).slice(-6) || String(companyId).slice(0, 6).toUpperCase();
  const bookletCode = booklet.id.slice(0, 6).toUpperCase();

  const parcelas = Array.from({ length: quantidadeParcelas }).map((_, index) => {
    const parcelaNumero = index + 1;
    const vencimento = addMonths(vencimentoPrimeiraTexto, index);
    const numeroControle = `CW-${year}-${companyCode}-${bookletCode}-${String(parcelaNumero).padStart(2, "0")}`;
    const valorComDesconto = calculateDiscountedValue({
      valor: Number(valorParcela || 0),
      descontoTipo: String(descontoTipo || ""),
      descontoValor: Number(descontoValor || 0),
    });

    return {
      company_id: companyId,
      booklet_id: booklet.id,
      competencia: competenciaFromDate(vencimento),
      descricao,
      valor: valorParcela,
      vencimento,
      status: "pendente",
      parcela_numero: parcelaNumero,
      total_parcelas: quantidadeParcelas,
      numero_controle: numeroControle,
      desconto_tipo: descontoTipo,
      desconto_valor: descontoValor,
      valor_com_desconto: valorComDesconto,
      instrucoes_pagamento: instrucoesPagamento,
      observacoes,
    };
  });

  const { error: parcelasError } = await supabase
    .from("financial_charges")
    .insert(parcelas);

  if (parcelasError) {
    return {
      ok: false,
      message: `Carnê criado, mas houve erro ao gerar parcelas: ${parcelasError.message}`,
    };
  }

  await supabase.from("audit_logs").insert({
    acao: "criou_carne_financeiro",
    tabela: "payment_booklets",
    entity_type: "financeiro",
    entity_id: booklet.id,
    valor_novo: {
      carne: bookletPayload,
      parcelas,
    },
    motivo: "Carnê gerado pelo painel financeiro.",
  });

  revalidatePath("/rh/financeiro");
  revalidatePath("/rh");

  return {
    ok: true,
    id: booklet.id,
    message: `${quantidadeParcelas} parcela(s) gerada(s) com sucesso.`,
  };
}

export async function baixarPagamentoPorControleAction(formData: FormData): Promise<ActionResult> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      ok: false,
      message: supabaseConfigMissingMessage(),
    };
  }

  const numeroControle = emptyToNull(formData.get("numero_controle"));
  const valorPago = parseMoney(formData.get("valor_pago"));
  const dataPagamento =
    emptyToNull(formData.get("data_pagamento")) ||
    new Date().toISOString().slice(0, 10);
  const formaPagamento = emptyToNull(formData.get("forma_pagamento"));
  const observacoes = emptyToNull(formData.get("observacoes"));

  if (!numeroControle) {
    return {
      ok: false,
      message: "Informe o número de controle da parcela.",
    };
  }

  if (!valorPago || valorPago <= 0) {
    return {
      ok: false,
      message: "Informe o valor pago.",
    };
  }

  const { data: charge, error: chargeError } = await supabase
    .from("financial_charges")
    .select("*")
    .eq("numero_controle", numeroControle)
    .maybeSingle();

  if (chargeError || !charge) {
    return {
      ok: false,
      message: "Parcela não localizada pelo número de controle.",
    };
  }

  if (charge.status === "pago") {
    return {
      ok: false,
      message: "Esta parcela já está marcada como paga.",
    };
  }

  if (charge.status === "cancelado") {
    return {
      ok: false,
      message: "Esta parcela está cancelada.",
    };
  }

  const paymentPayload = {
    charge_id: charge.id,
    company_id: charge.company_id,
    valor_pago: valorPago,
    data_pagamento: dataPagamento,
    forma_pagamento: formaPagamento,
    observacoes,
    status: "confirmado",
  };

  const { error: paymentError } = await supabase
    .from("payments")
    .insert(paymentPayload);

  if (paymentError) {
    return {
      ok: false,
      message: `Erro ao registrar pagamento: ${paymentError.message}`,
    };
  }

  const chargePayload = {
    status: "pago",
    valor_pago: valorPago,
    data_pagamento: dataPagamento,
    forma_pagamento: formaPagamento,
    observacoes,
  };

  const { error: updateError } = await supabase
    .from("financial_charges")
    .update(chargePayload)
    .eq("id", charge.id);

  if (updateError) {
    return {
      ok: false,
      message: `Pagamento registrado, mas houve erro ao atualizar parcela: ${updateError.message}`,
    };
  }

  await supabase.from("audit_logs").insert({
    acao: "baixou_parcela_carne",
    tabela: "financial_charges",
    entity_type: "financeiro",
    entity_id: charge.id,
    valor_anterior: charge,
    valor_novo: {
      pagamento: paymentPayload,
      parcela: chargePayload,
    },
    motivo: observacoes || "Baixa de parcela por número de controle.",
  });

  revalidatePath("/rh/financeiro");
  revalidatePath("/rh");

  return {
    ok: true,
    id: charge.id,
    message: "Pagamento baixado com sucesso.",
  };
}

export async function editarParcelaFinanceiraAction(formData: FormData): Promise<ActionResult> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      ok: false,
      message: supabaseConfigMissingMessage(),
    };
  }

  const id = String(formData.get("id") ?? "");
  const motivo = String(formData.get("motivo") ?? "").trim();
  const valor = parseMoney(formData.get("valor"));
  const vencimento = emptyToNull(formData.get("vencimento"));
  const descricao = emptyToNull(formData.get("descricao"));
  const descontoTipo = emptyToNull(formData.get("desconto_tipo")) || "nenhum";
  const descontoValor = parseMoney(formData.get("desconto_valor"));
  const instrucoesPagamento = emptyToNull(formData.get("instrucoes_pagamento"));
  const observacoes = emptyToNull(formData.get("observacoes"));

  if (!id) {
    return {
      ok: false,
      message: "Parcela não informada.",
    };
  }

  if (!motivo) {
    return {
      ok: false,
      message: "Informe o motivo da alteração.",
    };
  }

  if (!valor || valor <= 0) {
    return {
      ok: false,
      message: "Informe um valor válido.",
    };
  }

  if (!vencimento) {
    return {
      ok: false,
      message: "Informe o vencimento.",
    };
  }

  const { data: anterior } = await supabase
    .from("financial_charges")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!anterior) {
    return {
      ok: false,
      message: "Parcela não localizada.",
    };
  }

  if (anterior.status === "pago") {
    return {
      ok: false,
      message: "Não é possível editar uma parcela paga. Estorne a baixa antes.",
    };
  }

  const valorComDesconto = calculateDiscountedValue({
    valor: Number(valor || 0),
    descontoTipo: String(descontoTipo || ""),
    descontoValor: Number(descontoValor || 0),
  });

  const payload = {
    descricao,
    valor,
    vencimento,
    desconto_tipo: descontoTipo,
    desconto_valor: descontoValor,
    valor_com_desconto: valorComDesconto,
    instrucoes_pagamento: instrucoesPagamento,
    observacoes,
  };

  const { error } = await supabase
    .from("financial_charges")
    .update(payload)
    .eq("id", id);

  if (error) {
    return {
      ok: false,
      message: `Erro ao editar parcela: ${error.message}`,
    };
  }

  await supabase.from("audit_logs").insert({
    acao: "editou_parcela_carne",
    tabela: "financial_charges",
    entity_type: "financeiro",
    entity_id: id,
    valor_anterior: anterior,
    valor_novo: payload,
    motivo,
  });

  revalidatePath("/rh/financeiro");
  revalidatePath("/rh");

  return {
    ok: true,
    id,
    message: "Parcela atualizada com sucesso.",
  };
}

export async function cancelarParcelaFinanceiraAction(formData: FormData): Promise<ActionResult> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      ok: false,
      message: supabaseConfigMissingMessage(),
    };
  }

  const id = String(formData.get("id") ?? "");
  const motivo = String(formData.get("motivo") ?? "").trim();

  if (!id) {
    return {
      ok: false,
      message: "Parcela não informada.",
    };
  }

  if (!motivo) {
    return {
      ok: false,
      message: "Informe o motivo do cancelamento.",
    };
  }

  const { data: anterior } = await supabase
    .from("financial_charges")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!anterior) {
    return {
      ok: false,
      message: "Parcela não localizada.",
    };
  }

  if (anterior.status === "pago") {
    return {
      ok: false,
      message: "Não é possível cancelar uma parcela paga. Estorne a baixa antes.",
    };
  }

  const payload = {
    status: "cancelado",
    motivo_cancelamento: motivo,
    cancelado_em: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("financial_charges")
    .update(payload)
    .eq("id", id);

  if (error) {
    return {
      ok: false,
      message: `Erro ao cancelar parcela: ${error.message}`,
    };
  }

  await supabase.from("audit_logs").insert({
    acao: "cancelou_parcela_carne",
    tabela: "financial_charges",
    entity_type: "financeiro",
    entity_id: id,
    valor_anterior: anterior,
    valor_novo: payload,
    motivo,
  });

  revalidatePath("/rh/financeiro");
  revalidatePath("/rh");

  return {
    ok: true,
    id,
    message: "Parcela cancelada com sucesso.",
  };
}

export async function cancelarCarneFinanceiroAction(formData: FormData): Promise<ActionResult> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      ok: false,
      message: supabaseConfigMissingMessage(),
    };
  }

  const id = String(formData.get("id") ?? "");
  const motivo = String(formData.get("motivo") ?? "").trim();

  if (!id) {
    return {
      ok: false,
      message: "Carnê não informado.",
    };
  }

  if (!motivo) {
    return {
      ok: false,
      message: "Informe o motivo do cancelamento.",
    };
  }

  const { data: carneAnterior } = await supabase
    .from("payment_booklets")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!carneAnterior) {
    return {
      ok: false,
      message: "Carnê não localizado.",
    };
  }

  const payloadCarne = {
    status: "cancelado",
    motivo_cancelamento: motivo,
    cancelado_em: new Date().toISOString(),
  };

  const { error: carneError } = await supabase
    .from("payment_booklets")
    .update(payloadCarne)
    .eq("id", id);

  if (carneError) {
    return {
      ok: false,
      message: `Erro ao cancelar carnê: ${carneError.message}`,
    };
  }

  const { data: parcelasAnteriores } = await supabase
    .from("financial_charges")
    .select("*")
    .eq("booklet_id", id)
    .neq("status", "pago");

  const payloadParcelas = {
    status: "cancelado",
    motivo_cancelamento: motivo,
    cancelado_em: new Date().toISOString(),
  };

  const { error: parcelasError } = await supabase
    .from("financial_charges")
    .update(payloadParcelas)
    .eq("booklet_id", id)
    .neq("status", "pago");

  if (parcelasError) {
    return {
      ok: false,
      message: `Carnê cancelado, mas houve erro ao cancelar parcelas pendentes: ${parcelasError.message}`,
    };
  }

  await supabase.from("audit_logs").insert({
    acao: "cancelou_carne_financeiro",
    tabela: "payment_booklets",
    entity_type: "financeiro",
    entity_id: id,
    valor_anterior: {
      carne: carneAnterior,
      parcelas: parcelasAnteriores,
    },
    valor_novo: {
      carne: payloadCarne,
      parcelas: payloadParcelas,
    },
    motivo,
  });

  revalidatePath("/rh/financeiro");
  revalidatePath("/rh");

  return {
    ok: true,
    id,
    message: "Carnê cancelado com sucesso. Parcelas pagas foram preservadas.",
  };
}

export async function excluirCarneFinanceiroAction(formData: FormData): Promise<ActionResult> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      ok: false,
      message: supabaseConfigMissingMessage(),
    };
  }

  const id = String(formData.get("id") ?? "");
  const motivo = String(formData.get("motivo") ?? "").trim();

  if (!id) {
    return {
      ok: false,
      message: "Carnê não informado.",
    };
  }

  if (!motivo) {
    return {
      ok: false,
      message: "Informe o motivo da exclusão.",
    };
  }

  const { data: carneAnterior } = await supabase
    .from("payment_booklets")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!carneAnterior) {
    return {
      ok: false,
      message: "Carnê não localizado.",
    };
  }

  const { data: parcelasAnteriores, error: parcelasFindError } = await supabase
    .from("financial_charges")
    .select("*")
    .eq("booklet_id", id);

  if (parcelasFindError) {
    return {
      ok: false,
      message: "Erro ao consultar parcelas do carnê: " + parcelasFindError.message,
    };
  }

  const parcelas = parcelasAnteriores ?? [];
  const temParcelaPaga = parcelas.some((parcela) =>
    parcela.status === "pago" ||
    Boolean(parcela.data_pagamento) ||
    Number(parcela.valor_pago ?? 0) > 0
  );

  if (temParcelaPaga) {
    return {
      ok: false,
      message: "Este carnê possui parcela paga ou baixada. Para preservar o histórico financeiro, use a opção Cancelar em vez de Excluir.",
    };
  }

  const now = new Date().toISOString();
  const marker = "[EXCLUIDO_DA_LISTA]";
  const motivoAuditado = marker + " " + motivo;

  const payloadCarne = {
    status: "cancelado",
    motivo_cancelamento: motivoAuditado,
    cancelado_em: now,
  };

  const payloadParcelas = {
    status: "cancelado",
    motivo_cancelamento: motivoAuditado,
    cancelado_em: now,
  };

  const { error: carneError } = await supabase
    .from("payment_booklets")
    .update(payloadCarne)
    .eq("id", id);

  if (carneError) {
    return {
      ok: false,
      message: "Erro ao excluir carnê da lista: " + carneError.message,
    };
  }

  const { error: parcelasError } = await supabase
    .from("financial_charges")
    .update(payloadParcelas)
    .eq("booklet_id", id);

  if (parcelasError) {
    return {
      ok: false,
      message: "Carnê removido da lista, mas houve erro ao remover as parcelas da fila: " + parcelasError.message,
    };
  }

  await supabase.from("audit_logs").insert({
    acao: "excluiu_carne_da_lista",
    tabela: "payment_booklets",
    entity_type: "financeiro",
    entity_id: id,
    valor_anterior: {
      carne: carneAnterior,
      parcelas,
    },
    valor_novo: {
      carne: payloadCarne,
      parcelas: payloadParcelas,
    },
    motivo,
  });

  revalidatePath("/rh/financeiro");
  revalidatePath("/rh");

  return {
    ok: true,
    id,
    message: "Carnê excluído da lista com sucesso.",
  };
}

export async function estornarBaixaFinanceiraAction(formData: FormData): Promise<ActionResult> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      ok: false,
      message: supabaseConfigMissingMessage(),
    };
  }

  const id = String(formData.get("id") ?? "");
  const motivo = String(formData.get("motivo") ?? "").trim();

  if (!id) {
    return {
      ok: false,
      message: "Parcela não informada.",
    };
  }

  if (!motivo) {
    return {
      ok: false,
      message: "Informe o motivo do estorno.",
    };
  }

  const { data: anterior } = await supabase
    .from("financial_charges")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!anterior) {
    return {
      ok: false,
      message: "Parcela não localizada.",
    };
  }

  if (anterior.status !== "pago") {
    return {
      ok: false,
      message: "Apenas parcelas pagas podem ser estornadas.",
    };
  }

  const now = new Date().toISOString();

  await supabase
    .from("payments")
    .update({
      status: "estornado",
      motivo_estorno: motivo,
      estornado_em: now,
    })
    .eq("charge_id", id)
    .eq("status", "confirmado");

  const payload = {
    status: "pendente",
    valor_pago: null,
    data_pagamento: null,
    forma_pagamento: null,
    motivo_estorno: motivo,
    estornado_em: now,
  };

  const { error } = await supabase
    .from("financial_charges")
    .update(payload)
    .eq("id", id);

  if (error) {
    return {
      ok: false,
      message: `Erro ao estornar baixa: ${error.message}`,
    };
  }

  await supabase.from("audit_logs").insert({
    acao: "estornou_baixa_financeira",
    tabela: "financial_charges",
    entity_type: "financeiro",
    entity_id: id,
    valor_anterior: anterior,
    valor_novo: payload,
    motivo,
  });

  revalidatePath("/rh/financeiro");
  revalidatePath("/rh");

  return {
    ok: true,
    id,
    message: "Baixa estornada com sucesso.",
  };
}

/**
 * Compatibilidade temporária:
 * Algumas telas antigas ainda importam criarCobrancaAction.
 * A ação oficial atual é criarCarneAction.
 */
export const criarCobrancaAction = criarCarneAction;
