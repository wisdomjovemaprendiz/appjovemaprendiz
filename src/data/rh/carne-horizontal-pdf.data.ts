import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type CarneParcelaPdf = {
  id: string;
  codigo_curto: string;
  numero_controle: string;
  parcela_numero: number;
  total_parcelas: number;
  vencimento: string;
  valor: string;
  valor_original: number;
  desconto: string;
  acrescimos: string;
  total_cobrado: string;
  status: string;
  descricao: string;
  instrucoes: string;
  data_pagamento: string;
};

export type CarneHorizontalPdfData = {
  carne: {
    id: string;
    codigo: string;
    titulo: string;
    quantidade_parcelas: number;
    valor_total: string;
    data_emissao: string;
  };
  cedente: {
    nome: string;
    razao_social: string;
    cnpj: string;
    endereco: string;
    telefone: string;
    email: string;
    logo_url: string;
  };
  sacado: {
    nome: string;
    razao_social: string;
    cnpj: string;
    endereco: string;
    telefone: string;
    email: string;
  };
  pix: {
    recebedor_nome: string;
    chave: string;
    observacoes: string;
    qrcode_url: string | null;
  };
  parcelas: CarneParcelaPdf[];
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

function getNumber(row: Record<string, unknown> | null | undefined, keys: string[], fallback = 0) {
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

function formatCurrency(value: number | string | null | undefined) {
  const number = Number(value ?? 0);

  if (!Number.isFinite(number)) {
    return "R$ 0,00";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(number);
}

function formatDateBR(value: string | null | undefined) {
  if (!value) return "";

  const clean = String(value).slice(0, 10);
  const date = new Date(`${clean}T00:00:00`);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(date);
}

function buildAddress(row: Record<string, unknown> | null | undefined) {
  return [
    getValue(row, ["endereco", "logradouro"]),
    getValue(row, ["numero"]),
    getValue(row, ["complemento"]),
    getValue(row, ["bairro"]),
    getValue(row, ["cidade", "municipio"]),
    getValue(row, ["estado", "uf"]),
    getValue(row, ["cep"]),
  ]
    .filter(Boolean)
    .join(" - ");
}

function shortCarnetCode(id: string) {
  return `CN${String(id).replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

function shortChargeCode(row: Record<string, unknown>) {
  return (
    getValue(row, ["codigo_curto"]) ||
    `C${String(getValue(row, ["id"])).replace(/-/g, "").slice(0, 5).toUpperCase()}`
  );
}

function protectedImageUrl(fileId: string | null | undefined) {
  if (!fileId) return null;
  return `/api/rh/files/image?file_id=${encodeURIComponent(fileId)}`;
}

function normalizeImageUrl(value: string | null | undefined) {
  const url = String(value || "").trim();

  if (!url) return null;

  if (url.startsWith("/api/rh/files/image")) {
    return url;
  }

  const fileIdFromView = url.match(/\/d\/([^/]+)/)?.[1];
  const fileIdFromQuery = url.match(/[?&]id=([^&]+)/)?.[1];

  const fileId = fileIdFromView || fileIdFromQuery;

  if (fileId) {
    return protectedImageUrl(fileId);
  }

  return url;
}

export async function getCarneHorizontalPdfData(id: string): Promise<{
  data: CarneHorizontalPdfData | null;
  errorMessage?: string;
}> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      data: null,
      errorMessage: "Supabase ainda não configurado.",
    };
  }

  const { data: booklet, error: bookletError } = await supabase
    .from("payment_booklets")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (bookletError) {
    return {
      data: null,
      errorMessage: `Erro ao carregar carnê: ${bookletError.message}`,
    };
  }

  if (!booklet) {
    return {
      data: null,
      errorMessage: "Carnê não encontrado.",
    };
  }

  const companyId = getValue(booklet, ["company_id"]);

  const [companyResult, chargesResult, orgResult, settingsResult] = await Promise.all([
    companyId
      ? supabase.from("companies").select("*").eq("id", companyId).maybeSingle()
      : Promise.resolve({ data: null, error: null } as any),

    supabase
      .from("financial_charges")
      .select("*")
      .eq("booklet_id", id)
      .order("parcela_numero", { ascending: true }),

    supabase
      .from("rh_organization_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle(),

    supabase
      .from("financial_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle(),
  ]);

  if (chargesResult.error) {
    return {
      data: null,
      errorMessage: `Erro ao carregar parcelas: ${chargesResult.error.message}`,
    };
  }

  const company = (companyResult.data ?? {}) as Record<string, unknown>;
  const org = (orgResult.data ?? {}) as Record<string, unknown>;
  const settings = (settingsResult.data ?? {}) as Record<string, unknown>;
  const charges = (chargesResult.data ?? []) as Array<Record<string, unknown>>;

  let qrCodeUrl = normalizeImageUrl(getValue(settings, ["pix_qrcode_url"]));

  const qrDocumentId = getValue(settings, ["pix_qrcode_document_id"]);

  if (qrDocumentId) {
    const { data: qrDocument } = await supabase
      .from("documents")
      .select("drive_file_id, drive_web_content_link, drive_web_view_link")
      .eq("id", qrDocumentId)
      .maybeSingle();

    const qrFileId = getValue(qrDocument as Record<string, unknown> | null, ["drive_file_id"]);

    if (qrFileId) {
      qrCodeUrl = protectedImageUrl(qrFileId);
    } else {
      qrCodeUrl =
        normalizeImageUrl(getValue(qrDocument as Record<string, unknown> | null, ["drive_web_content_link"])) ||
        normalizeImageUrl(getValue(qrDocument as Record<string, unknown> | null, ["drive_web_view_link"])) ||
        qrCodeUrl;
    }
  }

  const logoUrl =
    normalizeImageUrl(getValue(org, ["logo_url"])) ||
    "/logo-wisdom.png";

  const parcelas: CarneParcelaPdf[] = charges.map((charge, index) => {
    const valorOriginal = getNumber(charge, ["valor", "valor_original", "amount"], 0);
    const descontoValor = getNumber(charge, ["desconto_valor"], 0);
    const valorComDesconto = getNumber(charge, ["valor_com_desconto"], 0);
    const totalCobrado = valorComDesconto > 0 ? valorComDesconto : valorOriginal;
    const parcelaNumero = getNumber(charge, ["parcela_numero"], index + 1);
    const totalParcelas = getNumber(charge, ["total_parcelas"], charges.length || 1);

    return {
      id: getValue(charge, ["id"]),
      codigo_curto: shortChargeCode(charge),
      numero_controle: getValue(charge, ["numero_controle"]),
      parcela_numero: parcelaNumero,
      total_parcelas: totalParcelas,
      vencimento: formatDateBR(getValue(charge, ["data_vencimento", "vencimento", "due_date"])),
      valor: formatCurrency(valorOriginal),
      valor_original: valorOriginal,
      desconto: descontoValor > 0 ? formatCurrency(descontoValor) : "",
      acrescimos: "",
      total_cobrado: formatCurrency(totalCobrado),
      status: getValue(charge, ["status"], "pendente"),
      descricao:
        getValue(charge, ["descricao"]) ||
        `Mensalidade RH Wisdom - Parcela ${parcelaNumero}/${totalParcelas}`,
      instrucoes:
        getValue(charge, ["instrucoes_pagamento"]) ||
        getValue(settings, ["instrucoes_pagamento_padrao"]) ||
        "Pagar até o vencimento. Após o vencimento, procurar o RH Wisdom para atualização.",
      data_pagamento: formatDateBR(getValue(charge, ["data_pagamento"])),
    };
  });

  const total = parcelas.reduce((sum, parcela) => sum + parcela.valor_original, 0);

  const data: CarneHorizontalPdfData = {
    carne: {
      id,
      codigo: shortCarnetCode(id),
      titulo: getValue(booklet, ["titulo", "descricao"]) || "Carnê de mensalidades",
      quantidade_parcelas: parcelas.length,
      valor_total: formatCurrency(total),
      data_emissao: formatDateBR(new Date().toISOString()),
    },

    cedente: {
      nome: getValue(org, ["nome_fantasia"]) || "Wisdom Cursos e Estágios",
      razao_social: getValue(org, ["razao_social"]) || "RH Wisdom Opportunities LTDA",
      cnpj: getValue(org, ["cnpj"]) || "52.983.709/0001-58",
      endereco: buildAddress(org),
      telefone: getValue(org, ["telefone", "whatsapp"]) || "",
      email: getValue(org, ["email"]) || "",
      logo_url: logoUrl,
    },

    sacado: {
      nome: getValue(company, ["nome_fantasia"]) || getValue(company, ["razao_social"]) || "Empresa não informada",
      razao_social: getValue(company, ["razao_social"]) || getValue(company, ["nome_fantasia"]) || "",
      cnpj: getValue(company, ["cnpj"]),
      endereco: buildAddress(company),
      telefone: getValue(company, ["telefone", "whatsapp"]),
      email: getValue(company, ["email"]),
    },

    pix: {
      recebedor_nome:
        getValue(settings, ["pix_recebedor_nome"]) ||
        getValue(org, ["nome_fantasia"]) ||
        "Wisdom Cursos e Estágios",
      chave: getValue(settings, ["pix_chave"]),
      observacoes: getValue(settings, ["pix_observacoes"]),
      qrcode_url: qrCodeUrl,
    },

    parcelas,
  };

  return {
    data,
  };
}