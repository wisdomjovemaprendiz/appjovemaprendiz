import { PageHeader } from "@/components/layout/RhShell";
import { DocumentosWorkspace } from "@/features/documentos/DocumentosWorkspace";
import { getDocumentoOptions, getDocumentos } from "@/data/rh/documentos.data";

export default async function DocumentosPage() {
  const options = await getDocumentoOptions();
  const { data: documentos, errorMessage } = await getDocumentos();

  return (
    <>
      <PageHeader
        eyebrow="Arquivos"
        title="Documentos"
        description="Envio, consulta, vínculo, visualização e exclusão de documentos."
      />

      {options.errorMessage ? (
        <section className="mx-auto max-w-7xl px-6 pt-6">
          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-5 text-sm font-black text-yellow-800">
            {options.errorMessage}
          </div>
        </section>
      ) : null}

      {errorMessage ? (
        <section className="mx-auto max-w-7xl px-6 pt-6">
          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-5 text-sm font-black text-yellow-800">
            {errorMessage}
          </div>
        </section>
      ) : null}

      <DocumentosWorkspace documentos={documentos} options={options.data} />
    </>
  );
}