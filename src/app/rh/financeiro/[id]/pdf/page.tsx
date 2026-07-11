export const revalidate = 0;
export const dynamic = "force-dynamic";
import Link from "next/link";
import { PageHeader } from "@/components/layout/RhShell";
import { FinanceiroPdfClient } from "@/features/financeiro/FinanceiroPdfClient";
import {
  getFinanceiroPdfById,
  getHistoricoPdfsFinanceiro,
} from "@/data/rh/financeiro-pdf.data";

export default async function FinanceiroPdfPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data, errorMessage } = await getFinanceiroPdfById(id);
  const historico = await getHistoricoPdfsFinanceiro(id);

  return (
    <>
      <PageHeader
        eyebrow="Documento financeiro"
        title="PDF financeiro"
        description="Visualize, registre a emissão e imprima o documento financeiro."
        action={
          <Link
            href="/rh/financeiro"
            className="btn-wisdom-blue rounded-xl px-5 py-3 font-black"
          >
            Voltar para financeiro
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
          <FinanceiroPdfClient data={data} historico={historico.data} />
        ) : null}
      </section>
    </>
  );
}