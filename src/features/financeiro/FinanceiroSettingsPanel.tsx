"use client";

import type { FinancialSettings } from "@/data/rh/financeiro-settings.data";
import { FileImage, Save, Settings } from "lucide-react";
import { FormEvent, useState } from "react";

export function FinanceiroSettingsPanel({
  settings,
}: {
  settings: FinancialSettings;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    setResultado(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/rh/financeiro/configuracoes", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      setResultado({
        ok: Boolean(data.ok),
        message: data.message || "Resposta recebida.",
      });

      if (data.ok) {
        window.location.reload();
      }
    } catch (error) {
      setResultado({
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao salvar configurações.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl bg-blue-50 p-3">
            <Settings className="h-6 w-6 text-blue-700" />
          </div>
          <div>
            <h3 className="text-xl font-black text-blue-950">
              Instruções padrão
            </h3>
            <p className="text-sm font-semibold text-slate-500">
              Este texto será carregado automaticamente ao gerar novos carnês.
            </p>
          </div>
        </div>

        {resultado ? (
          <div
            className={`mb-5 rounded-2xl border p-4 text-sm font-black ${
              resultado.ok
                ? "border-green-100 bg-green-50 text-green-700"
                : "border-red-100 bg-red-50 text-red-700"
            }`}
          >
            {resultado.message}
          </div>
        ) : null}

        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">
            Mensagem padrão de pagamento
          </span>
          <textarea
            name="instrucoes_pagamento_padrao"
            rows={6}
            defaultValue={settings.instrucoes_pagamento_padrao ?? ""}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
          />
        </label>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-black text-blue-950">
              Recebedor Pix
            </span>
            <input
              name="pix_recebedor_nome"
              defaultValue={settings.pix_recebedor_nome ?? ""}
              placeholder="Nome do recebedor"
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-500"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-blue-950">
              Chave Pix
            </span>
            <input
              name="pix_chave"
              defaultValue={settings.pix_chave ?? ""}
              placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
              className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-500"
            />
          </label>
        </div>

        <label className="mt-5 grid gap-2">
          <span className="text-sm font-black text-blue-950">
            Observações sobre Pix
          </span>
          <textarea
            name="pix_observacoes"
            rows={3}
            defaultValue={settings.pix_observacoes ?? ""}
            placeholder="Ex: enviar comprovante após o pagamento."
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
          />
        </label>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl bg-blue-50 p-3">
            <FileImage className="h-6 w-6 text-blue-700" />
          </div>
          <div>
            <h3 className="text-xl font-black text-blue-950">
              QR Code Pix
            </h3>
            <p className="text-sm font-semibold text-slate-500">
              Imagem usada nos PDFs dos carnês.
            </p>
          </div>
        </div>

        {settings.pix_qrcode_url ? (
          <div className="mb-5 rounded-2xl border border-green-100 bg-green-50 p-4">
            <p className="text-sm font-black text-green-800">
              QR Code cadastrado
            </p>
            <p className="mt-1 truncate text-xs font-semibold text-green-700">
              {settings.pix_qrcode_file_name || "Arquivo sem nome"}
            </p>
            <a
              href={settings.pix_qrcode_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex rounded-xl bg-green-600 px-4 py-2 text-sm font-black text-white hover:bg-green-700"
            >
              Abrir arquivo
            </a>
          </div>
        ) : (
          <div className="mb-5 rounded-2xl border border-yellow-100 bg-yellow-50 p-4 text-sm font-black text-yellow-800">
            Nenhum QR Code cadastrado.
          </div>
        )}

        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">
            Nova imagem do QR Code
          </span>
          <input
            name="pix_qrcode"
            type="file"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-black file:text-blue-700"
          />
          <span className="text-xs font-bold text-slate-500">
            Formatos aceitos: JPEG e PNG. Limite: 3 MB.
          </span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-wisdom-red mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-black disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Save className="h-5 w-5" />
          {isSubmitting ? "Salvando..." : "Salvar configurações"}
        </button>
      </section>
    </form>
  );
}