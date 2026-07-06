import { redirect } from "next/navigation";

export default function EmpresaPortalPage() {
  redirect("/login?erro=portal_desativado");
}
