export const revalidate = 0;
export const dynamic = "force-dynamic";
import { PageHeader } from "@/components/layout/RhShell";
import { ContratosWorkspace } from "@/features/contratos/ContratosWorkspace";
import { getContratoFormOptions, getContratos } from "@/data/rh/contratos.data";

export default async function ContratosPage() {
  const options = await getContratoFormOptions();
  const { data: contratos, errorMessage } = await getContratos();

  return (
    <>
      <PageHeader
        eyebrow="Termos de estágio"
        title="Contratos"
        description="Rascunhos, emissão de PDF, vigência, assinatura, seguro e status."
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

      <ContratosWorkspace
        contratos={contratos}
        empresas={options.empresas}
        estagiarios={options.estagiarios}
      />
    </>
  );
}