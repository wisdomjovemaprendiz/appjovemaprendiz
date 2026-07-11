export const revalidate = 0;
export const dynamic = "force-dynamic";
import Link from "next/link";
import { PageHeader } from "@/components/layout/RhShell";
import { EstagiarioForm } from "@/features/estagiarios/EstagiarioForm";
import { getEstagiarioById } from "@/data/rh/estagiarios.data";

export default async function EditarEstagiarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: estagiario, errorMessage } = await getEstagiarioById(id);

  return (
    <>
      <PageHeader
        eyebrow="Editar cadastro"
        title="Editar estagiário"
        description="Atualize os dados do estagiário. Campos preenchidos baixam pendências automaticamente."
        action={
          <Link
            href="/rh/estagiarios"
            className="btn-wisdom-blue rounded-xl px-5 py-3 font-black"
          >
            Voltar para estagiários
          </Link>
        }
      />

      <section className="mx-auto max-w-5xl px-6 py-8">
        {errorMessage ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-black text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {!estagiario && !errorMessage ? (
          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-5 text-sm font-black text-yellow-800">
            Estagiário não encontrado.
          </div>
        ) : null}

        {estagiario ? (
          <EstagiarioForm
            estagiarioId={id}
            initialData={{
              nome: String(estagiario.nome ?? ""),
              data_nascimento: String(estagiario.data_nascimento ?? ""),
              cpf: String(estagiario.cpf ?? ""),
              rg: String(estagiario.rg ?? ""),
              telefone: String(estagiario.telefone ?? ""),
              email: String(estagiario.email ?? ""),
              serie_ano: String(estagiario.serie_ano ?? ""),
              turno: String(estagiario.turno ?? ""),
              escola: String(estagiario.escola ?? ""),
              endereco: String(estagiario.endereco ?? ""),
              bairro: String(estagiario.bairro ?? ""),
              cidade: String(estagiario.cidade ?? "Salvador"),
              estado: String(estagiario.estado ?? "Bahia"),
              cep: String(estagiario.cep ?? ""),
              loja_trabalho: String(estagiario.loja_trabalho ?? ""),
              funcao: String(estagiario.funcao ?? ""),
              valor_bolsa: estagiario.valor_bolsa ?? undefined,
              data_vencimento_seguro: String(estagiario.data_vencimento_seguro ?? ""),
              numero_apolice: String(estagiario.numero_apolice ?? ""),
              seguradora: String(estagiario.seguradora ?? ""),
              observacoes: String(estagiario.observacoes ?? ""),
              skills: estagiario.skills ?? [],
            }}
          />
        ) : null}
      </section>
    </>
  );
}