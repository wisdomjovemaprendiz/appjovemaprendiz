import { NextResponse } from "next/server";
import { isValidCnpj, onlyDigits } from "@/lib/brasil/validators";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cnpj = onlyDigits(searchParams.get("cnpj") ?? "");

  if (!isValidCnpj(cnpj)) {
    return NextResponse.json(
      { ok: false, message: "CNPJ inválido." },
      { status: 400 }
    );
  }

  const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json(
      { ok: false, message: "Não foi possível consultar o CNPJ." },
      { status: 502 }
    );
  }

  const data = await response.json();

  const enderecoPartes = [
    data.descricao_tipo_logradouro,
    data.logradouro,
    data.numero,
    data.complemento,
  ].filter(Boolean);

  return NextResponse.json({
    ok: true,
    empresa: {
      cnpj: data.cnpj,
      razao_social: data.razao_social,
      nome_fantasia: data.nome_fantasia,
      email: data.email,
      telefone: data.ddd_telefone_1,
      ramo_atuacao: data.cnae_fiscal_descricao,
      endereco: enderecoPartes.join(" "),
      bairro: data.bairro,
      cidade: data.municipio,
      estado: data.uf,
      cep: data.cep,
      situacao_cadastral: data.descricao_situacao_cadastral,
    },
  });
}
