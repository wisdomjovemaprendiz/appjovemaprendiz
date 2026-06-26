export default function CadastroEmpresaPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-600">
          Cadastro inicial
        </p>
        <h1 className="mt-3 text-3xl font-black text-blue-950">
          Cadastre sua empresa
        </h1>
        <p className="mt-4 max-w-3xl text-slate-600">
          O formulário completo será conectado ao banco de dados. Campos
          previstos: responsável, CNPJ, razão social, endereço, e-mail,
          telefone, perfil do candidato, funções, bolsa, logomarca e documentos.
        </p>
      </section>
    </main>
  );
}
