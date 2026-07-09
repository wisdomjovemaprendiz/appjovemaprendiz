"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  cancelarCarneFinanceiroAction,
  cancelarParcelaFinanceiraAction,
  excluirCarneFinanceiroAction,
  editarParcelaFinanceiraAction,
  estornarBaixaFinanceiraAction,
} from "@/actions/rh/financeiro.actions";
import { Modal } from "@/components/ui/Modal";
import { BaixaPorControleForm } from "@/features/financeiro/BaixaPorControleForm";
import { CarneForm } from "@/features/financeiro/CarneForm";
import { FinanceiroSettingsPanel } from "@/features/financeiro/FinanceiroSettingsPanel";
import type { FinancialSettings } from "@/data/rh/financeiro-settings.data";
import type {
  EmpresaFinanceiroOption,
  FinancialChargeItem,
  FinanceiroStats,
  PaymentBookletItem,
} from "@/data/rh/financeiro.data";
import {
  AlertTriangle,
  Ban,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Edit,
  ExternalLink,
  FileDown,
  HelpCircle,
  Plus,
  ReceiptText,
  RotateCcw,
  Search,
  SearchCheck,
  Settings,
  WalletCards,
  Trash2,
  XCircle,
} from "lucide-react";

type FinanceiroTab = "carnes" | "parcelas" | "baixas" | "inadimplencia" | "configuracoes";

function formatCurrency(value: number | null | undefined) {
  const parsed = Number(value ?? 0);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(parsed) ? parsed : 0);
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(new Date(date));
}

function statusLabel(status: string) {
  if (status === "pago") return "Pago";
  if (status === "atrasado") return "Atrasado";
  if (status === "cancelado") return "Cancelado";
  return "Pendente";
}

function statusClass(status: string) {
  if (status === "pago") return "border-green-100 bg-green-50 text-green-700";
  if (status === "atrasado") return "border-red-100 bg-red-50 text-red-700";
  if (status === "cancelado") return "border-slate-200 bg-slate-100 text-slate-600";
  return "border-yellow-100 bg-yellow-50 text-yellow-800";
}

function shortControl(value: string | null | undefined) {
  const raw = String(value || "").trim();

  if (!raw) return "Sem controle";

  const parts = raw.split("-").filter(Boolean);

  if (parts.length >= 2) {
    return parts.slice(-2).join("-");
  }

  return raw.length > 12 ? raw.slice(-12) : raw;
}

function MetricCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="mb-3 text-blue-700">{icon}</div>
      <p className="text-sm font-black text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-blue-950">{value}</p>
      {helper ? (
        <p className="mt-1 text-xs font-bold text-slate-500">{helper}</p>
      ) : null}
    </div>
  );
}

function EmptyTable({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-8 text-center">
      <p className="font-black text-blue-950">{title}</p>
      <p className="mt-2 text-sm font-semibold text-slate-500">{description}</p>
    </div>
  );
}

function TableShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-2xl font-black text-blue-950">{title}</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          {description}
        </p>
      </div>

      {children}
    </section>
  );
}




function CarnesTable({
  carnes,
  onVerParcelas,
  onCancelar,
  onExcluir,
  excluindoId,
}: {
  carnes: PaymentBookletItem[];
  onVerParcelas: (carne: PaymentBookletItem) => void;
  onCancelar: (carne: PaymentBookletItem) => void;
  onExcluir: (carne: PaymentBookletItem) => void;
  excluindoId?: string | null;
}) {
  if (carnes.length === 0) {
    return (
      <EmptyTable
        title="Nenhum carnê gerado."
        description="Clique em Novo carnê para criar o primeiro registro."
      />
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white">
      <div className="grid grid-cols-[minmax(190px,1.35fr)_minmax(150px,1fr)_70px_105px_110px_95px_240px] items-center gap-3 border-b border-slate-100 px-4 py-3 text-[10px] font-black uppercase tracking-wide text-slate-500">
        <span>Empresa</span>
        <span>Carnê</span>
        <span className="text-center">Parc.</span>
        <span>Valor</span>
        <span>1º venc.</span>
        <span>Status</span>
        <span className="text-right">Ações</span>
      </div>

      <div className="divide-y divide-slate-100">
        {carnes.map((carne) => (
          <div
            key={carne.id}
            className="grid grid-cols-[minmax(190px,1.35fr)_minmax(150px,1fr)_70px_105px_110px_95px_240px] items-center gap-3 px-4 py-3 text-[12px] transition hover:bg-slate-50"
          >
            <div className="min-w-0">
              <p className="truncate font-black leading-tight text-blue-950" title={carne.company_name}>
                {carne.company_name}
              </p>
              <p className="truncate text-[10px] font-semibold leading-tight text-slate-500">
                {carne.company_document || "Documento não informado"}
              </p>
            </div>

            <div className="min-w-0">
              <p className="truncate font-bold leading-tight text-slate-800" title={carne.titulo || "Carnê"}>
                {carne.titulo || "Carnê"}
              </p>
              <p className="truncate text-[10px] font-semibold leading-tight text-slate-500">
                {carne.descricao || "Sem descrição"}
              </p>
            </div>

            <p className="text-center font-black text-blue-950">
              {carne.quantidade_parcelas || 0}
            </p>

            <p className="whitespace-nowrap font-black text-slate-800">
              {formatCurrency(carne.valor_parcela)}
            </p>

            <p className="whitespace-nowrap font-black text-slate-800">
              {formatDate(carne.vencimento_primeira)}
            </p>

            <div>
              <span
                className={
                  "inline-flex rounded-full border px-2 py-1 text-[10px] font-black leading-none " +
                  (carne.status === "cancelado"
                    ? "border-red-100 bg-red-50 text-red-700"
                    : "border-blue-100 bg-blue-50 text-blue-700")
                }
              >
                {carne.status || "ativo"}
              </span>
            </div>

            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => onVerParcelas(carne)}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-blue-100 bg-white px-2.5 text-[10px] font-black text-blue-700 hover:bg-blue-50"
              >
                <ReceiptText className="h-3.5 w-3.5" />
                Parcelas
              </button>

              <Link
                href={"/rh/financeiro/carnes/" + carne.id + "/pdf"}
                className="inline-flex h-8 items-center gap-1 rounded-lg bg-blue-700 px-2.5 text-[10px] font-black text-white hover:bg-blue-800"
              >
                <FileDown className="h-3.5 w-3.5" />
                PDF
              </Link>

              {carne.status !== "cancelado" ? (
                <button
                  type="button"
                  onClick={() => onCancelar(carne)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-100 bg-white px-2.5 text-[10px] font-black text-red-700 hover:bg-red-50"
                >
                  <Ban className="h-3.5 w-3.5" />
                  Cancelar
                </button>
              ) : null}

              <button
                type="button"
                disabled={excluindoId === carne.id}
                onClick={() => onExcluir(carne)}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 text-[10px] font-black text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {excluindoId === carne.id ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ParcelasTable({
  charges,
  onBaixar,
  onEditar,
  onCancelar,
  onEstornar,
}: {
  charges: FinancialChargeItem[];
  onBaixar: (controle: string) => void;
  onEditar: (charge: FinancialChargeItem) => void;
  onCancelar: (charge: FinancialChargeItem) => void;
  onEstornar: (charge: FinancialChargeItem) => void;
}) {
  if (charges.length === 0) {
    return (
      <EmptyTable
        title="Nenhuma parcela cadastrada."
        description="As parcelas serão listadas após a geração do carnê."
      />
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white">
      <div className="grid grid-cols-[95px_minmax(185px,1.3fr)_70px_95px_115px_92px_105px_190px] items-center gap-3 border-b border-slate-100 px-4 py-3 text-[10px] font-black uppercase tracking-wide text-slate-500">
        <span>Controle</span>
        <span>Empresa</span>
        <span className="text-center">Parc.</span>
        <span>Venc.</span>
        <span>Valor</span>
        <span>Status</span>
        <span>Comp.</span>
        <span className="text-right">Ações</span>
      </div>

      <div className="divide-y divide-slate-100">
        {charges.map((charge) => (
          <div
            key={charge.id}
            className="grid grid-cols-[95px_minmax(185px,1.3fr)_70px_95px_115px_92px_105px_190px] items-center gap-3 px-4 py-3 text-[12px] transition hover:bg-slate-50"
          >
            <div className="min-w-0" title={charge.numero_controle || "Sem controle"}>
              <p className="truncate font-black leading-tight text-blue-950">
                {shortControl(charge.numero_controle)}
              </p>
            </div>

            <div className="min-w-0">
              <p className="truncate font-black leading-tight text-blue-950" title={charge.company_name}>
                {charge.company_name}
              </p>
              <p className="truncate text-[10px] font-semibold leading-tight text-slate-500">
                {charge.company_document || "Documento não informado"}
              </p>
            </div>

            <p className="text-center font-black text-slate-800">
              {charge.parcela_numero || "-"} de {charge.total_parcelas || "-"}
            </p>

            <p className="whitespace-nowrap font-black text-slate-800">
              {formatDate(charge.vencimento)}
            </p>

            <div className="leading-tight">
              <p className="whitespace-nowrap font-black text-slate-800">
                {formatCurrency(charge.valor)}
              </p>
              {charge.valor_com_desconto ? (
                <p className="whitespace-nowrap text-[10px] font-bold text-green-700">
                  Em dia: {formatCurrency(charge.valor_com_desconto)}
                </p>
              ) : null}
            </div>

            <div>
              <span className={"inline-flex rounded-full border px-2 py-1 text-[10px] font-black leading-none " + statusClass(charge.status)}>
                {statusLabel(charge.status)}
              </span>
            </div>

            <div>
              {charge.comprovante_url ? (
                <a
                  href={charge.comprovante_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-green-100 bg-white px-2 text-[10px] font-black text-green-700 hover:bg-green-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir
                </a>
              ) : (
                <span className="text-[10px] font-black text-slate-400">
                  Não anexado
                </span>
              )}
            </div>

            <div className="flex justify-end gap-1">
              {charge.status !== "pago" && charge.status !== "cancelado" ? (
                <button
                  type="button"
                  onClick={() => onBaixar(charge.numero_controle || "")}
                  className="inline-flex h-8 items-center gap-1 rounded-lg bg-green-600 px-2 text-[10px] font-black text-white hover:bg-green-700"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Baixar
                </button>
              ) : null}

              {charge.status === "pago" ? (
                <button
                  type="button"
                  onClick={() => onEstornar(charge)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-yellow-100 bg-white px-2 text-[10px] font-black text-yellow-800 hover:bg-yellow-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Estornar
                </button>
              ) : null}

              {charge.status !== "pago" && charge.status !== "cancelado" ? (
                <button
                  type="button"
                  onClick={() => onEditar(charge)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-blue-100 bg-white px-2 text-[10px] font-black text-blue-700 hover:bg-blue-50"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Editar
                </button>
              ) : null}

              <Link
                href={"/rh/financeiro/" + charge.id + "/pdf"}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-black text-blue-950 hover:bg-slate-50"
              >
                <FileDown className="h-3.5 w-3.5" />
                PDF
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BaixasTable({
  charges,
  onEstornar,
}: {
  charges: FinancialChargeItem[];
  onEstornar: (charge: FinancialChargeItem) => void;
}) {
  const baixas = charges.filter((item) => item.status === "pago");

  if (baixas.length === 0) {
    return (
      <EmptyTable
        title="Nenhuma baixa registrada."
        description="Os pagamentos baixados serão exibidos nesta aba."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1050px] w-full border-separate border-spacing-y-2">
        <thead>
          <tr className="text-left text-xs font-black uppercase tracking-wide text-slate-500">
            <th className="px-4 py-2">Data</th>
            <th className="px-4 py-2">Empresa</th>
            <th className="px-4 py-2">Controle</th>
            <th className="px-4 py-2">Valor pago</th>
            <th className="px-4 py-2">Forma</th>
            <th className="px-4 py-2">Comprovante</th>
            <th className="px-4 py-2 text-right">Ações</th>
          </tr>
        </thead>

        <tbody>
          {baixas.map((charge) => (
            <tr key={charge.id} className="bg-slate-50">
              <td className="rounded-l-2xl px-4 py-4 font-bold text-slate-700">
                {formatDate(charge.data_pagamento)}
              </td>
              <td className="px-4 py-4">
                <p className="font-black text-blue-950">{charge.company_name}</p>
                <p className="text-xs font-semibold text-slate-500">
                  {charge.company_document || "Documento não informado"}
                </p>
              </td>
              <td className="px-4 py-4 font-black text-blue-950">
                {charge.numero_controle || "Sem controle"}
              </td>
              <td className="px-4 py-4 font-bold text-slate-700">
                {formatCurrency(charge.valor_pago)}
              </td>
              <td className="px-4 py-4 font-bold text-slate-700">
                {charge.forma_pagamento || "Não informado"}
              </td>
              <td className="px-4 py-4">
                {charge.comprovante_url ? (
                  <a
                    href={charge.comprovante_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-green-100 bg-white px-3 py-2 text-xs font-black text-green-700 hover:bg-green-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Abrir
                  </a>
                ) : (
                  <span className="text-xs font-black text-slate-400">
                    Não anexado
                  </span>
                )}
              </td>
              <td className="rounded-r-2xl px-4 py-4 text-right">
                <button
                  type="button"
                  onClick={() => onEstornar(charge)}
                  className="inline-flex items-center gap-2 rounded-xl border border-yellow-100 bg-white px-3 py-2 text-xs font-black text-yellow-800 hover:bg-yellow-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Estornar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EditarParcelaForm({ charge }: { charge: FinancialChargeItem }) {
  return (
    <form action={async (formData) => { await editarParcelaFinanceiraAction(formData); }} className="space-y-5">
      <input type="hidden" name="id" value={charge.id} />

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-sm font-black text-slate-500">Parcela</p>
        <p className="mt-1 font-black text-blue-950">
          {charge.numero_controle || "Sem controle"}
        </p>
        <p className="text-sm font-semibold text-slate-500">
          {charge.company_name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">Descrição</span>
          <input
            name="descricao"
            defaultValue={charge.descricao || ""}
            className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">Vencimento</span>
          <input
            type="date"
            name="vencimento"
            defaultValue={charge.vencimento || ""}
            required
            className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">Valor</span>
          <input
            name="valor"
            required
            defaultValue={charge.valor ? String(charge.valor).replace(".", ",") : ""}
            className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">Desconto</span>
          <select
            name="desconto_tipo"
            defaultValue={charge.desconto_tipo || "nenhum"}
            className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-500"
          >
            <option value="nenhum">Sem desconto</option>
            <option value="valor">Valor</option>
            <option value="percentual">Percentual</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-blue-950">Valor desconto</span>
          <input
            name="desconto_valor"
            defaultValue={
              charge.desconto_valor
                ? String(charge.desconto_valor).replace(".", ",")
                : ""
            }
            className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-blue-500"
          />
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-black text-blue-950">Instruções</span>
        <textarea
          name="instrucoes_pagamento"
          rows={4}
          defaultValue={charge.instrucoes_pagamento || ""}
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-black text-blue-950">Observações</span>
        <textarea
          name="observacoes"
          rows={3}
          defaultValue={charge.observacoes || ""}
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-black text-blue-950">Motivo da alteração</span>
        <textarea
          name="motivo"
          rows={3}
          required
          placeholder="Explique por que esta parcela está sendo alterada."
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
        />
      </label>

      <button
        type="submit"
        className="btn-wisdom-red flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-black"
      >
        <Edit className="h-5 w-5" />
        Salvar alteração
      </button>
    </form>
  );
}

function MotivoForm({
  action,
  id,
  title,
  description,
  button,
  tone,
}: {
  action: (formData: FormData) => Promise<{ ok: boolean; message: string; id?: string }>;
  id: string;
  title: string;
  description: string;
  button: string;
  tone: "danger" | "warning";
}) {
  return (
    <form action={async (formData) => { await action(formData); }} className="space-y-5">
      <input type="hidden" name="id" value={id} />

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-sm font-black text-slate-500">{title}</p>
        <p className="mt-1 text-sm font-semibold text-slate-600">{description}</p>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-black text-blue-950">Motivo</span>
        <textarea
          name="motivo"
          rows={4}
          required
          placeholder="Registre o motivo para auditoria."
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
        />
      </label>

      <button
        type="submit"
        className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-black text-white ${
          tone === "danger"
            ? "bg-red-600 hover:bg-red-700"
            : "bg-yellow-600 hover:bg-yellow-700"
        }`}
      >
        {tone === "danger" ? <XCircle className="h-5 w-5" /> : <RotateCcw className="h-5 w-5" />}
        {button}
      </button>
    </form>
  );
}

export function FinanceiroWorkspace({
  empresas,
  carnes,
  charges,
  stats,
  settings,
}: {
  empresas: EmpresaFinanceiroOption[];
  carnes: PaymentBookletItem[];
  charges: FinancialChargeItem[];
  stats: FinanceiroStats;
  settings: FinancialSettings;
}) {
  const [tab, setTab] = useState<FinanceiroTab>("carnes");
  const [novoCarneOpen, setNovoCarneOpen] = useState(false);
  const [baixaOpen, setBaixaOpen] = useState(false);
  const [ajudaOpen, setAjudaOpen] = useState(false);
  const [controleSelecionado, setControleSelecionado] = useState("");
  const [search, setSearch] = useState("");
  const [selectedBooklet, setSelectedBooklet] = useState<PaymentBookletItem | null>(null);
  const [editarParcela, setEditarParcela] = useState<FinancialChargeItem | null>(null);
  const [cancelarParcela, setCancelarParcela] = useState<FinancialChargeItem | null>(null);
  const [cancelarCarne, setCancelarCarne] = useState<PaymentBookletItem | null>(null);
  const [excluirCarne, setExcluirCarne] = useState<PaymentBookletItem | null>(null);
  const [estornarParcela, setEstornarParcela] = useState<FinancialChargeItem | null>(null);

  const inadimplentes = useMemo(
    () => charges.filter((item) => item.status === "atrasado"),
    [charges]
  );

  function abrirBaixa(controle = "") {
    setControleSelecionado(controle);
    setBaixaOpen(true);
  }

  function verParcelas(carne: PaymentBookletItem) {
    setSelectedBooklet(carne);
    setSearch("");
    setTab("parcelas");
  }

  const parcelasBase = useMemo(() => {
    if (selectedBooklet) {
      return charges.filter((item) => item.booklet_id === selectedBooklet.id);
    }

    return charges;
  }, [charges, selectedBooklet]);

  const baseForTab = useMemo(() => {
    if (tab === "parcelas") return parcelasBase;
    if (tab === "inadimplencia") return inadimplentes;
    return charges;
  }, [tab, parcelasBase, inadimplentes, charges]);

  const filteredCharges = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return baseForTab;

    return baseForTab.filter((item) =>
      [
        item.numero_controle,
        item.company_name,
        item.company_document,
        item.descricao,
        item.competencia,
        item.status,
        item.forma_pagamento,
        item.observacoes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [baseForTab, search]);

  const filteredCarnes = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return carnes;

    return carnes.filter((item) =>
      [
        item.company_name,
        item.company_document,
        item.titulo,
        item.descricao,
        item.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [carnes, search]);

  const tabs: Array<{ id: FinanceiroTab; label: string; icon: ReactNode }> = [
    { id: "carnes", label: "Carnês", icon: <BookOpenCheck className="h-5 w-5" /> },
    { id: "parcelas", label: "Parcelas", icon: <ReceiptText className="h-5 w-5" /> },
    { id: "baixas", label: "Baixas", icon: <CheckCircle2 className="h-5 w-5" /> },
    { id: "inadimplencia", label: "Inadimplência", icon: <AlertTriangle className="h-5 w-5" /> },
    { id: "configuracoes", label: "Configurações", icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 grid gap-5 md:grid-cols-5">
        <MetricCard
          icon={<BookOpenCheck className="h-7 w-7" />}
          label="Carnês"
          value={String(stats.quantidadeCarnes)}
        />
        <MetricCard
          icon={<WalletCards className="h-7 w-7" />}
          label="Pendente"
          value={formatCurrency(stats.totalPendente)}
          helper={`${stats.quantidadePendente} parcela(s)`}
        />
        <MetricCard
          icon={<AlertTriangle className="h-7 w-7 text-red-600" />}
          label="Atrasado"
          value={formatCurrency(stats.totalAtrasado)}
          helper={`${stats.quantidadeAtrasado} parcela(s)`}
        />
        <MetricCard
          icon={<CheckCircle2 className="h-7 w-7 text-green-600" />}
          label="Pago"
          value={formatCurrency(stats.totalPago)}
          helper={`${stats.quantidadePago} baixa(s)`}
        />
        <MetricCard
          icon={<Clock3 className="h-7 w-7 text-yellow-700" />}
          label="Vence em 7 dias"
          value={String(stats.vencendoEm7Dias)}
        />
      </div>

      <div className="mb-6 rounded-3xl bg-white p-4 shadow-sm">
        <div className="flex overflow-x-auto rounded-2xl bg-slate-100 p-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                if (item.id !== "parcelas") {
                  setSelectedBooklet(null);
                }
              }}
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
              placeholder={
                tab === "carnes"
                  ? "Pesquisar carnê, empresa, CNPJ ou status"
                  : "Pesquisar controle, empresa, status, competência ou observação"
              }
              className="h-12 w-full rounded-xl border border-slate-200 pl-12 pr-4 text-sm font-bold outline-none focus:border-blue-500"
            />
          </div>

          {selectedBooklet && tab === "parcelas" ? (
            <button
              type="button"
              onClick={() => setSelectedBooklet(null)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-5 py-3 font-black text-blue-700 hover:bg-blue-50"
            >
              Ver todas as parcelas
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setNovoCarneOpen(true)}
            className="btn-wisdom-red inline-flex items-center gap-2 rounded-xl px-5 py-3 font-black"
          >
            <Plus className="h-5 w-5" />
            Novo carnê
          </button>

          <button
            type="button"
            onClick={() => abrirBaixa("")}
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-black text-white hover:bg-green-700"
          >
            <SearchCheck className="h-5 w-5" />
            Baixa por controle
          </button>

          <button
            type="button"
            onClick={() => setAjudaOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-black text-blue-950 hover:bg-slate-50"
          >
            <HelpCircle className="h-5 w-5 text-blue-700" />
            Ajuda
          </button>
        </div>
      </div>

      {tab === "carnes" ? (
        <TableShell
          title="Carnês"
          description="Controle dos carnês gerados por empresa."
        >
          <CarnesTable
            carnes={filteredCarnes}
            onVerParcelas={verParcelas}
            onCancelar={setCancelarCarne}
            onExcluir={setExcluirCarne}
          />
        </TableShell>
      ) : null}

      {tab === "parcelas" ? (
        <TableShell
          title={selectedBooklet ? `Parcelas â€” ${selectedBooklet.company_name}` : "Parcelas"}
          description="Folhas do carnê com número de controle individual."
        >
          <ParcelasTable
            charges={filteredCharges}
            onBaixar={abrirBaixa}
            onEditar={setEditarParcela}
            onCancelar={setCancelarParcela}
            onEstornar={setEstornarParcela}
          />
        </TableShell>
      ) : null}

      {tab === "baixas" ? (
        <TableShell
          title="Baixas"
          description="Pagamentos registrados no sistema."
        >
          <BaixasTable charges={filteredCharges} onEstornar={setEstornarParcela} />
        </TableShell>
      ) : null}

      {tab === "inadimplencia" ? (
        <TableShell
          title="Inadimplência"
          description="Parcelas vencidas e ainda não pagas."
        >
          <ParcelasTable
            charges={filteredCharges}
            onBaixar={abrirBaixa}
            onEditar={setEditarParcela}
            onCancelar={setCancelarParcela}
            onEstornar={setEstornarParcela}
          />
        </TableShell>
      ) : null}

      {tab === "configuracoes" ? (
        <TableShell
          title="Configurações"
          description="Parâmetros usados na geração dos carnês e PDFs financeiros."
        >
          <FinanceiroSettingsPanel settings={settings} />
        </TableShell>
      ) : null}

      <Modal
        open={novoCarneOpen}
        onClose={() => setNovoCarneOpen(false)}
        title="Novo carnê"
        description="Gere parcelas mensais vinculadas a uma empresa."
        size="lg"
      >
        <CarneForm
          empresas={empresas}
          defaultInstructions={settings.instrucoes_pagamento_padrao}
        />
      </Modal>

      <Modal
        open={baixaOpen}
        onClose={() => setBaixaOpen(false)}
        title="Baixar pagamento"
        description="Registre o pagamento de uma folha do carnê."
        size="md"
      >
        <BaixaPorControleForm
          key={controleSelecionado || "sem-controle"}
          initialControle={controleSelecionado}
        />
      </Modal>

      <Modal
        open={Boolean(editarParcela)}
        onClose={() => setEditarParcela(null)}
        title="Editar parcela"
        description="Altere valor, vencimento, desconto, instruções e observações."
        size="lg"
      >
        {editarParcela ? <EditarParcelaForm charge={editarParcela} /> : null}
      </Modal>

      <Modal
        open={Boolean(cancelarParcela)}
        onClose={() => setCancelarParcela(null)}
        title="Cancelar parcela"
        description="A parcela será cancelada e a ação ficará registrada."
        size="md"
      >
        {cancelarParcela ? (
          <MotivoForm
            action={cancelarParcelaFinanceiraAction}
            id={cancelarParcela.id}
            title={cancelarParcela.numero_controle || "Parcela"}
            description={cancelarParcela.company_name}
            button="Cancelar parcela"
            tone="danger"
          />
        ) : null}
      </Modal>

      <Modal
        open={Boolean(cancelarCarne)}
        onClose={() => setCancelarCarne(null)}
        title="Cancelar carnê"
        description="O carnê será cancelado. Parcelas já pagas serão preservadas."
        size="md"
      >
        {cancelarCarne ? (
          <MotivoForm
            action={cancelarCarneFinanceiroAction}
            id={cancelarCarne.id}
            title={cancelarCarne.titulo || "Carnê"}
            description={cancelarCarne.company_name}
            button="Cancelar carnê"
            tone="danger"
          />
        ) : null}
      </Modal>


      <Modal
        open={Boolean(excluirCarne)}
        onClose={() => setExcluirCarne(null)}
        title="Excluir carnê"
        description="O carnê será removido da lista. Só é permitido excluir carnês sem parcelas pagas ou baixadas."
        size="md"
      >
        {excluirCarne ? (
          <MotivoForm
            action={excluirCarneFinanceiroAction}
            id={excluirCarne.id}
            title={excluirCarne.titulo || "Carnê"}
            description={excluirCarne.company_name}
            button="Excluir carnê da lista"
            tone="danger"
          />
        ) : null}
      </Modal>
      <Modal
        open={Boolean(estornarParcela)}
        onClose={() => setEstornarParcela(null)}
        title="Estornar baixa"
        description="A baixa será estornada e a parcela voltará para pendente."
        size="md"
      >
        {estornarParcela ? (
          <MotivoForm
            action={estornarBaixaFinanceiraAction}
            id={estornarParcela.id}
            title={estornarParcela.numero_controle || "Parcela"}
            description={estornarParcela.company_name}
            button="Estornar baixa"
            tone="warning"
          />
        ) : null}
      </Modal>

      <Modal
        open={ajudaOpen}
        onClose={() => setAjudaOpen(false)}
        title="Ajuda do financeiro"
        description="Resumo operacional da página."
        size="md"
      >
        <div className="space-y-4 text-sm leading-7 text-slate-600">
          <p>
            Use <strong>Novo carnê</strong> para gerar várias parcelas de uma
            empresa de uma só vez.
          </p>
          <p>
            Use <strong>Parcelas</strong> no carnê para filtrar apenas as folhas
            daquele carnê.
          </p>
          <p>
            Use <strong>Baixa por controle</strong> para registrar o pagamento
            com comprovante anexado.
          </p>
          <p>
            Alterações críticas, cancelamentos e estornos pedem motivo e ficam
            registradas na auditoria.
          </p>
        </div>
      </Modal>
    </section>
  );
}
