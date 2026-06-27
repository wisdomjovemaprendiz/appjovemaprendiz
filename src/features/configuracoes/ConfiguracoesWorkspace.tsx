"use client";

import type {
  RhOrganizationSettings,
  SystemCatalogItem,
} from "@/data/rh/configuracoes.data";
import {
  Archive,
  Building2,
  CheckCircle2,
  FileText,
  GraduationCap,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

type Tab =
  | "dados"
  | "marca"
  | "instituicoes"
  | "seguradoras"
  | "documentos"
  | "contratos";

const catalogMap: Record<Exclude<Tab, "dados" | "marca">, string> = {
  instituicoes: "educational_institution",
  seguradoras: "insurance_provider",
  documentos: "document_category",
  contratos: "contract_model",
};

function labelForType(type: string) {
  if (type === "educational_institution") return "Instituição de ensino";
  if (type === "insurance_provider") return "Seguradora";
  if (type === "document_category") return "Tipo de documento";
  if (type === "contract_model") return "Modelo de contrato";
  return "Item";
}

function messageClass(ok: boolean) {
  return ok
    ? "border-green-100 bg-green-50 text-green-700"
    : "border-red-100 bg-red-50 text-red-700";
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-black ${
        status === "ativo"
          ? "border-green-100 bg-green-50 text-green-700"
          : "border-slate-200 bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

function AssetUploadForm({
  type,
  title,
}: {
  type: "logo" | "assinatura";
  title: string;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData(event.currentTarget);
      formData.set("asset_type", type);

      const response = await fetch("/api/rh/configuracoes/asset-upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      setMessage({
        ok: Boolean(result.ok),
        text: result.message || "Resposta recebida.",
      });

      if (result.ok) {
        event.currentTarget.reset();
        window.location.reload();
      }
    } catch (error) {
      setMessage({
        ok: false,
        text: error instanceof Error ? error.message : "Erro inesperado ao enviar arquivo.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
      <h3 className="font-black text-blue-950">{title}</h3>

      {message ? (
        <div className={`mt-4 rounded-2xl border p-4 text-sm font-black ${messageClass(message.ok)}`}>
          {message.text}
        </div>
      ) : null}

      <label className="mt-4 grid gap-2">
        <span className="text-sm font-black text-blue-950">Arquivo</span>
        <input
          type="file"
          name="file"
          required
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-black file:text-blue-700"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="btn-wisdom-red mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-black disabled:opacity-70"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
        {loading ? "Enviando..." : "Enviar"}
      </button>
    </form>
  );
}

function CatalogForm({ itemType }: { itemType: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData(event.currentTarget);
      formData.set("item_type", itemType);

      const response = await fetch("/api/rh/configuracoes/catalog", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      setMessage({
        ok: Boolean(result.ok),
        text: result.message || "Resposta recebida.",
      });

      if (result.ok) {
        event.currentTarget.reset();
        window.location.reload();
      }
    } catch (error) {
      setMessage({
        ok: false,
        text: error instanceof Error ? error.message : "Erro inesperado ao cadastrar item.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-black text-blue-950">
        Novo item
      </h2>
      <p className="mt-1 text-sm font-semibold text-slate-500">
        Cadastro de {labelForType(itemType).toLowerCase()}.
      </p>

      {message ? (
        <div className={`mt-4 rounded-2xl border p-4 text-sm font-black ${messageClass(message.ok)}`}>
          {message.text}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">Nome</span>
          <input
            name="name"
            required
            className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">Descrição</span>
          <textarea
            name="description"
            rows={4}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-black text-blue-950">Ordem</span>
            <input
              type="number"
              name="sort_order"
              defaultValue="0"
              className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-blue-950">Metadados opcionais</span>
            <input
              name="metadata"
              placeholder='Ex.: {"cnpj":"00.000.000/0001-00"}'
              className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-wisdom-red inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-black disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
          {loading ? "Salvando..." : "Cadastrar"}
        </button>
      </div>
    </form>
  );
}

function CatalogList({
  items,
  itemType,
}: {
  items: SystemCatalogItem[];
  itemType: string;
}) {
  const filtered = items.filter((item) => item.item_type === itemType);

  async function updateStatus(id: string, status: string) {
    const response = await fetch("/api/rh/configuracoes/catalog", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        status,
      }),
    });

    const result = await response.json();

    if (result.ok) {
      window.location.reload();
    } else {
      alert(result.message || "Erro ao atualizar item.");
    }
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-black text-blue-950">
        Itens cadastrados
      </h2>
      <p className="mt-1 text-sm font-semibold text-slate-500">
        Cadastros ativos podem ser usados em formulários, contratos e documentos.
      </p>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-8 text-center">
          <p className="font-black text-blue-950">Nenhum item cadastrado.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-black text-blue-950">{item.name}</p>
                  {item.description ? (
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                      {item.description}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs font-bold text-slate-400">
                    Ordem: {item.sort_order}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <StatusBadge status={item.status} />

                  {item.status === "ativo" ? (
                    <button
                      type="button"
                      onClick={() => updateStatus(item.id, "arquivado")}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-black text-red-700 hover:bg-red-50"
                    >
                      <Archive className="h-4 w-4" />
                      Arquivar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => updateStatus(item.id, "ativo")}
                      className="inline-flex items-center gap-2 rounded-xl border border-green-100 bg-white px-3 py-2 text-xs font-black text-green-700 hover:bg-green-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Ativar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function ConfiguracoesWorkspace({
  organization,
  catalogItems,
}: {
  organization: RhOrganizationSettings;
  catalogItems: SystemCatalogItem[];
}) {
  const [tab, setTab] = useState<Tab>("dados");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: "dados", label: "Dados Wisdom", icon: <Building2 className="h-5 w-5" /> },
    { id: "marca", label: "Marca", icon: <ImagePlus className="h-5 w-5" /> },
    { id: "instituicoes", label: "Instituições", icon: <GraduationCap className="h-5 w-5" /> },
    { id: "seguradoras", label: "Seguradoras", icon: <ShieldCheck className="h-5 w-5" /> },
    { id: "documentos", label: "Documentos", icon: <FileText className="h-5 w-5" /> },
    { id: "contratos", label: "Contratos", icon: <FileText className="h-5 w-5" /> },
  ];

  const currentItemType = useMemo(() => {
    if (tab === "dados" || tab === "marca") return null;
    return catalogMap[tab];
  }, [tab]);

  async function saveOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage(null);

    try {
      const formData = new FormData(event.currentTarget);

      const response = await fetch("/api/rh/configuracoes/organization", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      setMessage({
        ok: Boolean(result.ok),
        text: result.message || "Resposta recebida.",
      });

      if (result.ok) {
        window.location.reload();
      }
    } catch (error) {
      setMessage({
        ok: false,
        text: error instanceof Error ? error.message : "Erro inesperado ao salvar configurações.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      {message ? (
        <div className={`mb-6 rounded-2xl border p-4 text-sm font-black ${messageClass(message.ok)}`}>
          {message.text}
        </div>
      ) : null}

      <div className="mb-6 rounded-3xl bg-white p-4 shadow-sm">
        <div className="flex overflow-x-auto rounded-2xl bg-slate-100 p-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex min-h-14 flex-1 shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-black ${
                tab === item.id
                  ? "bg-white text-blue-950 shadow-sm"
                  : "text-slate-500 hover:text-blue-950"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "dados" ? (
        <form onSubmit={saveOrganization} className="rounded-3xl bg-white p-7 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-blue-950">
              Dados oficiais da Wisdom
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Essas informações serão usadas em contratos, PDFs, relatórios e cabeçalhos do sistema.
            </p>
          </div>

          <div className="grid gap-5">
            <div className="grid gap-5 md:grid-cols-3">
              <label className="grid gap-2 md:col-span-1">
                <span className="text-sm font-black text-blue-950">Nome fantasia</span>
                <input name="nome_fantasia" defaultValue={organization.nome_fantasia || ""} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>

              <label className="grid gap-2 md:col-span-1">
                <span className="text-sm font-black text-blue-950">Razão social</span>
                <input name="razao_social" defaultValue={organization.razao_social || ""} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">CNPJ</span>
                <input name="cnpj" defaultValue={organization.cnpj || ""} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-4">
              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">Telefone</span>
                <input name="telefone" defaultValue={organization.telefone || ""} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">WhatsApp</span>
                <input name="whatsapp" defaultValue={organization.whatsapp || ""} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">E-mail</span>
                <input name="email" defaultValue={organization.email || ""} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">Site</span>
                <input name="site" defaultValue={organization.site || ""} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-5">
              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm font-black text-blue-950">Endereço</span>
                <input name="endereco" defaultValue={organization.endereco || ""} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">Bairro</span>
                <input name="bairro" defaultValue={organization.bairro || ""} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">Cidade</span>
                <input name="cidade" defaultValue={organization.cidade || ""} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">Estado</span>
                <input name="estado" defaultValue={organization.estado || ""} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">CEP</span>
                <input name="cep" defaultValue={organization.cep || ""} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">Representante</span>
                <input name="representante_nome" defaultValue={organization.representante_nome || ""} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">Cargo</span>
                <input name="representante_cargo" defaultValue={organization.representante_cargo || ""} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500" />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-black text-blue-950">Observações</span>
              <textarea name="observacoes" rows={4} defaultValue={organization.observacoes || ""} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500" />
            </label>

            <button type="submit" disabled={saving} className="btn-wisdom-red inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-black disabled:opacity-70">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {saving ? "Salvando..." : "Salvar dados"}
            </button>
          </div>
        </form>
      ) : null}

      {tab === "marca" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-black text-blue-950">Logomarca</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Usada em contratos, carnês, relatórios e cabeçalhos.
            </p>

            <div className="mt-6 rounded-3xl border border-slate-100 bg-slate-50 p-6">
              {organization.logo_url ? (
                <img src={organization.logo_url} alt="Logomarca Wisdom" className="max-h-32 w-auto object-contain" />
              ) : (
                <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-8 text-center font-black text-blue-950">
                  Nenhuma logomarca enviada.
                </div>
              )}
              {organization.logo_file_name ? (
                <p className="mt-3 text-xs font-bold text-slate-500">{organization.logo_file_name}</p>
              ) : null}
            </div>

            <div className="mt-6">
              <AssetUploadForm type="logo" title="Enviar nova logomarca" />
            </div>
          </section>

          <section className="rounded-3xl bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-black text-blue-950">Assinatura</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Usada futuramente em contratos e documentos oficiais.
            </p>

            <div className="mt-6 rounded-3xl border border-slate-100 bg-slate-50 p-6">
              {organization.assinatura_url ? (
                <img src={organization.assinatura_url} alt="Assinatura Wisdom" className="max-h-32 w-auto object-contain" />
              ) : (
                <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-8 text-center font-black text-blue-950">
                  Nenhuma assinatura enviada.
                </div>
              )}
              {organization.assinatura_file_name ? (
                <p className="mt-3 text-xs font-bold text-slate-500">{organization.assinatura_file_name}</p>
              ) : null}
            </div>

            <div className="mt-6">
              <AssetUploadForm type="assinatura" title="Enviar nova assinatura" />
            </div>
          </section>
        </div>
      ) : null}

      {currentItemType ? (
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <CatalogForm itemType={currentItemType} />
          <CatalogList items={catalogItems} itemType={currentItemType} />
        </div>
      ) : null}
    </section>
  );
}