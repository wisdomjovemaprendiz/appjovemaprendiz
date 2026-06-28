import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CepResult = {
  cep: string;
  logradouro: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  localidade: string | null;
  uf: string | null;
  estado: string | null;
  ibge: string | null;
  ddd: string | null;
  source: string;
};

function onlyDigits(value: string | null | undefined) {
  return String(value || "").replace(/\D/g, "");
}

function getParam(request: Request) {
  const { searchParams } = new URL(request.url);

  return (
    searchParams.get("cep") ||
    searchParams.get("value") ||
    searchParams.get("q") ||
    searchParams.get("codigo") ||
    searchParams.get("postalCode") ||
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
  const timeout = setTimeout(() => controller.abort(), 9000);

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

function normalizeViaCep(data: any): CepResult {
  return {
    cep: data.cep || "",
    logradouro: data.logradouro || null,
    complemento: data.complemento || null,
    bairro: data.bairro || null,
    cidade: data.localidade || null,
    localidade: data.localidade || null,
    uf: data.uf || null,
    estado: data.estado || data.uf || null,
    ibge: data.ibge || null,
    ddd: data.ddd || null,
    source: "viacep",
  };
}

function normalizeBrasilApi(data: any): CepResult {
  return {
    cep: data.cep || "",
    logradouro: data.street || data.logradouro || null,
    complemento: data.complement || data.complemento || null,
    bairro: data.neighborhood || data.bairro || null,
    cidade: data.city || data.cidade || data.localidade || null,
    localidade: data.city || data.cidade || data.localidade || null,
    uf: data.state || data.uf || null,
    estado: data.state || data.uf || null,
    ibge: data.city_ibge || data.ibge || null,
    ddd: null,
    source: "brasilapi",
  };
}

export async function GET(request: Request) {
  const rawCep = getParam(request);
  const cep = onlyDigits(rawCep);

  if (!cep) {
    return json({
      ok: false,
      success: false,
      message: "Informe o CEP.",
      input: rawCep,
      endereco: null,
      data: null,
    });
  }

  if (cep.length !== 8) {
    return json({
      ok: false,
      success: false,
      message: "CEP inválido. Informe exatamente 8 dígitos.",
      input: rawCep,
      digits: cep,
      endereco: null,
      data: null,
    });
  }

  const errors: Array<Record<string, unknown>> = [];

  try {
    const viaCep = await fetchJson(`https://viacep.com.br/ws/${cep}/json/`);

    if (viaCep.ok && viaCep.data && !(viaCep.data as any).erro) {
      const normalized = normalizeViaCep(viaCep.data);

      return json({
        ok: true,
        success: true,
        message: "CEP encontrado.",
        source: "viacep",

        // Formato novo
        data: normalized,

        // Formato antigo esperado por possíveis formulários
        endereco: normalized,

        // Campos também no topo
        ...normalized,
      });
    }

    errors.push({
      source: "viacep",
      status: viaCep.status,
      data: viaCep.data,
    });
  } catch (error) {
    errors.push({
      source: "viacep",
      message: error instanceof Error ? error.message : "Erro no ViaCEP.",
    });
  }

  try {
    const brasilApi = await fetchJson(`https://brasilapi.com.br/api/cep/v2/${cep}`);

    if (brasilApi.ok && brasilApi.data) {
      const normalized = normalizeBrasilApi(brasilApi.data);

      return json({
        ok: true,
        success: true,
        message: "CEP encontrado.",
        source: "brasilapi",
        data: normalized,
        endereco: normalized,
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
    message: "CEP não encontrado nas fontes disponíveis.",
    input: rawCep,
    digits: cep,
    errors,
    endereco: null,
    data: null,
  });
}