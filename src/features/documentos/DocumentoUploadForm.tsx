"use client";

import type { DocumentoOptions } from "@/data/rh/documentos.data";
import { FileText, FileUp, Loader2, UploadCloud, X } from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";

const categories = [
  { value: "documentos_pessoais", label: "Documentos pessoais" },
  { value: "comprovante_residencia", label: "Comprovante de residência" },
  { value: "declaracao_escolar", label: "Declaração escolar" },
  { value: "cartao_cnpj", label: "Cartão CNPJ" },
  { value: "contrato_social", label: "Contrato social" },
  { value: "contrato_assinado", label: "Contrato assinado" },
  { value: "apolice_seguro", label: "Apólice/seguro" },
  { value: "financeiro", label: "Financeiro" },
  { value: "outros", label: "Outros" },
];

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentoUploadForm({ options }: { options: DocumentoOptions }) {
  const [entityType, setEntityType] = useState("estagiario");
  const [files, setFiles] = useState<File[]>([]);
  const [inputKey, setInputKey] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; message: string } | null>(null);

  const entityOptions = useMemo(() => {
    if (entityType === "empresa") return options.empresas;
    if (entityType === "contrato") return options.contratos;
    return options.estagiarios;
  }, [entityType, options]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    setFiles(selected);
  }

  function clearFiles() {
    setFiles([]);
    setInputKey((current) => current + 1);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    if (files.length === 0) {
      setResultado({
        ok: false,
        message: "Selecione pelo menos um arquivo.",
      });
      return;
    }

    formData.delete("files");

    for (const file of files) {
      formData.append("files", file);
    }

    setIsUploading(true);
    setResultado(null);

    try {
      const response = await fetch("/api/rh/documentos/upload", {
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
        setEntityType("estagiario");
        clearFiles();
        window.location.reload();
      }
    } catch (error) {
      setResultado({
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Erro inesperado ao enviar documento.",
      });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl bg-white p-7 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-blue-50 p-3">
          <UploadCloud className="h-7 w-7 text-blue-700" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-blue-950">
            Enviar documentos
          </h2>
          <p className="text-sm font-semibold text-slate-500">
            Selecione o vínculo e anexe um ou mais arquivos.
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

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">Tipo de vínculo</span>
          <select
            name="entity_type"
            value={entityType}
            onChange={(event) => {
              setEntityType(event.target.value);
            }}
            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-500"
          >
            <option value="estagiario">Estagiário</option>
            <option value="empresa">Empresa</option>
            <option value="contrato">Contrato</option>
            <option value="geral">Geral / sem vínculo específico</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">Registro vinculado</span>
          <select
            name="entity_id"
            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
            disabled={entityType === "geral"}
          >
            <option value="">Selecione</option>
            {entityOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
                {item.detail ? ` — ${item.detail}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 lg:col-span-2">
          <span className="text-sm font-black text-blue-950">Categoria</span>
          <select
            name="category"
            defaultValue="documentos_pessoais"
            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-500"
          >
            {categories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <div className="lg:col-span-2">
          <span className="mb-2 block text-sm font-black text-blue-950">
            Arquivos
          </span>

          <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 px-6 py-8 text-center hover:border-blue-400 hover:bg-blue-50">
            <FileUp className="mb-3 h-8 w-8 text-blue-700" />
            <span className="text-base font-black text-blue-950">
              Clique para selecionar os arquivos
            </span>
            <span className="mt-1 text-sm font-semibold text-slate-500">
              PDF, JPEG ou PNG. Limite de 8 MB por arquivo.
            </span>
            <input
              key={inputKey}
              name="files"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>

          {files.length > 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-black text-blue-950">
                  {files.length} arquivo{files.length > 1 ? "s" : ""} selecionado{files.length > 1 ? "s" : ""}
                </p>

                <button
                  type="button"
                  onClick={clearFiles}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
                >
                  <X className="h-4 w-4" />
                  Limpar
                </button>
              </div>

              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                    className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-blue-700" />
                      <span className="truncate text-sm font-bold text-slate-700">
                        {file.name}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs font-black text-slate-500">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <button
        type="submit"
        disabled={isUploading}
        className="btn-wisdom-red inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-black disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isUploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <FileUp className="h-5 w-5" />
        )}
        {isUploading ? "Enviando..." : "Enviar documentos"}
      </button>
    </form>
  );
}