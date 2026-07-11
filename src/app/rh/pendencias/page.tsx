export const revalidate = 0;
export const dynamic = "force-dynamic";
import { PageHeader } from "@/components/layout/RhShell";
import { PendenciasWorkspace } from "@/features/pendencias/PendenciasWorkspace";
import { getPendencias } from "@/data/rh/pendencias.data";

export default async function PendenciasPage() {
  const { data: pendencias, stats, errorMessage } = await getPendencias();

  return (
    <>
      <PageHeader
        eyebrow="Alertas operacionais"
        title="Pendências"
        description="Cadastros incompletos, lembretes, alertas e acompanhamento de correções."
      />

      {errorMessage ? (
        <section className="mx-auto max-w-7xl px-6 pt-6">
          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-5 text-sm font-black text-yellow-800">
            {errorMessage}
          </div>
        </section>
      ) : null}

      <PendenciasWorkspace pendencias={pendencias} stats={stats} />
    </>
  );
}