"use client";

import { registrarPdfCarneAction } from "@/actions/rh/carne-pdf.actions";
import type {
  CarnePdfData,
  CarnePdfHistoricoItem,
  CarnePdfParcela,
} from "@/data/rh/carne-pdf.data";
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

function formatDateTime(date: string | null | undefined) {
  if (!date) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function formatCurrency(value: number | null | undefined) {
  const parsed = Number(value ?? 0);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(parsed) ? parsed : 0);
}

function slug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function chunk<T>(items: T[], size: number) {
  const result: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }

  return result;
}

function getQrCodeUrl(data: CarnePdfData) {
  return data.settings.pix_qrcode_url || "";
}

function getEmpresaNome(data: CarnePdfData) {
  return (
    data.empresa?.nome_fantasia ||
    data.empresa?.razao_social ||
    "Empresa não informada"
  );
}

function getEmpresaEndereco(data: CarnePdfData) {
  return [
    data.empresa?.endereco,
    data.empresa?.bairro,
    data.empresa?.cidade,
    data.empresa?.estado,
  ]
    .filter(Boolean)
    .join(", ");
}

function valorPagamentoEmDia(parcela: CarnePdfParcela) {
  if (parcela.valor_com_desconto && parcela.valor_com_desconto > 0) {
    return parcela.valor_com_desconto;
  }

  return parcela.valor;
}

function Coupon({
  data,
  parcela,
}: {
  data: CarnePdfData;
  parcela: CarnePdfParcela;
}) {
  const qrUrl = getQrCodeUrl(data);

  return (
    <div className="coupon">
      <div className="couponCutTop" />
      <div className="couponHeader">
        <img src="/logo-wisdom.png" alt="Wisdom" className="couponLogo" />
        <div className="couponTitleBlock">
          <p className="couponTitle">Carnê de pagamento</p>
          <p className="couponSubtitle">
            Parcela {safe(parcela.parcela_numero)} de {safe(parcela.total_parcelas)}
          </p>
        </div>
      </div>

      <div className="couponControl">
        <span>Controle</span>
        <strong>{safe(parcela.numero_controle)}</strong>
      </div>

      <div className="couponGrid">
        <div>
          <span>Empresa</span>
          <strong>{getEmpresaNome(data)}</strong>
        </div>

        <div>
          <span>CNPJ</span>
          <strong>{safe(data.empresa?.cnpj)}</strong>
        </div>

        <div>
          <span>Competência</span>
          <strong>{safe(parcela.competencia)}</strong>
        </div>

        <div>
          <span>Vencimento</span>
          <strong>{formatDate(parcela.vencimento)}</strong>
        </div>

        <div>
          <span>Valor</span>
          <strong>{formatCurrency(parcela.valor)}</strong>
        </div>

        <div>
          <span>Em dia</span>
          <strong>{formatCurrency(valorPagamentoEmDia(parcela))}</strong>
        </div>
      </div>

      <div className="couponPayment">
        <div className="couponInstructions">
          <p className="sectionMiniTitle">Instruções</p>
          <p>{parcela.instrucoes_pagamento || data.carne.instrucoes_pagamento || data.settings.instrucoes_pagamento_padrao}</p>

          {data.settings.pix_chave ? (
            <p className="pixLine">
              <strong>Pix:</strong> {data.settings.pix_chave}
            </p>
          ) : null}

          {data.settings.pix_recebedor_nome ? (
            <p className="pixLine">
              <strong>Recebedor:</strong> {data.settings.pix_recebedor_nome}
            </p>
          ) : null}
        </div>

        <div className="couponQr">
          {qrUrl ? (
            <img src={qrUrl} alt="QR Code Pix" />
          ) : (
            <div className="qrPlaceholder">QR Code Pix</div>
          )}
        </div>
      </div>

      <div className="couponFooter">
        <div>
          <span>Data do pagamento</span>
          <strong>____/____/______</strong>
        </div>
        <div>
          <span>Assinatura/baixa</span>
          <strong>________________________</strong>
        </div>
      </div>
    </div>
  );
}

export function CarnePdfClient({
  data,
  historico,
}: {
  data: CarnePdfData;
  historico: CarnePdfHistoricoItem[];
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const parcelasPorPagina = useMemo(() => chunk(data.parcelas, 4), [data.parcelas]);

  const fileName = useMemo(() => {
    const empresa = slug(getEmpresaNome(data));
    const date = new Date().toISOString().slice(0, 10);
    return `carne-${empresa}-${date}.pdf`;
  }, [data]);

  const valorTotal = data.parcelas.reduce(
    (total, parcela) => total + Number(parcela.valor ?? 0),
    0
  );

  const primeiroVencimento = data.parcelas[0]?.vencimento || data.carne.vencimento_primeira;
  const ultimoVencimento = data.parcelas[data.parcelas.length - 1]?.vencimento || null;

  function registrarEImprimir() {
    setMessage(null);

    const formData = new FormData();
    formData.set("carne_id", data.carne.id);
    formData.set("file_name", fileName);
    formData.set("motivo", "Emissão de PDF de carnê.");

    startTransition(async () => {
      const result = await registrarPdfCarneAction(formData);
      setMessage(result.message);

      if (result.ok) {
        setTimeout(() => {
          window.print();
        }, 300);
      }
    });
  }

  return (
    <div className="space-y-8">
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .rh-print-shell {
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: white !important;
          }

          @page {
            size: A4;
            margin: 10mm;
          }

          .bookletCover,
          .couponPage {
            break-after: page;
            page-break-after: always;
          }

          .couponPage:last-child {
            break-after: auto;
            page-break-after: auto;
          }
        }

        .bookletCover {
          min-height: 277mm;
          background: white;
          color: #0f172a;
          padding: 20mm;
          border: 1px solid #e2e8f0;
        }

        .coverTop {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          align-items: flex-start;
          border-bottom: 4px solid #1e3a8a;
          padding-bottom: 22px;
        }

        .coverLogo {
          height: 82px;
          width: auto;
          object-fit: contain;
        }

        .coverStamp {
          text-align: right;
          font-size: 12px;
          font-weight: 800;
          color: #475569;
        }

        .coverTitle {
          margin-top: 42px;
          text-align: center;
        }

        .coverTitle h1 {
          font-size: 34px;
          font-weight: 900;
          text-transform: uppercase;
          color: #172554;
          margin: 0;
        }

        .coverTitle p {
          margin-top: 8px;
          color: #64748b;
          font-weight: 700;
        }

        .coverInfoGrid {
          margin-top: 36px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .coverInfoBox {
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 16px;
          background: #f8fafc;
        }

        .coverInfoBox span,
        .couponGrid span,
        .couponFooter span,
        .couponControl span {
          display: block;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #64748b;
          font-weight: 900;
          margin-bottom: 3px;
        }

        .coverInfoBox strong {
          display: block;
          font-size: 14px;
          color: #0f172a;
          font-weight: 900;
          line-height: 1.45;
        }

        .coverInstructions {
          margin-top: 28px;
          border: 1px solid #dbeafe;
          background: #eff6ff;
          border-radius: 22px;
          padding: 18px;
          color: #334155;
          line-height: 1.6;
          font-size: 13px;
          font-weight: 650;
        }

        .coverSignature {
          margin-top: 56px;
          text-align: center;
          color: #334155;
          font-size: 13px;
          font-weight: 700;
        }

        .coverSignatureLine {
          margin: 48px auto 0;
          max-width: 360px;
          border-top: 1px solid #334155;
          padding-top: 10px;
        }

        .couponPage {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          grid-template-rows: repeat(2, minmax(0, 1fr));
          gap: 7mm;
          min-height: 277mm;
          background: white;
        }

        .coupon {
          position: relative;
          border: 1.5px dashed #94a3b8;
          border-radius: 12px;
          padding: 10px;
          min-height: 132mm;
          display: flex;
          flex-direction: column;
          background: white;
          overflow: hidden;
        }

        .couponCutTop {
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: 12px;
          background:
            linear-gradient(90deg, transparent 0, transparent 49%, #cbd5e1 49%, #cbd5e1 51%, transparent 51%),
            linear-gradient(0deg, transparent 0, transparent 49%, #cbd5e1 49%, #cbd5e1 51%, transparent 51%);
          opacity: 0.12;
        }

        .couponHeader {
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 2px solid #1e3a8a;
          padding-bottom: 8px;
          position: relative;
        }

        .couponLogo {
          width: 78px;
          height: 42px;
          object-fit: contain;
        }

        .couponTitleBlock {
          flex: 1;
        }

        .couponTitle {
          margin: 0;
          color: #172554;
          font-weight: 900;
          font-size: 15px;
          text-transform: uppercase;
        }

        .couponSubtitle {
          margin: 2px 0 0;
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
        }

        .couponControl {
          margin-top: 8px;
          border-radius: 10px;
          background: #172554;
          color: white;
          padding: 8px 10px;
        }

        .couponControl span {
          color: #bfdbfe;
          margin-bottom: 2px;
        }

        .couponControl strong {
          display: block;
          font-size: 13px;
          letter-spacing: 0.04em;
        }

        .couponGrid {
          margin-top: 9px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 7px;
        }

        .couponGrid div {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 7px;
          background: #f8fafc;
          min-height: 47px;
        }

        .couponGrid strong {
          display: block;
          color: #0f172a;
          font-size: 11px;
          font-weight: 900;
          line-height: 1.28;
        }

        .couponPayment {
          margin-top: 8px;
          display: grid;
          grid-template-columns: 1fr 92px;
          gap: 8px;
          align-items: stretch;
        }

        .couponInstructions {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 8px;
          background: white;
          color: #334155;
          font-size: 9.5px;
          line-height: 1.38;
          font-weight: 650;
          min-height: 93px;
        }

        .sectionMiniTitle {
          margin: 0 0 4px;
          color: #172554;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .pixLine {
          margin: 4px 0 0;
        }

        .couponQr {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          min-height: 93px;
        }

        .couponQr img {
          width: 80px;
          height: 80px;
          object-fit: contain;
        }

        .qrPlaceholder {
          width: 80px;
          height: 80px;
          border: 1px dashed #94a3b8;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #64748b;
          font-size: 10px;
          font-weight: 900;
        }

        .couponFooter {
          margin-top: auto;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          padding-top: 9px;
        }

        .couponFooter div {
          border-top: 1px solid #cbd5e1;
          padding-top: 5px;
        }

        .couponFooter strong {
          display: block;
          font-size: 10px;
          color: #0f172a;
          font-weight: 800;
        }
      `}</style>

      <div className="print:hidden rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-2xl font-black text-blue-950">
              PDF do carnê
            </h2>
            <p className="mt-2 leading-7 text-slate-600">
              A página possui capa e folhas preparadas para impressão, corte e entrega.
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
              {isPending ? "Registrando..." : "Registrar e imprimir"}
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
              Nenhuma emissão registrada para este carnê.
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

      <div className="rh-print-shell mx-auto max-w-[900px] space-y-8 rounded-3xl bg-white p-4 shadow-sm print:max-w-none print:p-0">
        <section className="bookletCover">
          <div className="coverTop">
            <div>
              <img src="/logo-wisdom.png" alt="Wisdom" className="coverLogo" />
            </div>

            <div className="coverStamp">
              <p>Controle financeiro</p>
              <p>Emissão: {formatDate(new Date().toISOString().slice(0, 10))}</p>
              <p>Carnê: {data.carne.id.slice(0, 8)}</p>
            </div>
          </div>

          <div className="coverTitle">
            <h1>{data.carne.titulo || "Carnê de mensalidades"}</h1>
            <p>{data.carne.descricao || "Mensalidade de estágio"}</p>
          </div>

          <div className="coverInfoGrid">
            <div className="coverInfoBox">
              <span>Empresa</span>
              <strong>{getEmpresaNome(data)}</strong>
            </div>

            <div className="coverInfoBox">
              <span>CNPJ</span>
              <strong>{safe(data.empresa?.cnpj)}</strong>
            </div>

            <div className="coverInfoBox">
              <span>Responsável</span>
              <strong>{safe(data.empresa?.nome_responsavel)}</strong>
            </div>

            <div className="coverInfoBox">
              <span>Contato</span>
              <strong>
                {safe(data.empresa?.telefone)} • {safe(data.empresa?.email)}
              </strong>
            </div>

            <div className="coverInfoBox">
              <span>Endereço</span>
              <strong>{safe(getEmpresaEndereco(data))}</strong>
            </div>

            <div className="coverInfoBox">
              <span>Parcelas</span>
              <strong>
                {data.parcelas.length} parcela(s) • Total {formatCurrency(valorTotal)}
              </strong>
            </div>

            <div className="coverInfoBox">
              <span>Primeiro vencimento</span>
              <strong>{formatDate(primeiroVencimento)}</strong>
            </div>

            <div className="coverInfoBox">
              <span>Último vencimento</span>
              <strong>{formatDate(ultimoVencimento)}</strong>
            </div>
          </div>

          <div className="coverInstructions">
            <strong>Instruções de pagamento:</strong>
            <p>
              {data.carne.instrucoes_pagamento ||
                data.settings.instrucoes_pagamento_padrao ||
                "Efetuar o pagamento até a data de vencimento e enviar o comprovante para baixa."}
            </p>

            {data.settings.pix_chave ? (
              <p>
                <strong>Chave Pix:</strong> {data.settings.pix_chave}
              </p>
            ) : null}

            {data.settings.pix_recebedor_nome ? (
              <p>
                <strong>Recebedor:</strong> {data.settings.pix_recebedor_nome}
              </p>
            ) : null}

            {data.settings.pix_observacoes ? (
              <p>
                <strong>Observações:</strong> {data.settings.pix_observacoes}
              </p>
            ) : null}
          </div>

          <div className="coverSignature">
            <p>Salvador/BA, ____ de __________________________ de ________.</p>
            <div className="coverSignatureLine">Responsável financeiro</div>
          </div>
        </section>

        {parcelasPorPagina.map((page, pageIndex) => (
          <section key={pageIndex} className="couponPage">
            {page.map((parcela) => (
              <Coupon key={parcela.id} data={data} parcela={parcela} />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}