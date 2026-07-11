export const revalidate = 0;
import { getContratoPadraoData } from "@/data/rh/contrato-padrao.data";
import { ContratoPadraoPrintClient } from "@/features/contratos/ContratoPadraoPrintClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ContratoPdfPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data, errorMessage } = await getContratoPadraoData(id);

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-black text-blue-950">
            Contrato não encontrado
          </h1>
          <p className="mt-3 font-semibold text-slate-500">
            {errorMessage || "Não foi possível carregar os dados do contrato."}
          </p>
          <Link
            href="/rh/contratos"
            className="btn-wisdom-blue mt-6 inline-flex rounded-xl px-5 py-3 font-black"
          >
            Voltar para contratos
          </Link>
        </section>
      </main>
    );
  }

  return <ContratoPadraoPrintClient data={data} />;
}