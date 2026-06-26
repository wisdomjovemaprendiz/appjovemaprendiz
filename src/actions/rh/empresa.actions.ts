"use server";

import { revalidatePath } from "next/cache";
import { empresaSchema, type EmpresaFormData } from "@/schemas/rh.schemas";
import { getSupabaseAdminClient, supabaseConfigMissingMessage } from "@/lib/supabase/server";
import {
  emptyToNull,
  formatZodErrors,
  getMissingFields,
  numberOrNull,
  type ActionResult,
} from "./action-utils";

const empresaRequiredFields = [
  { campo: "razao_social", label: "razão social" },
  { campo: "cnpj", label: "CNPJ" },
  { campo: "nome_responsavel", label: "nome do responsável" },
  { campo: "telefone", label: "telefone" },
  { campo: "email", label: "e-mail" },
  { campo: "endereco", label: "endereço" },
  { campo: "perfil_candidato", label: "perfil do candidato" },
  { campo: "funcoes_estagiario", label: "funções do estagiário" },
];

function buildEmpresaPayload(data: EmpresaFormData) {
  return {
    nome_responsavel: emptyToNull(data.nome_responsavel),
    cnpj: emptyToNull(data.cnpj),
    razao_social: emptyToNull(data.razao_social),
    nome_fantasia: emptyToNull(data.nome_fantasia),
    ramo_atuacao: emptyToNull(data.ramo_atuacao),
    endereco: emptyToNull(data.endereco),
    bairro: emptyToNull(data.bairro),
    cidade: emptyToNull(data.cidade) || "Salvador",
    estado: emptyToNull(data.estado) || "Bahia",
    cep: emptyToNull(data.cep),
    email: emptyToNull(data.email),
    telefone: emptyToNull(data.telefone),
    perfil_candidato: emptyToNull(data.perfil_candidato),
    funcoes_estagiario: emptyToNull(data.funcoes_estagiario),
    valor_bolsa: numberOrNull(data.valor_bolsa),
    observacoes: emptyToNull(data.observacoes),
    status: "ativo",
  };
}

async function syncEmpresaPendencias(entityId: string, payload: Record<string, unknown>) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  const pendencias = getMissingFields(payload, empresaRequiredFields);
  const camposFaltantes = new Set(pendencias.map((item) => item.campo));
  const camposPreenchidos = empresaRequiredFields
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
      .eq("entity_type", "empresa")
      .eq("entity_id", entityId)
      .in("campo", camposPreenchidos)
      .eq("ignorar_definitivo", false);
  }

  for (const pendencia of pendencias) {
    const { data: existente } = await supabase
      .from("completion_reminders")
      .select("id, ignorar_definitivo")
      .eq("entity_type", "empresa")
      .eq("entity_id", entityId)
      .eq("campo", pendencia.campo)
      .maybeSingle();

    if (!existente) {
      await supabase.from("completion_reminders").insert({
        entity_type: "empresa",
        entity_id: entityId,
        campo: pendencia.campo,
        mensagem: pendencia.mensagem,
        ativo: true,
      });
    }
  }

  return pendencias;
}

async function syncEmpresaSkills(entityId: string, data: EmpresaFormData) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  const skills = Array.from(
    new Set([...(data.skills_desejadas ?? []), ...(data.funcoes_sugeridas ?? [])])
  );

  await supabase.from("company_skill_requirements").delete().eq("company_id", entityId);

  if (skills.length > 0) {
    await supabase.from("company_skill_requirements").insert(
      skills.map((skill) => ({
        company_id: entityId,
        nome_skill: skill,
        peso: 1,
      }))
    );
  }

  return skills;
}

export async function createEmpresaAction(input: EmpresaFormData): Promise<ActionResult> {
  const parsed = empresaSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Verifique os dados da empresa.",
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
  const payload = buildEmpresaPayload(data);

  const { data: empresa, error } = await supabase
    .from("companies")
    .insert(payload)
    .select("id, razao_social, nome_fantasia")
    .single();

  if (error) {
    return {
      ok: false,
      message: `Erro ao salvar empresa: ${error.message}`,
    };
  }

  const skills = await syncEmpresaSkills(empresa.id, data);
  const pendencias = await syncEmpresaPendencias(empresa.id, payload);

  await supabase.from("audit_logs").insert({
    acao: "criou_empresa",
    tabela: "companies",
    entity_type: "empresa",
    entity_id: empresa.id,
    valor_novo: {
      ...payload,
      skills,
      pendencias,
    },
    motivo: "Cadastro inicial da empresa pelo painel RH.",
  });

  revalidatePath("/rh/empresas");
  revalidatePath("/rh/pendencias");
  revalidatePath("/rh");
  revalidatePath("/rh/match");

  return {
    ok: true,
    id: empresa.id,
    message: `Empresa ${empresa.nome_fantasia || empresa.razao_social || "sem nome definido"} cadastrada com sucesso.`,
  };
}

export async function updateEmpresaAction(id: string, input: EmpresaFormData): Promise<ActionResult> {
  const parsed = empresaSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Verifique os dados da empresa.",
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
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  const data = parsed.data;
  const payload = buildEmpresaPayload(data);

  const { data: empresa, error } = await supabase
    .from("companies")
    .update(payload)
    .eq("id", id)
    .select("id, razao_social, nome_fantasia")
    .single();

  if (error) {
    return {
      ok: false,
      message: `Erro ao atualizar empresa: ${error.message}`,
    };
  }

  const skills = await syncEmpresaSkills(id, data);
  const pendencias = await syncEmpresaPendencias(id, payload);

  await supabase.from("audit_logs").insert({
    acao: "atualizou_empresa",
    tabela: "companies",
    entity_type: "empresa",
    entity_id: id,
    valor_anterior: anterior,
    valor_novo: {
      ...payload,
      skills,
      pendencias,
    },
    motivo: "Atualização de cadastro da empresa pelo painel RH.",
  });

  revalidatePath("/rh/empresas");
  revalidatePath(`/rh/empresas/${id}/editar`);
  revalidatePath("/rh/pendencias");
  revalidatePath("/rh");
  revalidatePath("/rh/match");

  return {
    ok: true,
    id: empresa.id,
    message: `Empresa ${empresa.nome_fantasia || empresa.razao_social || "sem nome definido"} atualizada com sucesso.`,
  };
}

export async function inativarEmpresaAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const motivo = String(formData.get("motivo") ?? "Inativação solicitada pelo painel RH.");

  const supabase = getSupabaseAdminClient();

  if (!supabase || !id) {
    revalidatePath("/rh/empresas");
    return;
  }

  const { data: anterior } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  const payload = {
    status: "inativo",
    inativado_em: new Date().toISOString(),
    motivo_inativacao: motivo,
  };

  await supabase.from("companies").update(payload).eq("id", id);

  await supabase.from("audit_logs").insert({
    acao: "inativou_empresa",
    tabela: "companies",
    entity_type: "empresa",
    entity_id: id,
    valor_anterior: anterior,
    valor_novo: payload,
    motivo,
  });

  revalidatePath("/rh/empresas");
  revalidatePath("/rh/pendencias");
  revalidatePath("/rh");
  revalidatePath("/rh/match");
}
