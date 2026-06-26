import Link from "next/link";
import { PageHeader } from "@/components/layout/RhShell";
import { CarnePdfClient } from "@/features/financeiro/CarnePdfClient";
import {
  getCarnePdfById,
  getHistoricoPdfsCarne,
} from "@/data/rh/carne-pdf.data";

export default async function CarnePdfPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data, errorMessage } = await getCarnePdfById(id);
  const historico = await getHistoricoPdfsCarne(id);

  return (
    <>
      <PageHeader
        eyebrow="Carnê"
        title="PDF do carnê"
        description="Capa, parcelas, QR Code Pix e número de controle para impressão."
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
          <CarnePdfClient data={data} historico={historico.data} />
        ) : null}
      </section>
    </>
  );
}