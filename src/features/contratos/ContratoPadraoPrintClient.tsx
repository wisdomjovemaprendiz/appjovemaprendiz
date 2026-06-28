"use client";

import type { ContratoPadraoData } from "@/data/rh/contrato-padrao.data";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";

function Field({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string | null | undefined;
  className?: string;
}) {
  return (
    <span className={className}>
      <strong>{label}</strong> {value || ""}
    </span>
  );
}

function ContractStyles() {
  return (
    <style>{`
      .contract-print-root {
        background: #e5e7eb;
        min-height: 100vh;
        padding: 24px;
      }

      .contract-toolbar {
        max-width: 210mm;
        margin: 0 auto 18px auto;
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
      }

      .contract-paper {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto 18px auto;
        background: white;
        color: #000;
        box-shadow: 0 8px 30px rgba(15, 23, 42, 0.18);
        padding: 14mm 15mm;
        box-sizing: border-box;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 10pt;
        line-height: 1.12;
        position: relative;
        overflow: hidden;
      }

      .contract-header {
        display: grid;
        grid-template-columns: 1fr 58mm;
        align-items: start;
        gap: 12mm;
      }

      .contract-title {
        margin-top: 8mm;
      }

      .contract-title h1 {
        font-size: 16pt;
        line-height: 1.1;
        margin: 0;
        font-weight: 700;
      }

      .contract-title p {
        margin: 1mm 0 0 28mm;
        font-size: 10pt;
      }

      .contract-logo {
        width: 55mm;
        max-height: 26mm;
        object-fit: contain;
        justify-self: end;
      }

      .contract-block {
        margin-top: 4.2mm;
      }

      .contract-block p,
      .contract-text p {
        margin: 0 0 1.15mm 0;
        text-align: justify;
      }

      .contract-text {
        margin-top: 4mm;
      }

      .contract-text p {
        text-align: justify;
      }

      .contract-clause-title {
        font-size: 12pt;
        font-weight: 400;
        letter-spacing: 0.01em;
      }

      .contract-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4mm;
      }

      .contract-row-3 {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 4mm;
      }

      .contract-row-student {
        display: grid;
        grid-template-columns: 1.1fr 1fr;
        gap: 4mm;
      }

      .contract-student-course {
        display: grid;
        grid-template-columns: 1fr 1fr 1.2fr;
        gap: 4mm;
      }

      .signature-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 6mm;
        font-size: 10pt;
      }

      .signature-table td {
        border: 1px solid #333;
        vertical-align: top;
        padding: 1.5mm 2mm;
        width: 50%;
        height: 19mm;
      }

      .signature-table .short {
        height: 16mm;
      }

      .signature-table .agent {
        height: 18mm;
        position: relative;
      }

      .signature-title {
        font-weight: 700;
        font-size: 10.5pt;
      }

      .signature-line {
        margin-top: 2mm;
        white-space: nowrap;
      }

      .agent-signature {
        position: absolute;
        right: 18mm;
        bottom: -3mm;
        max-width: 40mm;
        max-height: 18mm;
        object-fit: contain;
      }

      .print-break {
        page-break-after: always;
      }

      @media print {
        @page {
          size: A4;
          margin: 14mm 15mm;
        }

        html,
        body {
          background: white !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        aside,
        nav,
        header,
        footer,
        .no-print,
        .contract-toolbar {
          display: none !important;
        }

        [class*="xl:pl-72"] {
          padding-left: 0 !important;
        }

        main,
        .contract-print-root {
          background: white !important;
          padding: 0 !important;
          margin: 0 !important;
          min-height: auto !important;
        }

        .contract-paper {
          width: auto !important;
          min-height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          overflow: visible !important;
          page-break-after: always;
        }

        .contract-paper:last-child {
          page-break-after: auto;
        }

        a {
          color: inherit !important;
          text-decoration: none !important;
        }
      }
    `}</style>
  );
}

function PageOne({ data }: { data: ContratoPadraoData }) {
  return (
    <section className="contract-paper">
      <div className="contract-header">
        <div className="contract-title">
          <h1>Termo de Compromisso de Estágio</h1>
          <p>(De acordo com o disposto na Lei nº 11.788/08</p>
        </div>

        <img
          src={data.agente.logo_url}
          alt="Wisdom Jovem Aprendiz"
          className="contract-logo"
        />
      </div>

      <div className="contract-block">
        <p>Neste ato, as partes a seguir nomeadas:</p>

        <p>
          <Field label="Instituição de Ensino:" value={data.instituicao.nome} />
        </p>

        <p>
          <Field label="Endereço:" value={data.instituicao.endereco} />
          {"   "}
          <Field label="BAIRRO:" value={data.instituicao.bairro} />
        </p>

        <p>
          <Field label="CNPJ/MF:" value={data.instituicao.cnpj} />
        </p>

        <p>
          <Field label="Inscrição Estadual:" value={data.instituicao.inscricao_estadual} />
        </p>

        <p>
          <Field label="Representante legal:" value={data.instituicao.representante} />
          {"   "}
          <Field label="Cargo:" value={data.instituicao.cargo} />
        </p>
      </div>

      <div className="contract-block">
        <p>
          <Field label="Concedente:" value={data.empresa.razao_social} />
        </p>

        <p>
          <Field label="Endereço:" value={data.empresa.endereco} />
          {"   "}
          <Field label="BAIRRO:" value={data.empresa.bairro} />
        </p>

        <p>
          <Field label="CIDADE:" value={data.empresa.cidade} />
          {"                         "}
          <Field label="ESTADO:" value={data.empresa.estado} />
        </p>

        <p>
          <Field label="CNPJ/MF:" value={data.empresa.cnpj} />
          {"     "}
          <Field label="Ramo de atuação:" value={data.empresa.ramo_atuacao} />
        </p>

        <p>
          <Field label="Inscrição Estadual:" value={data.empresa.inscricao_estadual} />
        </p>

        <p>
          <Field label="Representante legal:" value={data.empresa.representante} />
          {"   "}
          <Field label="Cargo:" value={data.empresa.cargo} />
        </p>

        <p>
          <Field label="Tel.:" value={data.empresa.telefone} />
          {" "}
          <Field label="E-mail:" value={data.empresa.email} />
        </p>
      </div>

      <div className="contract-block">
        <p>
          <Field label="Estagiário:" value={data.estagiario.nome} />
        </p>

        <div className="contract-row-student">
          <p>
            <Field label="Data de nascimento:" value={data.estagiario.data_nascimento} />
          </p>
          <p>
            <Field label="Telefone:" value={data.estagiario.telefone} />
          </p>
        </div>

        <div className="contract-row-student">
          <p>
            <Field label="Endereço:" value={data.estagiario.endereco} />
          </p>
          <p>
            <Field label="BAIRRO:" value={data.estagiario.bairro} />
            {"   "}
            <Field label="CEP:" value={data.estagiario.cep} />
          </p>
        </div>

        <div className="contract-row-student">
          <p>
            <Field label="CPF:" value={data.estagiario.cpf} />
          </p>
          <p>
            <Field label="RG:" value={data.estagiario.rg} />
          </p>
        </div>

        <div className="contract-student-course">
          <p>
            <Field label="Curso:" value={data.estagiario.curso} />
          </p>
          <p>
            <Field label="Nível:" value={data.estagiario.nivel} />
          </p>
          <p>
            <Field label="Período de aula:" value={data.estagiario.periodo_aula} />
          </p>
        </div>
      </div>

      <div className="contract-text">
        <p>
          Acordam e estabelecem entre si as cláusulas e condições que regerão este TERMO DE COMPROMISSO DE ESTÁGIO. O presente Termo é assinado, também pela Instituição de Ensino, na condição de interveniente, consoante determinação legal.
        </p>

        <p>
          <span className="contract-clause-title">CLÁUSULA 1ª</span>{" "}
          Este TERMO DE COMPROMISSO DE ESTÁGIO está fundamentado e fica vinculado ao ACORDO DE COOPERAÇÃO celebrado entre o(a) CONCEDENTE e a INSTITUIÇÃO DE ENSINO da qual o (a) ESTAGIÁRIO(A) é aluno(a), com fulcro nos dispositivos da Lei 11.788/2008.
        </p>

        <p>
          <span className="contract-clause-title">CLÁUSULA 2ª</span>{" "}
          Fica compromissado entre as partes que:
        </p>

        <p>
          a) Vigência deste Termo de Compromisso de estágio: <strong>{data.estagio.data_inicio} a {data.estagio.data_fim}</strong> podendo ser renunciado a qualquer tempo, unilateralmente, mediante comunicação escrita.
        </p>

        <p>
          b) <strong>Horário {data.estagio.horario}</strong>, com intervalo de {data.estagio.intervalo} para lanche, totalizando {data.estagio.carga_horaria}, a serem cumpridas de {data.estagio.dias_semana}.
        </p>

        <p>
          c) Bolsa-Auxílio mensal, inicial de: <strong>{data.estagio.bolsa_auxilio} + {data.estagio.auxilio_transporte}</strong>
        </p>

        <p>
          d) a jornada de atividades em ESTÁGIO deverá compatibilizar-se com o horário escolar do (a) ESTAGIÁRIO (A) e com o horário do (a) CONCEDENTE;
        </p>

        <p>
          e) <strong>ATIVIDADES:</strong> ESTAGIÁRIO atuará na área <strong>{data.estagio.atividades}</strong>, a supervisão será feita por {data.estagio.supervisor_nome} cargo {data.estagio.supervisor_cargo}, <em>e-mail</em> <strong>{data.estagio.supervisor_email}</strong>, que ficará responsável por emitir um relatório semestral de atividades desenvolvidas na área, a ser entregue a Instituição de Ensino.
        </p>

        <p>
          <span className="contract-clause-title">CLÁUSULA 3ª</span>{" "}
          No desenvolvimento do ESTÁGIO ora compromissado, caberá a CONCEDENTE:
        </p>

        <p>a) – celebrar termo de compromisso com a INSTITUIÇÃO DE ENSINO e o(a) ESTAGIÁRIO(A), zelando por seu cumprimento;</p>
        <p>b) – ofertar instalações que tenham condições de proporcionar ao(a) ESTAGIÁRIO(A) atividades de aprendizagem social, profissional e cultural;</p>
        <p>c) – indicar funcionário de seu quadro de pessoal, com formação ou experiência profissional na área de conhecimento desenvolvida no curso do(a) ESTAGIÁRIO(A), para orientá-lo e supervisioná-lo;</p>
        <p>d) – contratar em favor do(a) ESTAGIÁRIO(A) seguro contra acidentes pessoais, cuja apólice seja compatível com valores de mercado, sendo representado <strong>pela apólice n° <span style={{ color: "#ff0000" }}>{data.estagio.apolice_numero}</span></strong> da seguradora <strong>{data.estagio.seguradora}</strong>;</p>
        <p>e) – por ocasião do desligamento do(a) ESTAGIÁRIO(A), entregar termo de realização do estágio com indicação resumida das atividades desenvolvidas, dos períodos e da avaliação de desempenho;</p>
        <p>f) – manter à disposição da fiscalização documentos que comprovem a relação de estágio;</p>
        <p>g) – enviar à instituição de ensino, com periodicidade mínima de 6 (seis) meses, relatório de atividades, com vista obrigatória ao(a) ESTAGIÁRIO(A);</p>
        <p>h) – Reduzir a jornada de trabalho, pelo menos à metade da contratada, no período de avaliações previamente informado pela INSTITUIÇÃO DE ENSINO;</p>
        <p>i) – Conceder período de recesso de 30 (trinta) dias a ser gozado preferencialmente durante as férias escolares, desde que o estágio tenha duração igual ou superior a 1 (um) ano, devidamente remunerado, ou, ainda, proporcionalmente em caso de duração inferior a 1 (um) ano;</p>
        <p>j) – subsidiar a INSTITUIÇÃO DE ENSINO com informações que propiciem o aprimoramento do sistema acadêmico e do próprio estágio;</p>
        <p>k) – Efetuar o pagamento de bolsa-auxílio, cujo valor está estabelecido na 2ª Cláusula deste Termo de Compromisso de Estágio.</p>
      </div>
    </section>
  );
}

function PageTwo({ data }: { data: ContratoPadraoData }) {
  return (
    <section className="contract-paper">
      <div className="contract-text">
        <p>
          <span className="contract-clause-title">CLÁUSULA 4ª</span>{" "}
          No desenvolvimento do ESTÁGIO ora compromissado, caberá ao(a) ESTAGIÁRIO(A):
        </p>

        <p>a) cumprir com todo empenho e interesse a programação estabelecida para seu ESTÁGIO;</p>
        <p>b) observar as diretrizes e/ou normas internas do (a) CONCEDENTE e os dispositivos legais aplicáveis ao ESTÁGIO;</p>
        <p>c) apresentar documentos oficiais que comprovem a regularidade de sua situação acadêmica à(ao) CONCEDENTE, sempre que solicitado, ficando, ainda, obrigado(a) a comunicar, à(ao) CONCEDENTE e à INSTITUIÇÃO DE ENSINO, qualquer alteração havida em sua situação acadêmica após a celebração do presente Termo, bem como fatos relevantes acerca da atividade desenvolvida;</p>
        <p>d) responder pessoalmente pelas eventuais perdas e danos (materiais e morais) decorrentes de infração das normas internas do (a) CONCEDENTE ou de qualquer outro comportamento que cause prejuízo, cometido por dolo ou culpa, sem prejuízo da rescisão de seu contrato de estágio e sem qualquer responsabilidade para a INSTITUIÇÃO DE ENSINO;</p>
        <p>e) Apresentar relatórios sobre o exercício do estágio, na forma, prazo e padrões estabelecidos pela INSTITUIÇÃO DE ENSINO para o respectivo curso, em prazo não superior a seis meses.</p>

        <p>
          <span className="contract-clause-title">CLÁUSULA 5ª</span>{" "}
          No desenvolvimento do ESTÁGIO ora compromissado caberá à INSTITUIÇÃO DE ENSINO:
        </p>

        <p>a) – celebrar termo de compromisso com o(a) ESTAGIÁRIO(A) ou com seu representante ou assistente legal, quando ele(a) for absoluta ou relativamente incapaz, e com a parte CONCEDENTE, indicando as condições de adequação do estágio à proposta pedagógica do curso, à etapa e modalidade da formação escolar do estudante e ao horário e calendário escolar;</p>
        <p>b) – avaliar as instalações da parte CONCEDENTE do estágio e sua adequação à formação cultural e profissional do(a) ESTAGIÁRIO(A);</p>
        <p>c) – indicar professor orientador da área a ser desenvolvida no estágio como responsável pelo acompanhamento e avaliação das atividades do(a) ESTAGIÁRIO(A);</p>
        <p>d) – exigir do(a) ESTAGIÁRIO(A) a apresentação periódica, em prazo não superior a 6 (seis) meses, de relatório das atividades;</p>
        <p>e) – zelar pelo cumprimento do termo de compromisso, reorientando o(a) ESTAGIÁRIO(A) para outro local em caso de descumprimento de suas normas;</p>
        <p>f) – elaborar normas complementares e instrumentos de avaliação dos estágios;</p>
        <p>g) – comunicar à parte CONCEDENTE do estágio, no início do período letivo, as datas de realização de avaliações escolares ou acadêmicas.</p>

        <p>
          <span className="contract-clause-title">CLÁUSULA 6ª</span>{" "}
          Constituem motivo para a INTERRUPÇÃO AUTOMÁTICA DA VIGÊNCIA do presente TERMO DE COMPROMISSO DE ESTÁGIO:
        </p>

        <p>a) a conclusão ou abandono do curso e o trancamento de matrícula, que deverão ser imediatamente comunicados à(o) CONCEDENTE pelo(a) ESTAGIÁRIO(A);</p>
        <p>b) o não cumprimento do convencionado neste TERMO DE COMPROMISSO, bem como no ACORDO DE COOPERAÇÃO do qual decorre.</p>

        <p>
          <span className="contract-clause-title">CLÁUSULA 7ª</span>{" "}
          Assim materializado e caracterizado o presente ESTÁGIO, segundo a legislação, não acarretará vínculo empregatício de qualquer natureza entre o(a) ESTAGIÁRIO(A) e o(a) CONCEDENTE, nos termos do que dispõe o Artigo 3º, com os respectivos incisos e parágrafos, da Lei nº 11.788/08.
        </p>

        <p style={{ marginTop: "4mm" }}>
          E, por estarem de inteiro e comum acordo com as condições e dizeres deste instrumento, as partes firmam o presente em 04 (quatro) vias de igual teor, cabendo a primeira ao (a) CONCEDENTE, a segunda ao (a) ESTAGIÁRIO (A) e a terceira à INSTITUIÇÃO DE ENSINO e a quarta via para o ALUNO.
        </p>

        <p style={{ marginTop: "8mm" }}>
          {data.estagio.cidade_assinatura}, {data.estagio.data_assinatura_extenso}.
        </p>

        <p>E por ser verdade, assinam todos tornando-se cientes.</p>
      </div>

      <table className="signature-table">
        <tbody>
          <tr>
            <td>
              <div className="signature-title">CONCEDENTE</div>
              <div className="signature-line">Assinatura ___________________________________</div>
              <div>{data.empresa.representante}</div>
              <div><strong>CNPJ:</strong> {data.empresa.cnpj}</div>
            </td>

            <td>
              <div className="signature-title">INSTITUIÇÃO DE ENSINO</div>
              <div style={{ marginTop: "5mm" }}>Assinatura</div>
              <div>__________________________________</div>
            </td>
          </tr>

          <tr>
            <td className="short">
              <div>Assinatura ___________________________________</div>
              <div><strong>ESTAGIÁRIO:</strong> {data.estagiario.nome}</div>
              <div><strong>CPF:</strong> {data.estagiario.cpf}</div>
            </td>

            <td className="short">
              <div className="signature-title">RESPONSÁVEL DO ALUNO (MENOR DE 18 ANOS)</div>
            </td>
          </tr>

          <tr>
            <td className="agent">
              <div className="signature-title">AGENTE DE INTEGRAÇÃO</div>
              <div>{data.agente.razao_social}</div>
              <div><strong>CNPJ:</strong> {data.agente.cnpj}</div>
              {data.agente.assinatura_url ? (
                <img
                  src={data.agente.assinatura_url}
                  alt="Assinatura do agente de integração"
                  className="agent-signature"
                />
              ) : null}
            </td>

            <td className="agent"></td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

export function ContratoPadraoPrintClient({
  data,
}: {
  data: ContratoPadraoData;
}) {
  return (
    <div className="contract-print-root">
      <ContractStyles />

      <div className="contract-toolbar no-print">
        <Link
          href="/rh/contratos"
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
          Imprimir contrato
        </button>
      </div>

      <PageOne data={data} />
      <PageTwo data={data} />
    </div>
  );
}