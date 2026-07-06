import { redirect } from "next/navigation";

export default function EstagiarioPortalPage() {
  redirect("/login?erro=portal_desativado");
}
