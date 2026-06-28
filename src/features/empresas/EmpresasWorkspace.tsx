"use client";

import { Modal } from "@/components/ui/Modal";
import { EmpresaForm } from "@/features/empresas/EmpresaForm";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Edit,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type EmpresaRow = Record<string, any>;
type Tab = "ativas" | "inativas" | "todas";

function getValue(row: EmpresaRow, keys: string[], fallback = "") {
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

export function EmpresasWorkspace({ empresas }: { empresas: EmpresaRow[] }) {
  const [tab, setTab] = useState<Tab>("ativas");
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [statusEmpresa, setStatusEmpresa] = useState<EmpresaRow | null>(null);
  const [deleteEmpresa, setDeleteEmpresa] = useState<EmpresaRow | null>(null);
  const [deleteText, setDeleteText] = useState("");
  const [actionMessage, setActionMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const stats = useMemo(() => {
    const total = empresas.length;
    const ativas = empresas.filter((item) => String(item.status) === "ativo").length;
    const inativas = empresas.filter((item) => String(item.status) !== "ativo").length;
    const comCnpj = empresas.filter((item) => getValue(item, ["cnpj"])).length;

    return {
      total,
      ativas,
      inativas,
      comCnpj,
    };
  }, [empresas]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return empresas.filter((empresa) => {
      const status = String(empresa.status || "ativo");

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
  }, [empresas, tab, search]);

  async function updateStatus(empresa: EmpresaRow, status: string) {
    setBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/rh/empresas/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_id: empresa.id,
          status,
          motivo: status === "inativo" ? "Empresa inativada pelo painel." : "Empresa reativada pelo painel.",
        }),
      });

      const result = await response.json();

      setActionMessage({
        ok: Boolean(result.ok),
        text: result.message || "Resposta recebida.",
      });

      if (result.ok) {
        window.location.reload();
      }
    } finally {
      setBusy(false);
    }
  }

  async function excluirInativa() {
    if (!deleteEmpresa) return;

    setBusy(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/rh/empresas/excluir", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_id: deleteEmpresa.id,
          confirm_text: deleteText,
        }),
      });

      const result = await response.json();

      setActionMessage({
        ok: Boolean(result.ok),
        text: result.message || "Resposta recebida.",
      });

      if (result.ok) {
        window.location.reload();
      }
    } finally {
      setBusy(false);
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
        {[
          ["Empresas", stats.total],
          ["Ativas", stats.ativas],
          ["Inativas", stats.inativas],
          ["Com CNPJ", stats.comCnpj],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-black text-blue-950">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-3xl bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex overflow-x-auto rounded-2xl bg-slate-100 p-1">
            {[
              ["ativas", "Ativas"],
              ["inativas", "Inativas"],
              ["todas", "Todas"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id as Tab)}
                className={`inline-flex min-h-12 min-w-32 items-center justify-center rounded-xl px-5 text-sm font-black ${
                  tab === id
                    ? "bg-white text-blue-950 shadow-sm"
                    : "text-slate-500 hover:text-blue-950"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <label className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Pesquisar empresa..."
                className="h-12 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm font-bold outline-none focus:border-blue-500 md:w-80"
              />
            </label>

            <button
              type="button"
              onClick={() => setNewOpen(true)}
              className="btn-wisdom-red inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black"
            >
              <Plus className="h-4 w-4" />
              Nova empresa
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-left">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              <tr>
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
                    <Building2 className="mx-auto h-10 w-10 text-blue-700" />
                    <p className="mt-3 font-black text-blue-950">Nenhuma empresa encontrada.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((empresa) => {
                  const status = String(empresa.status || "ativo");
                  const nome = getValue(empresa, ["nome_fantasia", "razao_social"], "Empresa sem nome");

                  return (
                    <tr key={empresa.id} className="text-sm">
                      <td className="px-5 py-4">
                        <p className="font-black text-blue-950">{nome}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {getValue(empresa, ["razao_social"])}
                        </p>
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-600">
                        {getValue(empresa, ["cnpj"], "Não informado")}
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-600">
                        {getValue(empresa, ["responsavel_nome", "nome_responsavel"], "Não informado")}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-600">{getValue(empresa, ["telefone", "whatsapp"], "Não informado")}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{getValue(empresa, ["email"])}</p>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(status)}`}>
                          {status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/rh/empresas/${empresa.id}/editar`}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-black text-white hover:bg-blue-800"
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </Link>

                          {status === "ativo" ? (
                            <button
                              type="button"
                              onClick={() => setStatusEmpresa(empresa)}
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 text-xs font-black text-red-700 hover:bg-red-100"
                            >
                              <XCircle className="h-4 w-4" />
                              Inativar
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => updateStatus(empresa, "ativo")}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 text-xs font-black text-green-700 hover:bg-green-100"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Reativar
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteText("");
                                  setDeleteEmpresa(empresa);
                                }}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-xs font-black text-red-700 hover:bg-red-50"
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
        open={Boolean(statusEmpresa)}
        onClose={() => setStatusEmpresa(null)}
        title="Inativar empresa"
        description="A empresa será removida das listas ativas, mas o histórico será mantido."
      >
        <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4 text-sm font-bold leading-6 text-yellow-800">
          Confirme a inativação de:
          <br />
          <strong>{statusEmpresa ? getValue(statusEmpresa, ["nome_fantasia", "razao_social"]) : ""}</strong>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setStatusEmpresa(null)}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={busy || !statusEmpresa}
            onClick={() => statusEmpresa && updateStatus(statusEmpresa, "inativo")}
            className="btn-wisdom-red rounded-xl px-5 py-3 text-sm font-black disabled:opacity-70"
          >
            Inativar
          </button>
        </div>
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
            disabled={busy || deleteText !== "EXCLUIR"}
            onClick={excluirInativa}
            className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            Excluir definitivamente
          </button>
        </div>
      </Modal>
    </section>
  );
}