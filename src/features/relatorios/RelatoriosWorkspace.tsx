"use client";

import type {
  RelatoriosData,
  RelatorioRow,
} from "@/data/rh/relatorios.data";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  Download,
  FileText,
  GraduationCap,
  Printer,
  Search,
  WalletCards,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

type Tab =
  | "geral"
  | "empresas"
  | "estagiarios"
  | "contratos"
  | "financeiro"
  | "documentos";

type Filters = {
  search: string;
  status: string;
  companyId: string;
  studentId: string;
  dateFrom: string;
  dateTo: string;
  dateMode: string;
  school: string;
  grade: string;
  shift: string;
  city: string;
  hasCnpj: string;
  entityType: string;
  category: string;
};

type ReportColumn = {
  label: string;
  render: (row: RelatorioRow) => ReactNode;
  csv: (row: RelatorioRow) => unknown;
  className?: string;
};

const initialFilters: Filters = {
  search: "",
  status: "",
  companyId: "",
  studentId: "",
  dateFrom: "",
  dateTo: "",
  dateMode: "",
  school: "",
  grade: "",
  shift: "",
  city: "",
  hasCnpj: "",
  entityType: "",
  category: "",
};

function getValue(row: RelatorioRow | null | undefined, keys: string[], fallback = "") {
  if (!row) return fallback;

  for (const key of keys) {
    const value = row[key];

    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return String(value);
    }
  }

  return fallback;
}

function getNumber(row: RelatorioRow | null | undefined, keys: string[], fallback = 0) {
  if (!row) return fallback;

  for (const key of keys) {
    const value = row[key];

    if (value !== null && value !== undefined && String(value).trim() !== "") {
      const number = Number(value);
      return Number.isFinite(number) ? number : fallback;
    }
  }

  return fallback;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatMoney(value: number | string | null | undefined) {
  const number = Number(value ?? 0);

  if (!Number.isFinite(number)) return "R$ 0,00";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(number);
}

function dateTime(value: string | null | undefined) {
  if (!value) return null;

  const clean = String(value).slice(0, 10);
  const date = new Date(`${clean}T12:00:00`);

  if (Number.isNaN(date.getTime())) return null;

  return date.getTime();
}

function todayTime() {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  return date.getTime();
}

function daysFromToday(value: string | null | undefined) {
  const time = dateTime(value);

  if (!time) return null;

  const diff = time - todayTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function isOverdue(dateValue: string | null | undefined, status?: string) {
  const days = daysFromToday(dateValue);

  if (days === null) return false;

  const safeStatus = String(status || "").toLowerCase();

  if (["pago", "assinado", "cancelado", "arquivado", "resolvido"].includes(safeStatus)) {
    return false;
  }

  return days < 0;
}

function isNextDays(dateValue: string | null | undefined, daysLimit: number) {
  const days = daysFromToday(dateValue);

  if (days === null) return false;

  return days >= 0 && days <= daysLimit;
}

function inDateRange(value: string | null | undefined, from: string, to: string) {
  if (!from && !to) return true;

  const current = dateTime(value);

  if (!current) return false;

  const fromTime = from ? dateTime(from) : null;
  const toTime = to ? dateTime(to) : null;

  if (fromTime && current < fromTime) return false;
  if (toTime && current > toTime) return false;

  return true;
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function rowMatches(row: RelatorioRow, search: string) {
  if (!search.trim()) return true;

  const haystack = normalizeSearch(JSON.stringify(row));

  return haystack.includes(normalizeSearch(search));
}

function uniqueValues(rows: RelatorioRow[], keys: string[]) {
  const set = new Set<string>();

  for (const row of rows) {
    const value = getValue(row, keys);

    if (value) set.add(value);
  }

  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function statusPill(status: string) {
  const normalized = status || "não informado";
  const lowered = normalized.toLowerCase();

  const className =
    ["ativo", "ativa", "assinado", "pago", "regular"].includes(lowered)
      ? "border-green-100 bg-green-50 text-green-700"
      : ["vencido", "atrasado", "inadimplente", "pendente", "rascunho"].includes(lowered)
        ? "border-red-100 bg-red-50 text-red-700"
        : "border-slate-200 bg-slate-100 text-slate-600";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black ${className}`}>
      {normalized}
    </span>
  );
}

function csvEscape(value: unknown) {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<unknown>>) {
  const csv = [
    headers.map(csvEscape).join(";"),
    ...rows.map((row) => row.map(csvEscape).join(";")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function Logo({
  src,
  name,
}: {
  src?: string | null;
  name: string;
}) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className="h-14 max-w-[170px] object-contain"
      />
    );
  }

  return (
    <div className="flex h-14 w-32 items-center justify-center rounded-2xl bg-blue-800 text-sm font-black text-white">
      WISDOM
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone?: "blue" | "red" | "green" | "amber";
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700",
    red: "bg-red-50 text-red-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-yellow-50 text-yellow-700",
  }[tone];

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm report-card">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black text-blue-950">
            {value}
          </p>
        </div>

        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ReportTable({
  columns,
  rows,
  emptyText,
}: {
  columns: ReportColumn[];
  rows: RelatorioRow[];
  emptyText: string;
}) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm report-table-card">
      <div className="overflow-x-auto">
        <table className="min-w-[1080px] w-full text-left report-table">
          <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column.label} className={`px-5 py-4 ${column.className || ""}`}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-sm">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center font-black text-slate-500">
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={String(row.id ?? index)}>
                  {columns.map((column) => (
                    <td key={column.label} className={`px-5 py-4 align-top ${column.className || ""}`}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PrintStyles() {
  return (
    <style>{`
      .print-only {
        display: none;
      }

      .report-document {
        background: #ffffff;
      }

      .report-document-header {
        border: 1px solid #e2e8f0;
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      }

      .report-title-area {
        border-left: 6px solid #1d4ed8;
      }

      @media print {
        @page {
          size: A4 landscape;
          margin: 10mm;
        }

        html,
        body {
          background: white !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        aside,
        nav,
        header,
        footer,
        .no-print {
          display: none !important;
        }

        .print-only {
          display: block !important;
        }

        [class*="xl:pl-72"] {
          padding-left: 0 !important;
        }

        main {
          background: white !important;
        }

        .report-print-area {
          max-width: none !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        .report-document {
          padding: 0 !important;
          margin: 0 !important;
        }

        .report-card {
          box-shadow: none !important;
          border: 1px solid #e5e7eb !important;
          break-inside: avoid;
        }

        .report-table-card {
          box-shadow: none !important;
          border-radius: 0 !important;
          overflow: visible !important;
        }

        .report-table {
          min-width: 0 !important;
          width: 100% !important;
          font-size: 8pt !important;
          border-collapse: collapse !important;
        }

        .report-table thead {
          display: table-header-group;
        }

        .report-table th {
          border: 1px solid #cbd5e1 !important;
          padding: 5px !important;
          background: #f1f5f9 !important;
          color: #0f172a !important;
        }

        .report-table td {
          border: 1px solid #e2e8f0 !important;
          padding: 5px !important;
          color: #0f172a !important;
        }

        tr {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .rounded-3xl {
          border-radius: 0 !important;
        }

        .shadow-sm {
          box-shadow: none !important;
        }
      }
    `}</style>
  );
}

function SelectFilter({
  label,
  value,
  onChange,
  options,
  placeholder = "Todos",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-blue-950 outline-none focus:border-blue-500"
      >
        <option value="">{placeholder}</option>
        {options.map((item) => (
          <option key={`${item.value}-${item.label}`} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-blue-950 outline-none focus:border-blue-500"
      />
    </label>
  );
}

export function RelatoriosWorkspace({ data }: { data: RelatoriosData }) {
  const [tab, setTab] = useState<Tab>("geral");
  const [filters, setFilters] = useState<Filters>(initialFilters);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function clearFilters() {
    setFilters(initialFilters);
  }

  const companiesMap = useMemo(() => {
    const map = new Map<string, RelatorioRow>();

    for (const company of data.companies) {
      const id = getValue(company, ["id"]);

      if (id) map.set(id, company);
    }

    return map;
  }, [data.companies]);

  const studentsMap = useMemo(() => {
    const map = new Map<string, RelatorioRow>();

    for (const student of data.students) {
      const id = getValue(student, ["id"]);

      if (id) map.set(id, student);
    }

    return map;
  }, [data.students]);

  function companyName(companyId: string) {
    const company = companiesMap.get(companyId);

    return getValue(company, ["nome_fantasia", "razao_social"], "Empresa não localizada");
  }

  function studentName(studentId: string) {
    const student = studentsMap.get(studentId);

    return getValue(student, ["nome"], "Estagiário não localizado");
  }

  const companyOptions = useMemo(() => {
    return data.companies
      .map((company) => ({
        value: getValue(company, ["id"]),
        label: getValue(company, ["nome_fantasia", "razao_social"], "Empresa sem nome"),
      }))
      .filter((item) => item.value)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [data.companies]);

  const studentOptions = useMemo(() => {
    return data.students
      .map((student) => ({
        value: getValue(student, ["id"]),
        label: getValue(student, ["nome"], "Estagiário sem nome"),
      }))
      .filter((item) => item.value)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [data.students]);

  const schoolOptions = useMemo(
    () => uniqueValues(data.students, ["escola"]).map((value) => ({ value, label: value })),
    [data.students]
  );

  const gradeOptions = useMemo(
    () => uniqueValues(data.students, ["serie_ano"]).map((value) => ({ value, label: value })),
    [data.students]
  );

  const shiftOptions = useMemo(
    () => uniqueValues(data.students, ["turno"]).map((value) => ({ value, label: value })),
    [data.students]
  );

  const cityOptions = useMemo(
    () => uniqueValues(data.companies, ["cidade"]).map((value) => ({ value, label: value })),
    [data.companies]
  );

  const documentCategoryOptions = useMemo(
    () => uniqueValues(data.documents, ["category"]).map((value) => ({ value, label: value })),
    [data.documents]
  );

  const stats = useMemo(() => {
    const empresasAtivas = data.companies.filter((item) => getValue(item, ["status"], "ativo") === "ativo").length;
    const estagiariosAtivos = data.students.filter((item) => getValue(item, ["status"], "ativo") === "ativo").length;

    const contratosVencidos = data.contracts.filter((item) =>
      isOverdue(getValue(item, ["data_fim", "fim", "end_date"]), getValue(item, ["status"]))
    ).length;

    const financeiroAtrasado = data.charges.filter((item) => {
      const status = getValue(item, ["status"], "pendente").toLowerCase();

      return status === "atrasado" || isOverdue(getValue(item, ["data_vencimento", "vencimento", "due_date"]), status);
    });

    const valorAtrasado = financeiroAtrasado.reduce((sum, item) => {
      return sum + getNumber(item, ["valor", "valor_original", "amount"], 0);
    }, 0);

    const documentosPendentes = data.reminders.filter((item) => {
      const status = getValue(item, ["status"], "pendente");
      const titulo = getValue(item, ["titulo", "message", "mensagem"]).toLowerCase();

      return status !== "resolvido" && (titulo.includes("document") || titulo.includes("pend"));
    }).length;

    return {
      empresasAtivas,
      estagiariosAtivos,
      contratosVencidos,
      financeiroAtrasado: financeiroAtrasado.length,
      valorAtrasado,
      documentosPendentes,
      documentosTotal: data.documents.length,
    };
  }, [data]);

  const filteredCompanies = useMemo(() => {
    return data.companies.filter((row) => {
      if (!rowMatches(row, filters.search)) return false;

      const status = getValue(row, ["status"], "ativo");

      if (filters.status && status !== filters.status) return false;
      if (filters.city && getValue(row, ["cidade"]) !== filters.city) return false;

      if (filters.hasCnpj === "sim" && !getValue(row, ["cnpj"])) return false;
      if (filters.hasCnpj === "nao" && getValue(row, ["cnpj"])) return false;

      return true;
    });
  }, [data.companies, filters]);

  const filteredStudents = useMemo(() => {
    return data.students.filter((row) => {
      if (!rowMatches(row, filters.search)) return false;

      const status = getValue(row, ["status"], "ativo");
      const seguroDate = getValue(row, ["data_vencimento_seguro", "vencimento_seguro"]);

      if (filters.status && status !== filters.status) return false;
      if (filters.school && getValue(row, ["escola"]) !== filters.school) return false;
      if (filters.grade && getValue(row, ["serie_ano"]) !== filters.grade) return false;
      if (filters.shift && getValue(row, ["turno"]) !== filters.shift) return false;

      if (filters.dateMode === "seguro_vencido" && !isOverdue(seguroDate, status)) return false;
      if (filters.dateMode === "seguro_30" && !isNextDays(seguroDate, 30)) return false;
      if (filters.dateMode === "sem_seguro" && seguroDate) return false;

      return true;
    });
  }, [data.students, filters]);

  const filteredContracts = useMemo(() => {
    return data.contracts.filter((row) => {
      if (!rowMatches(row, filters.search)) return false;

      const status = getValue(row, ["status"], "rascunho");
      const companyId = getValue(row, ["company_id"]);
      const studentId = getValue(row, ["student_id"]);
      const fim = getValue(row, ["data_fim", "fim", "end_date"]);

      if (filters.companyId && companyId !== filters.companyId) return false;
      if (filters.studentId && studentId !== filters.studentId) return false;
      if (filters.status && status !== filters.status) return false;
      if (!inDateRange(fim, filters.dateFrom, filters.dateTo)) return false;

      if (filters.dateMode === "vencidos" && !isOverdue(fim, status)) return false;
      if (filters.dateMode === "vencem_30" && !isNextDays(fim, 30)) return false;
      if (filters.dateMode === "sem_anexo") {
        const hasAttachment = Boolean(getValue(row, ["document_id", "documento_id", "arquivo_id", "drive_file_id"]));

        if (hasAttachment) return false;
      }

      return true;
    });
  }, [data.contracts, filters]);

  const filteredCharges = useMemo(() => {
    return data.charges.filter((row) => {
      if (!rowMatches(row, filters.search)) return false;

      const status = getValue(row, ["status"], "pendente").toLowerCase();
      const companyId = getValue(row, ["company_id"]);
      const vencimento = getValue(row, ["data_vencimento", "vencimento", "due_date"]);

      if (filters.companyId && companyId !== filters.companyId) return false;
      if (filters.status && status !== filters.status) return false;
      if (!inDateRange(vencimento, filters.dateFrom, filters.dateTo)) return false;

      if (filters.dateMode === "em_aberto" && ["pago", "cancelado"].includes(status)) return false;
      if (filters.dateMode === "vencidos" && !(status === "atrasado" || isOverdue(vencimento, status))) return false;
      if (filters.dateMode === "vencem_7" && !isNextDays(vencimento, 7)) return false;
      if (filters.dateMode === "sem_comprovante") {
        const comprovante = getValue(row, ["comprovante_document_id"]);

        if (comprovante) return false;
      }

      return true;
    });
  }, [data.charges, filters]);

  const filteredDocuments = useMemo(() => {
    return data.documents.filter((row) => {
      if (!rowMatches(row, filters.search)) return false;

      const status = getValue(row, ["status"], "ativo");
      const entityType = getValue(row, ["entity_type"]);
      const category = getValue(row, ["category"]);
      const createdAt = getValue(row, ["created_at", "criado_em"]);

      if (filters.status && status !== filters.status) return false;
      if (filters.entityType && entityType !== filters.entityType) return false;
      if (filters.category && category !== filters.category) return false;
      if (!inDateRange(createdAt, filters.dateFrom, filters.dateTo)) return false;

      return true;
    });
  }, [data.documents, filters]);

  const activeRows = useMemo(() => {
    if (tab === "empresas") return filteredCompanies;
    if (tab === "estagiarios") return filteredStudents;
    if (tab === "contratos") return filteredContracts;
    if (tab === "financeiro") return filteredCharges;
    if (tab === "documentos") return filteredDocuments;

    return [];
  }, [
    tab,
    filteredCompanies,
    filteredStudents,
    filteredContracts,
    filteredCharges,
    filteredDocuments,
  ]);

  const columns: ReportColumn[] = useMemo(() => {
    if (tab === "empresas") {
      return [
        {
          label: "Empresa",
          render: (row) => (
            <div>
              <p className="font-black text-blue-950">
                {getValue(row, ["nome_fantasia", "razao_social"], "Empresa sem nome")}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {getValue(row, ["razao_social"])}
              </p>
            </div>
          ),
          csv: (row) => getValue(row, ["nome_fantasia", "razao_social"]),
        },
        { label: "CNPJ", render: (row) => getValue(row, ["cnpj"], "Não informado"), csv: (row) => getValue(row, ["cnpj"]) },
        { label: "Responsável", render: (row) => getValue(row, ["responsavel_nome", "nome_responsavel"], "Não informado"), csv: (row) => getValue(row, ["responsavel_nome", "nome_responsavel"]) },
        {
          label: "Contato",
          render: (row) => (
            <div>
              <p>{getValue(row, ["telefone", "whatsapp"], "Não informado")}</p>
              <p className="mt-1 text-xs text-slate-500">{getValue(row, ["email"])}</p>
            </div>
          ),
          csv: (row) => `${getValue(row, ["telefone", "whatsapp"])} ${getValue(row, ["email"])}`,
        },
        { label: "Cidade", render: (row) => getValue(row, ["cidade"], "Não informado"), csv: (row) => getValue(row, ["cidade"]) },
        { label: "Status", render: (row) => statusPill(getValue(row, ["status"], "ativo")), csv: (row) => getValue(row, ["status"], "ativo") },
      ];
    }

    if (tab === "estagiarios") {
      return [
        {
          label: "Estagiário",
          render: (row) => (
            <div>
              <p className="font-black text-blue-950">{getValue(row, ["nome"], "Sem nome")}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                CPF: {getValue(row, ["cpf"], "Não informado")}
              </p>
            </div>
          ),
          csv: (row) => getValue(row, ["nome"]),
        },
        { label: "Telefone", render: (row) => getValue(row, ["telefone"], "Não informado"), csv: (row) => getValue(row, ["telefone"]) },
        { label: "Escola", render: (row) => getValue(row, ["escola"], "Não informado"), csv: (row) => getValue(row, ["escola"]) },
        { label: "Série/Turno", render: (row) => `${getValue(row, ["serie_ano"], "-")} • ${getValue(row, ["turno"], "-")}`, csv: (row) => `${getValue(row, ["serie_ano"])} ${getValue(row, ["turno"])}` },
        { label: "Seguro", render: (row) => formatDate(getValue(row, ["data_vencimento_seguro", "vencimento_seguro"])) || "Não informado", csv: (row) => formatDate(getValue(row, ["data_vencimento_seguro", "vencimento_seguro"])) },
        { label: "Status", render: (row) => statusPill(getValue(row, ["status"], "ativo")), csv: (row) => getValue(row, ["status"], "ativo") },
      ];
    }

    if (tab === "contratos") {
      return [
        { label: "Estagiário", render: (row) => studentName(getValue(row, ["student_id"])), csv: (row) => studentName(getValue(row, ["student_id"])) },
        { label: "Empresa", render: (row) => companyName(getValue(row, ["company_id"])), csv: (row) => companyName(getValue(row, ["company_id"])) },
        { label: "Início", render: (row) => formatDate(getValue(row, ["data_inicio"])) || "Não informado", csv: (row) => formatDate(getValue(row, ["data_inicio"])) },
        { label: "Fim", render: (row) => formatDate(getValue(row, ["data_fim"])) || "Não informado", csv: (row) => formatDate(getValue(row, ["data_fim"])) },
        { label: "Bolsa", render: (row) => formatMoney(getValue(row, ["bolsa_auxilio", "valor_bolsa"])), csv: (row) => formatMoney(getValue(row, ["bolsa_auxilio", "valor_bolsa"])) },
        { label: "Status", render: (row) => statusPill(getValue(row, ["status"], "rascunho")), csv: (row) => getValue(row, ["status"], "rascunho") },
      ];
    }

    if (tab === "financeiro") {
      return [
        { label: "Empresa", render: (row) => companyName(getValue(row, ["company_id"])), csv: (row) => companyName(getValue(row, ["company_id"])) },
        { label: "Código", render: (row) => <strong>{getValue(row, ["codigo_curto", "numero_controle"], "Não informado")}</strong>, csv: (row) => getValue(row, ["codigo_curto", "numero_controle"]) },
        { label: "Descrição", render: (row) => getValue(row, ["descricao"], "Mensalidade"), csv: (row) => getValue(row, ["descricao"]) },
        { label: "Vencimento", render: (row) => formatDate(getValue(row, ["data_vencimento", "vencimento", "due_date"])), csv: (row) => formatDate(getValue(row, ["data_vencimento", "vencimento", "due_date"])) },
        { label: "Valor", render: (row) => formatMoney(getValue(row, ["valor", "valor_original", "amount"])), csv: (row) => formatMoney(getValue(row, ["valor", "valor_original", "amount"])) },
        { label: "Pago", render: (row) => formatMoney(getValue(row, ["valor_pago"])), csv: (row) => formatMoney(getValue(row, ["valor_pago"])) },
        { label: "Status", render: (row) => statusPill(getValue(row, ["status"], "pendente")), csv: (row) => getValue(row, ["status"], "pendente") },
      ];
    }

    if (tab === "documentos") {
      return [
        {
          label: "Documento",
          render: (row) => (
            <div>
              <p className="font-black text-blue-950">
                {getValue(row, ["original_name", "file_name"], "Documento")}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {getValue(row, ["mime_type"])}
              </p>
            </div>
          ),
          csv: (row) => getValue(row, ["original_name", "file_name"]),
        },
        { label: "Categoria", render: (row) => getValue(row, ["category"], "Não informado"), csv: (row) => getValue(row, ["category"]) },
        { label: "Vínculo", render: (row) => getValue(row, ["entity_type"], "Não informado"), csv: (row) => getValue(row, ["entity_type"]) },
        { label: "Data", render: (row) => formatDate(getValue(row, ["created_at", "criado_em"])), csv: (row) => formatDate(getValue(row, ["created_at", "criado_em"])) },
        { label: "Status", render: (row) => statusPill(getValue(row, ["status"], "ativo")), csv: (row) => getValue(row, ["status"], "ativo") },
      ];
    }

    return [];
  }, [tab, companiesMap, studentsMap]);

  const tabs: Array<{ id: Tab; label: string; icon: ReactNode }> = [
    { id: "geral", label: "Visão geral", icon: <CalendarClock className="h-4 w-4" /> },
    { id: "empresas", label: "Empresas", icon: <Building2 className="h-4 w-4" /> },
    { id: "estagiarios", label: "Estagiários", icon: <GraduationCap className="h-4 w-4" /> },
    { id: "contratos", label: "Contratos", icon: <FileText className="h-4 w-4" /> },
    { id: "financeiro", label: "Financeiro", icon: <WalletCards className="h-4 w-4" /> },
    { id: "documentos", label: "Documentos", icon: <FileText className="h-4 w-4" /> },
  ];

  const reportTitle = tabs.find((item) => item.id === tab)?.label || "Relatório";

  const filterSummary = useMemo(() => {
    const items: string[] = [];

    if (filters.search) items.push(`Busca: ${filters.search}`);
    if (filters.status) items.push(`Status: ${filters.status}`);
    if (filters.companyId) items.push(`Empresa: ${companyName(filters.companyId)}`);
    if (filters.studentId) items.push(`Estagiário: ${studentName(filters.studentId)}`);
    if (filters.dateFrom) items.push(`De: ${formatDate(filters.dateFrom)}`);
    if (filters.dateTo) items.push(`Até: ${formatDate(filters.dateTo)}`);
    if (filters.dateMode) items.push(`Filtro especial: ${filters.dateMode}`);
    if (filters.school) items.push(`Escola: ${filters.school}`);
    if (filters.grade) items.push(`Série/Ano: ${filters.grade}`);
    if (filters.shift) items.push(`Turno: ${filters.shift}`);
    if (filters.city) items.push(`Cidade: ${filters.city}`);
    if (filters.hasCnpj) items.push(`CNPJ: ${filters.hasCnpj === "sim" ? "com CNPJ" : "sem CNPJ"}`);
    if (filters.entityType) items.push(`Vínculo: ${filters.entityType}`);
    if (filters.category) items.push(`Categoria: ${filters.category}`);

    return items.length > 0 ? items.join(" | ") : "Sem filtros adicionais.";
  }, [filters, companiesMap, studentsMap]);

  function exportCurrentCsv() {
    if (tab === "geral") return;

    downloadCsv(
      `relatorio-${tab}.csv`,
      columns.map((column) => column.label),
      activeRows.map((row) => columns.map((column) => column.csv(row)))
    );
  }

  function renderFilters() {
    if (tab === "geral") {
      return (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-900">
          Use as abas acima para gerar relatórios específicos com filtros por empresa,
          estagiário, status, vencimento, período, documentos e financeiro.
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        <div className="grid gap-4 xl:grid-cols-[1.3fr_repeat(4,minmax(150px,1fr))]">
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              Pesquisar
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
                placeholder="Pesquisar no relatório..."
                className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm font-bold outline-none focus:border-blue-500"
              />
            </div>
          </label>

          {tab === "empresas" ? (
            <>
              <SelectFilter
                label="Status"
                value={filters.status}
                onChange={(value) => updateFilter("status", value)}
                options={[
                  { value: "ativo", label: "Ativas" },
                  { value: "inativo", label: "Inativas" },
                ]}
              />

              <SelectFilter
                label="Cidade"
                value={filters.city}
                onChange={(value) => updateFilter("city", value)}
                options={cityOptions}
              />

              <SelectFilter
                label="CNPJ"
                value={filters.hasCnpj}
                onChange={(value) => updateFilter("hasCnpj", value)}
                options={[
                  { value: "sim", label: "Com CNPJ" },
                  { value: "nao", label: "Sem CNPJ" },
                ]}
              />
            </>
          ) : null}

          {tab === "estagiarios" ? (
            <>
              <SelectFilter
                label="Status"
                value={filters.status}
                onChange={(value) => updateFilter("status", value)}
                options={[
                  { value: "ativo", label: "Ativos" },
                  { value: "inativo", label: "Inativos" },
                ]}
              />

              <SelectFilter
                label="Escola"
                value={filters.school}
                onChange={(value) => updateFilter("school", value)}
                options={schoolOptions}
              />

              <SelectFilter
                label="Série/Ano"
                value={filters.grade}
                onChange={(value) => updateFilter("grade", value)}
                options={gradeOptions}
              />

              <SelectFilter
                label="Turno/Seguro"
                value={filters.dateMode}
                onChange={(value) => updateFilter("dateMode", value)}
                options={[
                  { value: "seguro_vencido", label: "Seguro vencido" },
                  { value: "seguro_30", label: "Seguro vencendo em 30 dias" },
                  { value: "sem_seguro", label: "Sem seguro informado" },
                ]}
                placeholder="Filtro de seguro"
              />
            </>
          ) : null}

          {tab === "contratos" ? (
            <>
              <SelectFilter
                label="Empresa"
                value={filters.companyId}
                onChange={(value) => updateFilter("companyId", value)}
                options={companyOptions}
              />

              <SelectFilter
                label="Estagiário"
                value={filters.studentId}
                onChange={(value) => updateFilter("studentId", value)}
                options={studentOptions}
              />

              <SelectFilter
                label="Status"
                value={filters.status}
                onChange={(value) => updateFilter("status", value)}
                options={[
                  { value: "rascunho", label: "Rascunho" },
                  { value: "gerado", label: "Gerado" },
                  { value: "pendente_assinatura", label: "Pendente assinatura" },
                  { value: "assinado", label: "Assinado" },
                  { value: "vencido", label: "Vencido" },
                  { value: "cancelado", label: "Cancelado" },
                ]}
              />

              <SelectFilter
                label="Especial"
                value={filters.dateMode}
                onChange={(value) => updateFilter("dateMode", value)}
                options={[
                  { value: "vencidos", label: "Contratos vencidos" },
                  { value: "vencem_30", label: "Vencem em 30 dias" },
                  { value: "sem_anexo", label: "Sem anexo" },
                ]}
              />
            </>
          ) : null}

          {tab === "financeiro" ? (
            <>
              <SelectFilter
                label="Empresa"
                value={filters.companyId}
                onChange={(value) => updateFilter("companyId", value)}
                options={companyOptions}
              />

              <SelectFilter
                label="Status"
                value={filters.status}
                onChange={(value) => updateFilter("status", value)}
                options={[
                  { value: "pendente", label: "Pendente" },
                  { value: "atrasado", label: "Atrasado" },
                  { value: "pago", label: "Pago" },
                  { value: "cancelado", label: "Cancelado" },
                ]}
              />

              <SelectFilter
                label="Especial"
                value={filters.dateMode}
                onChange={(value) => updateFilter("dateMode", value)}
                options={[
                  { value: "em_aberto", label: "Boletos em aberto" },
                  { value: "vencidos", label: "Vencidos" },
                  { value: "vencem_7", label: "Vencem em 7 dias" },
                  { value: "sem_comprovante", label: "Pagos sem comprovante" },
                ]}
              />
            </>
          ) : null}

          {tab === "documentos" ? (
            <>
              <SelectFilter
                label="Vínculo"
                value={filters.entityType}
                onChange={(value) => updateFilter("entityType", value)}
                options={[
                  { value: "empresa", label: "Empresa" },
                  { value: "estagiario", label: "Estagiário" },
                  { value: "contrato", label: "Contrato" },
                  { value: "geral", label: "Geral" },
                  { value: "landing", label: "Landing page" },
                  { value: "financeiro", label: "Financeiro" },
                ]}
              />

              <SelectFilter
                label="Categoria"
                value={filters.category}
                onChange={(value) => updateFilter("category", value)}
                options={documentCategoryOptions}
              />

              <SelectFilter
                label="Status"
                value={filters.status}
                onChange={(value) => updateFilter("status", value)}
                options={[
                  { value: "ativo", label: "Ativo" },
                  { value: "arquivado", label: "Arquivado" },
                ]}
              />
            </>
          ) : null}
        </div>

        {["contratos", "financeiro", "documentos"].includes(tab) ? (
          <div className="grid gap-4 md:grid-cols-4">
            <DateFilter
              label={tab === "documentos" ? "Data inicial" : "Vencimento inicial"}
              value={filters.dateFrom}
              onChange={(value) => updateFilter("dateFrom", value)}
            />

            <DateFilter
              label={tab === "documentos" ? "Data final" : "Vencimento final"}
              value={filters.dateTo}
              onChange={(value) => updateFilter("dateTo", value)}
            />

            <div className="md:col-span-2 flex items-end gap-3">
              <button
                type="button"
                onClick={clearFilters}
                className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-600 hover:bg-slate-50"
              >
                Limpar filtros
              </button>

              <div className="text-xs font-bold leading-5 text-slate-500">
                {activeRows.length} registro(s) encontrado(s).
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={clearFilters}
              className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-600 hover:bg-slate-50"
            >
              Limpar filtros
            </button>

            <div className="text-xs font-bold leading-5 text-slate-500">
              {activeRows.length} registro(s) encontrado(s).
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="report-print-area mx-auto max-w-7xl px-6 py-8">
      <PrintStyles />

      {data.errors.length > 0 ? (
        <div className="no-print mb-6 rounded-2xl border border-yellow-100 bg-yellow-50 p-4 text-sm font-black text-yellow-800">
          Alguns dados não foram carregados: {data.errors.join(" | ")}
        </div>
      ) : null}

      <div className="no-print mb-6 grid gap-4 md:grid-cols-4">
        <MetricCard
          label="Empresas ativas"
          value={stats.empresasAtivas}
          icon={<Building2 className="h-6 w-6" />}
        />

        <MetricCard
          label="Estagiários ativos"
          value={stats.estagiariosAtivos}
          icon={<GraduationCap className="h-6 w-6" />}
          tone="green"
        />

        <MetricCard
          label="Contratos vencidos"
          value={stats.contratosVencidos}
          icon={<AlertTriangle className="h-6 w-6" />}
          tone={stats.contratosVencidos > 0 ? "red" : "blue"}
        />

        <MetricCard
          label="Valor em atraso"
          value={formatMoney(stats.valorAtrasado)}
          icon={<WalletCards className="h-6 w-6" />}
          tone={stats.valorAtrasado > 0 ? "red" : "blue"}
        />
      </div>

      <div className="no-print mb-5 rounded-3xl bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                setFilters(initialFilters);
              }}
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black ${
                tab === item.id
                  ? "bg-blue-700 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-800"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="no-print mb-6 rounded-3xl bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-xl font-black text-blue-950">
              Filtros do relatório
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Escolha os filtros antes de imprimir ou exportar.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            {tab !== "geral" ? (
              <button
                type="button"
                onClick={exportCurrentCsv}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-5 text-sm font-black text-blue-700 hover:bg-blue-100"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => window.print()}
              className="btn-wisdom-red inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black"
            >
              <Printer className="h-4 w-4" />
              Imprimir relatório
            </button>
          </div>
        </div>

        {renderFilters()}
      </div>

      <div className="report-document rounded-3xl bg-white p-6 shadow-sm">
        <div className="report-document-header mb-6 rounded-3xl p-5">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Logo src={data.organization.logo_url} name={data.organization.nome_fantasia} />

              <div>
                <p className="text-sm font-black uppercase tracking-[0.14em] text-red-600">
                  {data.organization.nome_fantasia}
                </p>
                <h2 className="mt-1 text-3xl font-black text-blue-950">
                  Relatório de {reportTitle}
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {data.organization.razao_social} • CNPJ {data.organization.cnpj}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold leading-6 text-slate-600">
              <p><strong>Emissão:</strong> {formatDateTime(data.generatedAt)}</p>
              <p><strong>Registros:</strong> {tab === "geral" ? "Resumo geral" : activeRows.length}</p>
              <p><strong>Responsável:</strong> RH Wisdom</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-600">
            <strong>Filtros aplicados:</strong> {filterSummary}
          </div>
        </div>

        {tab === "geral" ? (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="report-card rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black text-blue-950">Cadastros</h3>
              <div className="mt-4 space-y-3 text-sm font-bold text-slate-600">
                <p>Empresas cadastradas: <strong>{data.companies.length}</strong></p>
                <p>Empresas ativas: <strong>{stats.empresasAtivas}</strong></p>
                <p>Estagiários cadastrados: <strong>{data.students.length}</strong></p>
                <p>Estagiários ativos: <strong>{stats.estagiariosAtivos}</strong></p>
              </div>
            </div>

            <div className="report-card rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black text-blue-950">Contratos e documentos</h3>
              <div className="mt-4 space-y-3 text-sm font-bold text-slate-600">
                <p>Total de contratos: <strong>{data.contracts.length}</strong></p>
                <p>Contratos vencidos: <strong>{stats.contratosVencidos}</strong></p>
                <p>Documentos cadastrados: <strong>{stats.documentosTotal}</strong></p>
                <p>Pendências de documentos: <strong>{stats.documentosPendentes}</strong></p>
              </div>
            </div>

            <div className="report-card rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black text-blue-950">Financeiro</h3>
              <div className="mt-4 space-y-3 text-sm font-bold text-slate-600">
                <p>Cobranças cadastradas: <strong>{data.charges.length}</strong></p>
                <p>Cobranças em atraso: <strong>{stats.financeiroAtrasado}</strong></p>
                <p>Valor em atraso: <strong>{formatMoney(stats.valorAtrasado)}</strong></p>
              </div>
            </div>
          </div>
        ) : (
          <ReportTable
            emptyText="Nenhum registro encontrado para os filtros aplicados."
            rows={activeRows}
            columns={columns}
          />
        )}
      </div>
    </section>
  );
}