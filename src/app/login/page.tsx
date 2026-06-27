import { LoginForm } from "@/features/auth/LoginForm";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <section className="mx-auto grid min-h-[calc(100vh-80px)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_480px]">
        <div>
          <div className="mb-6 inline-flex rounded-2xl bg-white p-4 shadow-sm">
            <ShieldCheck className="h-10 w-10 text-blue-700" />
          </div>

          <h1 className="max-w-2xl text-4xl font-black tracking-tight text-blue-950 md:text-6xl">
            Sistema RH Wisdom
          </h1>

          <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
            Acesso protegido para gestão de empresas, estagiários, contratos,
            documentos, financeiro e auditoria.
          </p>

          <div className="mt-8 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
            <p className="font-black text-blue-950">Segurança aplicada</p>
            <p className="mt-2 text-sm font-semibold leading-7 text-slate-500">
              Usuários com perfis separados, troca obrigatória de senha inicial,
              rotas internas protegidas e registro de eventos sensíveis.
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-8 shadow-xl">
          <div className="mb-7">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-red-600">
              Login seguro
            </p>
            <h2 className="mt-2 text-3xl font-black text-blue-950">
              Entrar no sistema
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Use o e-mail e a senha cadastrados pelo RH master.
            </p>
          </div>

          <LoginForm />
        </div>
      </section>
    </main>
  );
}