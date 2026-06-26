import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileSignature,
  GraduationCap,
  Handshake,
  HelpCircle,
  Landmark,
  MessageCircle,
  Phone,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const imagens = {
  hero:
    "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1400&q=85",
  atendimento:
    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=1200&q=85",
  jovens:
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=85",
};

const servicos = [
  {
    titulo: "Recrutamento e triagem",
    texto:
      "Ajudamos sua empresa a transformar a necessidade da vaga em um perfil claro, divulgando a oportunidade e filtrando estudantes com aderência à função.",
    icon: Users,
  },
  {
    titulo: "Encaminhamento de candidatos",
    texto:
      "A empresa recebe candidatos mais alinhados ao turno, escolaridade, perfil comportamental, localização e atividades previstas para o estágio.",
    icon: Handshake,
  },
  {
    titulo: "Contrato e documentação",
    texto:
      "Apoiamos a organização dos dados necessários para o Termo de Compromisso de Estágio, reduzindo erros, retrabalho e perda de documentos.",
    icon: FileSignature,
  },
  {
    titulo: "Acompanhamento administrativo",
    texto:
      "O RH Wisdom acompanha vencimentos, pendências, seguros, contratos e informações importantes durante a vigência do estágio.",
    icon: ClipboardCheck,
  },
  {
    titulo: "Controle de prazos",
    texto:
      "A empresa ganha previsibilidade sobre vencimentos contratuais, renovação, encerramento, seguro e documentos obrigatórios.",
    icon: CalendarClock,
  },
  {
    titulo: "Suporte para empresas",
    texto:
      "Atendimento próximo para empresas que precisam contratar estagiários, mas não querem lidar sozinhas com toda a burocracia.",
    icon: ShieldCheck,
  },
];

const beneficios = [
  "Menos tempo perdido procurando candidatos sem perfil.",
  "Mais segurança na organização contratual e documental.",
  "Apoio para empresas pequenas, médias e comércios locais.",
  "Processo mais humano, com orientação para empresa e estudante.",
  "Formação de novos talentos dentro da própria empresa.",
  "Acompanhamento para evitar esquecimentos de prazos importantes.",
];

const etapas = [
  {
    titulo: "Entendemos a vaga",
    texto:
      "A empresa informa função, turno, perfil desejado, local de atuação e principais atividades.",
  },
  {
    titulo: "Buscamos candidatos",
    texto:
      "A Wisdom divulga, orienta e faz a primeira triagem dos estudantes com potencial.",
  },
  {
    titulo: "Empresa entrevista",
    texto:
      "Os candidatos selecionados são encaminhados para avaliação da empresa concedente.",
  },
  {
    titulo: "Organizamos documentos",
    texto:
      "Após a escolha, os dados do estudante, empresa e instituição de ensino são organizados.",
  },
  {
    titulo: "Contrato de estágio",
    texto:
      "Apoiamos a formalização do termo, vigência, atividades, bolsa, horário e seguro.",
  },
  {
    titulo: "Acompanhamento",
    texto:
      "Durante o estágio, o RH Wisdom acompanha pendências, prazos e necessidade de atualização.",
  },
];

const curiosidades = [
  {
    titulo: "Estágio é formação prática",
    texto:
      "O estágio aproxima o estudante do ambiente real de trabalho e ajuda a desenvolver postura, responsabilidade e visão profissional.",
  },
  {
    titulo: "O contrato precisa ser bem organizado",
    texto:
      "Dados da empresa, estudante, instituição de ensino, vigência, horário, atividades, bolsa e seguro precisam estar claros.",
  },
  {
    titulo: "A empresa também educa",
    texto:
      "Ao receber um estagiário, a empresa participa da formação de um profissional e pode desenvolver talentos desde o início.",
  },
];

const perguntas = [
  {
    pergunta: "O que é estágio?",
    resposta:
      "É uma atividade educativa supervisionada, realizada em ambiente de trabalho, para complementar a formação do estudante e aproximá-lo da prática profissional.",
  },
  {
    pergunta: "O estágio gera vínculo empregatício?",
    resposta:
      "Quando formalizado corretamente, com termo de compromisso, matrícula regular e regras respeitadas, o estágio não é tratado como contrato CLT.",
  },
  {
    pergunta: "Quem pode contratar estagiários?",
    resposta:
      "Empresas, profissionais liberais registrados, órgãos públicos e instituições podem receber estagiários, desde que ofereçam ambiente adequado e atividades compatíveis.",
  },
  {
    pergunta: "Quem pode ser estagiário?",
    resposta:
      "Estudantes regularmente matriculados e frequentando ensino médio, técnico, superior ou outras modalidades previstas, conforme a legislação aplicável.",
  },
  {
    pergunta: "A empresa pode escolher o perfil?",
    resposta:
      "Sim. A empresa pode informar área, função, turno, requisitos, perfil comportamental e tipo de candidato que precisa.",
  },
  {
    pergunta: "A Wisdom faz toda a parte documental?",
    resposta:
      "A Wisdom apoia a organização documental, cadastro, dados para contrato, acompanhamento de prazos e controle administrativo do estágio.",
  },
  {
    pergunta: "Existe seguro no estágio?",
    resposta:
      "O seguro contra acidentes pessoais é uma etapa importante do processo de estágio e deve ser observado na formalização.",
  },
  {
    pergunta: "A empresa precisa ter RH interno?",
    resposta:
      "Não necessariamente. O serviço da Wisdom ajuda principalmente empresas que querem contratar estagiários com mais organização e suporte.",
  },
];

const carrossel = [
  {
    titulo: "Jovens preparados para aprender",
    texto: "Estudantes buscando oportunidade real de desenvolvimento.",
    imagem:
      "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=900&q=85",
  },
  {
    titulo: "Empresas com mais apoio",
    texto: "Processo de estágio mais claro para empresários e gestores.",
    imagem:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=85",
  },
  {
    titulo: "Acompanhamento próximo",
    texto: "Suporte para documentos, prazos, contratos e dúvidas.",
    imagem:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=85",
  },
];

const postsInstagram = [
  "Dicas para empresas que querem contratar estagiários",
  "Orientações para jovens em busca da primeira oportunidade",
  "Bastidores, vagas, cursos e conteúdos da Wisdom",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-blue-100 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/logo-wisdom.png"
              alt="Wisdom Jovem Aprendiz"
              className="h-14 w-auto object-contain"
            />
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-bold text-slate-700 lg:flex">
            <a className="hover:text-blue-800" href="#empresas">
              Empresas
            </a>
            <a className="hover:text-blue-800" href="#servicos">
              Serviços
            </a>
            <a className="hover:text-blue-800" href="#como-funciona">
              Como funciona
            </a>
            <a className="hover:text-blue-800" href="#duvidas">
              Dúvidas
            </a>
            <a className="hover:text-blue-800" href="#contato">
              Contato
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="btn-wisdom-white rounded-full border border-blue-200 px-5 py-2.5 text-sm font-black"
            >
              Área restrita
            </Link>
            <Link
              href="/empresa/cadastro"
              className="btn-wisdom-red rounded-full px-5 py-2.5 text-sm font-black shadow-sm"
            >
              Cadastrar empresa
            </Link>
          </div>

          <Link
            href="/empresa/cadastro"
            className="btn-wisdom-red rounded-full px-4 py-2 text-sm font-black shadow-sm md:hidden"
          >
            Empresa
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 text-white">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-red-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-yellow-400/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-20">
          <div className="max-w-2xl">
            <div className="mb-7 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold text-blue-50">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                Intermediação de estágios
              </span>
              <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold text-blue-50">
                Salvador e região
              </span>
            </div>

            <h1 className="text-4xl font-black leading-[1.08] tracking-tight md:text-5xl lg:text-[3.35rem]">
              Sua empresa precisa de estagiários?
            </h1>

            <h2 className="mt-4 text-2xl font-black leading-tight text-blue-100 md:text-3xl lg:text-[2.15rem]">
              A Wisdom cuida do recrutamento, contrato e acompanhamento.
            </h2>

            <p className="mt-6 max-w-xl text-base leading-8 text-blue-50 md:text-lg">
              Recrutamento, triagem, encaminhamento, documentação e suporte
              administrativo para empresas que desejam contratar estagiários com
              mais organização, agilidade e segurança.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#contato"
                className="btn-wisdom-white inline-flex min-h-16 items-center justify-center gap-2 rounded-xl px-6 py-4 text-center text-sm font-black shadow-lg sm:w-64"
              >
                Quero contratar estagiários
                <ArrowRight className="h-5 w-5" />
              </a>
              <Link
                href="/empresa/cadastro"
                className="btn-wisdom-red inline-flex min-h-16 items-center justify-center gap-2 rounded-xl px-6 py-4 text-center text-sm font-black shadow-lg sm:w-64"
              >
                Cadastrar minha empresa
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
              {[
                ["Empresas", "contratam com apoio"],
                ["Estudantes", "ganham oportunidade"],
                ["Instituições", "participam do processo"],
              ].map(([titulo, texto]) => (
                <div
                  key={titulo}
                  className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"
                >
                  <p className="text-sm font-black text-white">{titulo}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-blue-100">
                    {texto}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur">
              <img
                src={imagens.hero}
                alt="Equipe reunida em ambiente corporativo"
                className="h-[360px] w-full rounded-[1.5rem] object-cover md:h-[430px]"
              />
            </div>

            <div className="absolute -bottom-6 left-1/2 w-[86%] -translate-x-1/2 rounded-3xl bg-white p-5 text-slate-900 shadow-2xl md:left-auto md:right-6 md:w-auto md:translate-x-0">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-green-100 p-3">
                  <CheckCircle2 className="h-7 w-7 text-green-700" />
                </div>
                <div>
                  <p className="font-black text-blue-950">Menos burocracia</p>
                  <p className="text-sm font-semibold text-slate-500">
                    Mais foco na operação da empresa
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-blue-100 bg-white py-7">
        <div className="mx-auto grid max-w-7xl gap-5 px-6 md:grid-cols-4">
          {[
            ["Recrutamento", "Busca e triagem de candidatos"],
            ["Contrato", "Apoio no termo de estágio"],
            ["Documentos", "Organização de informações"],
            ["Prazos", "Acompanhamento administrativo"],
          ].map(([titulo, texto]) => (
            <div key={titulo} className="flex items-start gap-3">
              <BadgeCheck className="mt-1 h-6 w-6 shrink-0 text-blue-700" />
              <div>
                <p className="font-black text-blue-950">{titulo}</p>
                <p className="text-sm font-semibold leading-6 text-slate-500">
                  {texto}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="empresas" className="bg-white py-18 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-red-600">
              Para empresas
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-blue-950 md:text-4xl">
              Contratar estagiários é formar talentos dentro da sua realidade.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Muitas empresas querem dar oportunidade a jovens, mas param na
              burocracia: documentos, escola, contrato, seguro, prazos, dados
              cadastrais e acompanhamento. A Wisdom entra como parceira para
              deixar esse processo mais claro, humano e organizado.
            </p>

            <div className="mt-7 rounded-3xl bg-blue-50 p-6">
              <div className="flex items-start gap-4">
                <Landmark className="h-9 w-9 shrink-0 text-blue-700" />
                <div>
                  <h3 className="text-xl font-black text-blue-950">
                    Ideal para comércios, escritórios, lojas e empresas locais
                  </h3>
                  <p className="mt-2 leading-7 text-slate-600">
                    A Wisdom conhece a realidade de Salvador, dos bairros
                    periféricos e dos jovens que buscam a primeira oportunidade
                    para crescer com responsabilidade.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {beneficios.map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-blue-100 bg-slate-50 p-6 shadow-sm"
              >
                <CheckCircle2 className="mb-4 h-7 w-7 text-green-600" />
                <p className="font-bold leading-7 text-slate-800">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="servicos" className="bg-slate-50 py-18 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-red-600">
              O que a Wisdom faz
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-blue-950 md:text-4xl">
              A empresa abre a vaga. A Wisdom ajuda a transformar isso em processo.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              O nosso trabalho é reduzir ruído, organizar informações e apoiar
              empresa e estudante para que o estágio comece com dados corretos,
              expectativas claras e documentação bem encaminhada.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {servicos.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.titulo}
                  className="group rounded-3xl bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-5 inline-flex rounded-2xl bg-blue-50 p-4 group-hover:bg-blue-700">
                    <Icon className="h-8 w-8 text-blue-700 group-hover:text-white" />
                  </div>
                  <h3 className="text-xl font-black text-blue-950">
                    {item.titulo}
                  </h3>
                  <p className="mt-3 leading-7 text-slate-600">{item.texto}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-18 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div className="overflow-hidden rounded-[2rem] bg-blue-50 p-3">
            <img
              src={imagens.atendimento}
              alt="Atendimento profissional para empresas"
              className="h-[420px] w-full rounded-[1.5rem] object-cover"
            />
          </div>

          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-red-600">
              Atendimento próximo
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-blue-950 md:text-4xl">
              Não é só encaminhar currículo. É acompanhar responsabilidade.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              A intermediação de estágio precisa considerar a empresa, o
              estudante, a escola, o contrato, as atividades, a jornada e os
              documentos. Por isso, a Wisdom atua com orientação e controle em
              cada etapa.
            </p>

            <div className="mt-7 grid gap-3">
              {[
                "Mais clareza para o empresário antes de contratar.",
                "Mais segurança para o estudante iniciar o estágio.",
                "Mais organização para o RH acompanhar vencimentos.",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"
                >
                  <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-blue-700" />
                  <p className="font-bold leading-7 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-blue-950 py-18 text-white md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-200">
              Como funciona
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight md:text-4xl">
              Um processo simples para a empresa e mais seguro para todos.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {etapas.map((item, index) => (
              <div
                key={item.titulo}
                className="rounded-3xl border border-white/15 bg-white/10 p-7 backdrop-blur"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg font-black text-blue-950">
                  {index + 1}
                </div>
                <h3 className="text-xl font-black">{item.titulo}</h3>
                <p className="mt-3 leading-7 text-blue-100">{item.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-18 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-red-600">
              Vídeo institucional
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-blue-950 md:text-4xl">
              Espaço preparado para apresentar a Wisdom em vídeo.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Aqui poderá entrar um vídeo do YouTube explicando a atuação da
              Wisdom, depoimentos de empresas, orientação para estudantes ou uma
              apresentação institucional.
            </p>
            <p className="mt-4 rounded-2xl bg-yellow-50 p-4 text-sm font-bold leading-6 text-yellow-900">
              No painel administrativo da landing page, vamos deixar o campo
              para cadastrar ou trocar a URL do vídeo.
            </p>
          </div>

          <div className="aspect-video overflow-hidden rounded-[2rem] bg-blue-950 p-4 shadow-xl">
            <div className="flex h-full items-center justify-center rounded-[1.5rem] border border-white/15 bg-gradient-to-br from-blue-900 to-slate-950 text-center text-white">
              <div className="px-6">
                <PlayCircle className="mx-auto mb-4 h-16 w-16 text-red-400" />
                <h3 className="text-2xl font-black">Vídeo da Wisdom</h3>
                <p className="mx-auto mt-3 max-w-md leading-7 text-blue-100">
                  Área reservada para incorporação de vídeo do YouTube.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-18 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-red-600">
                Jovens, empresas e oportunidades
              </p>
              <h2 className="mt-3 text-3xl font-black text-blue-950 md:text-4xl">
                Uma ponte entre quem quer aprender e quem precisa crescer.
              </h2>
            </div>
            <Link
              href="/empresa/cadastro"
              className="btn-wisdom-blue inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 font-black"
            >
              Solicitar estagiários
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {carrossel.map((item) => (
              <article
                key={item.titulo}
                className="overflow-hidden rounded-3xl bg-slate-50 shadow-sm"
              >
                <img
                  src={item.imagem}
                  alt={item.titulo}
                  className="h-72 w-full object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-black text-blue-950">
                    {item.titulo}
                  </h3>
                  <p className="mt-3 leading-7 text-slate-600">{item.texto}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-blue-50 py-18 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-red-600">
              Curiosidades sobre estágio
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-blue-950 md:text-4xl">
              Conteúdo que ajuda a empresa a decidir com mais confiança.
            </h2>

            <div className="mt-8 grid gap-4">
              {curiosidades.map((item) => (
                <div key={item.titulo} className="rounded-3xl bg-white p-6 shadow-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <BookOpenCheck className="h-7 w-7 text-blue-700" />
                    <h3 className="text-xl font-black text-blue-950">
                      {item.titulo}
                    </h3>
                  </div>
                  <p className="leading-7 text-slate-600">{item.texto}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] bg-white p-3 shadow-xl">
            <img
              src={imagens.jovens}
              alt="Jovens em ambiente de aprendizagem e trabalho"
              className="h-[480px] w-full rounded-[1.5rem] object-cover"
            />
          </div>
        </div>
      </section>

      <section id="duvidas" className="bg-white py-18 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-red-600">
              Dúvidas frequentes
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-blue-950 md:text-4xl">
              O que sua empresa precisa saber antes de contratar estagiários.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {perguntas.map((item) => (
              <div key={item.pergunta} className="rounded-3xl bg-slate-50 p-7">
                <div className="mb-4 flex items-start gap-3">
                  <HelpCircle className="mt-1 h-7 w-7 shrink-0 text-blue-700" />
                  <h3 className="text-xl font-black text-blue-950">
                    {item.pergunta}
                  </h3>
                </div>
                <p className="leading-7 text-slate-600">{item.resposta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-18 text-white md:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex rounded-full bg-white p-3">
              <img
                src="/logo-wisdom.png"
                alt="Wisdom Jovem Aprendiz"
                className="h-16 w-auto object-contain"
              />
            </div>

            <p className="text-sm font-black uppercase tracking-[0.18em] text-red-400">
              Instagram e atualizações
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight md:text-4xl">
              Conteúdo vivo para empresas, jovens e parceiros.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Esta seção ficará preparada para exibir as últimas postagens do
              Instagram da Wisdom quando a integração for configurada.
            </p>

            <a
              href="https://www.instagram.com/institutowisdom/"
              target="_blank"
              rel="noreferrer"
              className="btn-wisdom-red mt-7 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 font-black"
            >
              <Camera className="h-5 w-5" />
              Acessar Instagram
            </a>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {postsInstagram.map((item, index) => (
              <div
                key={item}
                className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-950">
                  <Camera className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold uppercase text-red-300">
                  Post {index + 1}
                </p>
                <h3 className="mt-2 text-lg font-black">{item}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Espaço reservado para feed automático ou posts escolhidos no
                  painel administrativo.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contato" className="bg-gradient-to-br from-blue-800 to-blue-950 px-6 py-18 text-white md:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-200">
              Fale com a Wisdom
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight md:text-4xl">
              Está procurando estagiários para sua empresa?
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-50">
              Entre em contato e informe o perfil que sua empresa precisa. A
              Wisdom orienta o processo e ajuda sua empresa a contratar com mais
              organização.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-7 text-slate-900 shadow-2xl">
            <Phone className="mb-4 h-9 w-9 text-blue-700" />
            <h3 className="text-2xl font-black text-blue-950">
              Solicite atendimento
            </h3>
            <p className="mt-3 leading-7 text-slate-600">
              Cadastre sua empresa ou fale com nossa equipe para iniciar a
              intermediação de estágio.
            </p>

            <div className="mt-6 grid gap-3">
              <Link
                href="/empresa/cadastro"
                className="btn-wisdom-red flex items-center justify-center gap-2 rounded-xl px-5 py-4 text-center font-black"
              >
                Cadastrar minha empresa
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="https://wa.me/5571985486088"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-4 text-center font-black text-white hover:bg-green-700"
              >
                <MessageCircle className="h-5 w-5" />
                Falar pelo WhatsApp
              </a>
              <Link
                href="/login"
                className="btn-wisdom-white rounded-xl border border-blue-200 px-5 py-4 text-center font-black"
              >
                Acessar área restrita
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.1fr_0.7fr_0.7fr_1fr]">
          <div>
            <img
              src="/logo-wisdom.png"
              alt="Wisdom Jovem Aprendiz"
              className="h-20 w-auto rounded-xl bg-white p-2 object-contain"
            />
            <p className="mt-4 max-w-sm leading-7 text-slate-300">
              Intermediação de estágios para empresas, com foco em jovens,
              oportunidades, documentação e acompanhamento administrativo.
            </p>
          </div>

          <div>
            <h4 className="font-black">Público</h4>
            <div className="mt-4 grid gap-2 text-slate-300">
              <a href="#empresas">Empresas</a>
              <a href="#duvidas">Dúvidas sobre estágio</a>
              <a href="#servicos">Serviços</a>
            </div>
          </div>

          <div>
            <h4 className="font-black">Acessos</h4>
            <div className="mt-4 grid gap-2 text-slate-300">
              <Link href="/empresa">Área da empresa</Link>
              <Link href="/estagiario">Área do estagiário</Link>
              <Link href="/rh">Área RH</Link>
              <Link href="/rh/landing">Editar landing</Link>
            </div>
          </div>

          <div>
            <h4 className="font-black">Contato</h4>
            <p className="mt-4 leading-7 text-slate-300">
              Atendimento para empresas interessadas em contratar estagiários
              com suporte da RH Wisdom.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
