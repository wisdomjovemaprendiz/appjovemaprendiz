"use client";

import type { ContratoPdfData, PdfHistoricoItem } from "@/data/rh/contrato-pdf.data";
import { registrarPdfContratoAction } from "@/actions/rh/pdf.actions";
import { FileDown, Printer, RotateCcw } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

function safe(value: string | number | null | undefined, fallback = "Não informado") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
  }).format(new Date(date));
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "Não informado";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDateTime(date: string | null | undefined) {
  if (!date) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function slug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function ContratoPdfClient({
  data,
  historico,
}: {
  data: ContratoPdfData;
  historico: PdfHistoricoItem[];
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const fileName = useMemo(() => {
    const aluno = slug(data.estagiario?.nome || "estagiario");
    const empresa = slug(
      data.empresa?.nome_fantasia || data.empresa?.razao_social || "empresa"
    );
    const date = new Date().toISOString().slice(0, 10);

    return `contrato-estagio-${aluno}-${empresa}-${date}.pdf`;
  }, [data]);

  function registrarEImprimir() {
    setMessage(null);

    const formData = new FormData();
    formData.set("contrato_id", data.contrato.id);
    formData.set("file_name", fileName);
    formData.set(
      "motivo",
      "Geração de PDF do contrato de estágio pela tela de contrato."
    );

    startTransition(async () => {
      const result = await registrarPdfContratoAction(formData);
      setMessage(result.message);

      if (result.ok) {
        setTimeout(() => {
          window.print();
        }, 300);
      }
    });
  }

  const estudanteEndereco = [
    data.estagiario?.endereco,
    data.estagiario?.bairro,
    data.estagiario?.cidade,
    data.estagiario?.estado,
  ]
    .filter(Boolean)
    .join(", ");

  const empresaEndereco = [
    data.empresa?.endereco,
    data.empresa?.bairro,
    data.empresa?.cidade,
    data.empresa?.estado,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-8">
      <div className="print:hidden rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-2xl font-black text-blue-950">
              Gerar PDF do contrato
            </h2>
            <p className="mt-2 leading-7 text-slate-600">
              Clique para registrar a emissão no histórico. Em seguida, o
              navegador abrirá a impressão. Escolha “Salvar como PDF”.
            </p>
            <p className="mt-2 text-sm font-black text-slate-500">
              Nome sugerido: {fileName}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={registrarEImprimir}
              disabled={isPending}
              className="btn-wisdom-red inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-black disabled:cursor-not-allowed disabled:opacity-70"
            >
              <FileDown className="h-5 w-5" />
              {isPending ? "Registrando..." : "Registrar e salvar PDF"}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="btn-wisdom-blue inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-black"
            >
              <Printer className="h-5 w-5" />
              Imprimir
            </button>
          </div>
        </div>

        {message ? (
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-black text-blue-800">
            {message}
          </div>
        ) : null}
      </div>

      <section className="print:hidden rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <RotateCcw className="h-7 w-7 text-blue-700" />
          <h2 className="text-2xl font-black text-blue-950">
            Histórico de emissões
          </h2>
        </div>

        {historico.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-5 text-center">
            <p className="font-black text-blue-950">
              Nenhum PDF registrado para este contrato ainda.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {historico.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <p className="font-black text-blue-950">
                  {safe(item.file_name, "Arquivo sem nome")}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Tipo: {safe(item.pdf_type)} • Status: {safe(item.status)}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Emissão: {formatDateTime(item.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <article className="mx-auto max-w-[900px] bg-white p-10 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        <div className="border-b-4 border-blue-900 pb-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <img
                src="/logo-wisdom.png"
                alt="Wisdom"
                className="h-20 w-auto object-contain"
              />
              <p className="mt-3 text-sm font-bold uppercase tracking-[0.18em] text-red-700">
                Termo de compromisso de estágio
              </p>
            </div>

            <div className="text-right text-sm font-bold text-slate-600">
              <p>Contrato: {safe(data.contrato.numero_contrato, data.contrato.id.slice(0, 8))}</p>
              <p>Versão: {safe(data.contrato.versao ?? 1)}</p>
              <p>Status: {safe(data.contrato.status)}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <h1 className="text-2xl font-black uppercase text-blue-950">
            Termo de Compromisso de Estágio
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Instrumento particular para formalização de estágio supervisionado.
          </p>
        </div>

        <section className="mt-8 space-y-5 text-justify text-[15px] leading-8 text-slate-800">
          <p>
            Pelo presente instrumento, as partes abaixo identificadas formalizam
            o presente Termo de Compromisso de Estágio, observando as
            informações cadastradas no sistema RH Wisdom e as condições descritas
            neste documento.
          </p>

          <div className="rounded-2xl border border-slate-200 p-5">
            <h2 className="mb-3 text-lg font-black text-blue-950">
              1. Empresa concedente
            </h2>
            <p>
              <strong>Razão social:</strong>{" "}
              {safe(data.empresa?.razao_social || data.empresa?.nome_fantasia)}
            </p>
            <p>
              <strong>CNPJ:</strong> {safe(data.empresa?.cnpj)}
            </p>
            <p>
              <strong>Endereço:</strong> {safe(empresaEndereco)}
            </p>
            <p>
              <strong>Responsável:</strong>{" "}
              {safe(data.empresa?.nome_responsavel)}
            </p>
            <p>
              <strong>Contato:</strong> {safe(data.empresa?.telefone)} •{" "}
              {safe(data.empresa?.email)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <h2 className="mb-3 text-lg font-black text-blue-950">
              2. Estagiário
            </h2>
            <p>
              <strong>Nome:</strong> {safe(data.estagiario?.nome)}
            </p>
            <p>
              <strong>Data de nascimento:</strong>{" "}
              {formatDate(data.estagiario?.data_nascimento)}
            </p>
            <p>
              <strong>CPF:</strong> {safe(data.estagiario?.cpf)} •{" "}
              <strong>RG:</strong> {safe(data.estagiario?.rg)}
            </p>
            <p>
              <strong>Telefone:</strong> {safe(data.estagiario?.telefone)} •{" "}
              <strong>E-mail:</strong> {safe(data.estagiario?.email)}
            </p>
            <p>
              <strong>Escola:</strong> {safe(data.estagiario?.escola)}
            </p>
            <p>
              <strong>Série/Ano:</strong> {safe(data.estagiario?.serie_ano)} •{" "}
              <strong>Turno:</strong> {safe(data.estagiario?.turno)}
            </p>
            <p>
              <strong>Endereço:</strong> {safe(estudanteEndereco)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <h2 className="mb-3 text-lg font-black text-blue-950">
              3. Instituição de ensino
            </h2>
            <p>
              <strong>Instituição:</strong>{" "}
              {safe(data.instituicao?.nome || data.estagiario?.escola)}
            </p>
            <p>
              <strong>CNPJ:</strong> {safe(data.instituicao?.cnpj)}
            </p>
            <p>
              <strong>Endereço:</strong> {safe(data.instituicao?.endereco)}
            </p>
            <p>
              <strong>Representante:</strong>{" "}
              {safe(data.instituicao?.representante)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <h2 className="mb-3 text-lg font-black text-blue-950">
              4. Condições do estágio
            </h2>
            <p>
              <strong>Vigência:</strong>{" "}
              {formatDate(data.contrato.data_inicio)} até{" "}
              {formatDate(data.contrato.data_fim)}
            </p>
            <p>
              <strong>Horário:</strong> {safe(data.contrato.horario)}
            </p>
            <p>
              <strong>Carga horária semanal:</strong>{" "}
              {safe(data.contrato.carga_horaria_semanal)}
            </p>
            <p>
              <strong>Bolsa-auxílio:</strong>{" "}
              {formatCurrency(data.contrato.bolsa_auxilio)}
            </p>
            <p>
              <strong>Auxílio transporte:</strong>{" "}
              {safe(data.contrato.auxilio_transporte)}
            </p>
            <p>
              <strong>Função:</strong> {safe(data.estagiario?.funcao)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <h2 className="mb-3 text-lg font-black text-blue-950">
              5. Atividades previstas
            </h2>
            <p>{safe(data.contrato.atividades)}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <h2 className="mb-3 text-lg font-black text-blue-950">
              6. Supervisão
            </h2>
            <p>
              <strong>Supervisor:</strong>{" "}
              {safe(data.contrato.supervisor_nome)}
            </p>
            <p>
              <strong>Cargo:</strong> {safe(data.contrato.supervisor_cargo)}
            </p>
            <p>
              <strong>E-mail:</strong> {safe(data.contrato.supervisor_email)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <h2 className="mb-3 text-lg font-black text-blue-950">
              7. Seguro contra acidentes pessoais
            </h2>
            <p>
              <strong>Apólice:</strong> {safe(data.contrato.apolice_numero)}
            </p>
            <p>
              <strong>Seguradora:</strong> {safe(data.contrato.seguradora)}
            </p>
            <p>
              <strong>Vencimento:</strong>{" "}
              {formatDate(data.contrato.data_vencimento_seguro)}
            </p>
          </div>

          <div className="space-y-4">
            <p>
              <strong>Cláusula primeira.</strong> O estágio tem finalidade
              educativa, sendo desenvolvido em ambiente de trabalho compatível
              com a formação escolar do estagiário.
            </p>

            <p>
              <strong>Cláusula segunda.</strong> A empresa concedente deverá
              proporcionar atividades supervisionadas, compatíveis com as
              condições previstas neste termo.
            </p>

            <p>
              <strong>Cláusula terceira.</strong> O estagiário compromete-se a
              cumprir os horários, normas internas, orientações do supervisor e
              atividades definidas neste documento.
            </p>

            <p>
              <strong>Cláusula quarta.</strong> Qualquer alteração relevante
              deverá ser registrada pelo RH Wisdom, mantendo histórico,
              justificativa e responsável pela alteração.
            </p>

            <p>
              <strong>Cláusula quinta.</strong> O presente documento deverá ser
              assinado pelas partes envolvidas e arquivado juntamente com os
              documentos obrigatórios do processo de estágio.
            </p>
          </div>

          {data.contrato.observacoes ? (
            <div className="rounded-2xl border border-slate-200 p-5">
              <h2 className="mb-3 text-lg font-black text-blue-950">
                Observações internas
              </h2>
              <p>{data.contrato.observacoes}</p>
            </div>
          ) : null}
        </section>

        <section className="mt-16 text-center text-[15px] text-slate-800">
          <p>
            Salvador/BA, ____ de __________________________ de ________.
          </p>

          <div className="mt-16 grid gap-12 md:grid-cols-2">
            <div>
              <div className="border-t border-slate-500 pt-3">
                Empresa concedente
              </div>
            </div>

            <div>
              <div className="border-t border-slate-500 pt-3">
                Estagiário
              </div>
            </div>

            <div>
              <div className="border-t border-slate-500 pt-3">
                Instituição de ensino
              </div>
            </div>

            <div>
              <div className="border-t border-slate-500 pt-3">
                RH Wisdom
              </div>
            </div>
          </div>
        </section>
      </article>
    </div>
  );
}