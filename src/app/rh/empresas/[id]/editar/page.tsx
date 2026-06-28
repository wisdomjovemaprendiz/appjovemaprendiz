import { PageHeader } from "@/components/layout/RhShell";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { EmpresaForm } from "@/features/empresas/EmpresaForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EditarEmpresaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return (
      <>
        <PageHeader
          eyebrow="Editar cadastro"
          title="Editar empresa"
          description="Atualize os dados da empresa."
        />

        <section className="mx-auto max-w-5xl px-6 py-8">
          <div className="rounded-3xl border border-red-100 bg-red-50 p-6 font-black text-red-700">
            Supabase ainda não configurado.
          </div>
        </section>
      </>
    );
  }

  const { data: empresa, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !empresa) {
    return (
      <>
        <PageHeader
          eyebrow="Editar cadastro"
          title="Empresa não encontrada"
          description="Não foi possível carregar os dados da empresa."
          action={
            <Link
              href="/rh/empresas"
              className="btn-wisdom-blue inline-flex rounded-xl px-5 py-3 text-sm font-black"
            >
              Voltar para empresas
            </Link>
          }
        />

        <section className="mx-auto max-w-5xl px-6 py-8">
          <div className="rounded-3xl border border-red-100 bg-red-50 p-6 font-black text-red-700">
            {error?.message || "Empresa não localizada no banco de dados."}
          </div>
        </section>
      </>
    );
  }

  const nomeEmpresa =
    empresa.nome_fantasia ||
    empresa.razao_social ||
    "empresa selecionada";

  return (
    <>
      <PageHeader
        eyebrow="Editar cadastro"
        title="Editar empresa"
        description={`Atualize os dados de ${nomeEmpresa}. Os campos preenchidos baixam pendências automaticamente.`}
        action={
          <Link
            href="/rh/empresas"
            className="btn-wisdom-blue inline-flex rounded-xl px-5 py-3 text-sm font-black"
          >
            Voltar para empresas
          </Link>
        }
      />

      <section className="mx-auto max-w-5xl px-6 py-8">
        <EmpresaForm empresa={empresa} empresaId={empresa.id} />
      </section>
    </>
  );
}