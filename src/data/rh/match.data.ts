import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type MatchItem = {
  company_id: string;
  student_id: string;
  razao_social: string | null;
  nome_fantasia: string | null;
  student_name: string | null;
  student_photo_url?: string | null;
  serie_ano: string | null;
  turno: string | null;
  total_skills_empresa: number;
  total_match: number;
  match_percent: number;
  decisao: string | null;
  observacao: string | null;
  decisao_em: string | null;
};

export type MatchStats = {
  total: number;
  fortes: number;
  medios: number;
  baixos: number;
  encaminhados: number;
  analisar: number;
  ignorados: number;
};

function normalizeNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getMatches(): Promise<{
  data: MatchItem[];
  stats: MatchStats;
  errorMessage?: string;
}> {
  const supabase = getSupabaseAdminClient();

  const emptyStats: MatchStats = {
    total: 0,
    fortes: 0,
    medios: 0,
    baixos: 0,
    encaminhados: 0,
    analisar: 0,
    ignorados: 0,
  };

  if (!supabase) {
    return {
      data: [],
      stats: emptyStats,
      errorMessage: "Supabase ainda não configurado.",
    };
  }

  const { data, error } = await supabase
    .from("vw_student_company_match")
    .select("*")
    .order("match_percent", { ascending: false })
    .order("total_match", { ascending: false })
    .limit(500);

  if (error) {
    return {
      data: [],
      stats: emptyStats,
      errorMessage: `Erro ao carregar matches: ${error.message}`,
    };
  }

  const rows = (data ?? []) as any[];

  const studentIds = Array.from(
    new Set(rows.map((item) => item.student_id).filter(Boolean))
  ) as string[];

  const studentPhotoMap = new Map<string, { foto_url: string | null; nome: string | null }>();

  if (studentIds.length > 0) {
    const { data: students } = await supabase
      .from("students")
      .select("id, nome, foto_url")
      .in("id", studentIds);

    for (const student of students ?? []) {
      studentPhotoMap.set(student.id, {
        foto_url: student.foto_url ?? null,
        nome: student.nome ?? null,
      });
    }
  }

  const pairs = rows
    .filter((item) => item.company_id && item.student_id)
    .map((item) => ({
      company_id: item.company_id,
      student_id: item.student_id,
    }));

  const decisionsMap = new Map<string, any>();

  if (pairs.length > 0) {
    const companyIds = Array.from(new Set(pairs.map((item) => item.company_id)));

    const { data: decisions } = await supabase
      .from("match_decisions")
      .select("company_id, student_id, decisao, observacao, atualizado_em, criado_em")
      .in("company_id", companyIds)
      .in("student_id", studentIds);

    for (const decision of decisions ?? []) {
      decisionsMap.set(`${decision.company_id}:${decision.student_id}`, decision);
    }
  }

  const mapped = rows.map((item) => {
    const key = `${item.company_id}:${item.student_id}`;
    const decision = decisionsMap.get(key);
    const studentPhoto = studentPhotoMap.get(item.student_id);

    return {
      company_id: item.company_id,
      student_id: item.student_id,
      razao_social: item.razao_social ?? null,
      nome_fantasia: item.nome_fantasia ?? null,
      student_name: item.student_name ?? item.nome ?? studentPhoto?.nome ?? null,
      student_photo_url: studentPhoto?.foto_url ?? null,
      serie_ano: item.serie_ano ?? null,
      turno: item.turno ?? null,
      total_skills_empresa: normalizeNumber(item.total_skills_empresa),
      total_match: normalizeNumber(item.total_match),
      match_percent: normalizeNumber(item.match_percent),
      decisao: decision?.decisao ?? null,
      observacao: decision?.observacao ?? null,
      decisao_em: decision?.atualizado_em ?? decision?.criado_em ?? null,
    } as MatchItem;
  });

  const stats = mapped.reduce(
    (acc, item) => {
      acc.total += 1;

      if (item.match_percent >= 70) acc.fortes += 1;
      else if (item.match_percent >= 40) acc.medios += 1;
      else acc.baixos += 1;

      if (item.decisao === "encaminhar") acc.encaminhados += 1;
      if (item.decisao === "analisar_depois") acc.analisar += 1;
      if (item.decisao === "ignorar") acc.ignorados += 1;

      return acc;
    },
    { ...emptyStats }
  );

  return {
    data: mapped,
    stats,
  };
}