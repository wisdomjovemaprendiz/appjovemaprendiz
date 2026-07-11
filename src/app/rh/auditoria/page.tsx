export const revalidate = 0;
export const dynamic = "force-dynamic";
import { PageHeader } from "@/components/layout/RhShell";
import { AuditoriaWorkspace } from "@/features/auditoria/AuditoriaWorkspace";
import { getAuditoria } from "@/data/rh/auditoria.data";

export default async function AuditoriaPage() {
  const { data: logs, stats, errorMessage } = await getAuditoria();

  return (
    <>
      <PageHeader
        eyebrow="Segurança e rastreabilidade"
        title="Auditoria"
        description="Histórico de ações, alterações, baixas, emissões e registros sensíveis."
      />

      {errorMessage ? (
        <section className="mx-auto max-w-7xl px-6 pt-6">
          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-5 text-sm font-black text-yellow-800">
            {errorMessage}
          </div>
        </section>
      ) : null}

      <AuditoriaWorkspace logs={logs} stats={stats} />
    </>
  );
}