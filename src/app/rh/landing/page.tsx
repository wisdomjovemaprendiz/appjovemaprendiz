import { PageHeader } from "@/components/layout/RhShell";
import { getLandingRhData } from "@/data/rh/landing.data";
import { LandingSettingsWorkspace } from "@/features/landing/LandingSettingsWorkspace";

export default async function RhLandingPage() {
  const { settings, media, updates, errorMessage } = await getLandingRhData();

  return (
    <>
      <PageHeader
        eyebrow="Configuração"
        title="Landing Page"
        description="Configure textos, vídeo, fotos, links, acessos e atualizações públicas da landing page."
      />

      {errorMessage ? (
        <section className="mx-auto max-w-7xl px-6 pt-6">
          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-5 text-sm font-black text-yellow-800">
            {errorMessage}
          </div>
        </section>
      ) : null}

      <LandingSettingsWorkspace
        initialSettings={settings}
        initialMedia={media}
        initialUpdates={updates}
      />
    </>
  );
}