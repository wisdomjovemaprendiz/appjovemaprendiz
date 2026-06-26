import { EmptyState, PageHeader } from "@/components/layout/RhShell";
import { Settings } from "lucide-react";

export default function ConfiguracoesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Parâmetros do sistema"
        title="Configurações"
        description="Dados da Wisdom, logomarca, assinatura, modelos de contrato, tipos de documentos, seguradoras, instituições e parâmetros."
      />

      <section className="mx-auto max-w-7xl px-6 py-8">
        <EmptyState
          icon={<Settings className="h-7 w-7" />}
          title="Configurações preparadas"
          description="Esta área permitirá trocar logomarca, cadastrar modelos, configurar dados do RH Wisdom e controlar parâmetros usados em contratos, PDFs e relatórios."
        />
      </section>
    </>
  );
}
