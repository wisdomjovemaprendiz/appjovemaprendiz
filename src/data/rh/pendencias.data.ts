import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type PendenciaItem = {
  id: string;
  entity_type: string | null;
  entity_id: string | null;
  titulo: string;
  mensagem: string;
  campo: string | null;
  nivel: "critico" | "atencao" | "informativo";
  status: "pendente" | "adiado" | "resolvido" | "ignorado";
  lembrar_em: string | null;
  resolvido_em: string | null;
  ignorado_em: string | null;
  motivo: string | null;
  created_at: string | null;
  entity_name: string;
};

export type PendenciasStats = {
  total: number;
  pendentes: number;
  criticas: number;
  atencao: number;
  informativas: number;
  adiadas: number;
  resolvidas: number;
  ignoradas: number;
};

function normalizeNivel(value: unknown): PendenciaItem["nivel"] {
  const text = String(value || "").toLowerCase();

  if (text.includes("crit")) return "critico";
  if (text.includes("info")) return "informativo";
  return "atencao";
}

function normalizeStatus(value: unknown): PendenciaItem["status"] {
  const text = String(value || "").toLowerCase();

  if (text.includes("resol")) return "resolvido";
  if (text.includes("ignor")) return "ignorado";
  if (text.includes("adi")) return "adiado";
  return "pendente";
}

function getString(...values: unknown[]) {
  for (const value of values) {
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return String(value);
    }
  }

  return "";
}

export async function getPendencias(): Promise<{
  data: PendenciaItem[];
  stats: PendenciasStats;
  errorMessage?: string;
}> {
  const supabase = getSupabaseAdminClient();

  const emptyStats: PendenciasStats = {
    total: 0,
    pendentes: 0,
    criticas: 0,
    atencao: 0,
    informativas: 0,
    adiadas: 0,
    resolvidas: 0,
    ignoradas: 0,
  };

  if (!supabase) {
    return {
      data: [],
      stats: emptyStats,
      errorMessage: "Supabase ainda não configurado.",
    };
  }

  const { data, error } = await supabase
    .from("completion_reminders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return {
      data: [],
      stats: emptyStats,
      errorMessage: `Erro ao carregar pendências: ${error.message}`,
    };
  }

  const rows = (data ?? []) as any[];

  const companyIds = rows
    .filter((item) => item.entity_type === "empresa" && item.entity_id)
    .map((item) => item.entity_id);

  const studentIds = rows
    .filter((item) => item.entity_type === "estagiario" && item.entity_id)
    .map((item) => item.entity_id);

  const contractIds = rows
    .filter((item) => item.entity_type === "contrato" && item.entity_id)
    .map((item) => item.entity_id);

  const companyMap = new Map<string, string>();
  const studentMap = new Map<string, string>();
  const contractMap = new Map<string, string>();

  if (companyIds.length > 0) {
    const { data: companies } = await supabase
      .from("companies")
      .select("id, razao_social, nome_fantasia")
      .in("id", companyIds);

    for (const company of companies ?? []) {
      companyMap.set(
        company.id,
        company.nome_fantasia || company.razao_social || "Empresa sem nome"
      );
    }
  }

  if (studentIds.length > 0) {
    const { data: students } = await supabase
      .from("students")
      .select("id, nome")
      .in("id", studentIds);

    for (const student of students ?? []) {
      studentMap.set(student.id, student.nome || "Estagiário sem nome");
    }
  }

  if (contractIds.length > 0) {
    const { data: contracts } = await supabase
      .from("internship_contracts")
      .select("id, numero_contrato")
      .in("id", contractIds);

    for (const contract of contracts ?? []) {
      contractMap.set(
        contract.id,
        contract.numero_contrato || `Contrato ${String(contract.id).slice(0, 8)}`
      );
    }
  }

  const mapped = rows.map((item) => {
    const entityType = item.entity_type || item.tipo_entidade || null;
    const entityId = item.entity_id || item.entidade_id || null;

    let entityName = "Sem vínculo";

    if (entityType === "empresa" && entityId) {
      entityName = companyMap.get(entityId) || "Empresa não localizada";
    }

    if (entityType === "estagiario" && entityId) {
      entityName = studentMap.get(entityId) || "Estagiário não localizado";
    }

    if (entityType === "contrato" && entityId) {
      entityName = contractMap.get(entityId) || "Contrato não localizado";
    }

    const titulo = getString(
      item.titulo,
      item.title,
      item.campo_label,
      item.field_label,
      "Pendência de cadastro"
    );

    const mensagem = getString(
      item.mensagem,
      item.message,
      item.descricao,
      item.description,
      "Revise as informações deste registro."
    );

    return {
      id: item.id,
      entity_type: entityType,
      entity_id: entityId,
      titulo,
      mensagem,
      campo: item.campo || item.field_name || item.field || null,
      nivel: normalizeNivel(item.nivel || item.severity || item.level),
      status: normalizeStatus(item.status),
      lembrar_em: item.lembrar_em || item.snoozed_until || null,
      resolvido_em: item.resolvido_em || item.resolved_at || null,
      ignorado_em: item.ignorado_em || item.dismissed_at || null,
      motivo: item.motivo || item.reason || null,
      created_at: item.created_at || item.criado_em || null,
      entity_name: entityName,
    } as PendenciaItem;
  });

  const stats = mapped.reduce(
    (acc, item) => {
      acc.total += 1;

      if (item.status === "pendente") acc.pendentes += 1;
      if (item.status === "adiado") acc.adiadas += 1;
      if (item.status === "resolvido") acc.resolvidas += 1;
      if (item.status === "ignorado") acc.ignoradas += 1;

      if (item.nivel === "critico") acc.criticas += 1;
      if (item.nivel === "atencao") acc.atencao += 1;
      if (item.nivel === "informativo") acc.informativas += 1;

      return acc;
    },
    { ...emptyStats }
  );

  return {
    data: mapped,
    stats,
  };
}