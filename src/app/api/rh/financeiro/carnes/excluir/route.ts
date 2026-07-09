import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ExcluirCarneBody = {
  id?: string;
  motivo?: string;
};

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return NextResponse.json(
        {
          ok: false,
          message: "Supabase ainda não configurado.",
        },
        { status: 500 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as ExcluirCarneBody;

    const id = String(body.id || "").trim();
    const motivo = String(body.motivo || "").trim();

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          message: "Carnê não informado.",
        },
        { status: 400 },
      );
    }

    if (!motivo) {
      return NextResponse.json(
        {
          ok: false,
          message: "Informe o motivo da exclusão.",
        },
        { status: 400 },
      );
    }

    const { data: carneAnterior, error: carneFindError } = await supabase
      .from("payment_booklets")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (carneFindError) {
      return NextResponse.json(
        {
          ok: false,
          message: "Erro ao localizar carnê: " + carneFindError.message,
        },
        { status: 500 },
      );
    }

    if (!carneAnterior) {
      return NextResponse.json(
        {
          ok: false,
          message: "Carnê não localizado.",
        },
        { status: 404 },
      );
    }

    const { data: parcelasAnteriores, error: parcelasFindError } = await supabase
      .from("financial_charges")
      .select("*")
      .eq("booklet_id", id);

    if (parcelasFindError) {
      return NextResponse.json(
        {
          ok: false,
          message: "Erro ao consultar parcelas do carnê: " + parcelasFindError.message,
        },
        { status: 500 },
      );
    }

    const parcelas = parcelasAnteriores ?? [];

    const temParcelaPaga = parcelas.some((parcela) => {
      return (
        parcela.status === "pago" ||
        Boolean(parcela.data_pagamento) ||
        Number(parcela.valor_pago ?? 0) > 0
      );
    });

    if (temParcelaPaga) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Este carnê possui parcela paga ou baixada. Para preservar o histórico financeiro, use a opção Cancelar em vez de Excluir.",
        },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    const motivoAuditado = `[EXCLUIDO_DA_LISTA] ${motivo}`;

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
      return NextResponse.json(
        {
          ok: false,
          message: "Erro ao excluir carnê da lista: " + carneError.message,
        },
        { status: 500 },
      );
    }

    const { error: parcelasError } = await supabase
      .from("financial_charges")
      .update(payloadParcelas)
      .eq("booklet_id", id);

    if (parcelasError) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Carnê removido da lista, mas houve erro ao remover as parcelas da fila: " +
            parcelasError.message,
        },
        { status: 500 },
      );
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

    return NextResponse.json({
      ok: true,
      id,
      message: "Carnê excluído da lista com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao excluir carnê:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Erro inesperado ao excluir carnê.",
      },
      { status: 500 },
    );
  }
}