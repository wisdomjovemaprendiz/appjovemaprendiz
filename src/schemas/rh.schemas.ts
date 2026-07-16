import { z } from "zod";

const textoOpcional = z.string().trim().optional().or(z.literal(""));

const emailOpcional = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
    message: "Informe um e-mail válido.",
  });

const numeroOpcional = z
  .union([z.coerce.number().nonnegative(), z.literal(""), z.undefined(), z.null()])
  .optional()
  .transform((value) => {
    if (value === "" || value === undefined || value === null) return undefined;
    return Number(value);
  });

export const empresaSchema = z.object({
  nome_responsavel: textoOpcional,
  cnpj: textoOpcional,
  razao_social: textoOpcional,
  nome_fantasia: textoOpcional,
  ramo_atuacao: textoOpcional,
  endereco: textoOpcional,
  bairro: textoOpcional,
  cidade: textoOpcional.default("Salvador"),
  estado: textoOpcional.default("Bahia"),
  cep: textoOpcional,
  email: emailOpcional,
  telefone: textoOpcional,
  perfil_candidato: textoOpcional,
  funcoes_estagiario: textoOpcional,
  valor_bolsa: numeroOpcional,
  observacoes: textoOpcional,
  skills_desejadas: z.array(z.string()).optional(),
  funcoes_sugeridas: z.array(z.string()).optional(),
});

export type EmpresaFormData = z.infer<typeof empresaSchema>;

export const estagiarioSchema = z.object({
  nome: textoOpcional,
  data_nascimento: textoOpcional,
  cpf: textoOpcional,
  rg: textoOpcional,
  telefone: textoOpcional,
  email: emailOpcional,
  serie_ano: textoOpcional,
  turno: textoOpcional,
  escola: textoOpcional,
  escola_endereco: z.string().optional(),
  escola_bairro: z.string().optional(),
  escola_cnpj: z.string().optional(),
  escola_inscricao_estadual: z.string().optional(),
  endereco: textoOpcional,
  bairro: textoOpcional,
  cidade: textoOpcional.default("Salvador"),
  estado: textoOpcional.default("Bahia"),
  cep: textoOpcional,
  empresa_id: textoOpcional,
  loja_trabalho: textoOpcional,
  funcao: textoOpcional,
  valor_bolsa: numeroOpcional,
  data_vencimento_seguro: textoOpcional,
  numero_apolice: textoOpcional,
  seguradora: textoOpcional,
  observacoes: textoOpcional,
  skills: z.array(z.string()).optional(),
});

export type EstagiarioFormData = z.infer<typeof estagiarioSchema>;

export const contratoSchema = z.object({
  student_id: textoOpcional,
  company_id: textoOpcional,
  institution_id: textoOpcional,
  data_inicio: textoOpcional,
  data_fim: textoOpcional,
  horario: textoOpcional,
  carga_horaria_semanal: textoOpcional,
  bolsa_auxilio: numeroOpcional,
  auxilio_transporte: textoOpcional,
  atividades: textoOpcional,
  supervisor_nome: textoOpcional,
  supervisor_cargo: textoOpcional,
  supervisor_email: emailOpcional,
  apolice_numero: textoOpcional,
  seguradora: textoOpcional,
  data_vencimento_seguro: textoOpcional,
  observacoes: textoOpcional,
});

export type ContratoFormData = z.infer<typeof contratoSchema>;

export const pagamentoSchema = z.object({
  company_id: textoOpcional,
  descricao: textoOpcional,
  competencia: textoOpcional,
  data_vencimento: textoOpcional,
  valor: numeroOpcional,
  observacoes: textoOpcional,
});

export type PagamentoFormData = z.infer<typeof pagamentoSchema>;
