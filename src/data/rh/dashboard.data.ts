import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type DashboardAlert = {
  id: string;
  title: string;
  description: string;
  area: "contratos" | "financeiro" | "documentos" | "estagiarios" | "empresas" | "pendencias";
  level: "critico" | "atencao" | "informativo";
  href: string;
};

export type DashboardActivity = {
  id: string;
  title: string;
  description: string;
  created_at: string | null;
  area: string;
};

export type DashboardStats = {
  empresasAtivas: number;
  estagiariosAtivos: number;
  contratosAtivos: number;
  contratosVencidos: number;
  mensalidadesAtrasadas: number;
  pendenciasCriticas: number;
  documentosAtivos: number;
  matchesDisponiveis: number;
};

export type DashboardData = {
  stats: DashboardStats;
  alerts: DashboardAlert[];
  activities: DashboardActivity[];
};

function todayStart() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function daysFromToday(dateString: string | null | undefined) {
  if (!dateString) return null;

  const date = new Date(`${dateString}T00:00:00`);
  const today = todayStart();

  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function isActiveStatus(value: unknown) {
  return String(value || "ativo").toLowerCase() === "ativo";
}

function isOverdue(dateString: string | null | undefined) {
  const days = daysFromToday(dateString);
  return days !== null && days < 0;
}

function isDueSoon(dateString: string | null | undefined, daysLimit = 30) {
  const days = daysFromToday(dateString);
  return days !== null && days >= 0 && days <= daysLimit;
}

function getString(value: unknown, fallback = "") {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback;
  }

  return String(value);
}

function getDateValue(item: Record<string, unknown>) {
  return getString(
    item.created_at ||
      item.criado_em ||
      item.data_hora ||
      item.timestamp ||
      item.inserted_at,
    ""
  );
}

export async function getDashboardData(): Promise<{
  data: DashboardData;
  errorMessage?: string;
}> {
  const supabase = getSupabaseAdminClient();

  const empty: DashboardData = {
    stats: {
      empresasAtivas: 0,
      estagiariosAtivos: 0,
      contratosAtivos: 0,
      contratosVencidos: 0,
      mensalidadesAtrasadas: 0,
      pendenciasCriticas: 0,
      documentosAtivos: 0,
      matchesDisponiveis: 0,
    },
    alerts: [],
    activities: [],
  };

  if (!supabase) {
    return {
      data: empty,
      errorMessage: "Supabase ainda não configurado.",
    };
  }

  const [
    companiesResult,
    studentsResult,
    contractsResult,
    chargesResult,
    documentsResult,
    remindersResult,
    auditResult,
    matchResult,
  ] = await Promise.all([
    supabase.from("companies").select("*").limit(1000),
    supabase.from("students").select("*").limit(1000),
    supabase.from("internship_contracts").select("*").limit(1000),
    supabase.from("financial_charges").select("*").limit(1000),
    supabase.from("documents").select("*").limit(1000),
    supabase.from("completion_reminders").select("*").limit(1000),
    supabase.from("audit_logs").select("*").limit(100),
    supabase.from("vw_student_company_match").select("*").limit(500),
  ]);

  const errors = [
    companiesResult.error?.message,
    studentsResult.error?.message,
    contractsResult.error?.message,
    chargesResult.error?.message,
    documentsResult.error?.message,
    remindersResult.error?.message,
    auditResult.error?.message,
    matchResult.error?.message,
  ].filter(Boolean);

  const companies = (companiesResult.data ?? []) as Array<Record<string, unknown>>;
  const students = (studentsResult.data ?? []) as Array<Record<string, unknown>>;
  const contracts = (contractsResult.data ?? []) as Array<Record<string, unknown>>;
  const charges = (chargesResult.data ?? []) as Array<Record<string, unknown>>;
  const documents = (documentsResult.data ?? []) as Array<Record<string, unknown>>;
  const reminders = (remindersResult.data ?? []) as Array<Record<string, unknown>>;
  const audit = (auditResult.data ?? []) as Array<Record<string, unknown>>;
  const matches = (matchResult.data ?? []) as Array<Record<string, unknown>>;

  const activeCompanies = companies.filter((item) => isActiveStatus(item.status));
  const activeStudents = students.filter((item) => isActiveStatus(item.status));

  const activeContracts = contracts.filter((item) => {
    const status = String(item.status || "").toLowerCase();
    return !["cancelado", "encerrado"].includes(status);
  });

  const expiredContracts = activeContracts.filter((item) => {
    const status = String(item.status || "").toLowerCase();
    return status === "vencido" || isOverdue(getString(item.data_fim, null as unknown as string));
  });

  const overdueCharges = charges.filter((item) => {
    const status = String(item.status || "").toLowerCase();
    return !["pago", "cancelado"].includes(status) && isOverdue(getString(item.vencimento, null as unknown as string));
  });

  const criticalReminders = reminders.filter((item) => {
    const status = String(item.status || "pendente").toLowerCase();
    const level = String(item.nivel || item.severity || "").toLowerCase();

    return status !== "resolvido" && status !== "ignorado" && level.includes("crit");
  });

  const activeDocuments = documents.filter((item) => isActiveStatus(item.status));

  const strongMatches = matches.filter((item) => Number(item.match_percent ?? 0) >= 70);

  const alerts: DashboardAlert[] = [];

  for (const contract of expiredContracts.slice(0, 8)) {
    alerts.push({
      id: `contrato-${getString(contract.id)}`,
      title: "Contrato vencido",
      description: `Contrato ${getString(contract.numero_contrato || contract.id, "sem identificação")} precisa de verificação.`,
      area: "contratos",
      level: "critico",
      href: "/rh/contratos",
    });
  }

  for (const contract of activeContracts.filter((item) => isDueSoon(getString(item.data_fim, null as unknown as string), 30)).slice(0, 8)) {
    alerts.push({
      id: `contrato-vencendo-${getString(contract.id)}`,
      title: "Contrato próximo do vencimento",
      description: `Vencimento previsto para ${getString(contract.data_fim, "data não informada")}.`,
      area: "contratos",
      level: "atencao",
      href: "/rh/contratos",
    });
  }

  for (const charge of overdueCharges.slice(0, 8)) {
    alerts.push({
      id: `financeiro-${getString(charge.id)}`,
      title: "Parcela vencida",
      description: `Controle ${getString(charge.numero_controle, "não informado")} está em atraso.`,
      area: "financeiro",
      level: "critico",
      href: "/rh/financeiro",
    });
  }

  for (const reminder of criticalReminders.slice(0, 8)) {
    alerts.push({
      id: `pendencia-${getString(reminder.id)}`,
      title: getString(reminder.titulo || reminder.title, "Pendência crítica"),
      description: getString(reminder.mensagem || reminder.message || reminder.descricao, "Revise esta pendência."),
      area: "pendencias",
      level: "critico",
      href: "/rh/pendencias",
    });
  }

  for (const student of activeStudents.filter((item) => String(item.serie_ano || "").toLowerCase().includes("3")).slice(0, 8)) {
    alerts.push({
      id: `terceiro-ano-${getString(student.id)}`,
      title: "Aluno do 3º ano",
      description: `${getString(student.nome, "Estagiário")} precisa de acompanhamento para encerramento ou renovação.`,
      area: "estagiarios",
      level: "atencao",
      href: "/rh/estagiarios",
    });
  }

  const activities: DashboardActivity[] = audit
    .map((item) => {
      const action = getString(item.acao || item.action, "Ação registrada");

      return {
        id: getString(item.id),
        title: action,
        description: getString(item.motivo || item.reason || item.tabela || item.table_name, "Sem descrição."),
        created_at: getDateValue(item) || null,
        area: getString(item.entity_type || item.tabela || "sistema"),
      };
    })
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 12);

  return {
    data: {
      stats: {
        empresasAtivas: activeCompanies.length,
        estagiariosAtivos: activeStudents.length,
        contratosAtivos: activeContracts.length,
        contratosVencidos: expiredContracts.length,
        mensalidadesAtrasadas: overdueCharges.length,
        pendenciasCriticas: criticalReminders.length,
        documentosAtivos: activeDocuments.length,
        matchesDisponiveis: strongMatches.length,
      },
      alerts,
      activities,
    },
    errorMessage: errors.length > 0 ? errors.join(" | ") : undefined,
  };
}