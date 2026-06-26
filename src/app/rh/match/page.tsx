import { PageHeader } from "@/components/layout/RhShell";
import { MatchWorkspace } from "@/features/match/MatchWorkspace";
import { getMatches } from "@/data/rh/match.data";

export default async function MatchPage() {
  const { data: matches, stats, errorMessage } = await getMatches();

  return (
    <>
      <PageHeader
        eyebrow="Recrutamento"
        title="Match"
        description="Compatibilidade entre empresas concedentes e estagiários."
      />

      {errorMessage ? (
        <section className="mx-auto max-w-7xl px-6 pt-6">
          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-5 text-sm font-black text-yellow-800">
            {errorMessage}
          </div>
        </section>
      ) : null}

      <MatchWorkspace matches={matches} stats={stats} />
    </>
  );
}