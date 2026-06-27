import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { requireRhMaster } from "@/lib/supabase/server-auth";

export type UsuarioSistema = {
  id: string;
  email: string;
  nome: string;
  role: string;
  status: string;
  company_id: string | null;
  student_id: string | null;
  must_change_password: boolean;
  created_at: string | null;
  company_name?: string | null;
  student_name?: string | null;
};

export type UsuarioOption = {
  id: string;
  label: string;
  detail?: string | null;
};

export async function getUsuariosSistema(): Promise<{
  usuarios: UsuarioSistema[];
  empresas: UsuarioOption[];
  estagiarios: UsuarioOption[];
  errorMessage?: string;
}> {
  const auth = await requireRhMaster();

  if (!auth.ok) {
    return {
      usuarios: [],
      empresas: [],
      estagiarios: [],
      errorMessage: auth.message,
    };
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      usuarios: [],
      empresas: [],
      estagiarios: [],
      errorMessage: "Supabase ainda não configurado.",
    };
  }

  const [profilesResult, companiesResult, studentsResult] = await Promise.all([
    supabase
      .from("app_profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("companies")
      .select("id, razao_social, nome_fantasia, cnpj")
      .order("criado_em", { ascending: false })
      .limit(500),
    supabase
      .from("students")
      .select("id, nome, cpf, serie_ano, turno")
      .order("criado_em", { ascending: false })
      .limit(500),
  ]);

  if (profilesResult.error) {
    return {
      usuarios: [],
      empresas: [],
      estagiarios: [],
      errorMessage: `Erro ao carregar usuários: ${profilesResult.error.message}`,
    };
  }

  const companyMap = new Map<string, string>();
  const studentMap = new Map<string, string>();

  for (const company of companiesResult.data ?? []) {
    companyMap.set(
      company.id,
      company.nome_fantasia || company.razao_social || "Empresa sem nome"
    );
  }

  for (const student of studentsResult.data ?? []) {
    studentMap.set(student.id, student.nome || "Estagiário sem nome");
  }

  return {
    usuarios: ((profilesResult.data ?? []) as UsuarioSistema[]).map((user) => ({
      ...user,
      company_name: user.company_id ? companyMap.get(user.company_id) || null : null,
      student_name: user.student_id ? studentMap.get(user.student_id) || null : null,
    })),
    empresas: (companiesResult.data ?? []).map((company) => ({
      id: company.id,
      label: company.nome_fantasia || company.razao_social || "Empresa sem nome",
      detail: company.cnpj ? `CNPJ: ${company.cnpj}` : null,
    })),
    estagiarios: (studentsResult.data ?? []).map((student) => ({
      id: student.id,
      label: student.nome || "Estagiário sem nome",
      detail: [student.serie_ano, student.turno].filter(Boolean).join(" • ") || student.cpf || null,
    })),
  };
}