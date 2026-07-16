"use client";

import { Modal } from "@/components/ui/Modal";
import { EstagiarioForm } from "@/features/estagiarios/EstagiarioForm";
import {
  AlertTriangle,
  CheckCircle2,
  Edit,
  HelpCircle,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

type EstagiarioItem = {
  id: string;
  nome: string | null;
  telefone: string | null;
  email: string | null;
  serie_ano: string | null;
  turno: string | null;
  escola: string | null;
  escola_endereco?: string | null;
  escola_bairro?: string | null;
  escola_cnpj?: string | null;
  escola_inscricao_estadual?: string | null;
  funcao: string | null;
  valor_bolsa: number | null;
  data_vencimento_seguro: string | null;
  status: string | null;
  criado_em: string | null;
  foto_url?: string | null;
  foto_file_name?: string | null;
  cpf?: string | null;
  rg?: string | null;
  data_nascimento?: string | null;
  endereco?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  loja_trabalho?: string | null;
  numero_apolice?: string | null;
  seguradora?: string | null;
  observacoes?: string | null;
};

type EstagiariosTab = "ativos" | "terceiro_ano" | "seguros" | "inativos" | "todos";

type ApiResult = {
  ok?: boolean;
  message?: string;
  data?: EstagiarioItem;
};

function formatDate(date: string | null | undefined) {
  if (!date) return "Não informado";

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(parsed);
}

function formatCurrency(value: number | null | undefined) {
  const parsed = Number(value ?? 0);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(parsed) ? parsed : 0);
}

function isTerceiroAno(serie: string | null | undefined) {
  return String(serie || "").toLowerCase().includes("3");
}

function getSeguroStatus(dataVencimento: string | null | undefined) {
  if (!dataVencimento) return "pendente";

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const vencimento = new Date(`${dataVencimento}T00:00:00`);

  if (Number.isNaN(vencimento.getTime())) {
    return "pendente";
  }

  const diffDays = Math.ceil(
    (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) return "vencido";
  if (diffDays <= 30) return "vencendo";
  return "ok";
}

function getNomeEstagiario(estagiario: EstagiarioItem) {
  return estagiario.nome || "Estagiário sem nome definido";
}

function abbreviateName(name: string | null | undefined) {
  const clean = String(name || "").replace(/\s+/g, " ").trim();

  if (!clean) return "Sem nome";

  const parts = clean.split(" ").filter(Boolean);

  if (parts.length <= 2) return clean;

  return `${parts[0]} ${parts[parts.length - 1]}`;
}

function firstActivity(value: string | null | undefined) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();

  if (!clean) return "Não informada";

  const first =
    clean
      .split(/[,;\n•|/]+/)
      .map((item) => item.trim())
      .filter(Boolean)[0] || clean;

  const words = first.split(" ").filter(Boolean);

  if (words.length <= 8) return first;

  return `${words.slice(0, 8).join(" ")}...`;
}

function schoolShort(value: string | null | undefined) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();

  if (!clean) return "Não informada";

  const words = clean.split(" ");

  if (words.length <= 5) return clean;

  return `${words.slice(0, 5).join(" ")}...`;
}

function statusClass(status: string | null | undefined) {
  if (String(status || "ativo") === "ativo") {
    return "border-green-100 bg-green-50 text-green-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
}

function seguroClass(status: string) {
  if (status === "vencido") return "border-red-100 bg-red-50 text-red-700";
  if (status === "vencendo") return "border-yellow-100 bg-yellow-50 text-yellow-700";
  if (status === "pendente") return "border-slate-200 bg-slate-50 text-slate-600";
  return "border-green-100 bg-green-50 text-green-700";
}

function detailValue(value: string | number | null | undefined, fallback = "Não informado") {
  if (value === null || value === undefined) return fallback;

  const text = String(value).trim();

  return text || fallback;
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

function Avatar({ estagiario }: { estagiario: EstagiarioItem }) {
  const name = getNomeEstagiario(estagiario);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  if (estagiario.foto_url) {
    return (
      <img
        src={estagiario.foto_url}
        alt={name}
        className="h-11 w-11 rounded-2xl object-cover"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-sm font-black text-blue-800">
      {initials || "AL"}
    </div>
  );
}

function IconButton({
  title,
  children,
  className,
  onClick,
  href,
  disabled,
}: {
  title: string;
  children: ReactNode;
  className: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}) {
  if (href) {
    return (
      <Link
        href={href}
        title={title}
        aria-label={title}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition ${className}`}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>

      <div className="mt-2 text-sm font-bold leading-6 text-blue-950">
        {value}
      </div>
    </div>
  );
}

export function EstagiariosWorkspace({
  estagiarios,
}: {
  estagiarios: EstagiarioItem[];
}) {
  const [rows, setRows] = useState<EstagiarioItem[]>(estagiarios);
  const [tab, setTab] = useState<EstagiariosTab>("ativos");
  const [novoOpen, setNovoOpen] = useState(false);
  const [ajudaOpen, setAjudaOpen] = useState(false);
  const [selected, setSelected] = useState<EstagiarioItem | null>(null);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const ativos = useMemo(
    () => rows.filter((item) => String(item.status || "ativo") === "ativo"),
    [rows],
  );

  const inativos = useMemo(
    () => rows.filter((item) => String(item.status || "ativo") !== "ativo"),
    [rows],
  );

  const terceiroAno = useMemo(
    () => ativos.filter((item) => isTerceiroAno(item.serie_ano)),
    [ativos],
  );

  const segurosCriticos = useMemo(
    () =>
      ativos.filter((item) => {
        const status = getSeguroStatus(item.data_vencimento_seguro);
        return status === "vencido" || status === "vencendo" || status === "pendente";
      }),
    [ativos],
  );

  const semFoto = useMemo(
    () => ativos.filter((item) => !item.foto_url),
    [ativos],
  );

  const baseList = useMemo(() => {
    if (tab === "ativos") return ativos;
    if (tab === "inativos") return inativos;
    if (tab === "terceiro_ano") return terceiroAno;
    if (tab === "seguros") return segurosCriticos;
    return rows;
  }, [tab, ativos, inativos, terceiroAno, segurosCriticos, rows]);

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
        estagiario.loja_trabalho,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [baseList, search]);

  async function updateStatus(estagiario: EstagiarioItem, status: "ativo" | "inativo") {
    const studentId = String(estagiario.id || "").trim();

    if (!studentId) {
      setActionMessage({
        ok: false,
        text: "Estagiário sem ID. Não foi possível alterar o status.",
      });
      return;
    }

    const name = getNomeEstagiario(estagiario);
    const confirmed = window.confirm(
      status === "inativo"
        ? `Deseja inativar ${name}? O histórico será mantido.`
        : `Deseja reativar ${name}?`,
    );

    if (!confirmed) return;

    setBusyId(studentId);
    setActionMessage(null);

    try {
      const response = await fetch("/api/rh/estagiarios/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          student_id: studentId,
          status,
          motivo:
            status === "inativo"
              ? "Estagiário inativado pelo painel RH."
              : "Estagiário reativado pelo painel RH.",
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
            String(item.id) === studentId
              ? {
                  ...item,
                  ...(result.data || {}),
                  status,
                }
              : item,
          ),
        );

        setSelected((current) =>
          current && String(current.id) === studentId
            ? {
                ...current,
                ...(result.data || {}),
                status,
              }
            : current,
        );
      }
    } catch (error) {
      setActionMessage({
        ok: false,
        text:
          error instanceof Error
            ? `Erro ao alterar status: ${error.message}`
            : "Erro ao alterar status do estagiário.",
      });
    } finally {
      setBusyId(null);
    }
  }

  const tabs: Array<{ id: EstagiariosTab; label: string; count: number }> = [
    { id: "ativos", label: "Ativos", count: ativos.length },
    { id: "terceiro_ano", label: "3º ano", count: terceiroAno.length },
    { id: "seguros", label: "Seguros", count: segurosCriticos.length },
    { id: "inativos", label: "Inativos", count: inativos.length },
    { id: "todos", label: "Todos", count: rows.length },
  ];

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
          <UserRound className="h-7 w-7 text-blue-700" />
          <p className="mt-4 text-sm font-black uppercase tracking-[0.25em] text-slate-400">
            Estagiários
          </p>
          <p className="mt-2 text-3xl font-black text-blue-950">{rows.length}</p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <CheckCircle2 className="h-7 w-7 text-green-600" />
          <p className="mt-4 text-sm font-black uppercase tracking-[0.25em] text-slate-400">
            Ativos
          </p>
          <p className="mt-2 text-3xl font-black text-blue-950">{ativos.length}</p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <AlertTriangle className="h-7 w-7 text-yellow-700" />
          <p className="mt-4 text-sm font-black uppercase tracking-[0.25em] text-slate-400">
            3º ano
          </p>
          <p className="mt-2 text-3xl font-black text-blue-950">{terceiroAno.length}</p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <ShieldCheck className="h-7 w-7 text-red-600" />
          <p className="mt-4 text-sm font-black uppercase tracking-[0.25em] text-slate-400">
            Alertas seguro
          </p>
          <p className="mt-2 text-3xl font-black text-blue-950">{segurosCriticos.length}</p>
        </div>
      </div>

      <div className="mb-6 rounded-3xl bg-white p-4 shadow-sm">
        <div className="grid gap-4">
          <div className="rounded-2xl bg-slate-100 p-1">
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 xl:grid-cols-5">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`min-h-12 rounded-xl px-3 text-center text-sm font-black leading-tight transition ${
                    tab === item.id
                      ? "bg-white text-blue-950 shadow-sm"
                      : "text-slate-500 hover:bg-white/70 hover:text-blue-950"
                  }`}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <span className="whitespace-nowrap">{item.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                        tab === item.id
                          ? "bg-blue-50 text-blue-700"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {item.count}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_120px] lg:items-center">
            <label className="relative min-w-0">
              <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Pesquisar estagiário, escola, telefone ou função"
                className="h-12 w-full rounded-xl border border-slate-200 pl-12 pr-4 text-sm font-bold outline-none focus:border-blue-500"
              />
            </label>

            <button
              type="button"
              onClick={() => setNovoOpen(true)}
              className="btn-wisdom-red inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black whitespace-nowrap"
            >
              <Plus className="h-5 w-5 shrink-0" />
              Novo estagiário
            </button>

            <button
              type="button"
              onClick={() => setAjudaOpen(true)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-blue-950 hover:bg-slate-50 whitespace-nowrap"
            >
              <HelpCircle className="h-5 w-5 shrink-0 text-blue-700" />
              Ajuda
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="hidden rounded-2xl bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-blue-950/70 lg:grid lg:grid-cols-[minmax(230px,1.25fr)_minmax(190px,1fr)_minmax(135px,0.7fr)_minmax(180px,0.9fr)_96px] lg:gap-4">
          <span>Estagiário</span>
          <span>Escola</span>
          <span>Série / turno</span>
          <span>Contato / seguro</span>
          <span className="text-right">Ações</span>
        </div>

        <div className="mt-3 space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center">
              <UserRound className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-black text-slate-500">
                Nenhum estagiário encontrado neste filtro.
              </p>
            </div>
          ) : (
            filtered.map((estagiario) => {
              const seguro = getSeguroStatus(estagiario.data_vencimento_seguro);
              const isBusy = busyId === estagiario.id;
              const isActive = String(estagiario.status || "ativo") === "ativo";

              return (
                <article
                  key={estagiario.id}
                  className="rounded-3xl bg-slate-50 p-4 transition hover:bg-slate-100"
                >
                  <div className="grid gap-4 lg:grid-cols-[minmax(230px,1.25fr)_minmax(190px,1fr)_minmax(135px,0.7fr)_minmax(180px,0.9fr)_96px] lg:items-center">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar estagiario={estagiario} />

                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setSelected(estagiario)}
                          title={getNomeEstagiario(estagiario)}
                          className="block max-w-full truncate text-left text-sm font-black uppercase text-blue-950 underline-offset-4 hover:underline"
                        >
                          {abbreviateName(estagiario.nome)}
                        </button>

                        <p className="mt-0.5 truncate text-[11px] font-bold text-slate-500">
                          {estagiario.foto_url ? "Com foto" : "Sem foto"}
                        </p>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 lg:hidden">
                        Escola
                      </p>

                      <p
                        title={detailValue(estagiario.escola)}
                        className="text-sm font-bold leading-5 text-blue-950"
                        style={{
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 2,
                          overflow: "hidden",
                        }}
                      >
                        {schoolShort(estagiario.escola)}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 lg:hidden">
                        Série / turno
                      </p>

                      <p className="truncate text-sm font-black text-blue-950">
                        {detailValue(estagiario.serie_ano)}
                      </p>

                      <p className="mt-1 truncate text-xs font-bold text-slate-500">
                        {detailValue(estagiario.turno)}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 lg:hidden">
                        Contato / seguro
                      </p>

                      <div className="grid gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-blue-950">
                            {detailValue(estagiario.telefone)}
                          </p>

                          <p className="truncate text-[11px] font-bold text-slate-500">
                            {detailValue(estagiario.email, "E-mail não informado")}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black text-blue-950">
                            {formatDate(estagiario.data_vencimento_seguro)}
                          </span>

                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black ${seguroClass(seguro)}`}
                          >
                            {seguro}
                          </span>

                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black ${statusClass(
                              estagiario.status,
                            )}`}
                          >
                            {estagiario.status || "ativo"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-start gap-2 lg:justify-end">
                      <IconButton
                        href={`/rh/estagiarios/${estagiario.id}/editar`}
                        title="Editar estagiário"
                        className="bg-blue-700 text-white hover:bg-blue-800"
                      >
                        <Edit className="h-4 w-4" />
                      </IconButton>

                      {isActive ? (
                        <IconButton
                          title="Inativar estagiário"
                          onClick={() => updateStatus(estagiario, "inativo")}
                          disabled={isBusy}
                          className="border border-red-100 bg-white text-red-700 hover:bg-red-50"
                        >
                          {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                        </IconButton>
                      ) : (
                        <IconButton
                          title="Reativar estagiário"
                          onClick={() => updateStatus(estagiario, "ativo")}
                          disabled={isBusy}
                          className="border border-green-100 bg-white text-green-700 hover:bg-green-50"
                        >
                          {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                        </IconButton>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-100 bg-white px-4 py-3">
                    <div className="grid gap-2 md:grid-cols-[92px_1fr] md:items-start">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Função
                      </p>

                      <p
                        title={detailValue(estagiario.funcao)}
                        className="text-sm font-bold leading-6 text-blue-950"
                        style={{
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 2,
                          overflow: "hidden",
                        }}
                      >
                        {firstActivity(estagiario.funcao)}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <p className="mt-4 text-xs font-bold text-slate-500">
          Exibindo {filtered.length} de {baseList.length} registro(s). {semFoto.length} ativo(s) sem foto cadastrada.
        </p>
      </div>

      <Modal
        open={novoOpen}
        onClose={() => setNovoOpen(false)}
        title="Novo estagiário"
        description="Cadastre dados pessoais, escola, função, seguro e documentos."
        size="xl"
      >
        <EstagiarioForm />
      </Modal>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? getNomeEstagiario(selected) : "Detalhes do estagiário"}
        description="Resumo completo do cadastro selecionado."
        size="xl"
      >
        {selected ? (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-3xl bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Avatar estagiario={selected} />

                <div>
                  <h3 className="text-xl font-black text-blue-950">
                    {getNomeEstagiario(selected)}
                  </h3>

                  <p className="mt-1 text-sm font-bold text-slate-500">
                    {detailValue(selected.email, "E-mail não informado")} • {detailValue(selected.telefone)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/rh/estagiarios/${selected.id}/editar`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-black text-white hover:bg-blue-800"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Link>

                {String(selected.status || "ativo") === "ativo" ? (
                  <button
                    type="button"
                    onClick={() => updateStatus(selected, "inativo")}
                    disabled={busyId === selected.id}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-100 bg-white px-4 text-sm font-black text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyId === selected.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    Inativar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => updateStatus(selected, "ativo")}
                    disabled={busyId === selected.id}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-green-100 bg-white px-4 text-sm font-black text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyId === selected.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Reativar
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <DetailItem label="Nome completo" value={getNomeEstagiario(selected)} />
              <DetailItem label="Telefone" value={detailValue(selected.telefone)} />
              <DetailItem label="E-mail" value={detailValue(selected.email)} />
              <DetailItem label="CPF" value={detailValue(selected.cpf)} />
              <DetailItem label="RG" value={detailValue(selected.rg)} />
              <DetailItem label="Nascimento" value={formatDate(selected.data_nascimento)} />
              <DetailItem label="Série / turno" value={`${detailValue(selected.serie_ano)} • ${detailValue(selected.turno)}`} />
              <DetailItem label="Escola" value={detailValue(selected.escola)} />
              <DetailItem label="Endereço da escola" value={detailValue(selected.escola_endereco)} />
              <DetailItem label="Bairro da escola" value={detailValue(selected.escola_bairro)} />
              <DetailItem label="CNPJ da escola" value={detailValue(selected.escola_cnpj)} />
              <DetailItem label="Inscrição estadual escola" value={detailValue(selected.escola_inscricao_estadual)} />
              <DetailItem label="Empresa/loja" value={detailValue(selected.loja_trabalho)} />
              <DetailItem label="Bolsa" value={formatCurrency(selected.valor_bolsa)} />
              <DetailItem label="Seguro" value={formatDate(selected.data_vencimento_seguro)} />
              <DetailItem label="Apólice" value={detailValue(selected.numero_apolice)} />
              <DetailItem label="Seguradora" value={detailValue(selected.seguradora)} />
              <DetailItem label="Status" value={detailValue(selected.status || "ativo")} />
            </div>

            <DetailItem
              label="Funções / atividades completas"
              value={detailValue(selected.funcao)}
            />

            <DetailItem
              label="Observações"
              value={detailValue(selected.observacoes)}
            />
          </div>
        ) : null}
      </Modal>

      <Modal
        open={ajudaOpen}
        onClose={() => setAjudaOpen(false)}
        title="Ajuda da lista de estagiários"
        description="Como usar a visualização compacta."
        size="md"
      >
        <div className="space-y-4 text-sm font-bold leading-7 text-slate-600">
          <p>
            A lista exibe apenas a primeira função para manter a leitura limpa.
            O texto completo fica disponível ao clicar no nome do estagiário.
          </p>

          <p>
            Os botões da lista foram reduzidos para ícones. Passe o mouse sobre
            o botão para ver a ação, ou abra o modal do aluno para ver as opções
            com texto.
          </p>

          <p>
            A tela foi reorganizada para evitar sobreposição, quebra ruim de
            botões e barra de rolagem horizontal.
          </p>
        </div>
      </Modal>
    </section>
  );
}