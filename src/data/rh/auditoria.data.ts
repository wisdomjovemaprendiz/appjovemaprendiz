import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type AuditoriaItem = {
  id: string;
  acao: string;
  tabela: string | null;
  entity_type: string | null;
  entity_id: string | null;
  usuario_nome: string | null;
  motivo: string | null;
  valor_anterior: unknown;
  valor_novo: unknown;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
};

export type AuditoriaStats = {
  total: number;
  hoje: number;
  empresas: number;
  estagiarios: number;
  contratos: number;
  financeiro: number;
  documentos: number;
  criticas: number;
};

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

function isToday(dateString: string | null) {
  if (!dateString) return false;

  const date = new Date(dateString);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function isCriticalAction(action: string) {
  const normalized = action.toLowerCase();

  return (
    normalized.includes("inativ") ||
    normalized.includes("cancel") ||
    normalized.includes("baix") ||
    normalized.includes("arquiv") ||
    normalized.includes("pdf") ||
    normalized.includes("status") ||
    normalized.includes("financeir")
  );
}

export async function getAuditoria(): Promise<{
  data: AuditoriaItem[];
  stats: AuditoriaStats;
  errorMessage?: string;
}> {
  const supabase = getSupabaseAdminClient();

  const emptyStats: AuditoriaStats = {
    total: 0,
    hoje: 0,
    empresas: 0,
    estagiarios: 0,
    contratos: 0,
    financeiro: 0,
    documentos: 0,
    criticas: 0,
  };

  if (!supabase) {
    return {
      data: [],
      stats: emptyStats,
      errorMessage: "Supabase ainda não configurado.",
    };
  }

  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .limit(700);

  if (error) {
    return {
      data: [],
      stats: emptyStats,
      errorMessage: `Erro ao carregar auditoria: ${error.message}`,
    };
  }

  const mapped = ((data ?? []) as Array<Record<string, unknown>>)
    .map((item) => {
      const acao = getString(item.acao || item.action, "ação não informada");
      const date = getDateValue(item);

      return {
        id: getString(item.id),
        acao,
        tabela: getString(item.tabela || item.table_name, null as unknown as string),
        entity_type: getString(item.entity_type || item.tipo_entidade, null as unknown as string),
        entity_id: getString(item.entity_id || item.entidade_id, null as unknown as string),
        usuario_nome: getString(item.usuario_nome || item.user_name || item.usuario, null as unknown as string),
        motivo: getString(item.motivo || item.reason, null as unknown as string),
        valor_anterior: item.valor_anterior || item.previous_value || null,
        valor_novo: item.valor_novo || item.new_value || null,
        ip_address: getString(item.ip_address, null as unknown as string),
        user_agent: getString(item.user_agent, null as unknown as string),
        created_at: date || null,
      } as AuditoriaItem;
    })
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

  const stats = mapped.reduce(
    (acc, item) => {
      acc.total += 1;

      if (isToday(item.created_at)) acc.hoje += 1;

      const area = `${item.entity_type || ""} ${item.tabela || ""}`.toLowerCase();

      if (area.includes("empresa") || area.includes("compan")) acc.empresas += 1;
      if (area.includes("estagi") || area.includes("student")) acc.estagiarios += 1;
      if (area.includes("contrat") || area.includes("internship")) acc.contratos += 1;
      if (area.includes("finance") || area.includes("payment") || area.includes("charge")) acc.financeiro += 1;
      if (area.includes("document")) acc.documentos += 1;

      if (isCriticalAction(item.acao)) acc.criticas += 1;

      return acc;
    },
    { ...emptyStats }
  );

  return {
    data: mapped,
    stats,
  };
}