"use client";

import type { EmpresaFinanceiroOption } from "@/data/rh/financeiro.data";
import { criarCarneAction } from "@/actions/rh/financeiro.actions";
import { BookOpenCheck, CalendarDays, Save } from "lucide-react";
import { FormEvent, useState, useTransition } from "react";

export function CarneForm({
  empresas,
  defaultInstructions,
}: {
  empresas: EmpresaFinanceiroOption[];
  defaultInstructions?: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setResultado(null);

    startTransition(async () => {
      const result = await criarCarneAction(formData);
      setResultado(result);

      if (result.ok) {
        form.reset();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-blue-50 p-3">
          <BookOpenCheck className="h-7 w-7 text-blue-700" />
        </div>
        <div>
          <h3 className="text-xl font-black text-blue-950">Dados do carnê</h3>
          <p className="text-sm font-semibold text-slate-500">
            Defina empresa, parcelas, vencimentos e instruções.
          </p>
        </div>
      </div>

      {resultado ? (
        <div
          className={`rounded-2xl border p-4 text-sm font-black ${
            resultado.ok
              ? "border-green-100 bg-green-50 text-green-700"
              : "border-red-100 bg-red-50 text-red-700"
          }`}
        >
          {resultado.message}
        </div>
      ) : null}

      <div className="grid gap-5">
        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">Empresa</span>
          <select
            name="company_id"
            required
            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-500"
          >
            <option value="">Selecione</option>
            {empresas.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.label}
                {empresa.detail ? ` — ${empresa.detail}` : ""}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-black text-blue-950">Título</span>
            <input
              name="titulo"
              defaultValue="Carnê de mensalidades"
              className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-blue-950">Descrição das parcelas</span>
            <input
              name="descricao"
              defaultValue="Mensalidade de estágio"
              className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
            />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <label className="grid gap-2">
            <span className="text-sm font-black text-blue-950">Quantidade</span>
            <input
              name="quantidade_parcelas"
              required
              type="number"
              min="1"
              max="36"
              defaultValue="3"
              className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-blue-950">Valor da parcela</span>
            <input
              name="valor_parcela"
              required
              placeholder="Ex: 250,00"
              className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-blue-950">1º vencimento</span>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-blue-700" />
              <input
                name="vencimento_primeira"
                required
                type="date"
                className="h-12 w-full rounded-xl border border-slate-200 pl-12 pr-4 text-sm font-bold outline-none focus:border-blue-500"
              />
            </div>
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-black text-blue-950">Condição para pagamento em dia</span>
            <select
              name="desconto_tipo"
              defaultValue="nenhum"
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-500"
            >
              <option value="nenhum">Sem desconto</option>
              <option value="valor">Desconto em valor</option>
              <option value="percentual">Desconto percentual</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-blue-950">Valor do desconto</span>
            <input
              name="desconto_valor"
              placeholder="Ex: 10,00 ou 5"
              className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
            />
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">Instruções de pagamento</span>
          <textarea
            name="instrucoes_pagamento"
            rows={4}
            defaultValue={
              defaultInstructions ||
              "Efetuar o pagamento até a data de vencimento. Após o pagamento, enviar o comprovante para conferência e baixa."
            }
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">Observações internas</span>
          <textarea
            name="observacoes"
            rows={3}
            placeholder="Informações internas sobre este carnê."
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="btn-wisdom-red inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-black disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Save className="h-5 w-5" />
        {isPending ? "Gerando..." : "Gerar carnê"}
      </button>
    </form>
  );
}