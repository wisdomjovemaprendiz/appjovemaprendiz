export default function EmpresaPortalPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-600">
          Portal da empresa
        </p>
        <h1 className="mt-3 text-3xl font-black text-blue-950">
          Área da empresa concedente
        </h1>
        <p className="mt-4 max-w-3xl text-slate-600">
          Esta área será usada para cadastro, atualização de dados, documentos,
          acompanhamento de estagiários vinculados e pendências.
        </p>
      </section>
    </main>
  );
}
