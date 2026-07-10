"use client";

import { Modal } from "@/components/ui/Modal";
import { EmpresaForm } from "@/features/empresas/EmpresaForm";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Edit,
  Loader2,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type EmpresaRow = Record<string, any>;
type Tab = "ativas" | "inativas" | "todas";

type ApiResult = {
  ok?: boolean;
  message?: string;
  data?: EmpresaRow;
};

function getValue(row: EmpresaRow | null | undefined, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = row?.[key];

    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return String(value);
    }
  }

  return fallback;
}

function statusClass(status: string) {
  if (status === "ativo") {
    return "border-green-100 bg-green-50 text-green-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
}

function normalizeStatus(value: unknown) {
  return String(value || "ativo").trim().toLowerCase() === "ativo"
    ? "ativo"
    : "inativo";
}

async function parseApiResponse(response: Response): Promise<ApiResult> {
  const text = await response.text();

  if (!text) {
    return {
      ok: response.ok,
      message: response.ok ? "Operação concluída." : "Resposta vazia do servidor.",
    };
  }

  try {
    const json = JSON.parse(text) as ApiResult;

    return {
      ok: Boolean(response.ok && json.ok),
      message: json.message || (response.ok ? "Operação concluída." : "Erro na operação."),
      data: json.data,
    };
  } catch {
    return {
      ok: false,
      message: response.redirected
        ? "Sua sessão pode ter expirado. Faça login novamente."
        : `Resposta inválida do servidor: ${text.slice(0, 180)}`,
    };
  }
}

export function EmpresasWorkspace({ empresas }: { empresas: EmpresaRow[] }) {
  const [rows, setRows] = useState<EmpresaRow[]>(empresas);
  const [tab, setTab] = useState<Tab>("ativas");
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [deleteEmpresa, setDeleteEmpresa] = useState<EmpresaRow | null>(null);
  const [deleteText, setDeleteText] = useState("");
  const [actionMessage, setActionMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = rows.length;
    const ativas = rows.filter((item) => normalizeStatus(item.status) === "ativo").length;
    const inativas = rows.filter((item) => normalizeStatus(item.status) !== "ativo").length;
    const comCnpj = rows.filter((item) => getValue(item, ["cnpj"])).length;

    return {
      total,
      ativas,
      inativas,
      comCnpj,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows.filter((empresa) => {
      const status = normalizeStatus(empresa.status);

      if (tab === "ativas" && status !== "ativo") return false;
      if (tab === "inativas" && status === "ativo") return false;

      if (!normalizedSearch) return true;

      const haystack = [
        getValue(empresa, ["razao_social"]),
        getValue(empresa, ["nome_fantasia"]),
        getValue(empresa, ["cnpj"]),
        getValue(empresa, ["responsavel_nome", "nome_responsavel"]),
        getValue(empresa, ["email"]),
        getValue(empresa, ["telefone", "whatsapp"]),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [rows, tab, search]);

  async function updateStatus(empresa: EmpresaRow, status: "ativo" | "inativo") {
    const companyId = String(empresa.id || "").trim();

    if (!companyId) {
      setActionMessage({
        ok: false,
        text: "Empresa sem ID. Não foi possível alterar o status.",
      });
      return;
    }

    const nome = getValue(empresa, ["nome_fantasia", "razao_social"], "esta empresa");

    if (status === "inativo") {
      const confirmed = window.confirm(
        `Deseja inativar ${nome}? O histórico será mantido e a empresa sairá da lista de ativas.`,
      );

      if (!confirmed) return;
    }

    if (status === "ativo") {
      const confirmed = window.confirm(`Deseja reativar ${nome}?`);

      if (!confirmed) return;
    }

    setBusyId(companyId);
    setActionMessage(null);

    try {
      const response = await fetch("/api/rh/empresas/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          company_id: companyId,
          status,
          motivo:
            status === "inativo"
              ? "Empresa inativada pelo painel RH."
              : "Empresa reativada pelo painel RH.",
        }),
      });

      const result = await parseApiResponse(response);

      setActionMessage({
        ok: Boolean(result.ok),
        text: result.message || "Resposta recebida.",
      });

      if (result.ok) {
        setRows((current) =>
          current.map((item) =>
            String(item.id) === companyId
              ? {
                  ...item,
                  ...(result.data || {}),
                  status,
                }
              : item,
          ),
        );

        if (status === "inativo") {
          setTab("ativas");
        }

        if (status === "ativo") {
          setTab("inativas");
        }
      }
    } catch (error) {
      setActionMessage({
        ok: false,
        text:
          error instanceof Error
            ? `Erro ao alterar status: ${error.message}`
            : "Erro ao alterar status da empresa.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function excluirInativa() {
    if (!deleteEmpresa) return;

    const companyId = String(deleteEmpresa.id || "").trim();

    if (!companyId) {
      setActionMessage({
        ok: false,
        text: "Empresa sem ID. Não foi possível excluir.",
      });
      return;
    }

    setBusyId(companyId);
    setActionMessage(null);

    try {
      const response = await fetch("/api/rh/empresas/excluir", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          company_id: companyId,
          confirm_text: deleteText,
        }),
      });

      const result = await parseApiResponse(response);

      setActionMessage({
        ok: Boolean(result.ok),
        text: result.message || "Resposta recebida.",
      });

      if (result.ok) {
        setRows((current) => current.filter((item) => String(item.id) !== companyId));
        setDeleteEmpresa(null);
        setDeleteText("");
      }
    } catch (error) {
      setActionMessage({
        ok: false,
        text:
          error instanceof Error
            ? `Erro ao excluir empresa: ${error.message}`
            : "Erro ao excluir empresa.",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      {actionMessage ? (
        <div
          className={`mb-6 rounded-2xl border p-4 text-sm font-black ${
            actionMessage.ok
              ? "border-green-100 bg-green-50 text-green-700"
              : "border-red-100 bg-red-50 text-red-700"
          }`}
        >
          {actionMessage.text}
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">
            Empresas
          </p>
          <p className="mt-3 text-3xl font-black text-blue-950">{stats.total}</p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">
            Ativas
          </p>
          <p className="mt-3 text-3xl font-black text-blue-950">{stats.ativas}</p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">
            Inativas
          </p>
          <p className="mt-3 text-3xl font-black text-blue-950">{stats.inativas}</p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">
            Com CNPJ
          </p>
          <p className="mt-3 text-3xl font-black text-blue-950">{stats.comCnpj}</p>
        </div>
      </div>

      <div className="mb-6 rounded-3xl bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex rounded-2xl bg-slate-100 p-1">
            {[
              { id: "ativas", label: "Ativas" },
              { id: "inativas", label: "Inativas" },
              { id: "todas", label: "Todas" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id as Tab)}
                className={`min-h-12 rounded-xl px-10 text-sm font-black ${
                  tab === item.id
                    ? "bg-white text-blue-950 shadow-sm"
                    : "text-slate-500 hover:text-blue-950"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <label className="relative">
              <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Pesquisar empresa..."
                className="h-12 w-full rounded-xl border border-slate-200 pl-12 pr-4 text-sm font-bold outline-none focus:border-blue-500 md:w-80"
              />
            </label>

            <button
              type="button"
              onClick={() => setNewOpen(true)}
              className="btn-wisdom-red inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-black"
            >
              <Plus className="h-5 w-5" />
              Nova empresa
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-black uppercase tracking-[0.25em] text-blue-950/70">
                <th className="px-5 py-4">Empresa</th>
                <th className="px-5 py-4">CNPJ</th>
                <th className="px-5 py-4">Responsável</th>
                <th className="px-5 py-4">Contato</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Building2 className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-3 text-sm font-black text-slate-500">
                      Nenhuma empresa encontrada neste filtro.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((empresa) => {
                  const id = String(empresa.id || "");
                  const status = normalizeStatus(empresa.status);
                  const isBusy = busyId === id;

                  return (
                    <tr key={id} className="text-sm hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-black uppercase text-blue-950">
                          {getValue(empresa, ["nome_fantasia", "razao_social"], "Empresa sem nome")}
                        </p>
                        <p className="mt-1 text-xs font-semibold uppercase text-slate-500">
                          {getValue(empresa, ["razao_social", "nome_fantasia"], "Sem razão social")}
                        </p>
                      </td>

                      <td className="px-5 py-4 font-black text-blue-950">
                        {getValue(empresa, ["cnpj"], "Não informado")}
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-700">
                        {getValue(empresa, ["responsavel_nome", "nome_responsavel"], "Não informado")}
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-700">
                        {getValue(empresa, ["telefone", "whatsapp", "email"], "Não informado")}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClass(
                            status,
                          )}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/rh/empresas/${id}/editar`}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-black text-white hover:bg-blue-800"
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </Link>

                          {status === "ativo" ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => updateStatus(empresa, "inativo")}
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 text-xs font-black text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isBusy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                              Inativar
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => updateStatus(empresa, "ativo")}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 text-xs font-black text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isBusy ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}
                                Reativar
                              </button>

                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => {
                                  setDeleteText("");
                                  setDeleteEmpresa(empresa);
                                }}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-xs font-black text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <Trash2 className="h-4 w-4" />
                                Excluir
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="Nova empresa"
        description="Cadastre a empresa, depois continue com vagas, skills e documentos."
        size="xl"
      >
        <EmpresaForm />
      </Modal>

      <Modal
        open={Boolean(deleteEmpresa)}
        onClose={() => setDeleteEmpresa(null)}
        title="Excluir empresa inativa"
        description="Exclusão definitiva. Use apenas para limpar cadastros sem histórico."
      >
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold leading-6 text-red-700">
          <div className="flex gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
            <div>
              Esta ação remove a empresa do banco. Empresas com contratos, carnês ou cobranças serão bloqueadas automaticamente.
              <br />
              <strong>{deleteEmpresa ? getValue(deleteEmpresa, ["nome_fantasia", "razao_social"]) : ""}</strong>
            </div>
          </div>
        </div>

        <label className="mt-5 grid gap-2">
          <span className="text-sm font-black text-blue-950">
            Digite EXCLUIR para confirmar
          </span>
          <input
            value={deleteText}
            onChange={(event) => setDeleteText(event.target.value)}
            className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-red-500"
          />
        </label>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setDeleteEmpresa(null)}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={busyId === String(deleteEmpresa?.id || "") || deleteText.trim().toUpperCase() !== "EXCLUIR"}
            onClick={excluirInativa}
            className="btn-wisdom-red inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busyId === String(deleteEmpresa?.id || "") ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Excluir definitivamente
          </button>
        </div>
      </Modal>
    </section>
  );
}