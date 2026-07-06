import { redirect } from "next/navigation";

export default function CadastroEmpresaPage() {
  redirect("/login?erro=portal_desativado");
}
