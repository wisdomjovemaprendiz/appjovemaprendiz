"use client";

import type { EmpresaFinanceiroOption } from "@/data/rh/financeiro.data";
import { criarCobrancaAction } from "@/actions/rh/financeiro.actions";
import { CalendarDays, Save, WalletCards } from "lucide-react";
import { FormEvent, useState, useTransition } from "react";

export function FinanceiroForm({
  empresas,
}: {
  empresas: EmpresaFinanceiroOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setResultado(null);

    startTransition(async () => {
      const result = await criarCobrancaAction(formData);
      setResultado(result);

      if (result.ok) {
        form.reset();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl bg-white p-7 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-blue-50 p-3">
          <WalletCards className="h-7 w-7 text-blue-700" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-blue-950">Nova cobrança</h2>
          <p className="text-sm font-semibold text-slate-500">
            Registre mensalidades, carnês ou cobranças avulsas.
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
            <span className="text-sm font-black text-blue-950">Competência</span>
            <input
              name="competencia"
              placeholder="Ex: 06/2026"
              className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-blue-950">Vencimento</span>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-blue-700" />
              <input
                name="vencimento"
                required
                type="date"
                className="h-12 w-full rounded-xl border border-slate-200 pl-12 pr-4 text-sm font-bold outline-none focus:border-blue-500"
              />
            </div>
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-black text-blue-950">Descrição</span>
            <input
              name="descricao"
              placeholder="Ex: Mensalidade de estágio"
              className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-blue-950">Valor</span>
            <input
              name="valor"
              required
              placeholder="Ex: 250,00"
              className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
            />
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">Observações</span>
          <textarea
            name="observacoes"
            rows={3}
            placeholder="Informações internas sobre a cobrança."
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
        {isPending ? "Salvando..." : "Salvar cobrança"}
      </button>
    </form>
  );
}