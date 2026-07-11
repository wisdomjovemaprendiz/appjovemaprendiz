export const revalidate = 0;
export const dynamic = "force-dynamic";
import { PageHeader } from "@/components/layout/RhShell";
import { getConfiguracoesData } from "@/data/rh/configuracoes.data";
import { ConfiguracoesWorkspace } from "@/features/configuracoes/ConfiguracoesWorkspace";

export default async function ConfiguracoesPage() {
  const { data, errorMessage } = await getConfiguracoesData();

  return (
    <>
      <PageHeader
        eyebrow="Parâmetros do sistema"
        title="Configurações"
        description="Dados da Wisdom, logomarca, assinatura, modelos de contrato, tipos de documentos, seguradoras, instituições e parâmetros."
      />

      {errorMessage ? (
        <section className="mx-auto max-w-7xl px-6 pt-6">
          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-5 text-sm font-black text-yellow-800">
            {errorMessage}
          </div>
        </section>
      ) : null}

      <ConfiguracoesWorkspace
        organization={data.organization}
        catalogItems={data.catalogItems}
      />
    </>
  );
}