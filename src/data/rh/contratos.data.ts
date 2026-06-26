import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type SelectOption = {
  id: string;
  label: string;
  detail?: string | null;
};

export type ContratoListItem = {
  id: string;
  student_id: string | null;
  company_id: string | null;
  student_name: string;
  student_photo_url?: string | null;
  company_name: string;
  data_inicio: string | null;
  data_fim: string | null;
  horario: string | null;
  bolsa_auxilio: number | null;
  data_vencimento_seguro: string | null;
  seguradora: string | null;
  apolice_numero: string | null;
  supervisor_nome: string | null;
  versao: number | null;
  status: string;
  criado_em: string | null;
};

function getCompanyName(company: Record<string, unknown> | null | undefined) {
  if (!company) return "Empresa não informada";
  return String(company.nome_fantasia || company.razao_social || "Empresa sem nome definido");
}

function getStudentName(student: Record<string, unknown> | null | undefined) {
  if (!student) return "Estagiário não informado";
  return String(student.nome || "Estagiário sem nome definido");
}

export async function getContratoFormOptions(): Promise<{
  empresas: SelectOption[];
  estagiarios: SelectOption[];
  errorMessage?: string;
}> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      empresas: [],
      estagiarios: [],
      errorMessage: "Supabase ainda não configurado.",
    };
  }

  const [companiesResult, studentsResult] = await Promise.all([
    supabase
      .from("companies")
      .select("id, razao_social, nome_fantasia, cnpj")
      .eq("status", "ativo")
      .order("criado_em", { ascending: false })
      .limit(300),
    supabase
      .from("students")
      .select("id, nome, serie_ano, turno")
      .eq("status", "ativo")
      .order("criado_em", { ascending: false })
      .limit(300),
  ]);

  const error = companiesResult.error || studentsResult.error;

  if (error) {
    return {
      empresas: [],
      estagiarios: [],
      errorMessage: `Erro ao carregar opções: ${error.message}`,
    };
  }

  return {
    empresas: (companiesResult.data ?? []).map((empresa) => ({
      id: empresa.id,
      label: empresa.nome_fantasia || empresa.razao_social || "Empresa sem nome",
      detail: empresa.cnpj ? `CNPJ: ${empresa.cnpj}` : null,
    })),
    estagiarios: (studentsResult.data ?? []).map((student) => ({
      id: student.id,
      label: student.nome || "Estagiário sem nome",
      detail: [student.serie_ano, student.turno].filter(Boolean).join(" • ") || null,
    })),
  };
}

export async function getContratos(): Promise<{
  data: ContratoListItem[];
  errorMessage?: string;
}> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      data: [],
      errorMessage: "Supabase ainda não configurado.",
    };
  }

  const { data: contracts, error } = await supabase
    .from("internship_contracts")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(500);

  if (error) {
    return {
      data: [],
      errorMessage: `Erro ao carregar contratos: ${error.message}`,
    };
  }

  const rows = (contracts ?? []) as Array<Record<string, unknown>>;
  const studentIds = Array.from(new Set(rows.map((item) => item.student_id).filter(Boolean))) as string[];
  const companyIds = Array.from(new Set(rows.map((item) => item.company_id).filter(Boolean))) as string[];

  const studentsMap = new Map<string, Record<string, unknown>>();
  const companiesMap = new Map<string, Record<string, unknown>>();

  if (studentIds.length > 0) {
    const { data: students } = await supabase
      .from("students")
      .select("id, nome, foto_url, serie_ano, turno")
      .in("id", studentIds);

    for (const student of students ?? []) {
      studentsMap.set(student.id, student);
    }
  }

  if (companyIds.length > 0) {
    const { data: companies } = await supabase
      .from("companies")
      .select("id, razao_social, nome_fantasia, cnpj")
      .in("id", companyIds);

    for (const company of companies ?? []) {
      companiesMap.set(company.id, company);
    }
  }

  return {
    data: rows.map((contract) => {
      const studentId = (contract.student_id as string | null) ?? null;
      const companyId = (contract.company_id as string | null) ?? null;
      const student = studentId ? studentsMap.get(studentId) : null;
      const company = companyId ? companiesMap.get(companyId) : null;

      return {
        id: String(contract.id),
        student_id: studentId,
        company_id: companyId,
        student_name: getStudentName(student),
        student_photo_url: (student?.foto_url as string | null) ?? null,
        company_name: getCompanyName(company),
        data_inicio: (contract.data_inicio as string | null) ?? null,
        data_fim: (contract.data_fim as string | null) ?? null,
        horario: (contract.horario as string | null) ?? null,
        bolsa_auxilio: contract.bolsa_auxilio === null || contract.bolsa_auxilio === undefined ? null : Number(contract.bolsa_auxilio),
        data_vencimento_seguro: (contract.data_vencimento_seguro as string | null) ?? null,
        seguradora: (contract.seguradora as string | null) ?? null,
        apolice_numero: (contract.apolice_numero as string | null) ?? null,
        supervisor_nome: (contract.supervisor_nome as string | null) ?? null,
        versao: contract.versao === null || contract.versao === undefined ? 1 : Number(contract.versao),
        status: String(contract.status || "rascunho"),
        criado_em: ((contract.criado_em || contract.created_at) as string | null) ?? null,
      };
    }),
  };
}