"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { excluirDocumentoAction } from "@/actions/rh/documento.actions";
import { Modal } from "@/components/ui/Modal";
import { EmptyTable, MetricCard, StatusPill, TableShell } from "@/components/ui/WorkspaceUi";
import { DocumentoUploadForm } from "@/features/documentos/DocumentoUploadForm";
import type { DocumentoListItem, DocumentoOptions } from "@/data/rh/documentos.data";
import {
  Building2,
  ExternalLink,
  FileText,
  FolderOpen,
  GraduationCap,
  HelpCircle,
  Plus,
  Search,
  ScrollText,
  Trash2,
} from "lucide-react";

type DocumentosTab = "todos" | "estagiario" | "empresa" | "contrato" | "geral";

function formatFileSize(size: number | null) {
  if (!size) return "Não informado";

  if (size < 1024 * 1024) {
    return String(Math.max(1, Math.round(size / 1024))) + " KB";
  }

  return (size / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDateTime(date: string | null) {
  if (!date) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function entityLabel(type: string | null) {
  if (type === "empresa") return "Empresa";
  if (type === "estagiario") return "Estagiário";
  if (type === "contrato") return "Contrato";
  if (type === "financeiro") return "Financeiro";
  if (type === "landing") return "Landing";
  if (type === "rh") return "RH";
  return "Geral";
}

function humanize(value: string | null) {
  if (!value) return "Não informada";

  return value
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function DocumentosTable({
  documentos,
  onExcluir,
}: {
  documentos: DocumentoListItem[];
  onExcluir: (documento: DocumentoListItem) => void;
}) {
  if (documentos.length === 0) {
    return (
      <EmptyTable
        title="Nenhum documento encontrado."
        description="Use Enviar documentos para anexar arquivos."
      />
    );
  }

  const gridClass =
    "grid grid-cols-[minmax(0,2.1fr)_minmax(0,1.15fr)_minmax(0,1.15fr)_minmax(0,1.2fr)_82px] items-center gap-3";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100">
      <div
        className={
          gridClass +
          " bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500"
        }
      >
        <span>Arquivo</span>
        <span>Vínculo</span>
        <span>Categoria</span>
        <span>Tipo/Envio</span>
        <span className="text-right">Ações</span>
      </div>

      <div className="divide-y divide-slate-100">
        {documentos.map((documento) => (
          <article
            key={documento.id}
            className={gridClass + " min-h-[68px] px-4 py-3 transition hover:bg-slate-50"}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-blue-950">
                {documento.original_name || documento.file_name || "Documento sem nome"}
              </p>
              <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">
                {documento.file_name || "Nome interno não informado"}
              </p>
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-700">
                {entityLabel(documento.entity_type)}
              </p>
              <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">
                {documento.entity_name || "Sem vínculo"}
              </p>
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-700">
                {humanize(documento.category)}
              </p>
              <div className="mt-1">
                <StatusPill tone={documento.status === "ativo" ? "ok" : "muted"}>
                  {documento.status || "ativo"}
                </StatusPill>
              </div>
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-700">
                {documento.mime_type || "Tipo não informado"}
              </p>
              <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">
                {formatFileSize(documento.file_size)}
              </p>
              <p className="mt-1 truncate text-[11px] font-bold text-blue-950">
                {formatDateTime(documento.created_at)}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              {documento.drive_web_view_link ? (
                <a
                  href={documento.drive_web_view_link}
                  target="_blank"
                  rel="noreferrer"
                  title="Abrir documento"
                  aria-label="Abrir documento"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white transition hover:bg-blue-800"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only">Abrir documento</span>
                </a>
              ) : null}

              <button
                type="button"
                onClick={() => onExcluir(documento)}
                title="Excluir documento"
                aria-label="Excluir documento"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-white text-red-700 transition hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Excluir documento</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function DocumentosWorkspace({
  documentos,
  options,
}: {
  documentos: DocumentoListItem[];
  options: DocumentoOptions;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<DocumentosTab>("todos");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [ajudaOpen, setAjudaOpen] = useState(false);
  const [documentoExcluir, setDocumentoExcluir] = useState<DocumentoListItem | null>(null);
  const [search, setSearch] = useState("");

  const estagiarioDocs = documentos.filter((item) => item.entity_type === "estagiario");
  const empresaDocs = documentos.filter((item) => item.entity_type === "empresa");
  const contratoDocs = documentos.filter((item) => item.entity_type === "contrato");
  const geralDocs = documentos.filter(
    (item) => item.entity_type === "geral" || item.entity_type === "rh" || !item.entity_type
  );

  const baseList = useMemo(() => {
    if (tab === "estagiario") return estagiarioDocs;
    if (tab === "empresa") return empresaDocs;
    if (tab === "contrato") return contratoDocs;
    if (tab === "geral") return geralDocs;
    return documentos;
  }, [tab, documentos, estagiarioDocs, empresaDocs, contratoDocs, geralDocs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return baseList;

    return baseList.filter((documento) =>
      [
        documento.original_name,
        documento.file_name,
        documento.category,
        documento.mime_type,
        documento.entity_type,
        documento.entity_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [baseList, search]);

  async function handleExcluirDocumento(formData: FormData) {
    setDocumentoExcluir(null);
    await excluirDocumentoAction(formData);
    router.refresh();
  }

  const tabs: Array<{ id: DocumentosTab; label: string; icon: ReactNode }> = [
    { id: "todos", label: "Todos", icon: <FileText className="h-5 w-5" /> },
    { id: "estagiario", label: "Estagiários", icon: <GraduationCap className="h-5 w-5" /> },
    { id: "empresa", label: "Empresas", icon: <Building2 className="h-5 w-5" /> },
    { id: "contrato", label: "Contratos", icon: <ScrollText className="h-5 w-5" /> },
    { id: "geral", label: "Geral", icon: <FolderOpen className="h-5 w-5" /> },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 grid gap-5 md:grid-cols-5">
        <MetricCard
          icon={<FileText className="h-7 w-7" />}
          label="Documentos"
          value={String(documentos.length)}
          helper="total no banco"
        />
        <MetricCard
          icon={<GraduationCap className="h-7 w-7" />}
          label="Estagiários"
          value={String(estagiarioDocs.length)}
        />
        <MetricCard
          icon={<Building2 className="h-7 w-7" />}
          label="Empresas"
          value={String(empresaDocs.length)}
        />
        <MetricCard
          icon={<ScrollText className="h-7 w-7" />}
          label="Contratos"
          value={String(contratoDocs.length)}
        />
        <MetricCard
          icon={<FolderOpen className="h-7 w-7" />}
          label="Geral"
          value={String(geralDocs.length)}
        />
      </div>

      <div className="mb-6 rounded-3xl bg-white p-4 shadow-sm">
        <div className="flex overflow-x-auto rounded-2xl bg-slate-100 p-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={
                "inline-flex min-h-14 flex-1 shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-black " +
                (tab === item.id
                  ? "bg-white text-blue-950 shadow-sm"
                  : "text-slate-500 hover:text-blue-950")
              }
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
              placeholder="Pesquisar arquivo, categoria, vínculo ou tipo"
              className="h-12 w-full rounded-xl border border-slate-200 pl-12 pr-4 text-sm font-bold outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="btn-wisdom-red inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-black"
          >
            <Plus className="h-5 w-5" />
            Enviar documentos
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
        title="Documentos"
        description="Consulta, visualização e exclusão de documentos vinculados aos cadastros."
      >
        <DocumentosTable documentos={filtered} onExcluir={setDocumentoExcluir} />
      </TableShell>

      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Enviar documentos"
        description="Vincule os arquivos a um estagiário, empresa, contrato ou registro geral."
        size="xl"
      >
        <DocumentoUploadForm options={options} />
      </Modal>

      <Modal
        open={Boolean(documentoExcluir)}
        onClose={() => setDocumentoExcluir(null)}
        title="Excluir documento"
        description="O registro será removido do banco de dados. Quando houver arquivo no Google Drive, o sistema tentará enviá-lo para a lixeira."
        size="md"
      >
        {documentoExcluir ? (
          <form action={handleExcluirDocumento} className="space-y-5">
            <input type="hidden" name="id" value={documentoExcluir.id} />

            <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <p className="text-sm font-black text-red-700">Documento selecionado</p>
              <p className="mt-1 font-black text-blue-950">
                {documentoExcluir.original_name || documentoExcluir.file_name || "Documento sem nome"}
              </p>
              <p className="mt-2 text-xs font-bold leading-5 text-red-700">
                Esta ação remove o documento da tabela de documentos e registra a exclusão na auditoria.
              </p>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-black text-blue-950">
                Motivo da exclusão
              </span>
              <textarea
                name="motivo"
                required
                rows={4}
                placeholder="Descreva o motivo da exclusão."
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
              />
            </label>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-black text-white hover:bg-red-700"
            >
              <Trash2 className="h-5 w-5" />
              Confirmar exclusão
            </button>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={ajudaOpen}
        onClose={() => setAjudaOpen(false)}
        title="Ajuda de documentos"
        description="Resumo operacional da página."
        size="md"
      >
        <div className="space-y-4 text-sm leading-7 text-slate-600">
          <p>
            Use <strong>Enviar documentos</strong> para anexar um ou mais
            arquivos e vinculá-los a um cadastro.
          </p>
          <p>
            A organização dos arquivos segue o vínculo escolhido, como empresa,
            estagiário ou contrato.
          </p>
          <p>
            Use <strong>Excluir</strong> quando um documento precisar ser removido
            da base do sistema. A ação fica registrada na auditoria.
          </p>
        </div>
      </Modal>
    </section>
  );
}
