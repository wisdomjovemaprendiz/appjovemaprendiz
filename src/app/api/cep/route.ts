import { NextResponse } from "next/server";
import { onlyDigits } from "@/lib/brasil/validators";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cep = onlyDigits(searchParams.get("cep") ?? "");

  if (cep.length !== 8) {
    return NextResponse.json(
      { ok: false, message: "CEP inválido. Informe 8 dígitos." },
      { status: 400 }
    );
  }

  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json(
      { ok: false, message: "Não foi possível consultar o CEP." },
      { status: 502 }
    );
  }

  const data = await response.json();

  if (data.erro) {
    return NextResponse.json(
      { ok: false, message: "CEP não encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    endereco: {
      cep: data.cep,
      logradouro: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      estado: data.uf,
      complemento: data.complemento,
      ibge: data.ibge,
    },
  });
}
