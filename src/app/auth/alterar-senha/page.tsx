import { ChangePasswordForm } from "@/features/auth/ChangePasswordForm";
import { ShieldAlert } from "lucide-react";

export default function AlterarSenhaPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-xl items-center">
        <div className="w-full rounded-[2rem] bg-white p-8 shadow-xl">
          <div className="mb-7">
            <div className="mb-4 inline-flex rounded-2xl bg-yellow-50 p-4">
              <ShieldAlert className="h-8 w-8 text-yellow-700" />
            </div>

            <p className="text-sm font-black uppercase tracking-[0.18em] text-red-600">
              Segurança obrigatória
            </p>

            <h1 className="mt-2 text-3xl font-black text-blue-950">
              Altere sua senha
            </h1>

            <p className="mt-2 text-sm font-semibold leading-7 text-slate-500">
              A senha inicial é temporária. Defina uma nova senha para continuar
              acessando o sistema.
            </p>
          </div>

          <ChangePasswordForm />
        </div>
      </section>
    </main>
  );
}