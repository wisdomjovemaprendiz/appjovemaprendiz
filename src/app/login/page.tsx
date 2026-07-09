import { getConfiguracoesData } from "@/data/rh/configuracoes.data";
import { LoginFormClient } from "@/features/auth/LoginFormClient";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

function findOrganizationName(source: unknown): string | null {
  if (!source || typeof source !== "object") {
    return null;
  }

  const object = source as Record<string, unknown>;

  const priorityKeys = [
    "organizationName",
    "organization_name",
    "nome_fantasia",
    "razao_social",
    "nome",
    "name",
  ];

  for (const key of priorityKeys) {
    const value = object[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  for (const value of Object.values(object)) {
    const found = findOrganizationName(value);

    if (found) {
      return found;
    }
  }

  return null;
}

function loginErrorMessage(errorCode: string) {
  if (!errorCode) {
    return null;
  }

  if (errorCode === "portal_desativado") {
    return "Nesta fase, somente o acesso interno do RH está liberado.";
  }

  return "E-mail ou senha inválidos.";
}

function loginSuccessMessage(messageCode: string) {
  if (messageCode === "senha_atualizada") {
    return "Senha redefinida com sucesso. Entre com a nova senha.";
  }

  return null;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = searchParams ? await searchParams : {};
  const errorMessage = loginErrorMessage(firstValue(params.erro));
  const successMessage = loginSuccessMessage(firstValue(params.mensagem));

  const configuracoes = await getConfiguracoesData().catch(() => null);
  const organizationName =
    findOrganizationName(configuracoes) || "Sistema RH Wisdom";

  const logoUrl = "/api/public/organization-logo";

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-14 px-6 py-10 lg:grid-cols-[1fr_460px]">
        <section className="flex flex-col items-start">
          <img
            src={logoUrl}
            alt={`Logo ${organizationName}`}
            className="mb-10 h-auto w-[280px] max-w-full object-contain"
          />

          <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight text-blue-950 md:text-5xl">
            Sistema RH Wisdom
          </h1>

          <p className="mt-5 max-w-2xl text-base font-semibold leading-relaxed text-slate-600 md:text-lg">
            Gestão interna de empresas, estagiários, contratos, documentos,
            financeiro e auditoria.
          </p>
        </section>

        <div className="flex justify-center lg:justify-end">
          <LoginFormClient
            errorMessage={errorMessage}
            successMessage={successMessage}
            logoUrl={null}
            organizationName={organizationName}
          />
        </div>
      </div>
    </main>
  );
}