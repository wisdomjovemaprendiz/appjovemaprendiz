import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type ReminderListItem = {
  id: string;
  entity_type: "empresa" | "estagiario" | "contrato" | "financeiro";
  entity_id: string;
  campo: string;
  mensagem: string;
  lembrar_em: string | null;
  criado_em: string;
  entity_name: string;
  entity_detail?: string | null;
};

export type ReminderStats = {
  total: number;
  empresas: number;
  estagiarios: number;
  contratos: number;
  financeiro: number;
};

export async function getActiveReminders(limit = 50): Promise<{
  data: ReminderListItem[];
  stats: ReminderStats;
  errorMessage?: string;
}> {
  const supabase = getSupabaseAdminClient();

  const emptyStats: ReminderStats = {
    total: 0,
    empresas: 0,
    estagiarios: 0,
    contratos: 0,
    financeiro: 0,
  };

  if (!supabase) {
    return {
      data: [],
      stats: emptyStats,
      errorMessage:
        "Supabase ainda não configurado. Preencha o .env.local para carregar pendências reais.",
    };
  }

  const now = new Date().toISOString();

  const { data: reminders, error } = await supabase
    .from("completion_reminders")
    .select(
      "id, entity_type, entity_id, campo, mensagem, lembrar_em, criado_em"
    )
    .eq("ativo", true)
    .eq("resolvido", false)
    .eq("ignorar_definitivo", false)
    .or(`lembrar_em.is.null,lembrar_em.lte.${now}`)
    .order("criado_em", { ascending: false })
    .limit(limit);

  if (error) {
    return {
      data: [],
      stats: emptyStats,
      errorMessage: `Erro ao carregar pendências: ${error.message}`,
    };
  }

  const rows = (reminders ?? []) as Array<{
    id: string;
    entity_type: "empresa" | "estagiario" | "contrato" | "financeiro";
    entity_id: string;
    campo: string;
    mensagem: string;
    lembrar_em: string | null;
    criado_em: string;
  }>;

  const companyIds = rows
    .filter((item) => item.entity_type === "empresa")
    .map((item) => item.entity_id);

  const studentIds = rows
    .filter((item) => item.entity_type === "estagiario")
    .map((item) => item.entity_id);

  const companyMap = new Map<string, { name: string; detail?: string | null }>();
  const studentMap = new Map<string, { name: string; detail?: string | null }>();

  if (companyIds.length > 0) {
    const { data: companies } = await supabase
      .from("companies")
      .select("id, razao_social, nome_fantasia, cnpj")
      .in("id", companyIds);

    for (const company of companies ?? []) {
      companyMap.set(company.id, {
        name:
          company.nome_fantasia ||
          company.razao_social ||
          "Empresa sem nome definido",
        detail: company.cnpj ? `CNPJ: ${company.cnpj}` : null,
      });
    }
  }

  if (studentIds.length > 0) {
    const { data: students } = await supabase
      .from("students")
      .select("id, nome, telefone, escola, serie_ano")
      .in("id", studentIds);

    for (const student of students ?? []) {
      studentMap.set(student.id, {
        name: student.nome || "Estagiário sem nome definido",
        detail: [student.serie_ano, student.escola].filter(Boolean).join(" • "),
      });
    }
  }

  const data: ReminderListItem[] = rows.map((item) => {
    if (item.entity_type === "empresa") {
      const company = companyMap.get(item.entity_id);

      return {
        ...item,
        entity_name: company?.name ?? "Empresa não localizada",
        entity_detail: company?.detail ?? null,
      };
    }

    if (item.entity_type === "estagiario") {
      const student = studentMap.get(item.entity_id);

      return {
        ...item,
        entity_name: student?.name ?? "Estagiário não localizado",
        entity_detail: student?.detail ?? null,
      };
    }

    return {
      ...item,
      entity_name: "Registro do sistema",
      entity_detail: null,
    };
  });

  const stats: ReminderStats = {
    total: data.length,
    empresas: data.filter((item) => item.entity_type === "empresa").length,
    estagiarios: data.filter((item) => item.entity_type === "estagiario").length,
    contratos: data.filter((item) => item.entity_type === "contrato").length,
    financeiro: data.filter((item) => item.entity_type === "financeiro").length,
  };

  return {
    data,
    stats,
  };
}
