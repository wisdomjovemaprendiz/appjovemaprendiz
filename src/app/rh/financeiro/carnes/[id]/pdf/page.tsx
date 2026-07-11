export const revalidate = 0;
import { getCarneHorizontalPdfData } from "@/data/rh/carne-horizontal-pdf.data";
import { CarneHorizontalPrintClient } from "@/features/financeiro/CarneHorizontalPrintClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CarnePdfPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data, errorMessage } = await getCarneHorizontalPdfData(id);

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-black text-blue-950">
            Carnê não encontrado
          </h1>
          <p className="mt-3 font-semibold text-slate-500">
            {errorMessage || "Não foi possível carregar os dados do carnê."}
          </p>

          <Link
            href="/rh/financeiro"
            className="btn-wisdom-blue mt-6 inline-flex rounded-xl px-5 py-3 font-black"
          >
            Voltar para financeiro
          </Link>
        </section>
      </main>
    );
  }

  return <CarneHorizontalPrintClient data={data} />;
}