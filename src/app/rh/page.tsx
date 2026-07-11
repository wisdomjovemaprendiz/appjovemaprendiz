export const revalidate = 0;
export const dynamic = "force-dynamic";
import { PageHeader } from "@/components/layout/RhShell";
import { DashboardWorkspace } from "@/features/dashboard/DashboardWorkspace";
import { getDashboardData } from "@/data/rh/dashboard.data";

export default async function RhDashboardPage() {
  const { data, errorMessage } = await getDashboardData();

  return (
    <>
      <PageHeader
        eyebrow="Painel RH"
        title="Dashboard"
        description="Visão geral dos pontos críticos, alertas e atividades recentes."
      />

      {errorMessage ? (
        <section className="mx-auto max-w-7xl px-6 pt-6">
          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-5 text-sm font-black text-yellow-800">
            Alguns dados não puderam ser carregados: {errorMessage}
          </div>
        </section>
      ) : null}

      <DashboardWorkspace data={data} />
    </>
  );
}