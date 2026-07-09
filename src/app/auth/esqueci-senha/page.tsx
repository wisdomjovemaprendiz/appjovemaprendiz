import { PasswordResetRequestForm } from "@/features/auth/PasswordResetRequestForm";

export default function EsqueciSenhaPage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-5 py-10">
        <PasswordResetRequestForm />
      </div>
    </main>
  );
}