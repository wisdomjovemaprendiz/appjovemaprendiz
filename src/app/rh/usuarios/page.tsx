export const revalidate = 0;
export const dynamic = "force-dynamic";
import { PageHeader } from "@/components/layout/RhShell";
import { UsuariosWorkspace } from "@/features/usuarios/UsuariosWorkspace";
import { getUsuariosSistema } from "@/data/rh/usuarios.data";

export default async function UsuariosPage() {
  const { usuarios, empresas, estagiarios, errorMessage } = await getUsuariosSistema();

  return (
    <>
      <PageHeader
        eyebrow="Segurança"
        title="Usuários"
        description="Criação de acessos, redefinição de senha e bloqueio de usuários."
      />

      {errorMessage ? (
        <section className="mx-auto max-w-7xl px-6 pt-6">
          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-5 text-sm font-black text-yellow-800">
            {errorMessage}
          </div>
        </section>
      ) : null}

      <UsuariosWorkspace
        usuarios={usuarios}
        empresas={empresas}
        estagiarios={estagiarios}
      />
    </>
  );
}