"use client";

import { registrarPdfFinanceiroAction } from "@/actions/rh/financeiro-pdf.actions";
import type {
  FinanceiroPdfData,
  FinanceiroPdfHistoricoItem,
} from "@/data/rh/financeiro-pdf.data";
import { FileDown, Printer, RotateCcw } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

function safe(value: string | number | null | undefined, fallback = "Não informado") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(new Date(date));
}

function formatDateTime(date: string | null | undefined) {
  if (!date) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function formatCurrency(value: number | null | undefined) {
  const parsed = Number(value ?? 0);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(parsed) ? parsed : 0);
}

function slug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function getDocumentTitle(status: string | null | undefined) {
  return status === "pago" ? "Recibo de pagamento" : "Cobrança financeira";
}

function getPdfType(status: string | null | undefined) {
  return status === "pago" ? "financeiro_recibo" : "financeiro_cobranca";
}

export function FinanceiroPdfClient({
  data,
  historico,
}: {
  data: FinanceiroPdfData;
  historico: FinanceiroPdfHistoricoItem[];
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const documentTitle = getDocumentTitle(data.cobranca.status);
  const pdfType = getPdfType(data.cobranca.status);

  const fileName = useMemo(() => {
    const empresa = slug(
      data.empresa?.nome_fantasia || data.empresa?.razao_social || "empresa"
    );
    const competencia = slug(data.cobranca.competencia || "sem-competencia");
    const tipo = data.cobranca.status === "pago" ? "recibo" : "cobranca";
    const date = new Date().toISOString().slice(0, 10);

    return `${tipo}-${empresa}-${competencia}-${date}.pdf`;
  }, [data]);

  function registrarEImprimir() {
    setMessage(null);

    const formData = new FormData();
    formData.set("cobranca_id", data.cobranca.id);
    formData.set("file_name", fileName);
    formData.set("pdf_type", pdfType);
    formData.set("motivo", "Emissão de documento financeiro.");

    startTransition(async () => {
      const result = await registrarPdfFinanceiroAction(formData);
      setMessage(result.message);

      if (result.ok) {
        setTimeout(() => {
          window.print();
        }, 300);
      }
    });
  }

  const empresaEndereco = [
    data.empresa?.endereco,
    data.empresa?.bairro,
    data.empresa?.cidade,
    data.empresa?.estado,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-8">
      <div className="print:hidden rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-2xl font-black text-blue-950">
              Documento financeiro
            </h2>
            <p className="mt-2 leading-7 text-slate-600">
              Registre a emissão e use a impressão do navegador para salvar em PDF.
            </p>
            <p className="mt-2 text-sm font-black text-slate-500">
              Nome sugerido: {fileName}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={registrarEImprimir}
              disabled={isPending}
              className="btn-wisdom-red inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-black disabled:cursor-not-allowed disabled:opacity-70"
            >
              <FileDown className="h-5 w-5" />
              {isPending ? "Registrando..." : "Registrar e imprimir"}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="btn-wisdom-blue inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-black"
            >
              <Printer className="h-5 w-5" />
              Imprimir
            </button>
          </div>
        </div>

        {message ? (
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-black text-blue-800">
            {message}
          </div>
        ) : null}
      </div>

      <section className="print:hidden rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <RotateCcw className="h-7 w-7 text-blue-700" />
          <h2 className="text-2xl font-black text-blue-950">
            Histórico de emissões
          </h2>
        </div>

        {historico.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-5 text-center">
            <p className="font-black text-blue-950">
              Nenhuma emissão registrada para esta cobrança.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {historico.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <p className="font-black text-blue-950">
                  {safe(item.file_name, "Arquivo sem nome")}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Tipo: {safe(item.pdf_type)} • Status: {safe(item.status)}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Emissão: {formatDateTime(item.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <article className="mx-auto max-w-[820px] bg-white p-10 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        <div className="border-b-4 border-blue-900 pb-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <img
                src="/logo-wisdom.png"
                alt="Wisdom"
                className="h-20 w-auto object-contain"
              />
              <p className="mt-3 text-sm font-bold uppercase tracking-[0.18em] text-red-700">
                Financeiro
              </p>
            </div>

            <div className="text-right text-sm font-bold text-slate-600">
              <p>Registro: {data.cobranca.id.slice(0, 8)}</p>
              <p>Status: {safe(data.cobranca.status)}</p>
              <p>Emissão: {formatDate(new Date().toISOString().slice(0, 10))}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <h1 className="text-2xl font-black uppercase text-blue-950">
            {documentTitle}
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Competência: {safe(data.cobranca.competencia)}
          </p>
        </div>

        <section className="mt-8 space-y-5 text-[15px] leading-8 text-slate-800">
          <div className="rounded-2xl border border-slate-200 p-5">
            <h2 className="mb-3 text-lg font-black text-blue-950">
              Empresa
            </h2>
            <p>
              <strong>Razão social:</strong>{" "}
              {safe(data.empresa?.razao_social || data.empresa?.nome_fantasia)}
            </p>
            <p>
              <strong>CNPJ:</strong> {safe(data.empresa?.cnpj)}
            </p>
            <p>
              <strong>Endereço:</strong> {safe(empresaEndereco)}
            </p>
            <p>
              <strong>Responsável:</strong>{" "}
              {safe(data.empresa?.nome_responsavel)}
            </p>
            <p>
              <strong>Contato:</strong> {safe(data.empresa?.telefone)} •{" "}
              {safe(data.empresa?.email)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <h2 className="mb-3 text-lg font-black text-blue-950">
              Dados da cobrança
            </h2>
            <p>
              <strong>Descrição:</strong> {safe(data.cobranca.descricao)}
            </p>
            <p>
              <strong>Competência:</strong> {safe(data.cobranca.competencia)}
            </p>
            <p>
              <strong>Vencimento:</strong> {formatDate(data.cobranca.vencimento)}
            </p>
            <p>
              <strong>Valor:</strong> {formatCurrency(data.cobranca.valor)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <h2 className="mb-3 text-lg font-black text-blue-950">
              Pagamento
            </h2>
            <p>
              <strong>Status:</strong> {safe(data.cobranca.status)}
            </p>
            <p>
              <strong>Valor pago:</strong>{" "}
              {formatCurrency(data.cobranca.valor_pago)}
            </p>
            <p>
              <strong>Data do pagamento:</strong>{" "}
              {formatDate(data.cobranca.data_pagamento)}
            </p>
            <p>
              <strong>Forma de pagamento:</strong>{" "}
              {safe(data.cobranca.forma_pagamento)}
            </p>
          </div>

          {data.cobranca.observacoes ? (
            <div className="rounded-2xl border border-slate-200 p-5">
              <h2 className="mb-3 text-lg font-black text-blue-950">
                Observações
              </h2>
              <p>{data.cobranca.observacoes}</p>
            </div>
          ) : null}
        </section>

        <section className="mt-16 text-center text-[15px] text-slate-800">
          <p>
            Salvador/BA, ____ de __________________________ de ________.
          </p>

          <div className="mx-auto mt-16 max-w-md">
            <div className="border-t border-slate-500 pt-3">
              Responsável financeiro
            </div>
          </div>
        </section>
      </article>
    </div>
  );
}