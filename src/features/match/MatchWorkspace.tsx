"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { registrarDecisaoMatchAction } from "@/actions/rh/match.actions";
import { Modal } from "@/components/ui/Modal";
import { StudentIdentity } from "@/components/ui/StudentAvatar";
import { EmptyTable, MetricCard, StatusPill, TableShell } from "@/components/ui/WorkspaceUi";
import type { MatchItem, MatchStats } from "@/data/rh/match.data";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Search,
  Send,
  Target,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";

type MatchTab = "fortes" | "medios" | "todos" | "encaminhados" | "analisar" | "ignorados";

function companyName(item: MatchItem) {
  return item.nome_fantasia || item.razao_social || "Empresa sem nome";
}

function percentTone(value: number): "ok" | "warning" | "danger" | "info" | "muted" {
  if (value >= 70) return "ok";
  if (value >= 40) return "warning";
  return "danger";
}

function decisionLabel(value: string | null) {
  if (value === "encaminhar") return "Encaminhar";
  if (value === "analisar_depois") return "Analisar depois";
  if (value === "ignorar") return "Ignorado";
  return "Sem decisão";
}

function decisionTone(value: string | null): "ok" | "warning" | "danger" | "info" | "muted" {
  if (value === "encaminhar") return "ok";
  if (value === "analisar_depois") return "warning";
  if (value === "ignorar") return "muted";
  return "info";
}

function MatchTable({
  matches,
  onDecision,
}: {
  matches: MatchItem[];
  onDecision: (match: MatchItem, decisao: "encaminhar" | "analisar_depois" | "ignorar") => void;
}) {
  if (matches.length === 0) {
    return (
      <EmptyTable
        title="Nenhum match encontrado."
        description="Cadastre skills em empresas e estagiários para gerar compatibilidade."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1100px] w-full border-separate border-spacing-y-2">
        <thead>
          <tr className="text-left text-xs font-black uppercase tracking-wide text-slate-500">
            <th className="px-4 py-2">Compatibilidade</th>
            <th className="px-4 py-2">Empresa</th>
            <th className="px-4 py-2">Estagiário</th>
            <th className="px-4 py-2">Skills</th>
            <th className="px-4 py-2">Decisão</th>
            <th className="px-4 py-2 text-right">Ações</th>
          </tr>
        </thead>

        <tbody>
          {matches.map((item) => (
            <tr key={`${item.company_id}-${item.student_id}`} className="bg-slate-50">
              <td className="rounded-l-2xl px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-xl font-black text-blue-950">
                    {Math.round(item.match_percent)}%
                  </div>
                  <div className="min-w-[160px]">
                    <div className="h-2 rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-blue-700"
                        style={{ width: `${Math.min(100, Math.max(0, item.match_percent))}%` }}
                      />
                    </div>
                    <div className="mt-2">
                      <StatusPill tone={percentTone(item.match_percent)}>
                        {item.match_percent >= 70
                          ? "Forte"
                          : item.match_percent >= 40
                            ? "Médio"
                            : "Baixo"}
                      </StatusPill>
                    </div>
                  </div>
                </div>
              </td>

              <td className="px-4 py-4">
                <p className="font-black text-blue-950">{companyName(item)}</p>
                <p className="text-xs font-semibold text-slate-500">
                  Empresa concedente
                </p>
              </td>

              <td className="px-4 py-4">
                <p className="font-black text-blue-950">
                  {item.student_name || "Estagiário sem nome"}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {[item.serie_ano, item.turno].filter(Boolean).join(" • ") ||
                    "Série/turno não informado"}
                </p>
              </td>

              <td className="px-4 py-4 font-bold text-slate-700">
                {item.total_match} de {item.total_skills_empresa}
              </td>

              <td className="px-4 py-4">
                <StatusPill tone={decisionTone(item.decisao)}>
                  {decisionLabel(item.decisao)}
                </StatusPill>
                {item.observacao ? (
                  <p className="mt-2 max-w-[260px] text-xs font-semibold text-slate-500">
                    {item.observacao}
                  </p>
                ) : null}
              </td>

              <td className="rounded-r-2xl px-4 py-4">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onDecision(item, "encaminhar")}
                    className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-xs font-black text-white hover:bg-green-700"
                  >
                    <Send className="h-4 w-4" />
                    Encaminhar
                  </button>

                  <button
                    type="button"
                    onClick={() => onDecision(item, "analisar_depois")}
                    className="inline-flex items-center gap-2 rounded-xl border border-yellow-100 bg-white px-3 py-2 text-xs font-black text-yellow-800 hover:bg-yellow-50"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Analisar
                  </button>

                  <button
                    type="button"
                    onClick={() => onDecision(item, "ignorar")}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Ignorar
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

export function MatchWorkspace({
  matches,
  stats,
}: {
  matches: MatchItem[];
  stats: MatchStats;
}) {
  const [tab, setTab] = useState<MatchTab>("fortes");
  const [search, setSearch] = useState("");
  const [ajudaOpen, setAjudaOpen] = useState(false);
  const [selected, setSelected] = useState<MatchItem | null>(null);
  const [decision, setDecision] = useState<"encaminhar" | "analisar_depois" | "ignorar" | null>(null);

  const baseList = useMemo(() => {
    if (tab === "fortes") return matches.filter((item) => item.match_percent >= 70);
    if (tab === "medios") return matches.filter((item) => item.match_percent >= 40 && item.match_percent < 70);
    if (tab === "encaminhados") return matches.filter((item) => item.decisao === "encaminhar");
    if (tab === "analisar") return matches.filter((item) => item.decisao === "analisar_depois");
    if (tab === "ignorados") return matches.filter((item) => item.decisao === "ignorar");
    return matches;
  }, [tab, matches]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return baseList;

    return baseList.filter((item) =>
      [
        companyName(item),
        item.student_name,
        item.serie_ano,
        item.turno,
        item.decisao,
        item.observacao,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [baseList, search]);

  function openDecision(item: MatchItem, value: "encaminhar" | "analisar_depois" | "ignorar") {
    setSelected(item);
    setDecision(value);
  }

  function closeDecision() {
    setSelected(null);
    setDecision(null);
  }

  const tabs: Array<{ id: MatchTab; label: string; icon: ReactNode }> = [
    { id: "fortes", label: "Fortes", icon: <Target className="h-5 w-5" /> },
    { id: "medios", label: "Médios", icon: <AlertTriangle className="h-5 w-5" /> },
    { id: "todos", label: "Todos", icon: <Users className="h-5 w-5" /> },
    { id: "encaminhados", label: "Encaminhados", icon: <Send className="h-5 w-5" /> },
    { id: "analisar", label: "Analisar", icon: <UserCheck className="h-5 w-5" /> },
    { id: "ignorados", label: "Ignorados", icon: <XCircle className="h-5 w-5" /> },
  ];

  const decisionTitle =
    decision === "encaminhar"
      ? "Encaminhar candidato"
      : decision === "analisar_depois"
        ? "Analisar depois"
        : "Ignorar match";

  const decisionButton =
    decision === "encaminhar"
      ? "Confirmar encaminhamento"
      : decision === "analisar_depois"
        ? "Salvar para análise"
        : "Confirmar ignorar";

  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 grid gap-5 md:grid-cols-5">
        <MetricCard
          icon={<Users className="h-7 w-7" />}
          label="Matches"
          value={String(stats.total)}
        />
        <MetricCard
          icon={<Target className="h-7 w-7 text-green-600" />}
          label="Fortes"
          value={String(stats.fortes)}
          helper="70% ou mais"
        />
        <MetricCard
          icon={<AlertTriangle className="h-7 w-7 text-yellow-700" />}
          label="Médios"
          value={String(stats.medios)}
        />
        <MetricCard
          icon={<Send className="h-7 w-7 text-blue-700" />}
          label="Encaminhados"
          value={String(stats.encaminhados)}
        />
        <MetricCard
          icon={<XCircle className="h-7 w-7 text-slate-500" />}
          label="Ignorados"
          value={String(stats.ignorados)}
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
              placeholder="Pesquisar empresa, estagiário, série, turno ou decisão"
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
        title="Compatibilidade"
        description="Cruzamento entre habilidades desejadas pelas empresas e habilidades cadastradas nos estagiários."
      >
        <MatchTable matches={filtered} onDecision={openDecision} />
      </TableShell>

      <Modal
        open={Boolean(selected && decision)}
        onClose={closeDecision}
        title={decisionTitle}
        description="Registre a decisão do recrutador para este cruzamento."
        size="md"
      >
        {selected && decision ? (
          <form action={registrarDecisaoMatchAction} className="space-y-5">
            <input type="hidden" name="company_id" value={selected.company_id} />
            <input type="hidden" name="student_id" value={selected.student_id} />
            <input type="hidden" name="decisao" value={decision} />

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-500">Empresa</p>
              <p className="mt-1 font-black text-blue-950">{companyName(selected)}</p>
              <p className="mt-4 text-sm font-black text-slate-500">Estagiário</p>
              <p className="mt-1 font-black text-blue-950">
                {selected.student_name || "Estagiário sem nome"}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-600">
                Compatibilidade: {Math.round(selected.match_percent)}%
              </p>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-black text-blue-950">
                Observação
              </span>
              <textarea
                name="observacao"
                rows={4}
                placeholder="Registre uma observação para o histórico."
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
              />
            </label>

            <button
              type="submit"
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-black text-white ${
                decision === "encaminhar"
                  ? "bg-green-600 hover:bg-green-700"
                  : decision === "analisar_depois"
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-slate-700 hover:bg-slate-800"
              }`}
            >
              {decision === "encaminhar" ? <Send className="h-5 w-5" /> : null}
              {decision === "analisar_depois" ? <AlertTriangle className="h-5 w-5" /> : null}
              {decision === "ignorar" ? <XCircle className="h-5 w-5" /> : null}
              {decisionButton}
            </button>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={ajudaOpen}
        onClose={() => setAjudaOpen(false)}
        title="Ajuda do Match"
        description="Resumo operacional da página."
        size="md"
      >
        <div className="space-y-4 text-sm leading-7 text-slate-600">
          <p>
            O match compara as habilidades desejadas pela empresa com as
            habilidades cadastradas no estagiário.
          </p>
          <p>
            Use <strong>Encaminhar</strong> quando o candidato for adequado para
            a empresa.
          </p>
          <p>
            Use <strong>Analisar depois</strong> quando houver potencial, mas
            ainda faltar validação do recrutador.
          </p>
          <p>
            Use <strong>Ignorar</strong> quando o cruzamento não fizer sentido
            para aquela vaga.
          </p>
        </div>
      </Modal>
    </section>
  );
}