import { EmptyState, PageHeader } from "@/components/layout/RhShell";
import { BarChart3 } from "lucide-react";

export default function RelatoriosPage() {
  return (
    <>
      <PageHeader
        eyebrow="Análises e documentos"
        title="Relatórios"
        description="Relatórios de empresas, estagiários, contratos, vencimentos, inadimplência e documentos pendentes."
      />

      <section className="mx-auto max-w-7xl px-6 py-8">
        <EmptyState
          icon={<BarChart3 className="h-7 w-7" />}
          title="Relatórios preparados"
          description="Esta área será integrada ao gerador de PDF e aos filtros do sistema para emissão de documentos e análises do RH."
        />
      </section>
    </>
  );
}
