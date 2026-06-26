import { PageHeader } from "@/components/layout/RhShell";
import { EmpresasWorkspace } from "@/features/empresas/EmpresasWorkspace";
import { getEmpresas } from "@/data/rh/empresas.data";

export default async function EmpresasPage() {
  const { data: empresas, errorMessage } = await getEmpresas();

  return (
    <>
      <PageHeader
        eyebrow="Cadastro e gestão"
        title="Empresas"
        description="Empresas concedentes, responsáveis, documentos, perfil de vaga e status."
      />

      {errorMessage ? (
        <section className="mx-auto max-w-7xl px-6 pt-6">
          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-5 text-sm font-black text-yellow-800">
            {errorMessage}
          </div>
        </section>
      ) : null}

      <EmpresasWorkspace empresas={empresas} />
    </>
  );
}