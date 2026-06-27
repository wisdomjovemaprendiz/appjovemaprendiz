import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

export type AppRole = "rh_master" | "rh_operador" | "empresa" | "estagiario";

export type AppProfile = {
  id: string;
  email: string;
  nome: string;
  role: AppRole;
  status: "ativo" | "inativo" | "bloqueado";
  company_id: string | null;
  student_id: string | null;
  must_change_password: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export function homeForRole(role: AppRole) {
  if (role === "empresa") return "/empresa";
  if (role === "estagiario") return "/estagiario";
  return "/rh";
}

export async function createSupabaseServerAuthClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Chamado dentro de Server Component. O middleware atualiza a sessão.
          }
        },
      },
    }
  );
}

export async function getCurrentProfile(): Promise<{
  user: User | null;
  profile: AppProfile | null;
}> {
  const supabase = await createSupabaseServerAuthClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      profile: null,
    };
  }

  const { data: profile } = await supabase
    .from("app_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user,
    profile: profile as AppProfile | null,
  };
}

export async function requireRhMaster() {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile || profile.role !== "rh_master" || profile.status !== "ativo") {
    return {
      ok: false,
      user,
      profile,
      message: "Apenas o RH master pode executar esta ação.",
    };
  }

  return {
    ok: true,
    user,
    profile,
    message: "Autorizado.",
  };
}