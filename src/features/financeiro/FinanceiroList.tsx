"use client";

import Link from "next/link";
import type {
  FinancialChargeItem,
  PaymentBookletItem,
} from "@/data/rh/financeiro.data";
import { BookOpenCheck, CircleDollarSign, FileDown } from "lucide-react";

function formatCurrency(value: number | null | undefined) {
  const parsed = Number(value ?? 0);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(parsed) ? parsed : 0);
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(new Date(date));
}

function statusLabel(status: string) {
  if (status === "pago") return "Pago";
  if (status === "atrasado") return "Atrasado";
  if (status === "cancelado") return "Cancelado";
  return "Pendente";
}

function statusClass(status: string) {
  if (status === "pago") return "border-green-100 bg-green-50 text-green-700";
  if (status === "atrasado") return "border-red-100 bg-red-50 text-red-700";
  if (status === "cancelado") return "border-slate-200 bg-slate-100 text-slate-600";
  return "border-yellow-100 bg-yellow-50 text-yellow-800";
}

export function CarnesList({ carnes }: { carnes: PaymentBookletItem[] }) {
  return (
    <div className="space-y-3">
      {carnes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-6 text-center">
          <p className="font-black text-blue-950">Nenhum carnê gerado.</p>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Use o formulário para gerar o primeiro carnê.
          </p>
        </div>
      ) : null}

      {carnes.map((carne) => (
        <article
          key={carne.id}
          className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="rounded-xl bg-blue-50 p-2 text-blue-700">
              <BookOpenCheck className="h-5 w-5" />
            </div>
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
              {carne.status || "ativo"}
            </span>
          </div>

          <h3 className="font-black text-blue-950">
            {carne.titulo || "Carnê"}
          </h3>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            {carne.company_name}
          </p>

          <div className="mt-3 grid gap-2 rounded-2xl bg-white p-3 text-sm font-bold text-slate-600 sm:grid-cols-2">
            <p>Parcelas: {carne.quantidade_parcelas || 0}</p>
            <p>Valor: {formatCurrency(carne.valor_parcela)}</p>
            <p>1º vencimento: {formatDate(carne.vencimento_primeira)}</p>
            <p>Desconto: {carne.desconto_tipo || "nenhum"}</p>
          </div>

          <Link
            href={`/rh/financeiro/carnes/${carne.id}/pdf`}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-black text-white hover:bg-blue-800"
          >
            <FileDown className="h-4 w-4" />
            PDF do carnê
          </Link>
        </article>
      ))}
    </div>
  );
}

export function ParcelasList({ charges }: { charges: FinancialChargeItem[] }) {
  return (
    <div className="space-y-3">
      {charges.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-6 text-center">
          <p className="font-black text-blue-950">Nenhuma parcela cadastrada.</p>
        </div>
      ) : null}

      {charges.map((charge) => (
        <article
          key={charge.id}
          className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="rounded-xl bg-blue-50 p-2 text-blue-700">
              <CircleDollarSign className="h-5 w-5" />
            </div>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(charge.status)}`}
            >
              {statusLabel(charge.status)}
            </span>
          </div>

          <h3 className="font-black text-blue-950">{charge.company_name}</h3>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            Controle: {charge.numero_controle || "Não informado"}
          </p>

          <p className="mt-3 text-sm font-bold text-slate-700">
            Parcela {charge.parcela_numero || "-"} de {charge.total_parcelas || "-"} •{" "}
            {charge.descricao || "Mensalidade"}
          </p>

          <div className="mt-3 grid gap-2 rounded-2xl bg-white p-3 text-sm font-bold text-slate-600 sm:grid-cols-2">
            <p>Valor: {formatCurrency(charge.valor)}</p>
            <p>Com desconto: {formatCurrency(charge.valor_com_desconto)}</p>
            <p>Vencimento: {formatDate(charge.vencimento)}</p>
            <p>Pago: {formatCurrency(charge.valor_pago)}</p>
          </div>

          <Link
            href={`/rh/financeiro/${charge.id}/pdf`}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-black text-white hover:bg-blue-800"
          >
            <FileDown className="h-4 w-4" />
            PDF da parcela
          </Link>
        </article>
      ))}
    </div>
  );
}