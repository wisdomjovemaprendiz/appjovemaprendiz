import Link from "next/link";
import { PageHeader } from "@/components/layout/RhShell";
import { ContratoPdfClient } from "@/features/contratos/ContratoPdfClient";
import {
  getContratoPdfById,
  getHistoricoPdfsContrato,
} from "@/data/rh/contrato-pdf.data";

export default async function ContratoPdfPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data, errorMessage } = await getContratoPdfById(id);
  const historico = await getHistoricoPdfsContrato(id);

  return (
    <>
      <PageHeader
        eyebrow="Gerador de PDF"
        title="PDF do contrato de estágio"
        description="Visualize, registre a emissão e salve o contrato em PDF pelo navegador."
        action={
          <Link
            href="/rh/contratos"
            className="btn-wisdom-blue rounded-xl px-5 py-3 font-black"
          >
            Voltar para contratos
          </Link>
        }
      />

      <section className="mx-auto max-w-7xl px-6 py-8">
        {errorMessage ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-black text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {historico.errorMessage ? (
          <div className="mb-6 rounded-2xl border border-yellow-100 bg-yellow-50 p-5 text-sm font-black text-yellow-800">
            {historico.errorMessage}
          </div>
        ) : null}

        {data ? (
          <ContratoPdfClient data={data} historico={historico.data} />
        ) : null}
      </section>
    </>
  );
}