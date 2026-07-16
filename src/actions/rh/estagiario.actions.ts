"use server";

import { revalidatePath } from "next/cache";
import { estagiarioSchema, type EstagiarioFormData } from "@/schemas/rh.schemas";
import { getSupabaseAdminClient, supabaseConfigMissingMessage } from "@/lib/supabase/server";
import {
  emptyToNull,
  formatZodErrors,
  getMissingFields,
  numberOrNull,
  type ActionResult,
} from "./action-utils";

const estagiarioRequiredFields = [
  { campo: "nome", label: "nome completo" },
  { campo: "data_nascimento", label: "data de nascimento" },
  { campo: "telefone", label: "telefone" },
  { campo: "email", label: "e-mail" },
  { campo: "serie_ano", label: "série/ano escolar" },
  { campo: "turno", label: "turno" },
  { campo: "escola", label: "escola" },
  { campo: "endereco", label: "endereço" },
  { campo: "data_vencimento_seguro", label: "vencimento do seguro" },
];

function buildEstagiarioPayload(data: EstagiarioFormData) {
  return {
    nome: emptyToNull(data.nome),
    data_nascimento: emptyToNull(data.data_nascimento),
    cpf: emptyToNull(data.cpf),
    rg: emptyToNull(data.rg),
    telefone: emptyToNull(data.telefone),
    email: emptyToNull(data.email),
    serie_ano: emptyToNull(data.serie_ano),
    turno: emptyToNull(data.turno),
    escola: emptyToNull(data.escola),
    escola_endereco: emptyToNull(data.escola_endereco),
    escola_bairro: emptyToNull(data.escola_bairro),
    escola_cnpj: emptyToNull(data.escola_cnpj),
    escola_inscricao_estadual: emptyToNull(data.escola_inscricao_estadual),
    endereco: emptyToNull(data.endereco),
    bairro: emptyToNull(data.bairro),
    cidade: emptyToNull(data.cidade) || "Salvador",
    estado: emptyToNull(data.estado) || "Bahia",
    cep: emptyToNull(data.cep),
    loja_trabalho: emptyToNull(data.loja_trabalho),
    funcao: emptyToNull(data.funcao),
    valor_bolsa: numberOrNull(data.valor_bolsa),
    data_vencimento_seguro: emptyToNull(data.data_vencimento_seguro),
    numero_apolice: emptyToNull(data.numero_apolice),
    seguradora: emptyToNull(data.seguradora),
    observacoes: emptyToNull(data.observacoes),
    status: "ativo",
  };
}

async function syncEstagiarioPendencias(entityId: string, payload: Record<string, unknown>) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  const pendencias = getMissingFields(payload, estagiarioRequiredFields);
  const camposFaltantes = new Set(pendencias.map((item) => item.campo));
  const camposPreenchidos = estagiarioRequiredFields
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
      .eq("entity_type", "estagiario")
      .eq("entity_id", entityId)
      .in("campo", camposPreenchidos)
      .eq("ignorar_definitivo", false);
  }

  for (const pendencia of pendencias) {
    const { data: existente } = await supabase
      .from("completion_reminders")
      .select("id, ignorar_definitivo")
      .eq("entity_type", "estagiario")
      .eq("entity_id", entityId)
      .eq("campo", pendencia.campo)
      .maybeSingle();

    if (!existente) {
      await supabase.from("completion_reminders").insert({
        entity_type: "estagiario",
        entity_id: entityId,
        campo: pendencia.campo,
        mensagem: pendencia.mensagem,
        ativo: true,
      });
    }
  }

  return pendencias;
}

async function syncEstagiarioSkills(entityId: string, data: EstagiarioFormData) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  const skills = Array.from(new Set(data.skills ?? []));

  await supabase.from("student_skills").delete().eq("student_id", entityId);

  if (skills.length > 0) {
    await supabase.from("student_skills").insert(
      skills.map((skill) => ({
        student_id: entityId,
        nome_skill: skill,
        nivel: "informado",
      }))
    );
  }

  return skills;
}

export async function createEstagiarioAction(input: EstagiarioFormData): Promise<ActionResult> {
  const parsed = estagiarioSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Verifique os dados do estagiário.",
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

  const data = parsed.data;
  const payload = buildEstagiarioPayload(data);

  const { data: estagiario, error } = await supabase
    .from("students")
    .insert(payload)
    .select("id, nome")
    .single();

  if (error) {
    return {
      ok: false,
      message: `Erro ao salvar estagiário: ${error.message}`,
    };
  }

  const skills = await syncEstagiarioSkills(estagiario.id, data);
  const pendencias = await syncEstagiarioPendencias(estagiario.id, payload);

  await supabase.from("audit_logs").insert({
    acao: "criou_estagiario",
    tabela: "students",
    entity_type: "estagiario",
    entity_id: estagiario.id,
    valor_novo: {
      ...payload,
      skills,
      pendencias,
    },
    motivo: "Cadastro inicial do estagiário pelo painel RH.",
  });

  revalidatePath("/rh/estagiarios");
  revalidatePath("/rh/pendencias");
  revalidatePath("/rh");
  revalidatePath("/rh/match");

  return {
    ok: true,
    id: estagiario.id,
    message: `Estagiário ${estagiario.nome || "sem nome definido"} cadastrado com sucesso.`,
  };
}

export async function updateEstagiarioAction(id: string, input: EstagiarioFormData): Promise<ActionResult> {
  const parsed = estagiarioSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Verifique os dados do estagiário.",
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

  const { data: anterior } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .single();

  const data = parsed.data;
  const payload = buildEstagiarioPayload(data);

  const { data: estagiario, error } = await supabase
    .from("students")
    .update(payload)
    .eq("id", id)
    .select("id, nome")
    .single();

  if (error) {
    return {
      ok: false,
      message: `Erro ao atualizar estagiário: ${error.message}`,
    };
  }

  const skills = await syncEstagiarioSkills(id, data);
  const pendencias = await syncEstagiarioPendencias(id, payload);

  await supabase.from("audit_logs").insert({
    acao: "atualizou_estagiario",
    tabela: "students",
    entity_type: "estagiario",
    entity_id: id,
    valor_anterior: anterior,
    valor_novo: {
      ...payload,
      skills,
      pendencias,
    },
    motivo: "Atualização de cadastro do estagiário pelo painel RH.",
  });

  revalidatePath("/rh/estagiarios");
  revalidatePath(`/rh/estagiarios/${id}/editar`);
  revalidatePath("/rh/pendencias");
  revalidatePath("/rh");
  revalidatePath("/rh/match");

  return {
    ok: true,
    id: estagiario.id,
    message: `Estagiário ${estagiario.nome || "sem nome definido"} atualizado com sucesso.`,
  };
}

export async function inativarEstagiarioAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const motivo = String(formData.get("motivo") ?? "Inativação solicitada pelo painel RH.");

  const supabase = getSupabaseAdminClient();

  if (!supabase || !id) {
    revalidatePath("/rh/estagiarios");
    return;
  }

  const { data: anterior } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .single();

  const payload = {
    status: "inativo",
    inativado_em: new Date().toISOString(),
    motivo_inativacao: motivo,
  };

  await supabase.from("students").update(payload).eq("id", id);

  await supabase.from("audit_logs").insert({
    acao: "inativou_estagiario",
    tabela: "students",
    entity_type: "estagiario",
    entity_id: id,
    valor_anterior: anterior,
    valor_novo: payload,
    motivo,
  });

  revalidatePath("/rh/estagiarios");
  revalidatePath("/rh/pendencias");
  revalidatePath("/rh");
  revalidatePath("/rh/match");
}
