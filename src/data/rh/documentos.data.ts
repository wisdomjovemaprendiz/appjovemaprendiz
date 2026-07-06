import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type DocumentoListItem = {
  id: string;
  entity_type: string | null;
  entity_id: string | null;
  category: string | null;
  file_name: string | null;
  original_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  storage_provider: string | null;
  drive_file_id: string | null;
  drive_folder_id: string | null;
  drive_web_view_link: string | null;
  drive_web_content_link: string | null;
  status: string | null;
  version: number | null;
  created_at: string | null;
  entity_name: string;
};

export type DocumentoEntityOption = {
  id: string;
  label: string;
  detail?: string | null;
};

export type DocumentoOptions = {
  empresas: DocumentoEntityOption[];
  estagiarios: DocumentoEntityOption[];
  contratos: DocumentoEntityOption[];
};

export async function getDocumentoOptions(): Promise<{
  data: DocumentoOptions;
  errorMessage?: string;
}> {
  const supabase = getSupabaseAdminClient();

  const empty: DocumentoOptions = {
    empresas: [],
    estagiarios: [],
    contratos: [],
  };

  if (!supabase) {
    return {
      data: empty,
      errorMessage: "Supabase ainda não configurado.",
    };
  }

  const { data: empresas } = await supabase
    .from("companies")
    .select("id, razao_social, nome_fantasia, cnpj")
    .order("criado_em", { ascending: false })
    .limit(200);

  const { data: estagiarios } = await supabase
    .from("students")
    .select("id, nome, serie_ano, turno, escola")
    .order("criado_em", { ascending: false })
    .limit(200);

  const { data: contratos } = await supabase
    .from("internship_contracts")
    .select("id, numero_contrato, student_id, company_id, criado_em")
    .order("criado_em", { ascending: false })
    .limit(200);

  return {
    data: {
      empresas: (empresas ?? []).map((empresa) => ({
        id: empresa.id,
        label:
          empresa.nome_fantasia ||
          empresa.razao_social ||
          "Empresa sem nome definido",
        detail: empresa.cnpj ? `CNPJ: ${empresa.cnpj}` : null,
      })),
      estagiarios: (estagiarios ?? []).map((estagiario) => ({
        id: estagiario.id,
        label: estagiario.nome || "Estagiário sem nome definido",
        detail: [estagiario.serie_ano, estagiario.turno, estagiario.escola]
          .filter(Boolean)
          .join(" • "),
      })),
      contratos: (contratos ?? []).map((contrato) => ({
        id: contrato.id,
        label:
          contrato.numero_contrato ||
          `Contrato ${String(contrato.id).slice(0, 8)}`,
        detail: contrato.criado_em
          ? `Criado em ${new Intl.DateTimeFormat("pt-BR").format(new Date(contrato.criado_em))}`
          : null,
      })),
    },
  };
}

export async function getDocumentos(): Promise<{
  data: DocumentoListItem[];
  errorMessage?: string;
}> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      data: [],
      errorMessage:
        "Supabase ainda não configurado. Preencha o .env.local para carregar documentos reais.",
    };
  }

  const { data: documentos, error } = await supabase
    .from("documents")
    .select(
      "id, entity_type, entity_id, category, file_name, original_name, mime_type, file_size, storage_provider, drive_file_id, drive_folder_id, drive_web_view_link, drive_web_content_link, status, version, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return {
      data: [],
      errorMessage: `Erro ao carregar documentos: ${error.message}`,
    };
  }

  const rows = documentos ?? [];

  const companyIds = rows
    .filter((item) => item.entity_type === "empresa" && item.entity_id)
    .map((item) => item.entity_id) as string[];

  const studentIds = rows
    .filter((item) => item.entity_type === "estagiario" && item.entity_id)
    .map((item) => item.entity_id) as string[];

  const contractIds = rows
    .filter((item) => item.entity_type === "contrato" && item.entity_id)
    .map((item) => item.entity_id) as string[];

  const companyMap = new Map<string, string>();
  const studentMap = new Map<string, string>();
  const contractMap = new Map<string, string>();

  if (companyIds.length > 0) {
    const { data } = await supabase
      .from("companies")
      .select("id, razao_social, nome_fantasia")
      .in("id", companyIds);

    for (const item of data ?? []) {
      companyMap.set(
        item.id,
        item.nome_fantasia || item.razao_social || "Empresa sem nome definido"
      );
    }
  }

  if (studentIds.length > 0) {
    const { data } = await supabase
      .from("students")
      .select("id, nome")
      .in("id", studentIds);

    for (const item of data ?? []) {
      studentMap.set(item.id, item.nome || "Estagiário sem nome definido");
    }
  }

  if (contractIds.length > 0) {
    const { data } = await supabase
      .from("internship_contracts")
      .select("id, numero_contrato")
      .in("id", contractIds);

    for (const item of data ?? []) {
      contractMap.set(
        item.id,
        item.numero_contrato || `Contrato ${String(item.id).slice(0, 8)}`
      );
    }
  }

  return {
    data: rows.map((item) => {
      let entityName = "Sem vínculo";

      if (item.entity_type === "empresa" && item.entity_id) {
        entityName = companyMap.get(item.entity_id) || "Empresa não localizada";
      }

      if (item.entity_type === "estagiario" && item.entity_id) {
        entityName =
          studentMap.get(item.entity_id) || "Estagiário não localizado";
      }

      if (item.entity_type === "contrato" && item.entity_id) {
        entityName = contractMap.get(item.entity_id) || "Contrato não localizado";
      }

      return {
        ...item,
        entity_name: entityName,
      };
    }) as DocumentoListItem[],
  };
}