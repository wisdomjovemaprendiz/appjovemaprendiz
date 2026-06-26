import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-600">
          Área restrita
        </p>
        <h1 className="mt-3 text-3xl font-black text-blue-950">
          Acesso ao sistema
        </h1>
        <p className="mt-3 text-slate-600">
          Escolha o perfil para acessar. A autenticação real será integrada ao
          Supabase Auth nas próximas etapas.
        </p>

        <div className="mt-8 space-y-3">
          <Link
            href="/rh"
            className="block rounded-xl bg-blue-700 px-5 py-4 text-center font-bold text-white"
          >
            Entrar como RH
          </Link>
          <Link
            href="/empresa"
            className="block rounded-xl border border-blue-200 px-5 py-4 text-center font-bold text-blue-900"
          >
            Entrar como empresa
          </Link>
          <Link
            href="/estagiario"
            className="block rounded-xl border border-blue-200 px-5 py-4 text-center font-bold text-blue-900"
          >
            Entrar como estagiário
          </Link>
        </div>

        <Link href="/" className="mt-6 block text-center text-sm font-semibold text-slate-500">
          Voltar para página inicial
        </Link>
      </section>
    </main>
  );
}
