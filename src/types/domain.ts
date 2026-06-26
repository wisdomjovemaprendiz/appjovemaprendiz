export type StatusRegistro = "ativo" | "inativo" | "arquivado";

export type UserRole = "rh_master" | "rh_operador" | "empresa" | "estagiario";

export type StatusContrato =
  | "rascunho"
  | "gerado"
  | "enviado"
  | "assinado"
  | "vencido"
  | "encerrado"
  | "cancelado";

export type StatusPagamento =
  | "aberto"
  | "pago"
  | "atrasado"
  | "cancelado"
  | "renegociado";

export type NivelAlerta = "critico" | "atencao" | "informativo";

export type Empresa = {
  id: string;
  nome_responsavel: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string | null;
  ramo_atuacao?: string | null;
  endereco: string;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  email: string;
  telefone: string;
  perfil_candidato?: string | null;
  funcoes_estagiario?: string | null;
  valor_bolsa?: number | null;
  logo_file_id?: string | null;
  observacoes?: string | null;
  status: StatusRegistro;
};

export type Estagiario = {
  id: string;
  nome: string;
  data_nascimento: string;
  cpf?: string | null;
  rg?: string | null;
  telefone: string;
  email: string;
  serie_ano: string;
  turno: string;
  escola: string;
  endereco: string;
  bairro?: string | null;
  empresa_id?: string | null;
  loja_trabalho?: string | null;
  funcao?: string | null;
  valor_bolsa?: number | null;
  data_vencimento_seguro?: string | null;
  numero_apolice?: string | null;
  seguradora?: string | null;
  foto_file_id?: string | null;
  observacoes?: string | null;
  status: StatusRegistro;
};

export type ContratoEstagio = {
  id: string;
  student_id: string;
  company_id: string;
  institution_id?: string | null;
  numero_contrato?: string | null;
  versao: number;
  data_inicio: string;
  data_fim: string;
  horario?: string | null;
  bolsa_auxilio?: number | null;
  atividades?: string | null;
  supervisor_nome?: string | null;
  supervisor_cargo?: string | null;
  supervisor_email?: string | null;
  apolice_numero?: string | null;
  seguradora?: string | null;
  data_vencimento_seguro?: string | null;
  status: StatusContrato;
};

export type Documento = {
  id: string;
  entity_type: "empresa" | "estagiario" | "contrato" | "financeiro" | "rh" | "landing";
  entity_id?: string | null;
  tipo: string;
  categoria?: string | null;
  nome_arquivo: string;
  mime_type?: string | null;
  tamanho_bytes?: number | null;
  drive_file_id?: string | null;
  drive_folder_id?: string | null;
  versao: number;
  arquivado: boolean;
};

export type AuditLog = {
  id: string;
  user_id?: string | null;
  user_email?: string | null;
  acao: string;
  tabela?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  campo?: string | null;
  valor_anterior?: unknown;
  valor_novo?: unknown;
  motivo?: string | null;
  criado_em: string;
};
