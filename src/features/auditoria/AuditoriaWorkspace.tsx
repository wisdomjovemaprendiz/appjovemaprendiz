"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";
import { EmptyTable, MetricCard, StatusPill, TableShell } from "@/components/ui/WorkspaceUi";
import type { AuditoriaItem, AuditoriaStats } from "@/data/rh/auditoria.data";
import {
  Activity,
  Building2,
  Clock3,
  FileText,
  HelpCircle,
  Search,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";

type AuditoriaTab = "todas" | "hoje" | "cadastros" | "financeiro" | "documentos" | "criticas";

function formatDateTime(date: string | null) {
  if (!date) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function areaLabel(item: AuditoriaItem) {
  const area = `${item.entity_type || ""} ${item.tabela || ""}`.toLowerCase();

  if (area.includes("empresa") || area.includes("compan")) return "Empresas";
  if (area.includes("estagi") || area.includes("student")) return "Estagiários";
  if (area.includes("contrat") || area.includes("internship")) return "Contratos";
  if (area.includes("finance") || area.includes("payment") || area.includes("charge")) return "Financeiro";
  if (area.includes("document")) return "Documentos";
  if (area.includes("match")) return "Match";
  if (area.includes("pendencia") || area.includes("reminder")) return "Pendências";

  return item.entity_type || item.tabela || "Sistema";
}

function isToday(dateString: string | null) {
  if (!dateString) return false;

  const date = new Date(dateString);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function isCriticalAction(action: string) {
  const normalized = action.toLowerCase();

  return (
    normalized.includes("inativ") ||
    normalized.includes("cancel") ||
    normalized.includes("baix") ||
    normalized.includes("arquiv") ||
    normalized.includes("pdf") ||
    normalized.includes("status") ||
    normalized.includes("financeir")
  );
}

function shortJson(value: unknown) {
  if (!value) return "Não informado";

  try {
    const text = JSON.stringify(value);
    return text.length > 90 ? `${text.slice(0, 90)}...` : text;
  } catch {
    return "Conteúdo não exibível";
  }
}

function AuditoriaTable({
  logs,
  onDetails,
}: {
  logs: AuditoriaItem[];
  onDetails: (item: AuditoriaItem) => void;
}) {
  if (logs.length === 0) {
    return (
      <EmptyTable
        title="Nenhum registro encontrado."
        description="As ações do sistema serão exibidas nesta tela."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1150px] w-full border-separate border-spacing-y-2">
        <thead>
          <tr className="text-left text-xs font-black uppercase tracking-wide text-slate-500">
            <th className="px-4 py-2">Ação</th>
            <th className="px-4 py-2">Área</th>
            <th className="px-4 py-2">Motivo</th>
            <th className="px-4 py-2">Valor anterior</th>
            <th className="px-4 py-2">Valor novo</th>
            <th className="px-4 py-2">Data</th>
            <th className="px-4 py-2 text-right">Ações</th>
          </tr>
        </thead>

        <tbody>
          {logs.map((item) => (
            <tr key={item.id} className="bg-slate-50">
              <td className="rounded-l-2xl px-4 py-4">
                <p className="font-black text-blue-950">{item.acao}</p>
                <p className="text-xs font-semibold text-slate-500">
                  {item.tabela || "Tabela não informada"}
                </p>
              </td>

              <td className="px-4 py-4">
                <StatusPill tone={isCriticalAction(item.acao) ? "warning" : "info"}>
                  {areaLabel(item)}
                </StatusPill>
              </td>

              <td className="px-4 py-4">
                <p className="max-w-[240px] truncate text-sm font-semibold text-slate-600">
                  {item.motivo || "Sem motivo registrado"}
                </p>
              </td>

              <td className="px-4 py-4">
                <p className="max-w-[180px] truncate text-xs font-semibold text-slate-500">
                  {shortJson(item.valor_anterior)}
                </p>
              </td>

              <td className="px-4 py-4">
                <p className="max-w-[180px] truncate text-xs font-semibold text-slate-500">
                  {shortJson(item.valor_novo)}
                </p>
              </td>

              <td className="px-4 py-4 font-bold text-slate-700">
                {formatDateTime(item.created_at)}
              </td>

              <td className="rounded-r-2xl px-4 py-4 text-right">
                <button
                  type="button"
                  onClick={() => onDetails(item)}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800"
                >
                  <FileText className="h-4 w-4" />
                  Detalhes
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AuditoriaWorkspace({
  logs,
  stats,
}: {
  logs: AuditoriaItem[];
  stats: AuditoriaStats;
}) {
  const [tab, setTab] = useState<AuditoriaTab>("todas");
  const [search, setSearch] = useState("");
  const [ajudaOpen, setAjudaOpen] = useState(false);
  const [selected, setSelected] = useState<AuditoriaItem | null>(null);

  const baseList = useMemo(() => {
    if (tab === "hoje") return logs.filter((item) => isToday(item.created_at));

    if (tab === "cadastros") {
      return logs.filter((item) => {
        const area = areaLabel(item).toLowerCase();
        return area.includes("empresa") || area.includes("estagi");
      });
    }

    if (tab === "financeiro") {
      return logs.filter((item) => areaLabel(item).toLowerCase().includes("financeiro"));
    }

    if (tab === "documentos") {
      return logs.filter((item) => areaLabel(item).toLowerCase().includes("document"));
    }

    if (tab === "criticas") {
      return logs.filter((item) => isCriticalAction(item.acao));
    }

    return logs;
  }, [tab, logs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return baseList;

    return baseList.filter((item) =>
      [
        item.acao,
        item.tabela,
        item.entity_type,
        item.entity_id,
        item.usuario_nome,
        item.motivo,
        areaLabel(item),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [baseList, search]);

  const tabs: Array<{ id: AuditoriaTab; label: string; icon: ReactNode }> = [
    { id: "todas", label: "Todas", icon: <Activity className="h-5 w-5" /> },
    { id: "hoje", label: "Hoje", icon: <Clock3 className="h-5 w-5" /> },
    { id: "cadastros", label: "Cadastros", icon: <UserRound className="h-5 w-5" /> },
    { id: "financeiro", label: "Financeiro", icon: <WalletCards className="h-5 w-5" /> },
    { id: "documentos", label: "Documentos", icon: <FileText className="h-5 w-5" /> },
    { id: "criticas", label: "Críticas", icon: <ShieldCheck className="h-5 w-5" /> },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 grid gap-5 md:grid-cols-5">
        <MetricCard
          icon={<Activity className="h-7 w-7" />}
          label="Registros"
          value={String(stats.total)}
        />
        <MetricCard
          icon={<Clock3 className="h-7 w-7 text-blue-700" />}
          label="Hoje"
          value={String(stats.hoje)}
        />
        <MetricCard
          icon={<Building2 className="h-7 w-7" />}
          label="Cadastros"
          value={String(stats.empresas + stats.estagiarios)}
        />
        <MetricCard
          icon={<WalletCards className="h-7 w-7" />}
          label="Financeiro"
          value={String(stats.financeiro)}
        />
        <MetricCard
          icon={<ShieldCheck className="h-7 w-7 text-yellow-700" />}
          label="Críticas"
          value={String(stats.criticas)}
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
              placeholder="Pesquisar ação, área, tabela, motivo ou usuário"
              className="h-12 w-full rounded-xl border border-slate-200 pl-12 pr-4 text-sm font-bold outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setAjudaOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-black text-blue-950 hover:bg-slate-50 xl:ml-auto"
          >
            <HelpCircle className="h-5 w-5 text-blue-700" />
            Ajuda
          </button>
        </div>
      </div>

      <TableShell
        title="Auditoria"
        description="Histórico de ações, alterações, baixas, emissões e mudanças sensíveis."
      >
        <AuditoriaTable logs={filtered} onDetails={setSelected} />
      </TableShell>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Detalhes da auditoria"
        description="Registro completo da ação selecionada."
        size="xl"
      >
        {selected ? (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-500">Ação</p>
                <p className="mt-1 font-black text-blue-950">{selected.acao}</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-500">Área</p>
                <p className="mt-1 font-black text-blue-950">{areaLabel(selected)}</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-500">Tabela</p>
                <p className="mt-1 font-black text-blue-950">
                  {selected.tabela || "Não informado"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-500">Data</p>
                <p className="mt-1 font-black text-blue-950">
                  {formatDateTime(selected.created_at)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-500">Motivo</p>
              <p className="mt-1 font-semibold text-slate-700">
                {selected.motivo || "Sem motivo registrado"}
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-950 p-4">
                <p className="mb-3 text-sm font-black text-white">Valor anterior</p>
                <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap text-xs leading-6 text-slate-100">
                  {JSON.stringify(selected.valor_anterior, null, 2)}
                </pre>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-950 p-4">
                <p className="mb-3 text-sm font-black text-white">Valor novo</p>
                <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap text-xs leading-6 text-slate-100">
                  {JSON.stringify(selected.valor_novo, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={ajudaOpen}
        onClose={() => setAjudaOpen(false)}
        title="Ajuda de auditoria"
        description="Resumo operacional da página."
        size="md"
      >
        <div className="space-y-4 text-sm leading-7 text-slate-600">
          <p>
            Esta tela mostra ações importantes realizadas no sistema, como
            cadastros, alterações, baixas financeiras, emissões de PDF e
            arquivamento de documentos.
          </p>
          <p>
            Use os filtros por aba para analisar áreas específicas e o botão
            <strong> Detalhes</strong> para visualizar valores anteriores e
            novos.
          </p>
          <p>
            Alterações sensíveis devem sempre manter motivo registrado para
            rastreabilidade.
          </p>
        </div>
      </Modal>
    </section>
  );
}