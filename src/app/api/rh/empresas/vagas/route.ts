import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function emptyToNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function numberOrDefault(value: FormDataEntryValue | null, fallback = 0) {
  const text = String(value ?? "").trim();

  if (!text) return fallback;

  const number = Number(
    text
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, "")
  );

  return Number.isFinite(number) ? number : fallback;
}

function splitCustomSkills(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/[,;\n]/g)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 30);
}

function parseSkillIds(value: FormDataEntryValue | null) {
  try {
    const parsed = JSON.parse(String(value ?? "[]"));

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => String(item ?? "").trim())
      .filter(Boolean)
      .slice(0, 100);
  } catch {
    return [];
  }
}

async function requireRh() {
  const { user, profile } = await getCurrentProfile();

  if (!user || !profile) {
    return {
      ok: false,
      message: "Sessão não encontrada.",
    };
  }

  if (
    profile.status !== "ativo" ||
    !["rh_master", "rh_operador"].includes(profile.role)
  ) {
    return {
      ok: false,
      message: "Apenas usuários do RH podem gerenciar vagas.",
    };
  }

  return {
    ok: true,
    message: "Autorizado.",
  };
}

function skillName(skill: Record<string, unknown> | undefined) {
  if (!skill) return "";

  return String(
    skill.name ||
      skill.nome ||
      skill.label ||
      skill.titulo ||
      skill.slug ||
      ""
  );
}

async function replaceVacancySkills(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  vacancyId: string,
  skillIds: string[],
  customSkills: string[]
) {
  await supabase
    .from("company_vacancy_skills")
    .delete()
    .eq("vacancy_id", vacancyId);

  const rows = [
    ...skillIds.map((skillId, index) => ({
      vacancy_id: vacancyId,
      skill_id: skillId,
      custom_skill: null,
      sort_order: index,
    })),
    ...customSkills.map((customSkill, index) => ({
      vacancy_id: vacancyId,
      skill_id: null,
      custom_skill: customSkill,
      sort_order: skillIds.length + index,
    })),
  ];

  if (rows.length > 0) {
    await supabase.from("company_vacancy_skills").insert(rows);
  }

  return rows;
}

export async function GET(request: Request) {
  const auth = await requireRh();

  if (!auth.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: auth.message,
      },
      { status: 403 }
    );
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        message: "Supabase ainda não configurado.",
      },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const companyId = String(searchParams.get("company_id") ?? "").trim();

  if (!companyId) {
    return NextResponse.json(
      {
        ok: false,
        message: "Empresa não informada.",
      },
      { status: 400 }
    );
  }

  const [vacanciesResult, catalogResult] = await Promise.all([
    supabase
      .from("company_vacancies")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("skill_catalog")
      .select("*")
      .limit(300),
  ]);

  if (vacanciesResult.error) {
    return NextResponse.json(
      {
        ok: false,
        message: `Erro ao carregar vagas: ${vacanciesResult.error.message}`,
      },
      { status: 500 }
    );
  }

  const vacancies = vacanciesResult.data ?? [];
  const vacancyIds = vacancies.map((item) => item.id);
  const catalog = catalogResult.data ?? [];
  const skillMap = new Map<string, Record<string, unknown>>();

  for (const skill of catalog) {
    skillMap.set(String(skill.id), skill);
  }

  let vacancySkills: Array<Record<string, unknown>> = [];

  if (vacancyIds.length > 0) {
    const skillsResult = await supabase
      .from("company_vacancy_skills")
      .select("*")
      .in("vacancy_id", vacancyIds)
      .order("sort_order", { ascending: true });

    vacancySkills = skillsResult.data ?? [];
  }

  const vagas = vacancies.map((vacancy) => {
    const skills = vacancySkills
      .filter((item) => item.vacancy_id === vacancy.id)
      .map((item) => {
        const skill = item.skill_id ? skillMap.get(String(item.skill_id)) : undefined;

        return {
          id: item.id,
          skill_id: item.skill_id,
          custom_skill: item.custom_skill,
          name: item.custom_skill || skillName(skill),
        };
      });

    return {
      ...vacancy,
      skills,
    };
  });

  const skills = catalog
    .map((item) => ({
      id: String(item.id),
      name: skillName(item),
      category: String(item.category || item.categoria || ""),
    }))
    .filter((item) => item.name);

  return NextResponse.json({
    ok: true,
    data: {
      vagas,
      skills,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireRh();

  if (!auth.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: auth.message,
      },
      { status: 403 }
    );
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        message: "Supabase ainda não configurado.",
      },
      { status: 500 }
    );
  }

  const formData = await request.formData();

  const companyId = String(formData.get("company_id") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const titulo = String(formData.get("titulo") ?? "").trim() || area || "Vaga";

  if (!companyId) {
    return NextResponse.json(
      {
        ok: false,
        message: "Salve a empresa antes de cadastrar vagas.",
      },
      { status: 400 }
    );
  }

  if (!area) {
    return NextResponse.json(
      {
        ok: false,
        message: "Informe a área da vaga.",
      },
      { status: 400 }
    );
  }

  const vacancyPayload = {
    company_id: companyId,
    titulo,
    area,
    perfil_desejado: emptyToNull(formData.get("perfil_desejado")),
    quantidade: Math.max(1, numberOrDefault(formData.get("quantidade"), 1)),
    turno: emptyToNull(formData.get("turno")),
    bolsa_auxilio: numberOrDefault(formData.get("bolsa_auxilio"), 0) || null,
    observacoes: emptyToNull(formData.get("observacoes")),
    status: "ativa",
    updated_at: new Date().toISOString(),
  };

  const { data: vacancy, error: vacancyError } = await supabase
    .from("company_vacancies")
    .insert(vacancyPayload)
    .select("*")
    .single();

  if (vacancyError || !vacancy) {
    return NextResponse.json(
      {
        ok: false,
        message: `Erro ao cadastrar vaga: ${vacancyError?.message || "registro não retornado"}`,
      },
      { status: 500 }
    );
  }

  const skillIds = parseSkillIds(formData.get("skill_ids"));
  const customSkills = splitCustomSkills(formData.get("custom_skills"));
  const skillRows = await replaceVacancySkills(supabase, vacancy.id, skillIds, customSkills);

  await supabase.from("audit_logs").insert({
    acao: "criou_vaga_empresa",
    tabela: "company_vacancies",
    entity_type: "empresa",
    entity_id: companyId,
    valor_anterior: null,
    valor_novo: {
      vaga: vacancyPayload,
      skills: skillRows,
    },
    motivo: "Vaga/perfil desejado cadastrado para empresa.",
  });

  return NextResponse.json({
    ok: true,
    message: "Vaga cadastrada com sucesso.",
    data: vacancy,
  });
}

export async function PUT(request: Request) {
  const auth = await requireRh();

  if (!auth.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: auth.message,
      },
      { status: 403 }
    );
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        message: "Supabase ainda não configurado.",
      },
      { status: 500 }
    );
  }

  const formData = await request.formData();

  const vacancyId = String(formData.get("vacancy_id") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const titulo = String(formData.get("titulo") ?? "").trim() || area || "Vaga";

  if (!vacancyId) {
    return NextResponse.json(
      {
        ok: false,
        message: "Vaga não informada.",
      },
      { status: 400 }
    );
  }

  if (!area) {
    return NextResponse.json(
      {
        ok: false,
        message: "Informe a área da vaga.",
      },
      { status: 400 }
    );
  }

  const { data: previous } = await supabase
    .from("company_vacancies")
    .select("*")
    .eq("id", vacancyId)
    .maybeSingle();

  if (!previous) {
    return NextResponse.json(
      {
        ok: false,
        message: "Vaga não encontrada.",
      },
      { status: 404 }
    );
  }

  const vacancyPayload = {
    titulo,
    area,
    perfil_desejado: emptyToNull(formData.get("perfil_desejado")),
    quantidade: Math.max(1, numberOrDefault(formData.get("quantidade"), 1)),
    turno: emptyToNull(formData.get("turno")),
    bolsa_auxilio: numberOrDefault(formData.get("bolsa_auxilio"), 0) || null,
    observacoes: emptyToNull(formData.get("observacoes")),
    updated_at: new Date().toISOString(),
  };

  const { data: vacancy, error } = await supabase
    .from("company_vacancies")
    .update(vacancyPayload)
    .eq("id", vacancyId)
    .select("*")
    .single();

  if (error || !vacancy) {
    return NextResponse.json(
      {
        ok: false,
        message: `Erro ao editar vaga: ${error?.message || "registro não retornado"}`,
      },
      { status: 500 }
    );
  }

  const skillIds = parseSkillIds(formData.get("skill_ids"));
  const customSkills = splitCustomSkills(formData.get("custom_skills"));
  const skillRows = await replaceVacancySkills(supabase, vacancyId, skillIds, customSkills);

  await supabase.from("audit_logs").insert({
    acao: "editou_vaga_empresa",
    tabela: "company_vacancies",
    entity_type: "empresa",
    entity_id: vacancy.company_id,
    valor_anterior: previous,
    valor_novo: {
      vaga: vacancyPayload,
      skills: skillRows,
    },
    motivo: "Vaga/perfil desejado editado no cadastro da empresa.",
  });

  return NextResponse.json({
    ok: true,
    message: "Vaga editada com sucesso.",
    data: vacancy,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireRh();

  if (!auth.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: auth.message,
      },
      { status: 403 }
    );
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        message: "Supabase ainda não configurado.",
      },
      { status: 500 }
    );
  }

  const body = await request.json();

  const vacancyId = String(body.vacancy_id ?? "").trim();
  const status = String(body.status ?? "").trim();

  if (!vacancyId) {
    return NextResponse.json(
      {
        ok: false,
        message: "Vaga não informada.",
      },
      { status: 400 }
    );
  }

  if (!["ativa", "arquivada", "cancelada"].includes(status)) {
    return NextResponse.json(
      {
        ok: false,
        message: "Status da vaga inválido.",
      },
      { status: 400 }
    );
  }

  const { data: previous } = await supabase
    .from("company_vacancies")
    .select("*")
    .eq("id", vacancyId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("company_vacancies")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", vacancyId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: `Erro ao atualizar vaga: ${error.message}`,
      },
      { status: 500 }
    );
  }

  await supabase.from("audit_logs").insert({
    acao: "atualizou_status_vaga_empresa",
    tabela: "company_vacancies",
    entity_type: "empresa",
    entity_id: data.company_id,
    valor_anterior: previous,
    valor_novo: data,
    motivo: `Status da vaga alterado para ${status}.`,
  });

  return NextResponse.json({
    ok: true,
    message: "Vaga atualizada com sucesso.",
    data,
  });
}

export async function DELETE(request: Request) {
  const auth = await requireRh();

  if (!auth.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: auth.message,
      },
      { status: 403 }
    );
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        message: "Supabase ainda não configurado.",
      },
      { status: 500 }
    );
  }

  const body = await request.json();

  const vacancyId = String(body.vacancy_id ?? "").trim();
  const confirmText = String(body.confirm_text ?? "").trim();

  if (!vacancyId) {
    return NextResponse.json(
      {
        ok: false,
        message: "Vaga não informada.",
      },
      { status: 400 }
    );
  }

  if (confirmText !== "EXCLUIR") {
    return NextResponse.json(
      {
        ok: false,
        message: "Confirmação inválida.",
      },
      { status: 400 }
    );
  }

  const { data: previous } = await supabase
    .from("company_vacancies")
    .select("*")
    .eq("id", vacancyId)
    .maybeSingle();

  if (!previous) {
    return NextResponse.json(
      {
        ok: false,
        message: "Vaga não encontrada.",
      },
      { status: 404 }
    );
  }

  await supabase.from("audit_logs").insert({
    acao: "excluiu_vaga_empresa",
    tabela: "company_vacancies",
    entity_type: "empresa",
    entity_id: previous.company_id,
    valor_anterior: previous,
    valor_novo: null,
    motivo: "Vaga excluída definitivamente no cadastro da empresa.",
  });

  const { error } = await supabase
    .from("company_vacancies")
    .delete()
    .eq("id", vacancyId);

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: `Erro ao excluir vaga: ${error.message}`,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Vaga excluída com sucesso.",
  });
}