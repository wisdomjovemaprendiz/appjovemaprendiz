"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  adiarPendenciaAction,
  ignorarPendenciaAction,
  resolverPendenciaAction,
} from "@/actions/rh/pendencia.actions";
import { Modal } from "@/components/ui/Modal";
import { EmptyTable, MetricCard, StatusPill, TableShell } from "@/components/ui/WorkspaceUi";
import type { PendenciaItem, PendenciasStats } from "@/data/rh/pendencias.data";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Clock3,
  HelpCircle,
  Info,
  Search,
  ShieldAlert,
  XCircle,
} from "lucide-react";

type PendenciasTab = "pendentes" | "criticas" | "atencao" | "adiadas" | "historico";

function formatDateTime(date: string | null) {
  if (!date) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function nivelTone(nivel: string): "ok" | "warning" | "danger" | "info" | "muted" {
  if (nivel === "critico") return "danger";
  if (nivel === "informativo") return "info";
  return "warning";
}

function statusTone(status: string): "ok" | "warning" | "danger" | "info" | "muted" {
  if (status === "resolvido") return "ok";
  if (status === "ignorado") return "muted";
  if (status === "adiado") return "info";
  return "warning";
}

function entityLabel(type: string | null) {
  if (type === "empresa") return "Empresa";
  if (type === "estagiario") return "Estagiário";
  if (type === "contrato") return "Contrato";
  if (type === "financeiro") return "Financeiro";
  return "Geral";
}

function PendenciasTable({
  pendencias,
  onAction,
}: {
  pendencias: PendenciaItem[];
  onAction: (pendencia: PendenciaItem, action: "resolver" | "adiar" | "ignorar") => void;
}) {
  if (pendencias.length === 0) {
    return (
      <EmptyTable
        title="Nenhuma pendência encontrada."
        description="As pendências geradas pelo sistema serão listadas aqui."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1100px] w-full border-separate border-spacing-y-2">
        <thead>
          <tr className="text-left text-xs font-black uppercase tracking-wide text-slate-500">
            <th className="px-4 py-2">Pendência</th>
            <th className="px-4 py-2">Vínculo</th>
            <th className="px-4 py-2">Campo</th>
            <th className="px-4 py-2">Nível</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Lembrete</th>
            <th className="px-4 py-2 text-right">Ações</th>
          </tr>
        </thead>

        <tbody>
          {pendencias.map((pendencia) => (
            <tr key={pendencia.id} className="bg-slate-50">
              <td className="rounded-l-2xl px-4 py-4">
                <p className="font-black text-blue-950">{pendencia.titulo}</p>
                <p className="mt-1 max-w-[360px] text-xs font-semibold leading-5 text-slate-500">
                  {pendencia.mensagem}
                </p>
              </td>

              <td className="px-4 py-4">
                <p className="font-bold text-slate-700">
                  {entityLabel(pendencia.entity_type)}
                </p>
                <p className="max-w-[220px] truncate text-xs font-semibold text-slate-500">
                  {pendencia.entity_name}
                </p>
              </td>

              <td className="px-4 py-4 font-bold text-slate-700">
                {pendencia.campo || "Não informado"}
              </td>

              <td className="px-4 py-4">
                <StatusPill tone={nivelTone(pendencia.nivel)}>
                  {pendencia.nivel}
                </StatusPill>
              </td>

              <td className="px-4 py-4">
                <StatusPill tone={statusTone(pendencia.status)}>
                  {pendencia.status}
                </StatusPill>
              </td>

              <td className="px-4 py-4 font-bold text-slate-700">
                {formatDateTime(pendencia.lembrar_em)}
              </td>

              <td className="rounded-r-2xl px-4 py-4">
                {pendencia.status === "resolvido" || pendencia.status === "ignorado" ? (
                  <span className="block text-right text-xs font-black text-slate-400">
                    Sem ação
                  </span>
                ) : (
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onAction(pendencia, "resolver")}
                      className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-xs font-black text-white hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Resolver
                    </button>

                    <button
                      type="button"
                      onClick={() => onAction(pendencia, "adiar")}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-50"
                    >
                      <Clock3 className="h-4 w-4" />
                      Adiar
                    </button>

                    <button
                      type="button"
                      onClick={() => onAction(pendencia, "ignorar")}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-black text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Ignorar
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PendenciasWorkspace({
  pendencias,
  stats,
}: {
  pendencias: PendenciaItem[];
  stats: PendenciasStats;
}) {
  const [tab, setTab] = useState<PendenciasTab>("pendentes");
  const [search, setSearch] = useState("");
  const [ajudaOpen, setAjudaOpen] = useState(false);
  const [selected, setSelected] = useState<PendenciaItem | null>(null);
  const [actionType, setActionType] = useState<"resolver" | "adiar" | "ignorar" | null>(null);

  const baseList = useMemo(() => {
    if (tab === "criticas") {
      return pendencias.filter((item) => item.nivel === "critico" && item.status !== "resolvido" && item.status !== "ignorado");
    }

    if (tab === "atencao") {
      return pendencias.filter((item) => item.nivel === "atencao" && item.status !== "resolvido" && item.status !== "ignorado");
    }

    if (tab === "adiadas") {
      return pendencias.filter((item) => item.status === "adiado");
    }

    if (tab === "historico") {
      return pendencias.filter((item) => item.status === "resolvido" || item.status === "ignorado");
    }

    return pendencias.filter((item) => item.status === "pendente" || item.status === "adiado");
  }, [tab, pendencias]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return baseList;

    return baseList.filter((item) =>
      [
        item.titulo,
        item.mensagem,
        item.campo,
        item.entity_type,
        item.entity_name,
        item.nivel,
        item.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [baseList, search]);

  function openAction(pendencia: PendenciaItem, action: "resolver" | "adiar" | "ignorar") {
    setSelected(pendencia);
    setActionType(action);
  }

  function closeAction() {
    setSelected(null);
    setActionType(null);
  }

  const tabs: Array<{ id: PendenciasTab; label: string; icon: ReactNode }> = [
    { id: "pendentes", label: "Pendentes", icon: <BellRing className="h-5 w-5" /> },
    { id: "criticas", label: "Críticas", icon: <ShieldAlert className="h-5 w-5" /> },
    { id: "atencao", label: "Atenção", icon: <AlertTriangle className="h-5 w-5" /> },
    { id: "adiadas", label: "Adiadas", icon: <Clock3 className="h-5 w-5" /> },
    { id: "historico", label: "Histórico", icon: <CheckCircle2 className="h-5 w-5" /> },
  ];

  const actionTitle =
    actionType === "resolver"
      ? "Resolver pendência"
      : actionType === "adiar"
        ? "Adiar pendência"
        : "Ignorar pendência";

  const actionDescription =
    actionType === "resolver"
      ? "Marque esta pendência como resolvida."
      : actionType === "adiar"
        ? "Defina quando esta pendência deve voltar a aparecer."
        : "Ignore esta pendência quando ela não for mais necessária.";

  const action = actionType === "resolver"
    ? resolverPendenciaAction
    : actionType === "adiar"
      ? adiarPendenciaAction
      : ignorarPendenciaAction;

  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 grid gap-5 md:grid-cols-5">
        <MetricCard
          icon={<BellRing className="h-7 w-7" />}
          label="Pendentes"
          value={String(stats.pendentes)}
        />
        <MetricCard
          icon={<ShieldAlert className="h-7 w-7 text-red-600" />}
          label="Críticas"
          value={String(stats.criticas)}
        />
        <MetricCard
          icon={<AlertTriangle className="h-7 w-7 text-yellow-700" />}
          label="Atenção"
          value={String(stats.atencao)}
        />
        <MetricCard
          icon={<Clock3 className="h-7 w-7 text-blue-700" />}
          label="Adiadas"
          value={String(stats.adiadas)}
        />
        <MetricCard
          icon={<CheckCircle2 className="h-7 w-7 text-green-600" />}
          label="Resolvidas"
          value={String(stats.resolvidas)}
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
              placeholder="Pesquisar pendência, vínculo, campo, status ou nível"
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
        title="Pendências"
        description="Acompanhamento de cadastros incompletos, alertas e lembretes operacionais."
      >
        <PendenciasTable pendencias={filtered} onAction={openAction} />
      </TableShell>

      <Modal
        open={Boolean(selected && actionType)}
        onClose={closeAction}
        title={actionTitle}
        description={actionDescription}
        size="md"
      >
        {selected && actionType ? (
          <form action={action} className="space-y-5">
            <input type="hidden" name="id" value={selected.id} />

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-500">Pendência</p>
              <p className="mt-1 font-black text-blue-950">{selected.titulo}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {selected.entity_name}
              </p>
            </div>

            {actionType === "adiar" ? (
              <label className="grid gap-2">
                <span className="text-sm font-black text-blue-950">
                  Lembrar novamente em
                </span>
                <select
                  name="dias"
                  defaultValue="7"
                  className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-500"
                >
                  <option value="1">1 dia</option>
                  <option value="3">3 dias</option>
                  <option value="7">7 dias</option>
                  <option value="15">15 dias</option>
                  <option value="30">30 dias</option>
                </select>
              </label>
            ) : null}

            <label className="grid gap-2">
              <span className="text-sm font-black text-blue-950">
                Motivo/observação
              </span>
              <textarea
                name="motivo"
                rows={4}
                required={actionType === "ignorar"}
                placeholder="Registre uma observação para o histórico."
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
              />
            </label>

            <button
              type="submit"
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-black text-white ${
                actionType === "ignorar"
                  ? "bg-red-600 hover:bg-red-700"
                  : actionType === "adiar"
                    ? "bg-blue-700 hover:bg-blue-800"
                    : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {actionType === "resolver" ? <CheckCircle2 className="h-5 w-5" /> : null}
              {actionType === "adiar" ? <Clock3 className="h-5 w-5" /> : null}
              {actionType === "ignorar" ? <XCircle className="h-5 w-5" /> : null}
              Confirmar
            </button>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={ajudaOpen}
        onClose={() => setAjudaOpen(false)}
        title="Ajuda de pendências"
        description="Resumo operacional da página."
        size="md"
      >
        <div className="space-y-4 text-sm leading-7 text-slate-600">
          <p>
            As pendências são geradas para lembrar ajustes em cadastros,
            documentos, contratos, seguros ou informações incompletas.
          </p>
          <p>
            Use <strong>Resolver</strong> quando o problema foi corrigido.
          </p>
          <p>
            Use <strong>Adiar</strong> quando a pendência ainda existe, mas deve
            voltar em outra data.
          </p>
          <p>
            Use <strong>Ignorar</strong> somente quando a pendência não se aplica
            mais ao caso.
          </p>
        </div>
      </Modal>
    </section>
  );
}