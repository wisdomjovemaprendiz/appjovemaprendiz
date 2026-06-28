import { PageHeader } from "@/components/layout/RhShell";
import { getRelatoriosData } from "@/data/rh/relatorios.data";
import { RelatoriosWorkspace } from "@/features/relatorios/RelatoriosWorkspace";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  const { data, errorMessage } = await getRelatoriosData();

  return (
    <>
      <PageHeader
        eyebrow="Análises e documentos"
        title="Relatórios"
        description="Relatórios de empresas, estagiários, contratos, vencimentos, inadimplência e documentos pendentes."
      />

      {errorMessage ? (
        <section className="mx-auto max-w-7xl px-6 pt-6">
          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4 text-sm font-black text-yellow-800">
            {errorMessage}
          </div>
        </section>
      ) : null}

      <RelatoriosWorkspace data={data} />
    </>
  );
}