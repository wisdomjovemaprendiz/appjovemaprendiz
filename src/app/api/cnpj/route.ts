import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CnpjResult = {
  cnpj: string;
  razao_social: string | null;
  nome_fantasia: string | null;
  nome_responsavel: string | null;
  responsavel_nome: string | null;
  email: string | null;
  telefone: string | null;
  situacao: string | null;
  porte: string | null;
  natureza_juridica: string | null;
  atividade_principal: string | null;
  ramo_atuacao: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  municipio: string | null;
  cidade: string | null;
  uf: string | null;
  endereco: string | null;
  capital_social: number | null;
  source: string;
};

function onlyDigits(value: string | null | undefined) {
  return String(value || "").replace(/\D/g, "");
}

function getParam(request: Request) {
  const { searchParams } = new URL(request.url);

  return (
    searchParams.get("cnpj") ||
    searchParams.get("value") ||
    searchParams.get("q") ||
    searchParams.get("documento") ||
    searchParams.get("document") ||
    searchParams.get("taxId") ||
    ""
  );
}

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

async function fetchJson(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "RH-Wisdom-Estagios/1.0",
      },
    });

    const text = await response.text();

    let data: unknown = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = {
        raw: text,
      };
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function formatPhone(value: string | null | undefined) {
  const digits = onlyDigits(value);

  if (!digits) return null;

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  return value || digits;
}

function addressFrom(data: any) {
  return [
    data.logradouro,
    data.numero,
    data.complemento,
    data.bairro,
    data.municipio,
    data.uf,
  ]
    .filter(Boolean)
    .join(", ");
}

function normalizeBrasilApi(data: any, digits: string): CnpjResult {
  const atividadePrincipal =
    data.cnae_fiscal_descricao ||
    data.atividade_principal?.[0]?.text ||
    data.atividade_principal?.[0]?.descricao ||
    null;

  const telefone =
    data.ddd_telefone_1 ||
    data.ddd_telefone_2 ||
    data.telefone ||
    null;

  const responsavel =
    data.qsa?.[0]?.nome_socio ||
    data.nome_responsavel ||
    null;

  return {
    cnpj: data.cnpj || digits,
    razao_social: data.razao_social || data.nome || null,
    nome_fantasia: data.nome_fantasia || data.razao_social || data.nome || null,
    nome_responsavel: responsavel,
    responsavel_nome: responsavel,
    email: data.email || null,
    telefone: formatPhone(telefone),
    situacao: data.descricao_situacao_cadastral || data.situacao || null,
    porte: data.porte || data.descricao_porte || null,
    natureza_juridica: data.natureza_juridica || data.codigo_natureza_juridica || null,
    atividade_principal: atividadePrincipal,
    ramo_atuacao: atividadePrincipal,
    cep: data.cep || null,
    logradouro: data.logradouro || null,
    numero: data.numero || null,
    complemento: data.complemento || null,
    bairro: data.bairro || null,
    municipio: data.municipio || null,
    cidade: data.municipio || null,
    uf: data.uf || null,
    endereco: addressFrom(data) || null,
    capital_social:
      data.capital_social === null || data.capital_social === undefined
        ? null
        : Number(data.capital_social),
    source: "brasilapi",
  };
}

export async function GET(request: Request) {
  const rawCnpj = getParam(request);
  const cnpj = onlyDigits(rawCnpj);

  if (!cnpj) {
    return json({
      ok: false,
      success: false,
      message: "Informe o CNPJ.",
      input: rawCnpj,
      empresa: null,
      data: null,
    });
  }

  if (cnpj.length !== 14) {
    return json({
      ok: false,
      success: false,
      message: "CNPJ inválido. Informe exatamente 14 dígitos.",
      input: rawCnpj,
      digits: cnpj,
      empresa: null,
      data: null,
    });
  }

  const errors: Array<Record<string, unknown>> = [];

  try {
    const brasilApi = await fetchJson(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);

    if (brasilApi.ok && brasilApi.data) {
      const normalized = normalizeBrasilApi(brasilApi.data, cnpj);

      return json({
        ok: true,
        success: true,
        message: "CNPJ encontrado.",

        // Formato novo
        data: normalized,

        // Formato antigo esperado pelo EmpresaForm.tsx
        empresa: normalized,

        // Campos também no topo para facilitar outros componentes
        ...normalized,
      });
    }

    errors.push({
      source: "brasilapi",
      status: brasilApi.status,
      data: brasilApi.data,
    });
  } catch (error) {
    errors.push({
      source: "brasilapi",
      message: error instanceof Error ? error.message : "Erro na BrasilAPI.",
    });
  }

  return json({
    ok: false,
    success: false,
    message: "CNPJ não encontrado na BrasilAPI.",
    input: rawCnpj,
    digits: cnpj,
    errors,
    empresa: null,
    data: null,
  });
}