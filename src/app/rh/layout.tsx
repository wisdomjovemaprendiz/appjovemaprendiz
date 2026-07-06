import { RhShell } from "@/components/layout/RhShell";
import { getConfiguracoesData } from "@/data/rh/configuracoes.data";

export default async function RhLayout({ children }: { children: React.ReactNode }) {
  const { data } = await getConfiguracoesData();

  return (
    <RhShell
      organizationLogoUrl={data.organization.logo_url}
      organizationName={data.organization.nome_fantasia}
    >
      {children}
    </RhShell>
  );
}
