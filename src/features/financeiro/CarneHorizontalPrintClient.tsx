"use client";

import type {
  CarneHorizontalPdfData,
  CarneParcelaPdf,
} from "@/data/rh/carne-horizontal-pdf.data";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type PrintableItem =
  | { type: "cover" }
  | { type: "parcela"; parcela: CarneParcelaPdf }
  | { type: "blank" };

function chunk<T>(items: T[], size: number) {
  const result: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }

  return result;
}

function safeText(value: string | null | undefined, fallback = "") {
  return String(value || fallback).trim();
}

function LogoBox({
  src,
  alt,
  compact = false,
}: {
  src?: string | null;
  alt: string;
  compact?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={alt}
        className={compact ? "logo-compact" : "logo-normal"}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className={compact ? "logo-fallback-compact" : "logo-fallback"}>
      <span>W</span>
      <small>Wisdom</small>
    </div>
  );
}

function PrintStyles() {
  return (
    <style>{`
      .carne-root {
        min-height: 100vh;
        background: #e5e7eb;
        padding: 24px;
        color: #0f172a;
      }

      .carne-toolbar {
        max-width: 210mm;
        margin: 0 auto 18px auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      .a4-carne-page {
        width: 210mm;
        min-height: 297mm;
        box-sizing: border-box;
        margin: 0 auto 18px auto;
        background: #ffffff;
        padding: 5mm;
        box-shadow: 0 8px 30px rgba(15, 23, 42, 0.18);
        display: grid;
        grid-template-rows: repeat(4, 69.8mm);
        gap: 1.4mm;
        font-family: Arial, Helvetica, sans-serif;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .carne-strip {
        width: 200mm;
        height: 69.8mm;
        border: 1px solid #111827;
        box-sizing: border-box;
        display: grid;
        grid-template-columns: 43mm 157mm;
        overflow: hidden;
        background: #ffffff;
        page-break-inside: avoid;
      }

      .carne-stub {
        border-right: 1px dashed #1f2937;
        padding: 2mm;
        box-sizing: border-box;
        font-size: 6.8pt;
        display: grid;
        grid-template-rows: 14mm 10.5mm 15mm 1fr;
        gap: 1mm;
        min-width: 0;
        overflow: hidden;
      }

      .stub-header {
        display: grid;
        grid-template-columns: 16mm 1fr;
        gap: 2mm;
        align-items: center;
        min-width: 0;
      }

      .logo-normal {
        width: 18mm;
        max-width: 18mm;
        max-height: 12mm;
        object-fit: contain;
        display: block;
      }

      .logo-compact {
        width: 15mm;
        max-width: 15mm;
        max-height: 10mm;
        object-fit: contain;
        display: block;
      }

      .logo-fallback,
      .logo-fallback-compact {
        border-radius: 7px;
        background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 70%, #dc2626 100%);
        color: #ffffff;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .logo-fallback {
        width: 18mm;
        height: 12mm;
      }

      .logo-fallback-compact {
        width: 15mm;
        height: 10mm;
      }

      .logo-fallback span,
      .logo-fallback-compact span {
        font-size: 9pt;
        line-height: 1;
        font-weight: 900;
      }

      .logo-fallback small,
      .logo-fallback-compact small {
        font-size: 4.8pt;
        line-height: 1;
        margin-top: 1px;
        font-weight: 700;
      }

      .stub-title {
        font-size: 7.3pt;
        line-height: 1.05;
        font-weight: 900;
        text-transform: uppercase;
        word-break: break-word;
      }

      .stub-division {
        border-top: 1px solid #111827;
        padding-top: 0.9mm;
        min-width: 0;
        overflow: hidden;
      }

      .stub-label {
        font-size: 6.1pt;
        line-height: 1.05;
        color: #111827;
      }

      .stub-value {
        font-size: 10pt;
        line-height: 1.05;
        font-weight: 900;
        margin-top: 0.5mm;
        word-break: break-word;
      }

      .stub-code {
        font-family: "Courier New", monospace;
        font-size: 10pt;
        line-height: 1;
        letter-spacing: 0.02em;
        font-weight: 900;
        margin-top: 0.8mm;
        word-break: break-word;
      }

      .stub-mini {
        font-size: 5.8pt;
        line-height: 1.05;
        margin-top: 0.8mm;
        word-break: break-word;
      }

      .carne-main {
        display: grid;
        grid-template-columns: 115mm 42mm;
        height: 69.8mm;
        min-width: 0;
        overflow: hidden;
      }

      .carne-center {
        padding: 2mm 2.2mm;
        box-sizing: border-box;
        display: grid;
        grid-template-rows: 15.5mm 11.5mm 20mm 16.8mm;
        gap: 1mm;
        min-width: 0;
        overflow: hidden;
      }

      .cedente-line {
        display: grid;
        grid-template-columns: 19mm 1fr;
        gap: 1.8mm;
        align-items: start;
        min-width: 0;
        overflow: hidden;
      }

      .cedente-title {
        font-size: 8.8pt;
        font-weight: 900;
        line-height: 1;
        margin-bottom: 0.5mm;
      }

      .cedente-small {
        font-size: 6.25pt;
        line-height: 1.08;
        word-break: break-word;
        overflow-wrap: anywhere;
        overflow: hidden;
      }

      .mini-grid {
        display: grid;
        grid-template-columns: 1fr 23mm 31mm;
        border-top: 1px solid #111827;
        border-bottom: 1px solid #111827;
        min-width: 0;
        overflow: hidden;
      }

      .mini-cell {
        padding: 0.9mm 1mm;
        border-right: 1px solid #111827;
        text-align: center;
        font-size: 6.25pt;
        line-height: 1.05;
        min-width: 0;
        overflow: hidden;
      }

      .mini-cell:last-child {
        border-right: none;
      }

      .mini-cell strong {
        display: block;
        font-size: 8pt;
        line-height: 1.05;
        margin-top: 0.5mm;
        word-break: break-word;
      }

      .descricao-grid {
        display: grid;
        grid-template-columns: 1fr 24mm;
        gap: 1.4mm;
        min-width: 0;
        overflow: hidden;
        align-items: start;
      }

      .descricao-content {
        font-size: 6.35pt;
        line-height: 1.12;
        min-width: 0;
        overflow: hidden;
      }

      .descricao-content strong {
        font-weight: 900;
      }

      .descricao-limited {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        word-break: break-word;
        overflow-wrap: anywhere;
      }

      .instrucao-limited {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        word-break: break-word;
        overflow-wrap: anywhere;
      }

      .pix-text-inline {
        font-size: 5.9pt;
        line-height: 1.08;
        margin-top: 0.8mm;
        word-break: break-word;
        overflow-wrap: anywhere;
      }

      .qr-panel {
        width: 24mm;
        min-width: 24mm;
        height: 20mm;
        border: 1px solid #111827;
        background: #ffffff;
        display: grid;
        grid-template-rows: 1fr auto;
        align-items: center;
        justify-items: center;
        padding: 1mm;
        box-sizing: border-box;
        overflow: hidden;
      }

      .qr-frame {
        width: 18mm;
        height: 18mm;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .qr {
        width: 18mm;
        height: 18mm;
        object-fit: contain;
        display: block;
      }

      .qr-caption {
        font-size: 5.1pt;
        line-height: 1;
        text-align: center;
        margin-top: 0.2mm;
      }

      .qr-placeholder {
        width: 18mm;
        height: 18mm;
        border: 1px dashed #94a3b8;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 4.8pt;
        text-align: center;
        color: #64748b;
        padding: 1mm;
        box-sizing: border-box;
      }

      .sacado-box {
        border-top: 1px solid #111827;
        padding-top: 0.9mm;
        font-size: 5.9pt;
        line-height: 1.06;
        min-width: 0;
        overflow: hidden;
        display: grid;
        grid-template-rows: auto 1fr auto;
        padding-bottom: 1.1mm;
      }

      .sacado-box strong {
        display: block;
        font-size: 7pt;
        line-height: 1.05;
        margin-bottom: 0.3mm;
      }

      .sacado-limited {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        word-break: break-word;
        overflow-wrap: anywhere;
      }

      .control-pill {
        display: inline-block;
        border: 1px solid #111827;
        padding: 0.5mm 1.2mm;
        font-family: "Courier New", monospace;
        font-size: 6.9pt;
        line-height: 1;
        font-weight: 900;
        letter-spacing: 0.02em;
        margin-top: 0.4mm;
        background: #f8fafc;
        align-self: end;
        width: max-content;
        max-width: 100%;
      }

      .carne-values {
        border-left: 1px solid #111827;
        display: grid;
        grid-template-rows: 12mm 12mm 12mm 10mm 23.8mm;
        font-size: 6.5pt;
        min-width: 0;
        overflow: hidden;
      }

      .value-cell {
        border-bottom: 1px solid #111827;
        padding: 1mm 1.1mm;
        box-sizing: border-box;
        min-width: 0;
        overflow: hidden;
      }

      .value-cell:last-child {
        border-bottom: none;
      }

      .value-label {
        font-size: 5.9pt;
        line-height: 1.05;
        white-space: nowrap;
      }

      .value-strong {
        display: block;
        text-align: right;
        font-size: 8.6pt;
        line-height: 1.05;
        font-weight: 900;
        margin-top: 0.55mm;
        word-break: break-word;
      }

      .value-strong-main {
        font-size: 9.3pt;
      }

      .final-lines {
        display: grid;
        gap: 1mm;
      }

      .final-total {
        margin-top: 0.8mm;
        border-top: 1px solid #e5e7eb;
        padding-top: 0.8mm;
      }

      .payment-date {
        font-size: 5.9pt;
        line-height: 1.05;
        margin-top: 1.6mm;
        white-space: nowrap;
      }

      .cover-strip {
        background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      }

      .cover-main {
        padding: 0;
        display: grid;
        grid-template-columns: 115mm 42mm;
        min-width: 0;
        overflow: hidden;
      }

      .cover-content {
        padding: 0;
        display: grid;
        grid-template-rows: 18mm 51.8mm;
        min-width: 0;
        overflow: hidden;
      }

      .cover-banner {
        background: linear-gradient(90deg, #1e3a8a 0%, #2563eb 55%, #dc2626 100%);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 4mm;
        box-sizing: border-box;
      }

      .cover-banner-title {
        font-size: 14.5pt;
        font-weight: 900;
        letter-spacing: 0.03em;
        line-height: 1;
      }

      .cover-banner-sub {
        font-size: 6.5pt;
        line-height: 1.15;
        opacity: 0.95;
        text-align: right;
      }

      .cover-body {
        padding: 3mm;
        box-sizing: border-box;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 3mm;
        min-width: 0;
        overflow: hidden;
      }

      .cover-card {
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 2.2mm;
        background: #ffffff;
        min-width: 0;
        overflow: hidden;
      }

      .cover-card-title {
        font-size: 7.2pt;
        font-weight: 900;
        text-transform: uppercase;
        color: #1e3a8a;
        margin-bottom: 0.8mm;
      }

      .cover-card-text {
        font-size: 6.25pt;
        line-height: 1.15;
        word-break: break-word;
        overflow-wrap: anywhere;
      }

      .cover-card-text strong {
        font-weight: 900;
      }

      .cover-code {
        margin-top: 1.3mm;
        display: inline-block;
        border: 1px solid #111827;
        padding: 0.9mm 2mm;
        font-family: "Courier New", monospace;
        font-size: 9.8pt;
        font-weight: 900;
        background: #f8fafc;
      }

      .cover-side {
        border-left: 1px solid #111827;
        padding: 2.5mm 2.4mm;
        font-size: 6.25pt;
        line-height: 1.15;
        background: #f8fafc;
        overflow: hidden;
      }

      .cover-side strong {
        display: block;
        font-size: 7pt;
        color: #1e3a8a;
        margin-bottom: 0.8mm;
      }

      .blank-strip {
        border: 1px dashed #d1d5db;
        color: transparent;
        background: #ffffff;
      }

      @media print {
        @page {
          size: A4 portrait;
          margin: 0;
        }

        html,
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
        }

        aside,
        nav,
        header,
        footer,
        .no-print,
        .carne-toolbar {
          display: none !important;
        }

        [class*="xl:pl-72"] {
          padding-left: 0 !important;
        }

        main,
        .carne-root {
          background: white !important;
          margin: 0 !important;
          padding: 0 !important;
          min-height: auto !important;
        }

        .a4-carne-page {
          width: 210mm !important;
          height: 297mm !important;
          min-height: 297mm !important;
          margin: 0 !important;
          padding: 5mm !important;
          box-shadow: none !important;
          page-break-after: always;
        }

        .a4-carne-page:last-child {
          page-break-after: auto;
        }

        .carne-strip {
          break-inside: avoid;
          page-break-inside: avoid;
        }
      }
    `}</style>
  );
}

function QrCodeBox({ url }: { url?: string | null }) {
  const imageUrl = safeText(url);

  return (
    <div className="qr-panel">
      <div className="qr-frame">
        {imageUrl ? (
          <img src={imageUrl} alt="QR Code Pix" className="qr" />
        ) : (
          <div className="qr-placeholder">QR Code<br />não configurado</div>
        )}
      </div>
      <div className="qr-caption">QR Code Pix</div>
    </div>
  );
}

function CoverStrip({ data }: { data: CarneHorizontalPdfData }) {
  return (
    <div className="carne-strip cover-strip">
      <div className="carne-stub">
        <div className="stub-header">
          <LogoBox src={data.cedente.logo_url} alt="Wisdom" compact />
          <div className="stub-title">Capa do carnê</div>
        </div>

        <div className="stub-division">
          <div className="stub-label">Código do carnê</div>
          <div className="stub-code">{safeText(data.carne.codigo)}</div>
        </div>

        <div className="stub-division">
          <div className="stub-label">Parcelas</div>
          <div className="stub-value">{safeText(String(data.carne.quantidade_parcelas))}</div>
        </div>

        <div className="stub-division">
          <div className="stub-label">Valor total</div>
          <div className="stub-value">{safeText(data.carne.valor_total)}</div>
        </div>
      </div>

      <div className="cover-main">
        <div className="cover-content">
          <div className="cover-banner">
            <div className="cover-banner-title">CARNÊ DE PAGAMENTO</div>
            <div className="cover-banner-sub">
              RH Wisdom<br />
              Controle financeiro
            </div>
          </div>

          <div className="cover-body">
            <div className="cover-card">
              <div className="cover-card-title">Cedente</div>
              <div className="cover-card-text">
                <strong>{safeText(data.cedente.razao_social || data.cedente.nome)}</strong>
                <br />
                CNPJ: {safeText(data.cedente.cnpj)}
                <br />
                {safeText(data.cedente.endereco)}
                <br />
                {safeText(data.cedente.telefone)} {safeText(data.cedente.email)}
              </div>

              <div className="cover-code">{safeText(data.carne.codigo)}</div>
            </div>

            <div className="cover-card">
              <div className="cover-card-title">Sacado</div>
              <div className="cover-card-text">
                <strong>{safeText(data.sacado.razao_social || data.sacado.nome)}</strong>
                <br />
                CNPJ: {safeText(data.sacado.cnpj)}
                <br />
                {safeText(data.sacado.endereco)}
                <br />
                {safeText(data.sacado.telefone)} {safeText(data.sacado.email)}
              </div>
            </div>
          </div>
        </div>

        <div className="cover-side">
          <strong>Orientações</strong>
          Destaque e entregue as parcelas conforme o vencimento.
          <br />
          <br />
          Para registrar a baixa no sistema, use o código curto impresso em cada parcela.
          <br />
          <br />
          Emissão: {safeText(data.carne.data_emissao)}
          <br />
          Quantidade: {safeText(String(data.carne.quantidade_parcelas))} parcela(s)
          <br />
          Total: {safeText(data.carne.valor_total)}
        </div>
      </div>
    </div>
  );
}

function ParcelaStrip({
  data,
  parcela,
}: {
  data: CarneHorizontalPdfData;
  parcela: CarneParcelaPdf;
}) {
  return (
    <div className="carne-strip">
      <div className="carne-stub">
        <div className="stub-header">
          <LogoBox src={data.cedente.logo_url} alt="Wisdom" compact />
          <div className="stub-title">
            Parcela
            <br />
            {parcela.parcela_numero}/{parcela.total_parcelas}
          </div>
        </div>

        <div className="stub-division">
          <div className="stub-label">Vencimento</div>
          <div className="stub-value">{safeText(parcela.vencimento)}</div>
        </div>

        <div className="stub-division">
          <div className="stub-label">Código para baixa</div>
          <div className="stub-code">{safeText(parcela.codigo_curto)}</div>
          <div className="stub-mini">Documento: {safeText(parcela.codigo_curto)}</div>
        </div>

        <div className="stub-division">
          <div className="stub-label">( = ) Valor do Documento</div>
          <div className="stub-value">{safeText(parcela.valor)}</div>
        </div>
      </div>

      <div className="carne-main">
        <div className="carne-center">
          <div className="cedente-line">
            <LogoBox src={data.cedente.logo_url} alt="Wisdom" />
            <div className="cedente-small">
              <div className="cedente-title">Cedente</div>
              <strong>{safeText(data.cedente.razao_social || data.cedente.nome)}</strong>
              <br />
              CNPJ {safeText(data.cedente.cnpj)}
              <br />
              {safeText(data.cedente.endereco)}
              <br />
              {safeText(data.cedente.telefone)} {safeText(data.cedente.email)}
            </div>
          </div>

          <div className="mini-grid">
            <div className="mini-cell">
              Documento
              <strong>{safeText(parcela.codigo_curto)}</strong>
            </div>

            <div className="mini-cell">
              Espécie
              <strong>R$</strong>
            </div>

            <div className="mini-cell">
              Processamento
              <strong>{safeText(data.carne.data_emissao)}</strong>
            </div>
          </div>

          <div className="descricao-grid">
            <div className="descricao-content">
              <div className="descricao-limited">
                <strong>Descrição:</strong> {safeText(parcela.descricao)}
              </div>

              <div className="instrucao-limited">
                <strong>Instruções:</strong> {safeText(parcela.instrucoes)}
              </div>

              <div className="pix-text-inline">
                {safeText(data.pix.chave) ? (
                  <>
                    <strong>PIX:</strong> {safeText(data.pix.chave)}
                    <br />
                    <strong>Recebedor:</strong> {safeText(data.pix.recebedor_nome)}
                  </>
                ) : (
                  <strong>Pagamento conforme orientação do RH Wisdom.</strong>
                )}
              </div>
            </div>

            <QrCodeBox url={data.pix.qrcode_url} />
          </div>

          <div className="sacado-box">
            <strong>Sacado</strong>
            <div className="sacado-limited">
              {safeText(data.sacado.razao_social || data.sacado.nome)} - CNPJ {safeText(data.sacado.cnpj)}
              <br />
              {safeText(data.sacado.endereco)}
            </div>

            <div className="control-pill">BAIXA: {safeText(parcela.codigo_curto)}</div>
          </div>
        </div>

        <div className="carne-values">
          <div className="value-cell">
            <div className="value-label">Parcela</div>
            <span className="value-strong">
              {parcela.parcela_numero}/{parcela.total_parcelas}
            </span>
          </div>

          <div className="value-cell">
            <div className="value-label">Vencimento</div>
            <span className="value-strong">{safeText(parcela.vencimento)}</span>
          </div>

          <div className="value-cell">
            <div className="value-label">( = ) Valor do Documento</div>
            <span className="value-strong value-strong-main">{safeText(parcela.valor)}</span>
          </div>

          <div className="value-cell">
            <div className="value-label">( - ) Descontos</div>
            <span className="value-strong">{safeText(parcela.desconto)}</span>
          </div>

          <div className="value-cell">
            <div className="final-lines">
              <div>
                <div className="value-label">( + ) Acréscimos</div>
                <span className="value-strong">{safeText(parcela.acrescimos)}</span>
              </div>

              <div className="final-total">
                <div className="value-label">( = ) Total Cobrado</div>
                <span className="value-strong value-strong-main">{safeText(parcela.total_cobrado)}</span>
              </div>

              <div className="payment-date">
                Data Pagamento: {safeText(parcela.data_pagamento)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlankStrip() {
  return <div className="carne-strip blank-strip">.</div>;
}

export function CarneHorizontalPrintClient({
  data,
}: {
  data: CarneHorizontalPdfData;
}) {
  const printableItems: PrintableItem[] = [
    { type: "cover" },
    ...data.parcelas.map((parcela) => ({
      type: "parcela" as const,
      parcela,
    })),
  ];

  const pages = chunk<PrintableItem>(printableItems, 4);

  return (
    <main className="carne-root">
      <PrintStyles />

      <div className="carne-toolbar no-print">
        <Link
          href="/rh/financeiro"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-blue-950 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <button
          type="button"
          onClick={() => window.print()}
          className="btn-wisdom-red inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black"
        >
          <Printer className="h-4 w-4" />
          Imprimir carnê
        </button>
      </div>

      {pages.map((page, pageIndex) => {
        const slots: PrintableItem[] = [...page];

        while (slots.length < 4) {
          slots.push({ type: "blank" });
        }

        return (
          <section key={pageIndex} className="a4-carne-page">
            {slots.map((item, index) => {
              if (item.type === "cover") {
                return <CoverStrip key={`cover-${pageIndex}-${index}`} data={data} />;
              }

              if (item.type === "parcela") {
                return (
                  <ParcelaStrip
                    key={item.parcela.id}
                    data={data}
                    parcela={item.parcela}
                  />
                );
              }

              return <BlankStrip key={`blank-${pageIndex}-${index}`} />;
            })}
          </section>
        );
      })}
    </main>
  );
}