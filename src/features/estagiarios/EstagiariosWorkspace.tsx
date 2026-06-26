"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { inativarEstagiarioAction } from "@/actions/rh/estagiario.actions";
import { Modal } from "@/components/ui/Modal";
import { StudentIdentity } from "@/components/ui/StudentAvatar";
import { EmptyTable, MetricCard, StatusPill, TableShell } from "@/components/ui/WorkspaceUi";
import { EstagiarioForm } from "@/features/estagiarios/EstagiarioForm";
import {
  AlertTriangle,
  CheckCircle2,
  Edit,
  GraduationCap,
  HelpCircle,
  Plus,
  Search,
  ShieldAlert,
  UserRound,
  XCircle,
} from "lucide-react";

type EstagiarioItem = {
  id: string;
  nome: string | null;
  telefone: string | null;
  email: string | null;
  serie_ano: string | null;
  turno: string | null;
  escola: string | null;
  funcao: string | null;
  valor_bolsa: number | null;
  data_vencimento_seguro: string | null;
  status: string | null;
  criado_em: string | null;
  foto_url?: string | null;
  foto_file_name?: string | null;
};

type EstagiariosTab = "ativos" | "terceiro_ano" | "seguros" | "inativos" | "todos";

function formatDate(date: string | null) {
  if (!date) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(new Date(date));
}

function isTerceiroAno(serie: string | null) {
  return String(serie || "").toLowerCase().includes("3");
}

function getSeguroStatus(dataVencimento: string | null) {
  if (!dataVencimento) return "pendente";

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const vencimento = new Date(`${dataVencimento}T00:00:00`);
  const diffDays = Math.ceil(
    (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return "vencido";
  if (diffDays <= 30) return "vencendo";
  return "ok";
}

function getNomeEstagiario(estagiario: EstagiarioItem) {
  return estagiario.nome || "Estagiário sem nome definido";
}

function EstagiariosTable({
  estagiarios,
  onInativar,
}: {
  estagiarios: EstagiarioItem[];
  onInativar: (estagiario: EstagiarioItem) => void;
}) {
  if (estagiarios.length === 0) {
    return (
      <EmptyTable
        title="Nenhum estagiário encontrado."
        description="Use o botão Novo cadastro para criar o primeiro registro."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1130px] w-full border-separate border-spacing-y-2">
        <thead>
          <tr className="text-left text-xs font-black uppercase tracking-wide text-slate-500">
            <th className="px-4 py-2">Estagiário</th>
            <th className="px-4 py-2">Escola</th>
            <th className="px-4 py-2">Série/Turno</th>
            <th className="px-4 py-2">Contato</th>
            <th className="px-4 py-2">Função</th>
            <th className="px-4 py-2">Seguro</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2 text-right">Ações</th>
          </tr>
        </thead>

        <tbody>
          {estagiarios.map((estagiario) => {
            const seguro = getSeguroStatus(estagiario.data_vencimento_seguro);

            return (
              <tr key={estagiario.id} className="bg-slate-50">
                <td className="rounded-l-2xl px-4 py-4">
                  <StudentIdentity
                    name={getNomeEstagiario(estagiario)}
                    photoUrl={estagiario.foto_url}
                    subtitle={isTerceiroAno(estagiario.serie_ano) ? "Aluno do 3º ano" : estagiario.foto_url ? "Foto cadastrada" : "Sem foto"}
                  />
                </td>

                <td className="px-4 py-4 font-bold text-slate-700">
                  {estagiario.escola || "Não informado"}
                </td>

                <td className="px-4 py-4 font-bold text-slate-700">
                  {[estagiario.serie_ano, estagiario.turno]
                    .filter(Boolean)
                    .join(" • ") || "Não informado"}
                </td>

                <td className="px-4 py-4">
                  <p className="font-bold text-slate-700">
                    {estagiario.telefone || "Telefone não informado"}
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    {estagiario.email || "E-mail não informado"}
                  </p>
                </td>

                <td className="px-4 py-4 font-bold text-slate-700">
                  {estagiario.funcao || "Não informado"}
                </td>

                <td className="px-4 py-4">
                  <p className="font-bold text-slate-700">
                    {formatDate(estagiario.data_vencimento_seguro)}
                  </p>
                  {seguro === "vencido" ? (
                    <p className="text-xs font-black text-red-700">Vencido</p>
                  ) : null}
                  {seguro === "vencendo" ? (
                    <p className="text-xs font-black text-yellow-700">Vencendo</p>
                  ) : null}
                </td>

                <td className="px-4 py-4">
                  <StatusPill tone={estagiario.status === "ativo" ? "ok" : "muted"}>
                    {estagiario.status || "ativo"}
                  </StatusPill>
                </td>

                <td className="rounded-r-2xl px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/rh/estagiarios/${estagiario.id}/editar`}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Link>

                    {estagiario.status === "ativo" ? (
                      <button
                        type="button"
                        onClick={() => onInativar(estagiario)}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-black text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4" />
                        Inativar
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function EstagiariosWorkspace({
  estagiarios,
}: {
  estagiarios: EstagiarioItem[];
}) {
  const [tab, setTab] = useState<EstagiariosTab>("ativos");
  const [novoOpen, setNovoOpen] = useState(false);
  const [ajudaOpen, setAjudaOpen] = useState(false);
  const [estagiarioInativar, setEstagiarioInativar] = useState<EstagiarioItem | null>(null);
  const [search, setSearch] = useState("");

  const ativos = estagiarios.filter((item) => item.status === "ativo");
  const inativos = estagiarios.filter((item) => item.status !== "ativo");
  const terceiroAno = ativos.filter((item) => isTerceiroAno(item.serie_ano));
  const segurosCriticos = ativos.filter((item) => {
    const status = getSeguroStatus(item.data_vencimento_seguro);
    return status === "vencido" || status === "vencendo" || status === "pendente";
  });
  const semFoto = ativos.filter((item) => !item.foto_url);

  const baseList = useMemo(() => {
    if (tab === "ativos") return ativos;
    if (tab === "inativos") return inativos;
    if (tab === "terceiro_ano") return terceiroAno;
    if (tab === "seguros") return segurosCriticos;
    return estagiarios;
  }, [tab, ativos, inativos, terceiroAno, segurosCriticos, estagiarios]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return baseList;

    return baseList.filter((estagiario) =>
      [
        estagiario.nome,
        estagiario.telefone,
        estagiario.email,
        estagiario.serie_ano,
        estagiario.turno,
        estagiario.escola,
        estagiario.funcao,
        estagiario.foto_file_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [baseList, search]);

  const tabs: Array<{ id: EstagiariosTab; label: string; icon: React.ReactNode }> = [
    { id: "ativos", label: "Ativos", icon: <CheckCircle2 className="h-5 w-5" /> },
    { id: "terceiro_ano", label: "3º ano", icon: <AlertTriangle className="h-5 w-5" /> },
    { id: "seguros", label: "Seguros", icon: <ShieldAlert className="h-5 w-5" /> },
    { id: "inativos", label: "Inativos", icon: <XCircle className="h-5 w-5" /> },
    { id: "todos", label: "Todos", icon: <UserRound className="h-5 w-5" /> },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 grid gap-5 md:grid-cols-5">
        <MetricCard
          icon={<GraduationCap className="h-7 w-7" />}
          label="Estagiários"
          value={String(estagiarios.length)}
          helper="total cadastrado"
        />
        <MetricCard
          icon={<CheckCircle2 className="h-7 w-7 text-green-600" />}
          label="Ativos"
          value={String(ativos.length)}
        />
        <MetricCard
          icon={<AlertTriangle className="h-7 w-7 text-yellow-700" />}
          label="3º ano"
          value={String(terceiroAno.length)}
        />
        <MetricCard
          icon={<ShieldAlert className="h-7 w-7 text-red-600" />}
          label="Seguros"
          value={String(segurosCriticos.length)}
          helper="vencidos, vencendo ou pendentes"
        />
        <MetricCard
          icon={<UserRound className="h-7 w-7 text-blue-700" />}
          label="Sem foto"
          value={String(semFoto.length)}
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
              placeholder="Pesquisar nome, escola, série, turno, telefone ou função"
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
        title="Estagiários"
        description="Consulta, foto, edição e acompanhamento de status dos estagiários."
      >
        <EstagiariosTable
          estagiarios={filtered}
          onInativar={setEstagiarioInativar}
        />
      </TableShell>

      <Modal
        open={novoOpen}
        onClose={() => setNovoOpen(false)}
        title="Novo estagiário"
        description="Cadastre o estagiário e, após salvar, envie foto e documentos ao registro."
        size="xl"
      >
        <EstagiarioForm />
      </Modal>

      <Modal
        open={Boolean(estagiarioInativar)}
        onClose={() => setEstagiarioInativar(null)}
        title="Inativar estagiário"
        description="O estagiário não será excluído. A alteração ficará registrada na auditoria."
        size="md"
      >
        {estagiarioInativar ? (
          <form action={inativarEstagiarioAction} className="space-y-5">
            <input type="hidden" name="id" value={estagiarioInativar.id} />

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-500">Estagiário</p>
              <div className="mt-3">
                <StudentIdentity
                  name={getNomeEstagiario(estagiarioInativar)}
                  photoUrl={estagiarioInativar.foto_url}
                  subtitle={estagiarioInativar.escola}
                />
              </div>
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
        title="Ajuda de estagiários"
        description="Resumo operacional da página."
        size="md"
      >
        <div className="space-y-4 text-sm leading-7 text-slate-600">
          <p>
            A foto ajuda a identificar estagiários com nomes parecidos e será
            exibida nas telas onde o estagiário aparecer.
          </p>
          <p>
            A imagem é comprimida antes do envio e salva no Google Drive. O
            banco mantém apenas o link e os metadados.
          </p>
          <p>
            Após salvar um novo cadastro, a área de foto e documentos fica
            liberada no próprio formulário.
          </p>
        </div>
      </Modal>
    </section>
  );
}