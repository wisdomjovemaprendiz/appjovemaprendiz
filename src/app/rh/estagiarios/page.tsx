export const revalidate = 0;
export const dynamic = "force-dynamic";
import { PageHeader } from "@/components/layout/RhShell";
import { EstagiariosWorkspace } from "@/features/estagiarios/EstagiariosWorkspace";
import { getEstagiarios } from "@/data/rh/estagiarios.data";

export default async function EstagiariosPage() {
  const { data: estagiarios, errorMessage } = await getEstagiarios();

  return (
    <>
      <PageHeader
        eyebrow="Cadastro e acompanhamento"
        title="Estagiários"
        description="Dados pessoais, escola, estágio, seguro, documentos e status."
      />

      {errorMessage ? (
        <section className="mx-auto max-w-7xl px-6 pt-6">
          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-5 text-sm font-black text-yellow-800">
            {errorMessage}
          </div>
        </section>
      ) : null}

      <EstagiariosWorkspace estagiarios={estagiarios} />
    </>
  );
}