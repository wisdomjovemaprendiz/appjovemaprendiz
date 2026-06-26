"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { alterarStatusContratoAction } from "@/actions/rh/contrato.actions";
import { Modal } from "@/components/ui/Modal";
import { StudentIdentity } from "@/components/ui/StudentAvatar";
import { EmptyTable, MetricCard, StatusPill, TableShell } from "@/components/ui/WorkspaceUi";
import { ContratoForm } from "@/features/contratos/ContratoForm";
import type { ContratoListItem, SelectOption } from "@/data/rh/contratos.data";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  FileDown,
  FileText,
  HelpCircle,
  PenLine,
  Plus,
  Search,
  Send,
  Signature,
  XCircle,
} from "lucide-react";

type ContratosTab = "todos" | "rascunhos" | "gerados" | "assinaturas" | "vencidos";

function formatDate(date: string | null) {
  if (!date) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(new Date(date));
}

function isContratoVencido(contrato: ContratoListItem) {
  if (!contrato.data_fim || contrato.status === "assinado" || contrato.status === "encerrado") {
    return contrato.status === "vencido";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const fim = new Date(`${contrato.data_fim}T00:00:00`);
  return fim.getTime() < today.getTime() || contrato.status === "vencido";
}

function statusTone(status: string): "ok" | "warning" | "danger" | "info" | "muted" {
  if (status === "assinado") return "ok";
  if (status === "vencido" || status === "cancelado") return "danger";
  if (status === "gerado" || status === "enviado") return "warning";
  if (status === "encerrado") return "muted";
  return "info";
}

function EmptyContratos() {
  return (
    <EmptyTable
      title="Nenhum contrato encontrado."
      description="Use Novo contrato para criar o primeiro rascunho."
    />
  );
}

function ContratosTable({
  contratos,
  onStatus,
}: {
  contratos: ContratoListItem[];
  onStatus: (contrato: ContratoListItem) => void;
}) {
  if (contratos.length === 0) {
    return <EmptyContratos />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1150px] w-full border-separate border-spacing-y-2">
        <thead>
          <tr className="text-left text-xs font-black uppercase tracking-wide text-slate-500">
            <th className="px-4 py-2">Estagiário</th>
            <th className="px-4 py-2">Empresa</th>
            <th className="px-4 py-2">Vigência</th>
            <th className="px-4 py-2">Horário</th>
            <th className="px-4 py-2">Bolsa</th>
            <th className="px-4 py-2">Seguro</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2 text-right">Ações</th>
          </tr>
        </thead>

        <tbody>
          {contratos.map((contrato) => (
            <tr key={contrato.id} className="bg-slate-50">
              <td className="rounded-l-2xl px-4 py-4">
                <p className="font-black text-blue-950">{contrato.student_name}</p>
                <p className="text-xs font-semibold text-slate-500">
                  Versão {contrato.versao || 1}
                </p>
              </td>

              <td className="px-4 py-4 font-bold text-slate-700">
                {contrato.company_name}
              </td>

              <td className="px-4 py-4">
                <p className="font-bold text-slate-700">
                  {formatDate(contrato.data_inicio)}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  até {formatDate(contrato.data_fim)}
                </p>
              </td>

              <td className="px-4 py-4 font-bold text-slate-700">
                {contrato.horario || "Não informado"}
              </td>

              <td className="px-4 py-4 font-bold text-slate-700">
                {contrato.bolsa_auxilio
                  ? new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(Number(contrato.bolsa_auxilio))
                  : "Não informado"}
              </td>

              <td className="px-4 py-4">
                <p className="font-bold text-slate-700">
                  {formatDate(contrato.data_vencimento_seguro)}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {contrato.seguradora || "Seguradora não informada"}
                </p>
              </td>

              <td className="px-4 py-4">
                <StatusPill tone={statusTone(contrato.status)}>
                  {contrato.status}
                </StatusPill>
              </td>

              <td className="rounded-r-2xl px-4 py-4">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/rh/contratos/${contrato.id}/pdf`}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800"
                  >
                    <FileDown className="h-4 w-4" />
                    PDF
                  </Link>

                  <button
                    type="button"
                    onClick={() => onStatus(contrato)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-blue-950 hover:bg-slate-50"
                  >
                    <PenLine className="h-4 w-4" />
                    Status
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ContratosWorkspace({
  contratos,
  empresas,
  estagiarios,
}: {
  contratos: ContratoListItem[];
  empresas: SelectOption[];
  estagiarios: SelectOption[];
}) {
  const [tab, setTab] = useState<ContratosTab>("todos");
  const [novoOpen, setNovoOpen] = useState(false);
  const [ajudaOpen, setAjudaOpen] = useState(false);
  const [statusContrato, setStatusContrato] = useState<ContratoListItem | null>(null);
  const [search, setSearch] = useState("");

  const rascunhos = contratos.filter((item) => item.status === "rascunho");
  const gerados = contratos.filter((item) => item.status === "gerado" || item.status === "enviado");
  const assinaturas = contratos.filter((item) => item.status !== "assinado" && item.status !== "cancelado" && item.status !== "encerrado");
  const vencidos = contratos.filter((item) => isContratoVencido(item));
  const assinados = contratos.filter((item) => item.status === "assinado");

  const baseList = useMemo(() => {
    if (tab === "rascunhos") return rascunhos;
    if (tab === "gerados") return gerados;
    if (tab === "assinaturas") return assinaturas;
    if (tab === "vencidos") return vencidos;
    return contratos;
  }, [tab, contratos, rascunhos, gerados, assinaturas, vencidos]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return baseList;

    return baseList.filter((contrato) =>
      [
        contrato.student_name,
        contrato.company_name,
        contrato.status,
        contrato.horario,
        contrato.seguradora,
        contrato.apolice_numero,
        contrato.supervisor_nome,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [baseList, search]);

  const tabs: Array<{ id: ContratosTab; label: string; icon: ReactNode }> = [
    { id: "todos", label: "Todos", icon: <FileText className="h-5 w-5" /> },
    { id: "rascunhos", label: "Rascunhos", icon: <PenLine className="h-5 w-5" /> },
    { id: "gerados", label: "Gerados", icon: <Send className="h-5 w-5" /> },
    { id: "assinaturas", label: "Assinaturas", icon: <Signature className="h-5 w-5" /> },
    { id: "vencidos", label: "Vencidos", icon: <AlertTriangle className="h-5 w-5" /> },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 grid gap-5 md:grid-cols-5">
        <MetricCard
          icon={<FileText className="h-7 w-7" />}
          label="Contratos"
          value={String(contratos.length)}
          helper="total cadastrado"
        />
        <MetricCard
          icon={<PenLine className="h-7 w-7" />}
          label="Rascunhos"
          value={String(rascunhos.length)}
        />
        <MetricCard
          icon={<Signature className="h-7 w-7 text-yellow-700" />}
          label="Pendentes"
          value={String(assinaturas.length)}
          helper="assinatura ou conclusão"
        />
        <MetricCard
          icon={<CheckCircle2 className="h-7 w-7 text-green-600" />}
          label="Assinados"
          value={String(assinados.length)}
        />
        <MetricCard
          icon={<AlertTriangle className="h-7 w-7 text-red-600" />}
          label="Vencidos"
          value={String(vencidos.length)}
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
              placeholder="Pesquisar estagiário, empresa, status, supervisor ou seguradora"
              className="h-12 w-full rounded-xl border border-slate-200 pl-12 pr-4 text-sm font-bold outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setNovoOpen(true)}
            className="btn-wisdom-red inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-black"
          >
            <Plus className="h-5 w-5" />
            Novo contrato
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
        title="Contratos"
        description="Consulta, emissão de PDF, vigência, seguro e status do contrato."
      >
        <ContratosTable contratos={filtered} onStatus={setStatusContrato} />
      </TableShell>

      <Modal
        open={novoOpen}
        onClose={() => setNovoOpen(false)}
        title="Novo contrato"
        description="Crie um rascunho de contrato vinculado ao estagiário e à empresa."
        size="xl"
      >
        <ContratoForm empresas={empresas} estagiarios={estagiarios} />
      </Modal>

      <Modal
        open={Boolean(statusContrato)}
        onClose={() => setStatusContrato(null)}
        title="Alterar status do contrato"
        description="Registre a alteração com motivo para manter o histórico."
        size="md"
      >
        {statusContrato ? (
          <form action={alterarStatusContratoAction} className="space-y-5">
            <input type="hidden" name="id" value={statusContrato.id} />

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-500">Contrato</p>
              <p className="mt-1 font-black text-blue-950">
                {statusContrato.student_name}
              </p>
              <p className="text-sm font-semibold text-slate-500">
                {statusContrato.company_name}
              </p>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-black text-blue-950">
                Novo status
              </span>
              <select
                name="status"
                defaultValue={statusContrato.status}
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-500"
              >
                <option value="rascunho">Rascunho</option>
                <option value="gerado">Gerado</option>
                <option value="enviado">Enviado</option>
                <option value="assinado">Assinado</option>
                <option value="vencido">Vencido</option>
                <option value="encerrado">Encerrado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-blue-950">
                Motivo/observação
              </span>
              <textarea
                name="motivo"
                required
                rows={4}
                placeholder="Descreva o motivo da alteração."
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
              />
            </label>

            <button
              type="submit"
              className="btn-wisdom-red flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-black"
            >
              <CalendarClock className="h-5 w-5" />
              Atualizar status
            </button>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={ajudaOpen}
        onClose={() => setAjudaOpen(false)}
        title="Ajuda de contratos"
        description="Resumo operacional da página."
        size="md"
      >
        <div className="space-y-4 text-sm leading-7 text-slate-600">
          <p>
            Use <strong>Novo contrato</strong> para criar um rascunho vinculado
            ao estagiário e à empresa.
          </p>
          <p>
            Use <strong>PDF</strong> para visualizar e registrar a emissão do
            termo de estágio.
          </p>
          <p>
            Use <strong>Status</strong> para marcar contratos como gerados,
            enviados, assinados, vencidos, encerrados ou cancelados.
          </p>
        </div>
      </Modal>
    </section>
  );
}