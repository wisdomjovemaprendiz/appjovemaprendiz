import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type ContratoPadraoData = {
  id: string;

  instituicao: {
    nome: string;
    endereco: string;
    bairro: string;
    cnpj: string;
    inscricao_estadual: string;
    representante: string;
    cargo: string;
  };

  empresa: {
    razao_social: string;
    endereco: string;
    bairro: string;
    cidade: string;
    estado: string;
    cnpj: string;
    ramo_atuacao: string;
    inscricao_estadual: string;
    representante: string;
    cargo: string;
    telefone: string;
    email: string;
  };

  estagiario: {
    nome: string;
    data_nascimento: string;
    telefone: string;
    endereco: string;
    bairro: string;
    cep: string;
    cpf: string;
    rg: string;
    curso: string;
    nivel: string;
    periodo_aula: string;
  };

  estagio: {
    data_inicio: string;
    data_fim: string;
    horario: string;
    intervalo: string;
    carga_horaria: string;
    dias_semana: string;
    bolsa_auxilio: string;
    auxilio_transporte: string;
    atividades: string;
    supervisor_nome: string;
    supervisor_cargo: string;
    supervisor_email: string;
    apolice_numero: string;
    seguradora: string;
    cidade_assinatura: string;
    data_assinatura_extenso: string;
  };

  agente: {
    razao_social: string;
    cnpj: string;
    logo_url: string;
    assinatura_url: string | null;
  };
};

function getValue(row: Record<string, unknown> | null | undefined, keys: string[], fallback = "") {
  if (!row) return fallback;

  for (const key of keys) {
    const value = row[key];

    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return String(value);
    }
  }

  return fallback;
}

function getNumberValue(row: Record<string, unknown> | null | undefined, keys: string[], fallback = 0) {
  if (!row) return fallback;

  for (const key of keys) {
    const value = row[key];

    if (value !== null && value !== undefined && String(value).trim() !== "") {
      const number = Number(value);
      return Number.isFinite(number) ? number : fallback;
    }
  }

  return fallback;
}

function formatDateBR(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

function formatCurrency(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "";

  const number = Number(value);

  if (!Number.isFinite(number)) return String(value);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(number);
}

function dateExtenso(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function normalizeUpper(value: string) {
  return value.trim().toUpperCase();
}

function buildEndereco(row: Record<string, unknown> | null | undefined) {
  const endereco = getValue(row, ["endereco", "logradouro", "address"]);
  const numero = getValue(row, ["numero", "number"]);
  const complemento = getValue(row, ["complemento", "complement"]);

  return [endereco, numero, complemento].filter(Boolean).join(", ");
}

export async function getContratoPadraoData(id: string): Promise<{
  data: ContratoPadraoData | null;
  errorMessage?: string;
}> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      data: null,
      errorMessage: "Supabase ainda não configurado.",
    };
  }

  const { data: contract, error: contractError } = await supabase
    .from("internship_contracts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (contractError) {
    return {
      data: null,
      errorMessage: `Erro ao carregar contrato: ${contractError.message}`,
    };
  }

  if (!contract) {
    return {
      data: null,
      errorMessage: "Contrato não encontrado.",
    };
  }

  const studentId = getValue(contract, ["student_id"]);
  const companyId = getValue(contract, ["company_id"]);
  const institutionId = getValue(contract, ["educational_institution_id", "institution_id"]);

  const [studentResult, companyResult, orgResult] = await Promise.all([
    studentId
      ? supabase.from("students").select("*").eq("id", studentId).maybeSingle()
      : Promise.resolve({ data: null, error: null } as any),
    companyId
      ? supabase.from("companies").select("*").eq("id", companyId).maybeSingle()
      : Promise.resolve({ data: null, error: null } as any),
    supabase
      .from("rh_organization_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle(),
  ]);

  let institution: Record<string, unknown> | null = null;

  if (institutionId) {
    const institutionResult = await supabase
      .from("educational_institutions")
      .select("*")
      .eq("id", institutionId)
      .maybeSingle();

    institution = institutionResult.data as Record<string, unknown> | null;
  }

  const student = (studentResult.data ?? {}) as Record<string, unknown>;
  const company = (companyResult.data ?? {}) as Record<string, unknown>;
  const org = (orgResult.data ?? {}) as Record<string, unknown>;

  const schoolName =
    getValue(institution, ["nome", "name", "razao_social"]) ||
    getValue(student, ["escola", "instituicao_ensino"]) ||
    "Instituição de Ensino";

  const assinaturaDate =
    getValue(contract, ["data_assinatura", "data_emissao", "criado_em", "created_at"]) ||
    new Date().toISOString();

  const bolsaNumber = getNumberValue(contract, ["bolsa_auxilio", "valor_bolsa"], 0) ||
    getNumberValue(student, ["valor_bolsa"], 0) ||
    getNumberValue(company, ["valor_bolsa"], 0);

  const supervisorNome =
    getValue(contract, ["supervisor_nome"]) ||
    getValue(company, ["responsavel_nome", "nome_responsavel", "responsavel"]);

  const supervisorCargo =
    getValue(contract, ["supervisor_cargo"]) ||
    getValue(company, ["responsavel_cargo", "cargo_responsavel", "cargo"]) ||
    "proprietária";

  const supervisorEmail =
    getValue(contract, ["supervisor_email"]) ||
    getValue(company, ["email"]);

  const empresaRepresentante =
    getValue(company, ["responsavel_nome", "nome_responsavel", "representante_legal", "responsavel"]) ||
    supervisorNome;

  const empresaCargo =
    getValue(company, ["responsavel_cargo", "cargo_responsavel", "cargo"]) ||
    getValue(contract, ["supervisor_cargo"]) ||
    "Administrador";

  const contratoData: ContratoPadraoData = {
    id,

    instituicao: {
      nome: schoolName,
      endereco:
        getValue(institution, ["endereco", "logradouro"]) ||
        getValue(student, ["escola_endereco"]) ||
        "",
      bairro:
        getValue(institution, ["bairro"]) ||
        getValue(student, ["escola_bairro"]) ||
        "",
      cnpj:
        getValue(institution, ["cnpj"]) ||
        getValue(student, ["escola_cnpj"]) ||
        "",
      inscricao_estadual:
        getValue(institution, ["inscricao_estadual"]) ||
        getValue(student, ["escola_inscricao_estadual"]) ||
        "Isenta",
      representante: "",
      cargo: "",
    },

    empresa: {
      razao_social:
        getValue(company, ["razao_social"]) ||
        getValue(company, ["nome_fantasia"]) ||
        "Empresa não informada",
      endereco: buildEndereco(company) || getValue(company, ["endereco"]),
      bairro: getValue(company, ["bairro"]),
      cidade: getValue(company, ["cidade"], "Salvador"),
      estado: getValue(company, ["estado", "uf"], "Bahia"),
      cnpj: getValue(company, ["cnpj"]),
      ramo_atuacao: getValue(company, ["ramo_atuacao", "atividade_principal", "perfil_candidato"], ""),
      inscricao_estadual: getValue(company, ["inscricao_estadual"], "Isenta"),
      representante: empresaRepresentante,
      cargo: empresaCargo,
      telefone: getValue(company, ["telefone", "whatsapp"]),
      email: getValue(company, ["email"]),
    },

    estagiario: {
      nome: getValue(student, ["nome"], "Estagiário não informado"),
      data_nascimento: formatDateBR(getValue(student, ["data_nascimento"])),
      telefone: getValue(student, ["telefone"]),
      endereco: buildEndereco(student) || getValue(student, ["endereco"]),
      bairro: getValue(student, ["bairro"]),
      cep: getValue(student, ["cep"]),
      cpf: getValue(student, ["cpf"]),
      rg: getValue(student, ["rg"]),
      curso: getValue(student, ["curso"], "Ensino Médio"),
      nivel: getValue(student, ["serie_ano", "nivel"], ""),
      periodo_aula: getValue(student, ["turno", "periodo_aula"], ""),
    },

    estagio: {
      data_inicio: formatDateBR(getValue(contract, ["data_inicio"])),
      data_fim: formatDateBR(getValue(contract, ["data_fim"])),
      horario: getValue(contract, ["horario"], "das 13:00 AS 18:00"),
      intervalo: getValue(contract, ["intervalo"], "15 minutos"),
      carga_horaria: getValue(contract, ["carga_horaria"], "30 horas semanais"),
      dias_semana: getValue(contract, ["dias_semana"], "segunda aos sábados"),
      bolsa_auxilio: bolsaNumber ? formatCurrency(bolsaNumber) : getValue(contract, ["bolsa_auxilio_texto"], ""),
      auxilio_transporte: getValue(contract, ["auxilio_transporte"], "auxílio transporte"),
      atividades:
        normalizeUpper(getValue(contract, ["atividades"]) ||
        getValue(company, ["funcoes_estagiario", "funcoes_do_estagiario"]) ||
        getValue(student, ["funcao"]) ||
        "ATENDIMENTO, VENDAS E OPERADORA DE CAIXA"),
      supervisor_nome: normalizeUpper(supervisorNome || empresaRepresentante || ""),
      supervisor_cargo: supervisorCargo,
      supervisor_email: normalizeUpper(supervisorEmail || ""),
      apolice_numero: getValue(contract, ["apolice_numero", "numero_apolice"], "264542"),
      seguradora: getValue(contract, ["seguradora"], "SABEMI"),
      cidade_assinatura: getValue(contract, ["cidade_assinatura"], "Salvador"),
      data_assinatura_extenso: dateExtenso(assinaturaDate),
    },

    agente: {
      razao_social: getValue(org, ["razao_social"], "RH WISDOM OPPORTTUNTIES LTDA"),
      cnpj: getValue(org, ["cnpj"], "52.983.709/0001-58"),
      logo_url: getValue(org, ["logo_url"], "/logo-wisdom.png") || "/logo-wisdom.png",
      assinatura_url: getValue(org, ["assinatura_url"]) || null,
    },
  };

  return {
    data: contratoData,
  };
}