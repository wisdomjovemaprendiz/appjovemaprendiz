"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { arquivarDocumentoAction } from "@/actions/rh/documento.actions";
import { Modal } from "@/components/ui/Modal";
import { EmptyTable, MetricCard, StatusPill, TableShell } from "@/components/ui/WorkspaceUi";
import { DocumentoUploadForm } from "@/features/documentos/DocumentoUploadForm";
import type { DocumentoListItem, DocumentoOptions } from "@/data/rh/documentos.data";
import {
  Archive,
  Building2,
  ExternalLink,
  FileText,
  FolderOpen,
  GraduationCap,
  HelpCircle,
  Plus,
  Search,
  ScrollText,
} from "lucide-react";

type DocumentosTab = "todos" | "estagiario" | "empresa" | "contrato" | "geral";

function formatFileSize(size: number | null) {
  if (!size) return "Não informado";

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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
  return "Geral";
}

function DocumentosTable({
  documentos,
  onArquivar,
}: {
  documentos: DocumentoListItem[];
  onArquivar: (documento: DocumentoListItem) => void;
}) {
  if (documentos.length === 0) {
    return (
      <EmptyTable
        title="Nenhum documento encontrado."
        description="Use Enviar documentos para anexar arquivos."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1100px] w-full border-separate border-spacing-y-2">
        <thead>
          <tr className="text-left text-xs font-black uppercase tracking-wide text-slate-500">
            <th className="px-4 py-2">Arquivo</th>
            <th className="px-4 py-2">Vínculo</th>
            <th className="px-4 py-2">Categoria</th>
            <th className="px-4 py-2">Tipo/Tamanho</th>
            <th className="px-4 py-2">Envio</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2 text-right">Ações</th>
          </tr>
        </thead>

        <tbody>
          {documentos.map((documento) => (
            <tr key={documento.id} className="bg-slate-50">
              <td className="rounded-l-2xl px-4 py-4">
                <p className="max-w-[260px] truncate font-black text-blue-950">
                  {documento.original_name || documento.file_name || "Documento sem nome"}
                </p>
                <p className="max-w-[260px] truncate text-xs font-semibold text-slate-500">
                  {documento.file_name || "Nome interno não informado"}
                </p>
              </td>

              <td className="px-4 py-4">
                <p className="font-bold text-slate-700">
                  {entityLabel(documento.entity_type)}
                </p>
                <p className="max-w-[220px] truncate text-xs font-semibold text-slate-500">
                  {documento.entity_name || "Sem vínculo"}
                </p>
              </td>

              <td className="px-4 py-4 font-bold text-slate-700">
                {documento.category || "Não informada"}
              </td>

              <td className="px-4 py-4">
                <p className="font-bold text-slate-700">
                  {documento.mime_type || "Tipo não informado"}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {formatFileSize(documento.file_size)}
                </p>
              </td>

              <td className="px-4 py-4 font-bold text-slate-700">
                {formatDateTime(documento.created_at)}
              </td>

              <td className="px-4 py-4">
                <StatusPill tone={documento.status === "ativo" ? "ok" : "muted"}>
                  {documento.status || "ativo"}
                </StatusPill>
              </td>

              <td className="rounded-r-2xl px-4 py-4">
                <div className="flex justify-end gap-2">
                  {documento.drive_web_view_link ? (
                    <a
                      href={documento.drive_web_view_link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Abrir
                    </a>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => onArquivar(documento)}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-white px-3 py-2 text-xs font-black text-red-700 hover:bg-red-50"
                  >
                    <Archive className="h-4 w-4" />
                    Arquivar
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

export function DocumentosWorkspace({
  documentos,
  options,
}: {
  documentos: DocumentoListItem[];
  options: DocumentoOptions;
}) {
  const [tab, setTab] = useState<DocumentosTab>("todos");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [ajudaOpen, setAjudaOpen] = useState(false);
  const [documentoArquivar, setDocumentoArquivar] = useState<DocumentoListItem | null>(null);
  const [search, setSearch] = useState("");

  const estagiarioDocs = documentos.filter((item) => item.entity_type === "estagiario");
  const empresaDocs = documentos.filter((item) => item.entity_type === "empresa");
  const contratoDocs = documentos.filter((item) => item.entity_type === "contrato");
  const geralDocs = documentos.filter((item) => item.entity_type === "geral" || !item.entity_type);

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
          helper="total ativo"
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
        description="Consulta, visualização e arquivamento de arquivos vinculados aos cadastros."
      >
        <DocumentosTable documentos={filtered} onArquivar={setDocumentoArquivar} />
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
        open={Boolean(documentoArquivar)}
        onClose={() => setDocumentoArquivar(null)}
        title="Arquivar documento"
        description="O documento deixará de aparecer na lista principal, mas permanecerá registrado."
        size="md"
      >
        {documentoArquivar ? (
          <form action={arquivarDocumentoAction} className="space-y-5">
            <input type="hidden" name="id" value={documentoArquivar.id} />

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-500">Arquivo</p>
              <p className="mt-1 font-black text-blue-950">
                {documentoArquivar.original_name || documentoArquivar.file_name || "Documento sem nome"}
              </p>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-black text-blue-950">
                Motivo do arquivamento
              </span>
              <textarea
                name="motivo"
                required
                rows={4}
                placeholder="Descreva o motivo do arquivamento."
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
              />
            </label>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-black text-white hover:bg-red-700"
            >
              <Archive className="h-5 w-5" />
              Confirmar arquivamento
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
            Use <strong>Arquivar</strong> quando um documento não deve mais
            aparecer na lista principal. O registro continua disponível no
            histórico.
          </p>
        </div>
      </Modal>
    </section>
  );
}