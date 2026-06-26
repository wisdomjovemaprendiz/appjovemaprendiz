"use server";

import { revalidatePath } from "next/cache";
import { contratoSchema, type ContratoFormData } from "@/schemas/rh.schemas";
import { getSupabaseAdminClient, supabaseConfigMissingMessage } from "@/lib/supabase/server";
import {
  emptyToNull,
  formatZodErrors,
  getMissingFields,
  numberOrNull,
  type ActionResult,
} from "./action-utils";

const contratoRequiredFields = [
  { campo: "student_id", label: "estagiário" },
  { campo: "company_id", label: "empresa concedente" },
  { campo: "data_inicio", label: "data de início" },
  { campo: "data_fim", label: "data de término" },
  { campo: "horario", label: "horário do estágio" },
  { campo: "atividades", label: "atividades do estagiário" },
  { campo: "supervisor_nome", label: "supervisor" },
  { campo: "apolice_numero", label: "número da apólice" },
  { campo: "seguradora", label: "seguradora" },
  { campo: "data_vencimento_seguro", label: "vencimento do seguro" },
];

function buildContratoPayload(data: ContratoFormData) {
  return {
    student_id: emptyToNull(data.student_id),
    company_id: emptyToNull(data.company_id),
    institution_id: emptyToNull(data.institution_id),
    data_inicio: emptyToNull(data.data_inicio),
    data_fim: emptyToNull(data.data_fim),
    horario: emptyToNull(data.horario),
    carga_horaria_semanal: emptyToNull(data.carga_horaria_semanal),
    bolsa_auxilio: numberOrNull(data.bolsa_auxilio),
    auxilio_transporte: emptyToNull(data.auxilio_transporte),
    atividades: emptyToNull(data.atividades),
    supervisor_nome: emptyToNull(data.supervisor_nome),
    supervisor_cargo: emptyToNull(data.supervisor_cargo),
    supervisor_email: emptyToNull(data.supervisor_email),
    apolice_numero: emptyToNull(data.apolice_numero),
    seguradora: emptyToNull(data.seguradora),
    data_vencimento_seguro: emptyToNull(data.data_vencimento_seguro),
    observacoes: emptyToNull(data.observacoes),
    status: "rascunho",
  };
}

async function syncContratoPendencias(entityId: string, payload: Record<string, unknown>) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  const pendencias = getMissingFields(payload, contratoRequiredFields);
  const camposFaltantes = new Set(pendencias.map((item) => item.campo));
  const camposPreenchidos = contratoRequiredFields
    .map((item) => item.campo)
    .filter((campo) => !camposFaltantes.has(campo));

  if (camposPreenchidos.length > 0) {
    await supabase
      .from("completion_reminders")
      .update({
        ativo: false,
        resolvido: true,
        resolvido_em: new Date().toISOString(),
      })
      .eq("entity_type", "contrato")
      .eq("entity_id", entityId)
      .in("campo", camposPreenchidos)
      .eq("ignorar_definitivo", false);
  }

  for (const pendencia of pendencias) {
    const { data: existente } = await supabase
      .from("completion_reminders")
      .select("id, ignorar_definitivo")
      .eq("entity_type", "contrato")
      .eq("entity_id", entityId)
      .eq("campo", pendencia.campo)
      .maybeSingle();

    if (!existente) {
      await supabase.from("completion_reminders").insert({
        entity_type: "contrato",
        entity_id: entityId,
        campo: pendencia.campo,
        mensagem: pendencia.mensagem,
        ativo: true,
      });
    }
  }

  return pendencias;
}

export async function createContratoAction(input: ContratoFormData): Promise<ActionResult> {
  const parsed = contratoSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Verifique os dados do contrato.",
      errors: formatZodErrors(parsed.error),
    };
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      ok: false,
      message: supabaseConfigMissingMessage(),
    };
  }

  const payload = buildContratoPayload(parsed.data);

  const { data: contrato, error } = await supabase
    .from("internship_contracts")
    .insert(payload)
    .select("id, numero_contrato")
    .single();

  if (error) {
    return {
      ok: false,
      message: `Erro ao salvar contrato: ${error.message}`,
    };
  }

  const pendencias = await syncContratoPendencias(contrato.id, payload);

  await supabase.from("audit_logs").insert({
    acao: "criou_contrato",
    tabela: "internship_contracts",
    entity_type: "contrato",
    entity_id: contrato.id,
    valor_novo: {
      ...payload,
      pendencias,
    },
    motivo: "Cadastro inicial do contrato pelo painel RH.",
  });

  revalidatePath("/rh/contratos");
  revalidatePath("/rh/pendencias");
  revalidatePath("/rh");

  return {
    ok: true,
    id: contrato.id,
    message: "Contrato salvo como rascunho com sucesso.",
  };
}

export async function alterarStatusContratoAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const motivo = String(formData.get("motivo") ?? "Alteração de status pelo painel RH.");

  const statusPermitidos = [
    "rascunho",
    "gerado",
    "enviado",
    "assinado",
    "vencido",
    "encerrado",
    "cancelado",
  ];

  const supabase = getSupabaseAdminClient();

  if (!supabase || !id || !statusPermitidos.includes(status)) {
    revalidatePath("/rh/contratos");
    return;
  }

  const { data: anterior } = await supabase
    .from("internship_contracts")
    .select("*")
    .eq("id", id)
    .single();

  const payload = { status };

  await supabase.from("internship_contracts").update(payload).eq("id", id);

  await supabase.from("audit_logs").insert({
    acao: "alterou_status_contrato",
    tabela: "internship_contracts",
    entity_type: "contrato",
    entity_id: id,
    valor_anterior: anterior,
    valor_novo: payload,
    motivo,
  });

  revalidatePath("/rh/contratos");
  revalidatePath("/rh");
}