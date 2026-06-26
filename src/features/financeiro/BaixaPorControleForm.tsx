"use client";

import { CheckCircle2, FileUp, SearchCheck } from "lucide-react";
import { FormEvent, useState } from "react";

export function BaixaPorControleForm({
  initialControle = "",
}: {
  initialControle?: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setResultado(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/rh/financeiro/baixa-comprovante", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      setResultado({
        ok: Boolean(data.ok),
        message: data.message || "Resposta recebida.",
      });

      if (data.ok) {
        form.reset();
        window.location.reload();
      }
    } catch (error) {
      setResultado({
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao registrar baixa.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-green-50 p-3">
          <SearchCheck className="h-7 w-7 text-green-700" />
        </div>
        <div>
          <h3 className="text-xl font-black text-blue-950">Registrar baixa</h3>
          <p className="text-sm font-semibold text-slate-500">
            Informe o controle da folha e, se houver, anexe o comprovante.
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

      <div className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">Número de controle</span>
          <input
            name="numero_controle"
            required
            defaultValue={initialControle}
            placeholder="Ex: CW-2026-123456-ABCDEF-01"
            className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold uppercase outline-none focus:border-blue-500"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-black text-blue-950">Valor pago</span>
            <input
              name="valor_pago"
              required
              placeholder="Ex: 250,00"
              className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-blue-950">Data do pagamento</span>
            <input
              name="data_pagamento"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-black text-blue-950">Forma de pagamento</span>
            <select
              name="forma_pagamento"
              defaultValue="Pix"
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-500"
            >
              <option value="Pix">Pix</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Cartão">Cartão</option>
              <option value="Transferência">Transferência</option>
              <option value="Boleto">Boleto</option>
              <option value="Outro">Outro</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-blue-950">Observação</span>
            <input
              name="observacoes"
              placeholder="Ex: comprovante recebido"
              className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-blue-500"
            />
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">Comprovante de pagamento</span>
          <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <FileUp className="h-6 w-6 text-blue-700" />
                <div>
                  <p className="font-black text-blue-950">Anexar comprovante</p>
                  <p className="text-sm font-semibold text-slate-500">
                    PDF, JPEG ou PNG. Limite de 8 MB.
                  </p>
                </div>
              </div>
              <input
                name="comprovante"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                className="max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-black file:text-blue-700"
              />
            </div>
          </div>
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-4 font-black text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <CheckCircle2 className="h-5 w-5" />
        {isSubmitting ? "Registrando..." : "Registrar baixa"}
      </button>
    </form>
  );
}