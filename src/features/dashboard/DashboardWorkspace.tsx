"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";
import { EmptyTable, MetricCard, StatusPill, TableShell } from "@/components/ui/WorkspaceUi";
import type { DashboardActivity, DashboardAlert, DashboardData } from "@/data/rh/dashboard.data";
import {
  AlertTriangle,
  BellRing,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  FileText,
  GraduationCap,
  HelpCircle,
  Search,
  Target,
  WalletCards,
} from "lucide-react";

type DashboardTab = "alertas" | "financeiro" | "contratos" | "documentos" | "atividades";

function levelTone(level: string): "ok" | "warning" | "danger" | "info" | "muted" {
  if (level === "critico") return "danger";
  if (level === "atencao") return "warning";
  return "info";
}

function areaLabel(area: string) {
  if (area === "financeiro") return "Financeiro";
  if (area === "contratos") return "Contratos";
  if (area === "documentos") return "Documentos";
  if (area === "estagiarios") return "Estagiários";
  if (area === "empresas") return "Empresas";
  if (area === "pendencias") return "Pendências";
  return area;
}

function formatDateTime(date: string | null) {
  if (!date) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function AlertsTable({ alerts }: { alerts: DashboardAlert[] }) {
  if (alerts.length === 0) {
    return (
      <EmptyTable
        title="Nenhum alerta crítico no momento."
        description="Quando houver vencimentos, atrasos ou pendências críticas, eles aparecerão aqui."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[960px] w-full border-separate border-spacing-y-2">
        <thead>
          <tr className="text-left text-xs font-black uppercase tracking-wide text-slate-500">
            <th className="px-4 py-2">Alerta</th>
            <th className="px-4 py-2">Área</th>
            <th className="px-4 py-2">Nível</th>
            <th className="px-4 py-2 text-right">Ação</th>
          </tr>
        </thead>

        <tbody>
          {alerts.map((alert) => (
            <tr key={alert.id} className="bg-slate-50">
              <td className="rounded-l-2xl px-4 py-4">
                <p className="font-black text-blue-950">{alert.title}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {alert.description}
                </p>
              </td>

              <td className="px-4 py-4">
                <StatusPill tone="info">{areaLabel(alert.area)}</StatusPill>
              </td>

              <td className="px-4 py-4">
                <StatusPill tone={levelTone(alert.level)}>{alert.level}</StatusPill>
              </td>

              <td className="rounded-r-2xl px-4 py-4 text-right">
                <Link
                  href={alert.href}
                  className="inline-flex rounded-xl bg-blue-700 px-4 py-2 text-sm font-black text-white hover:bg-blue-800"
                >
                  Abrir
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivitiesList({ activities }: { activities: DashboardActivity[] }) {
  if (activities.length === 0) {
    return (
      <EmptyTable
        title="Nenhuma atividade recente."
        description="As ações registradas na auditoria aparecerão aqui."
      />
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-black text-blue-950">{activity.title}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {activity.description}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
              <StatusPill tone="info">{activity.area}</StatusPill>
              <p className="text-xs font-bold text-slate-500">
                {formatDateTime(activity.created_at)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="mb-4 text-blue-700">{icon}</div>
      <p className="font-black text-blue-950">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
        {description}
      </p>
    </Link>
  );
}

export function DashboardWorkspace({ data }: { data: DashboardData }) {
  const [tab, setTab] = useState<DashboardTab>("alertas");
  const [search, setSearch] = useState("");
  const [ajudaOpen, setAjudaOpen] = useState(false);

  const filteredAlerts = useMemo(() => {
    const q = search.trim().toLowerCase();

    const base = data.alerts.filter((alert) => {
      if (tab === "financeiro") return alert.area === "financeiro";
      if (tab === "contratos") return alert.area === "contratos";
      if (tab === "documentos") return alert.area === "documentos";
      return true;
    });

    if (!q) return base;

    return base.filter((alert) =>
      [alert.title, alert.description, alert.area, alert.level]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [data.alerts, search, tab]);

  const tabs: Array<{ id: DashboardTab; label: string; icon: ReactNode }> = [
    { id: "alertas", label: "Alertas", icon: <BellRing className="h-5 w-5" /> },
    { id: "financeiro", label: "Financeiro", icon: <WalletCards className="h-5 w-5" /> },
    { id: "contratos", label: "Contratos", icon: <BookOpenCheck className="h-5 w-5" /> },
    { id: "documentos", label: "Documentos", icon: <FileText className="h-5 w-5" /> },
    { id: "atividades", label: "Atividades", icon: <CheckCircle2 className="h-5 w-5" /> },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 grid gap-5 md:grid-cols-4">
        <MetricCard
          icon={<Building2 className="h-7 w-7" />}
          label="Empresas ativas"
          value={String(data.stats.empresasAtivas)}
        />
        <MetricCard
          icon={<GraduationCap className="h-7 w-7" />}
          label="Estagiários ativos"
          value={String(data.stats.estagiariosAtivos)}
        />
        <MetricCard
          icon={<BookOpenCheck className="h-7 w-7" />}
          label="Contratos ativos"
          value={String(data.stats.contratosAtivos)}
          helper={`${data.stats.contratosVencidos} vencido(s)`}
        />
        <MetricCard
          icon={<WalletCards className="h-7 w-7 text-red-600" />}
          label="Financeiro em atraso"
          value={String(data.stats.mensalidadesAtrasadas)}
        />
      </div>

      <div className="mb-8 grid gap-5 md:grid-cols-4">
        <QuickActionCard
          title="Empresas"
          description="Cadastrar, consultar e editar empresas concedentes."
          href="/rh/empresas"
          icon={<Building2 className="h-7 w-7" />}
        />
        <QuickActionCard
          title="Estagiários"
          description="Acompanhar alunos, seguros, documentos e status."
          href="/rh/estagiarios"
          icon={<GraduationCap className="h-7 w-7" />}
        />
        <QuickActionCard
          title="Financeiro"
          description="Gerar carnês, baixar parcelas e acompanhar atrasos."
          href="/rh/financeiro"
          icon={<WalletCards className="h-7 w-7" />}
        />
        <QuickActionCard
          title="Match"
          description="Ver compatibilidade entre empresas e estagiários."
          href="/rh/match"
          icon={<Target className="h-7 w-7" />}
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
          {tab !== "atividades" ? (
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Pesquisar alertas por área, nível ou descrição"
                className="h-12 w-full rounded-xl border border-slate-200 pl-12 pr-4 text-sm font-bold outline-none focus:border-blue-500"
              />
            </div>
          ) : (
            <div className="flex-1" />
          )}

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

      {tab === "atividades" ? (
        <TableShell
          title="Atividades recentes"
          description="Últimas ações registradas na auditoria."
        >
          <ActivitiesList activities={data.activities} />
        </TableShell>
      ) : (
        <TableShell
          title="Alertas"
          description="Pontos críticos e acompanhamentos que exigem atenção do RH."
        >
          <AlertsTable alerts={filteredAlerts} />
        </TableShell>
      )}

      <Modal
        open={ajudaOpen}
        onClose={() => setAjudaOpen(false)}
        title="Ajuda do dashboard"
        description="Resumo operacional da página inicial."
        size="md"
      >
        <div className="space-y-4 text-sm leading-7 text-slate-600">
          <p>
            O dashboard resume os pontos críticos do sistema: contratos vencidos,
            financeiro em atraso, pendências críticas, alunos do 3º ano e
            documentos.
          </p>
          <p>
            Use as abas para filtrar os alertas por área e os cards de ação
            rápida para ir direto ao módulo necessário.
          </p>
          <p>
            A aba <strong>Atividades</strong> mostra os últimos registros de
            auditoria.
          </p>
        </div>
      </Modal>
    </section>
  );
}