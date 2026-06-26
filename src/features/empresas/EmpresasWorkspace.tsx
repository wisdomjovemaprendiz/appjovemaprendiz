"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { inativarEmpresaAction } from "@/actions/rh/empresa.actions";
import { Modal } from "@/components/ui/Modal";
import { EmptyTable, MetricCard, StatusPill, TableShell } from "@/components/ui/WorkspaceUi";
import { EmpresaForm } from "@/features/empresas/EmpresaForm";
import {
  Building2,
  CheckCircle2,
  Edit,
  HelpCircle,
  Plus,
  Search,
  Store,
  UserRound,
  XCircle,
} from "lucide-react";

type EmpresaItem = {
  id: string;
  razao_social: string | null;
  nome_fantasia: string | null;
  nome_responsavel: string | null;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
  bairro: string | null;
  status: string | null;
  criado_em: string | null;
};

type EmpresasTab = "ativas" | "inativas" | "todas";

function getNomeEmpresa(empresa: EmpresaItem) {
  return (
    empresa.nome_fantasia ||
    empresa.razao_social ||
    "Empresa sem nome definido"
  );
}

function formatDate(date: string | null) {
  if (!date) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(date));
}

function EmpresasTable({
  empresas,
  onInativar,
}: {
  empresas: EmpresaItem[];
  onInativar: (empresa: EmpresaItem) => void;
}) {
  if (empresas.length === 0) {
    return (
      <EmptyTable
        title="Nenhuma empresa encontrada."
        description="Use o botão Novo cadastro para criar a primeira empresa."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1050px] w-full border-separate border-spacing-y-2">
        <thead>
          <tr className="text-left text-xs font-black uppercase tracking-wide text-slate-500">
            <th className="px-4 py-2">Empresa</th>
            <th className="px-4 py-2">Responsável</th>
            <th className="px-4 py-2">Contato</th>
            <th className="px-4 py-2">Localização</th>
            <th className="px-4 py-2">Cadastro</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2 text-right">Ações</th>
          </tr>
        </thead>

        <tbody>
          {empresas.map((empresa) => (
            <tr key={empresa.id} className="bg-slate-50">
              <td className="rounded-l-2xl px-4 py-4">
                <p className="font-black text-blue-950">
                  {getNomeEmpresa(empresa)}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {empresa.cnpj || "CNPJ não informado"}
                </p>
              </td>

              <td className="px-4 py-4 font-bold text-slate-700">
                {empresa.nome_responsavel || "Não informado"}
              </td>

              <td className="px-4 py-4">
                <p className="font-bold text-slate-700">
                  {empresa.telefone || "Telefone não informado"}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {empresa.email || "E-mail não informado"}
                </p>
              </td>

              <td className="px-4 py-4 font-bold text-slate-700">
                {[empresa.bairro, empresa.cidade].filter(Boolean).join(" • ") ||
                  "Não informado"}
              </td>

              <td className="px-4 py-4 font-bold text-slate-700">
                {formatDate(empresa.criado_em)}
              </td>

              <td className="px-4 py-4">
                <StatusPill tone={empresa.status === "ativo" ? "ok" : "muted"}>
                  {empresa.status || "ativo"}
                </StatusPill>
              </td>

              <td className="rounded-r-2xl px-4 py-4">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/rh/empresas/${empresa.id}/editar`}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </Link>

                  {empresa.status === "ativo" ? (
                    <button
                      type="button"
                      onClick={() => onInativar(empresa)}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-black text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Inativar
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EmpresasWorkspace({ empresas }: { empresas: EmpresaItem[] }) {
  const [tab, setTab] = useState<EmpresasTab>("ativas");
  const [novoOpen, setNovoOpen] = useState(false);
  const [ajudaOpen, setAjudaOpen] = useState(false);
  const [empresaInativar, setEmpresaInativar] = useState<EmpresaItem | null>(null);
  const [search, setSearch] = useState("");

  const empresasAtivas = empresas.filter((empresa) => empresa.status === "ativo");
  const empresasInativas = empresas.filter((empresa) => empresa.status !== "ativo");
  const empresasComCnpj = empresas.filter((empresa) => empresa.cnpj).length;
  const empresasComResponsavel = empresas.filter((empresa) => empresa.nome_responsavel).length;

  const baseList = useMemo(() => {
    if (tab === "ativas") return empresasAtivas;
    if (tab === "inativas") return empresasInativas;
    return empresas;
  }, [tab, empresas, empresasAtivas, empresasInativas]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return baseList;

    return baseList.filter((empresa) =>
      [
        empresa.razao_social,
        empresa.nome_fantasia,
        empresa.nome_responsavel,
        empresa.cnpj,
        empresa.email,
        empresa.telefone,
        empresa.cidade,
        empresa.bairro,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [baseList, search]);

  const tabs: Array<{ id: EmpresasTab; label: string; icon: React.ReactNode }> = [
    { id: "ativas", label: "Ativas", icon: <CheckCircle2 className="h-5 w-5" /> },
    { id: "inativas", label: "Inativas", icon: <XCircle className="h-5 w-5" /> },
    { id: "todas", label: "Todas", icon: <Store className="h-5 w-5" /> },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 grid gap-5 md:grid-cols-4">
        <MetricCard
          icon={<Building2 className="h-7 w-7" />}
          label="Empresas"
          value={String(empresas.length)}
          helper="total cadastrado"
        />
        <MetricCard
          icon={<CheckCircle2 className="h-7 w-7 text-green-600" />}
          label="Ativas"
          value={String(empresasAtivas.length)}
        />
        <MetricCard
          icon={<Store className="h-7 w-7" />}
          label="Com CNPJ"
          value={String(empresasComCnpj)}
        />
        <MetricCard
          icon={<UserRound className="h-7 w-7" />}
          label="Com responsável"
          value={String(empresasComResponsavel)}
        />
      </div>

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

        <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar empresa, CNPJ, responsável, telefone ou cidade"
              className="h-12 w-full rounded-xl border border-slate-200 pl-12 pr-4 text-sm font-bold outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setNovoOpen(true)}
            className="btn-wisdom-red inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-black"
          >
            <Plus className="h-5 w-5" />
            Novo cadastro
          </button>

          <button
            type="button"
            onClick={() => setAjudaOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-black text-blue-950 hover:bg-slate-50"
          >
            <HelpCircle className="h-5 w-5 text-blue-700" />
            Ajuda
          </button>
        </div>
      </div>

      <TableShell
        title="Empresas"
        description="Consulta, edição e controle de status das empresas concedentes."
      >
        <EmpresasTable empresas={filtered} onInativar={setEmpresaInativar} />
      </TableShell>

      <Modal
        open={novoOpen}
        onClose={() => setNovoOpen(false)}
        title="Nova empresa"
        description="Cadastre a empresa concedente e, após salvar, anexe documentos ao registro."
        size="xl"
      >
        <EmpresaForm />
      </Modal>

      <Modal
        open={Boolean(empresaInativar)}
        onClose={() => setEmpresaInativar(null)}
        title="Inativar empresa"
        description="A empresa não será excluída. A alteração ficará registrada na auditoria."
        size="md"
      >
        {empresaInativar ? (
          <form action={inativarEmpresaAction} className="space-y-5">
            <input type="hidden" name="id" value={empresaInativar.id} />

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-500">Empresa</p>
              <p className="mt-1 font-black text-blue-950">
                {getNomeEmpresa(empresaInativar)}
              </p>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-black text-blue-950">
                Motivo da inativação
              </span>
              <textarea
                name="motivo"
                required
                rows={4}
                placeholder="Descreva o motivo da inativação."
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
              />
            </label>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-black text-white hover:bg-red-700"
            >
              <XCircle className="h-5 w-5" />
              Confirmar inativação
            </button>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={ajudaOpen}
        onClose={() => setAjudaOpen(false)}
        title="Ajuda de empresas"
        description="Resumo operacional da página."
        size="md"
      >
        <div className="space-y-4 text-sm leading-7 text-slate-600">
          <p>
            Use <strong>Novo cadastro</strong> para registrar uma empresa
            concedente. Após salvar, o envio de documentos da empresa fica
            disponível no próprio cadastro.
          </p>
          <p>
            Use <strong>Editar</strong> para atualizar dados, perfil de vaga,
            funções, habilidades desejadas e anexos.
          </p>
          <p>
            Use <strong>Inativar</strong> quando a empresa não estiver mais
            ativa. O registro permanece no histórico.
          </p>
        </div>
      </Modal>
    </section>
  );
}