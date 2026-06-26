import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type ContratoPdfData = {
  contrato: {
    id: string;
    numero_contrato: string | null;
    versao: number | null;
    data_inicio: string | null;
    data_fim: string | null;
    horario: string | null;
    carga_horaria_semanal: string | null;
    bolsa_auxilio: number | null;
    auxilio_transporte: string | null;
    atividades: string | null;
    supervisor_nome: string | null;
    supervisor_cargo: string | null;
    supervisor_email: string | null;
    apolice_numero: string | null;
    seguradora: string | null;
    data_vencimento_seguro: string | null;
    observacoes: string | null;
    status: string | null;
    criado_em: string | null;
  };
  estagiario: {
    nome: string | null;
    data_nascimento: string | null;
    cpf: string | null;
    rg: string | null;
    telefone: string | null;
    email: string | null;
    serie_ano: string | null;
    turno: string | null;
    escola: string | null;
    endereco: string | null;
    bairro: string | null;
    cidade: string | null;
    estado: string | null;
    funcao: string | null;
  } | null;
  empresa: {
    razao_social: string | null;
    nome_fantasia: string | null;
    cnpj: string | null;
    endereco: string | null;
    bairro: string | null;
    cidade: string | null;
    estado: string | null;
    email: string | null;
    telefone: string | null;
    nome_responsavel: string | null;
  } | null;
  instituicao: {
    nome: string | null;
    cnpj: string | null;
    endereco: string | null;
    representante: string | null;
  } | null;
};

export type PdfHistoricoItem = {
  id: string;
  file_name: string | null;
  pdf_type: string | null;
  category: string | null;
  storage_provider: string | null;
  status: string | null;
  created_at: string | null;
};

export async function getContratoPdfById(id: string): Promise<{
  data: ContratoPdfData | null;
  errorMessage?: string;
}> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      data: null,
      errorMessage: "Supabase ainda não configurado.",
    };
  }

  const { data: contrato, error } = await supabase
    .from("internship_contracts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !contrato) {
    return {
      data: null,
      errorMessage: `Erro ao carregar contrato: ${error?.message || "contrato não encontrado"}`,
    };
  }

  let estagiario = null;
  let empresa = null;
  let instituicao = null;

  if (contrato.student_id) {
    const { data } = await supabase
      .from("students")
      .select(
        "nome, data_nascimento, cpf, rg, telefone, email, serie_ano, turno, escola, endereco, bairro, cidade, estado, funcao"
      )
      .eq("id", contrato.student_id)
      .maybeSingle();

    estagiario = data;
  }

  if (contrato.company_id) {
    const { data } = await supabase
      .from("companies")
      .select(
        "razao_social, nome_fantasia, cnpj, endereco, bairro, cidade, estado, email, telefone, nome_responsavel"
      )
      .eq("id", contrato.company_id)
      .maybeSingle();

    empresa = data;
  }

  if (contrato.institution_id) {
    const { data } = await supabase
      .from("educational_institutions")
      .select("nome, cnpj, endereco, representante")
      .eq("id", contrato.institution_id)
      .maybeSingle();

    instituicao = data;
  }

  return {
    data: {
      contrato: {
        id: contrato.id,
        numero_contrato: contrato.numero_contrato,
        versao: contrato.versao,
        data_inicio: contrato.data_inicio,
        data_fim: contrato.data_fim,
        horario: contrato.horario,
        carga_horaria_semanal: contrato.carga_horaria_semanal,
        bolsa_auxilio: contrato.bolsa_auxilio,
        auxilio_transporte: contrato.auxilio_transporte,
        atividades: contrato.atividades,
        supervisor_nome: contrato.supervisor_nome,
        supervisor_cargo: contrato.supervisor_cargo,
        supervisor_email: contrato.supervisor_email,
        apolice_numero: contrato.apolice_numero,
        seguradora: contrato.seguradora,
        data_vencimento_seguro: contrato.data_vencimento_seguro,
        observacoes: contrato.observacoes,
        status: contrato.status,
        criado_em: contrato.criado_em,
      },
      estagiario,
      empresa,
      instituicao,
    },
  };
}

export async function getHistoricoPdfsContrato(id: string): Promise<{
  data: PdfHistoricoItem[];
  errorMessage?: string;
}> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      data: [],
      errorMessage: "Supabase ainda não configurado.",
    };
  }

  const { data, error } = await supabase
    .from("generated_pdfs")
    .select("id, file_name, pdf_type, category, storage_provider, status, created_at")
    .eq("entity_type", "contrato")
    .eq("entity_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return {
      data: [],
      errorMessage: `Erro ao carregar histórico de PDFs: ${error.message}`,
    };
  }

  return {
    data: (data ?? []) as PdfHistoricoItem[],
  };
}