"use client";

import { EmbeddedDocumentoUploadForm } from "@/features/documentos/EmbeddedDocumentoUploadForm";
import { EmpresaVagasManager } from "@/features/empresas/EmpresaVagasManager";
import { Building2, CheckCircle2, Loader2, Save, Search } from "lucide-react";
import { FormEvent, useRef, useState } from "react";

type AnyEmpresa = Record<string, any>;

function getEmpresaValue(empresa: AnyEmpresa, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = empresa?.[key];

    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return String(value);
    }
  }

  return fallback;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-blue-950">{label}</span>
      {children}
    </label>
  );
}

export function EmpresaForm({
  empresa,
  empresaId,
  defaultValues,
}: {
  empresa?: AnyEmpresa | null;
  empresaId?: string | null;
  defaultValues?: AnyEmpresa | null;
}) {
  const initial = empresa ?? defaultValues ?? {};
  const initialId = empresaId ?? initial?.id ?? null;

  const formRef = useRef<HTMLFormElement | null>(null);
  const [savedEmpresaId, setSavedEmpresaId] = useState<string | null>(initialId);
  const [saving, setSaving] = useState(false);
  const [searchingCnpj, setSearchingCnpj] = useState(false);
  const [searchingCep, setSearchingCep] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function setField(name: string, value: string | null | undefined) {
    const field = formRef.current?.elements.namedItem(name);

    if (field && "value" in field) {
      (field as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value = value || "";
    }
  }

  function getField(name: string) {
    const field = formRef.current?.elements.namedItem(name);

    if (field && "value" in field) {
      return String((field as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value || "");
    }

    return "";
  }

  async function buscarCnpj() {
    const cnpj = getField("cnpj");

    if (!cnpj.trim()) {
      setMessage({
        ok: false,
        text: "Informe o CNPJ para pesquisar.",
      });
      return;
    }

    setSearchingCnpj(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/cnpj?cnpj=${encodeURIComponent(cnpj)}`);
      const result = await response.json();

      if (!result.ok) {
        setMessage({
          ok: false,
          text: result.message || "CNPJ não encontrado.",
        });
        return;
      }

      const empresaApi = result.empresa || result.data || result;

      setField("razao_social", empresaApi.razao_social);
      setField("nome_fantasia", empresaApi.nome_fantasia);
      setField("ramo_atuacao", empresaApi.ramo_atuacao || empresaApi.atividade_principal);
      setField("email", empresaApi.email);
      setField("telefone", empresaApi.telefone);
      setField("cep", empresaApi.cep);
      setField("endereco", empresaApi.logradouro || empresaApi.endereco);
      setField("numero", empresaApi.numero);
      setField("complemento", empresaApi.complemento);
      setField("bairro", empresaApi.bairro);
      setField("cidade", empresaApi.cidade || empresaApi.municipio);
      setField("estado", empresaApi.uf || empresaApi.estado);

      setMessage({
        ok: true,
        text: "Dados do CNPJ carregados. Confira antes de salvar.",
      });
    } finally {
      setSearchingCnpj(false);
    }
  }

  async function buscarCep() {
    const cep = getField("cep");

    if (!cep.trim()) {
      setMessage({
        ok: false,
        text: "Informe o CEP para pesquisar.",
      });
      return;
    }

    setSearchingCep(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/cep?cep=${encodeURIComponent(cep)}`);
      const result = await response.json();

      if (!result.ok) {
        setMessage({
          ok: false,
          text: result.message || "CEP não encontrado.",
        });
        return;
      }

      const endereco = result.endereco || result.data || result;

      setField("endereco", endereco.logradouro);
      setField("bairro", endereco.bairro);
      setField("cidade", endereco.cidade || endereco.localidade);
      setField("estado", endereco.uf || endereco.estado);

      setMessage({
        ok: true,
        text: "Endereço carregado pelo CEP. Confira antes de salvar.",
      });
    } finally {
      setSearchingCep(false);
    }
  }

  async function submitEmpresa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage(null);

    try {
      const formData = new FormData(event.currentTarget);

      if (savedEmpresaId) {
        formData.set("company_id", savedEmpresaId);
      }

      const response = await fetch("/api/rh/empresas/salvar", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      setMessage({
        ok: Boolean(result.ok),
        text: result.message || "Resposta recebida.",
      });

      if (result.ok) {
        setSavedEmpresaId(result.data.id);

        setTimeout(() => {
          const modal = document.querySelector("[role='dialog']");
          if (modal) {
            modal.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }, 80);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid min-w-0 max-w-full gap-6 overflow-x-hidden">
      {message ? (
        <div
          className={`rounded-2xl border p-4 text-sm font-black ${
            message.ok
              ? "border-green-100 bg-green-50 text-green-700"
              : "border-red-100 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {savedEmpresaId ? (
        <div className="rounded-3xl border border-green-100 bg-green-50 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-1 h-6 w-6 text-green-700" />
            <div>
              <h3 className="text-lg font-black text-green-800">
                Empresa salva no sistema
              </h3>
              <p className="mt-1 text-sm font-semibold leading-6 text-green-700">
                Você pode fechar esta janela ou continuar organizando as vagas,
                skills e documentos da empresa abaixo.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <form ref={formRef} onSubmit={submitEmpresa} className="min-w-0 max-w-full overflow-x-hidden rounded-3xl bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <Building2 className="h-8 w-8 text-blue-700" />
          <div>
            <h2 className="text-2xl font-black text-blue-950">
              Dados da empresa
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Salve a empresa primeiro. Depois cadastre as vagas e anexe documentos.
            </p>
          </div>
        </div>

        <input type="hidden" name="company_id" value={savedEmpresaId || ""} />

        <div className="grid min-w-0 max-w-full gap-5">
          <div className="grid min-w-0 max-w-full gap-5 md:grid-cols-[minmax(0,1fr)_auto]">
            <Field label="CNPJ">
              <input
                name="cnpj"
                defaultValue={getEmpresaValue(initial, ["cnpj"])}
                className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
              />
            </Field>

            <button
              type="button"
              onClick={buscarCnpj}
              disabled={searchingCnpj}
              className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-5 text-sm font-black text-blue-700 hover:bg-blue-100 disabled:opacity-70"
            >
              {searchingCnpj ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar CNPJ
            </button>
          </div>

          <div className="grid min-w-0 max-w-full gap-5 md:grid-cols-2">
            <Field label="Razão social">
              <input
                name="razao_social"
                defaultValue={getEmpresaValue(initial, ["razao_social"])}
                className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
              />
            </Field>

            <Field label="Nome fantasia">
              <input
                name="nome_fantasia"
                defaultValue={getEmpresaValue(initial, ["nome_fantasia"])}
                className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
              />
            </Field>
          </div>

          <div className="grid min-w-0 max-w-full gap-5 md:grid-cols-2">
            <Field label="Responsável">
              <input
                name="responsavel_nome"
                defaultValue={getEmpresaValue(initial, ["responsavel_nome", "nome_responsavel", "responsavel"])}
                className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
              />
            </Field>

            <Field label="Ramo de atuação">
              <input
                name="ramo_atuacao"
                defaultValue={getEmpresaValue(initial, ["ramo_atuacao", "atividade_principal"])}
                className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
              />
            </Field>
          </div>

          <div className="grid min-w-0 max-w-full gap-5 md:grid-cols-3">
            <Field label="Telefone">
              <input
                name="telefone"
                defaultValue={getEmpresaValue(initial, ["telefone"])}
                className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
              />
            </Field>

            <Field label="WhatsApp">
              <input
                name="whatsapp"
                defaultValue={getEmpresaValue(initial, ["whatsapp"])}
                className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
              />
            </Field>

            <Field label="E-mail">
              <input
                name="email"
                defaultValue={getEmpresaValue(initial, ["email"])}
                className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
              />
            </Field>
          </div>

          <div className="grid min-w-0 max-w-full gap-5 md:grid-cols-[minmax(0,1fr)_auto]">
            <Field label="CEP">
              <input
                name="cep"
                defaultValue={getEmpresaValue(initial, ["cep"])}
                className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
              />
            </Field>

            <button
              type="button"
              onClick={buscarCep}
              disabled={searchingCep}
              className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-5 text-sm font-black text-blue-700 hover:bg-blue-100 disabled:opacity-70"
            >
              {searchingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar CEP
            </button>
          </div>

          <div className="grid min-w-0 max-w-full gap-5 md:grid-cols-[minmax(0,1fr)_120px]">
            <Field label="Endereço">
              <input
                name="endereco"
                defaultValue={getEmpresaValue(initial, ["endereco", "logradouro"])}
                className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
              />
            </Field>

            <Field label="Número">
              <input
                name="numero"
                defaultValue={getEmpresaValue(initial, ["numero"])}
                className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
              />
            </Field>
          </div>

          <div className="grid min-w-0 max-w-full gap-5 md:grid-cols-4">
            <Field label="Complemento">
              <input
                name="complemento"
                defaultValue={getEmpresaValue(initial, ["complemento"])}
                className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
              />
            </Field>

            <Field label="Bairro">
              <input
                name="bairro"
                defaultValue={getEmpresaValue(initial, ["bairro"])}
                className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
              />
            </Field>

            <Field label="Cidade">
              <input
                name="cidade"
                defaultValue={getEmpresaValue(initial, ["cidade", "municipio"])}
                className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
              />
            </Field>

            <Field label="Estado">
              <input
                name="estado"
                defaultValue={getEmpresaValue(initial, ["estado", "uf"])}
                className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
              />
            </Field>
          </div>

          <div className="grid min-w-0 max-w-full gap-5 md:grid-cols-2">
            <Field label="Valor de bolsa padrão">
              <input
                name="valor_bolsa"
                defaultValue={getEmpresaValue(initial, ["valor_bolsa"])}
                placeholder="Ex.: 600,00"
                className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
              />
            </Field>

            <Field label="Perfil geral desejado">
              <input
                name="perfil_candidato"
                defaultValue={getEmpresaValue(initial, ["perfil_candidato"])}
                placeholder="Resumo geral. As vagas específicas serão cadastradas abaixo."
                className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
              />
            </Field>
          </div>

          <Field label="Observações">
            <textarea
              name="observacoes"
              rows={4}
              defaultValue={getEmpresaValue(initial, ["observacoes"])}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
            />
          </Field>

          <button
            type="submit"
            disabled={saving}
            className="btn-wisdom-red inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-black disabled:opacity-70"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {saving ? "Salvando..." : savedEmpresaId ? "Salvar alterações" : "Salvar empresa"}
          </button>
        </div>
      </form>

      <EmpresaVagasManager companyId={savedEmpresaId} />

      <EmbeddedDocumentoUploadForm
        entityType="empresa"
        entityId={savedEmpresaId}
        title="Documentos da empresa"
        description="Depois de salvar a empresa, anexe cartão CNPJ, contrato social, documentos e outros arquivos."
        defaultCategory="cartao_cnpj"
      />
    </div>
  );
}