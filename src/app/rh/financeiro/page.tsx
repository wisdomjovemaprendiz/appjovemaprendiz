export const revalidate = 0;
export const dynamic = "force-dynamic";
import { PageHeader } from "@/components/layout/RhShell";
import { FinanceiroWorkspace } from "@/features/financeiro/FinanceiroWorkspace";
import { getFinanceiroData, getFinanceiroOptions } from "@/data/rh/financeiro.data";
import { getFinanceiroSettings } from "@/data/rh/financeiro-settings.data";

export default async function FinanceiroPage() {
  const options = await getFinanceiroOptions();
  const { carnes, charges, stats, errorMessage } = await getFinanceiroData();
  const settings = await getFinanceiroSettings();

  return (
    <>
      <PageHeader
        eyebrow="Controle financeiro"
        title="Financeiro"
        description="Carnês, parcelas, vencimentos, baixas e inadimplência."
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

      {settings.errorMessage ? (
        <section className="mx-auto max-w-7xl px-6 pt-6">
          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-5 text-sm font-black text-yellow-800">
            {settings.errorMessage}
          </div>
        </section>
      ) : null}

      <FinanceiroWorkspace
        empresas={options.empresas}
        carnes={carnes}
        charges={charges}
        stats={stats}
        settings={settings.data}
      />
    </>
  );
}