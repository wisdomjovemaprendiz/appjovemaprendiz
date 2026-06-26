import Link from "next/link";
import { PageHeader } from "@/components/layout/RhShell";
import { EmpresaForm } from "@/features/empresas/EmpresaForm";
import { getEmpresaById } from "@/data/rh/empresas.data";

export default async function EditarEmpresaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: empresa, errorMessage } = await getEmpresaById(id);

  return (
    <>
      <PageHeader
        eyebrow="Editar cadastro"
        title="Editar empresa"
        description="Atualize os dados da empresa. Campos preenchidos baixam pendências automaticamente."
        action={
          <Link
            href="/rh/empresas"
            className="btn-wisdom-blue rounded-xl px-5 py-3 font-black"
          >
            Voltar para empresas
          </Link>
        }
      />

      <section className="mx-auto max-w-5xl px-6 py-8">
        {errorMessage ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-black text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {!empresa && !errorMessage ? (
          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-5 text-sm font-black text-yellow-800">
            Empresa não encontrada.
          </div>
        ) : null}

        {empresa ? (
          <EmpresaForm
            empresaId={id}
            initialData={{
              nome_responsavel: empresa.nome_responsavel ?? "",
              cnpj: empresa.cnpj ?? "",
              razao_social: empresa.razao_social ?? "",
              nome_fantasia: empresa.nome_fantasia ?? "",
              ramo_atuacao: empresa.ramo_atuacao ?? "",
              endereco: empresa.endereco ?? "",
              bairro: empresa.bairro ?? "",
              cidade: empresa.cidade ?? "Salvador",
              estado: empresa.estado ?? "Bahia",
              cep: empresa.cep ?? "",
              email: empresa.email ?? "",
              telefone: empresa.telefone ?? "",
              perfil_candidato: empresa.perfil_candidato ?? "",
              funcoes_estagiario: empresa.funcoes_estagiario ?? "",
              valor_bolsa: empresa.valor_bolsa ?? undefined,
              observacoes: empresa.observacoes ?? "",
              skills_desejadas: empresa.skills_desejadas ?? [],
              funcoes_sugeridas: empresa.funcoes_sugeridas ?? [],
            }}
          />
        ) : null}
      </section>
    </>
  );
}