import type { LandingData, LandingMedia } from "@/data/rh/landing.data";
import {
  ArrowRight,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  FileSignature,
  FileText,
  GraduationCap,
  HelpCircle,
  Camera,
  LockKeyhole,
  MessageCircle,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
} from "lucide-react";

function mediaByCategory(data: LandingData, category: string) {
  return data.media.filter((item) => item.category === category && item.public_url);
}

function firstImage(data: LandingData): LandingMedia | null {
  return mediaByCategory(data, "hero")[0] || data.media.find((item) => item.public_url) || null;
}

function safeUrl(value: string | null | undefined, fallback = "#") {
  return value && value.trim() ? value : fallback;
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 inline-flex rounded-2xl bg-blue-50 p-3 text-blue-700">
        {icon}
      </div>
      <h3 className="text-lg font-black text-blue-950">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function FactCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <CheckCircle2 className="mb-4 h-7 w-7 text-green-600" />
      <h3 className="font-black text-blue-950">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{text}</p>
    </div>
  );
}

export function PublicLandingPage({ data }: { data: LandingData }) {
  const { settings } = data;
  const hero = firstImage(data);
  const gallery = data.media.filter((item) => item.public_url);
  const empresaUrl = safeUrl(settings.empresa_portal_url, "/empresa");
  const estagiarioUrl = safeUrl(settings.estagiario_portal_url, "/estagiario");
  const rhUrl = safeUrl(settings.rh_login_url, "/login");
  const cadastroEmpresaUrl = safeUrl(settings.empresa_cadastro_url || settings.primary_cta_url, "/empresa/cadastro");
  const whatsappUrl = safeUrl(settings.whatsapp_url || settings.secondary_cta_url, "#");
  const instagramUrl = safeUrl(settings.instagram_url, "#");

  if (!settings.public_enabled) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
        <section className="max-w-xl rounded-[2rem] bg-white p-8 text-center shadow-sm">
          <ShieldCheck className="mx-auto h-12 w-12 text-blue-700" />
          <h1 className="mt-4 text-3xl font-black text-blue-950">
            Landing page indisponível
          </h1>
          <p className="mt-3 font-semibold leading-7 text-slate-500">
            A página pública está temporariamente desativada pelo RH Wisdom.
          </p>
          <a
            href={rhUrl}
            className="btn-wisdom-blue mt-6 inline-flex rounded-xl px-5 py-3 font-black"
          >
            Acessar administração
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <a href="/" className="flex items-center gap-3">
            <img src="/logo-wisdom.png" alt="Wisdom" className="h-12 w-auto object-contain" />
            <div className="hidden sm:block">
              <p className="font-black text-blue-950">Wisdom</p>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-red-600">
                Cursos e Estágios
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-6 text-sm font-black text-slate-600 lg:flex">
            <a href="#empresas" className="hover:text-blue-800">Empresas</a>
            <a href="#estagiarios" className="hover:text-blue-800">Estagiários</a>
            <a href="#duvidas" className="hover:text-blue-800">Dúvidas</a>
            <a href="#atualizacoes" className="hover:text-blue-800">Atualizações</a>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={rhUrl}
              className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-blue-950 hover:bg-slate-50 md:inline-flex"
            >
              <LockKeyhole className="h-4 w-4 text-blue-700" />
              RH/Admin
            </a>
            <a
              href="/login"
              className="btn-wisdom-red inline-flex rounded-xl px-4 py-3 text-sm font-black"
            >
              Entrar
            </a>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-blue-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.45),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(220,38,38,0.35),transparent_30%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1fr_520px] lg:items-center lg:py-20">
          <div>
            <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-blue-100">
              {settings.hero_badge || "RH Wisdom • Gestão de Estágios"}
            </p>

            <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-white md:text-6xl">
              {settings.hero_title}
            </h1>

            <p className="mt-6 max-w-3xl text-lg font-semibold leading-8 text-blue-100">
              {settings.hero_subtitle}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={cadastroEmpresaUrl}
                className="btn-wisdom-red inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 font-black"
              >
                {settings.primary_cta_label || "Cadastrar empresa"}
                <ArrowRight className="h-5 w-5" />
              </a>

              <a
                href={whatsappUrl}
                className="btn-wisdom-white inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 font-black"
              >
                <MessageCircle className="h-5 w-5" />
                {settings.secondary_cta_label || "Falar com o RH"}
              </a>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <a href={empresaUrl} className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white hover:bg-white/15">
                <Building2 className="mb-2 h-6 w-6" />
                <p className="font-black">Portal Empresa</p>
                <p className="mt-1 text-xs font-semibold text-blue-100">Acompanhe contratos e documentos.</p>
              </a>

              <a href={estagiarioUrl} className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white hover:bg-white/15">
                <UserRound className="mb-2 h-6 w-6" />
                <p className="font-black">Portal Estagiário</p>
                <p className="mt-1 text-xs font-semibold text-blue-100">Acesso do estudante.</p>
              </a>

              <a href={rhUrl} className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white hover:bg-white/15">
                <LockKeyhole className="mb-2 h-6 w-6" />
                <p className="font-black">Área RH</p>
                <p className="mt-1 text-xs font-semibold text-blue-100">Administração protegida.</p>
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur">
            {settings.video_embed_url ? (
              <div className="overflow-hidden rounded-[1.5rem] bg-slate-950">
                <iframe
                  src={settings.video_embed_url}
                  title="Vídeo Wisdom"
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : hero?.public_url ? (
              <img
                src={hero.public_url}
                alt={hero.title || "RH Wisdom"}
                className="h-[420px] w-full rounded-[1.5rem] object-cover"
              />
            ) : (
              <div className="flex h-[420px] items-center justify-center rounded-[1.5rem] bg-white/10 text-center text-white">
                <div>
                  <GraduationCap className="mx-auto h-14 w-14" />
                  <p className="mt-4 text-xl font-black">RH Wisdom</p>
                  <p className="mt-2 text-sm font-semibold text-blue-100">
                    Configure imagens no painel RH.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-12">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-4">
          <FeatureCard
            icon={<BriefcaseBusiness className="h-8 w-8" />}
            title="Intermediação"
            text="Apoio para conectar empresas a estudantes com perfil adequado para estágio."
          />
          <FeatureCard
            icon={<FileSignature className="h-8 w-8" />}
            title="Contratos"
            text="Organização do Termo de Compromisso de Estágio e histórico documental."
          />
          <FeatureCard
            icon={<CalendarCheck className="h-8 w-8" />}
            title="Alertas"
            text="Acompanhamento de vencimentos, apólices, documentos e pendências."
          />
          <FeatureCard
            icon={<WalletCards className="h-8 w-8" />}
            title="Financeiro"
            text="Controle de carnês, mensalidades, comprovantes e baixas."
          />
        </div>
      </section>

      <section id="empresas" className="px-6 py-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-red-600">
              Para empresas
            </p>
            <h2 className="mt-2 text-4xl font-black text-blue-950">
              {settings.company_section_title}
            </h2>
            <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
              {settings.company_section_text}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={cadastroEmpresaUrl}
                className="btn-wisdom-red inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 font-black"
              >
                Quero cadastrar minha empresa
                <ArrowRight className="h-5 w-5" />
              </a>
              <a
                href={empresaUrl}
                className="btn-wisdom-blue inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 font-black"
              >
                Acessar portal da empresa
              </a>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FeatureCard
              icon={<ClipboardCheck className="h-8 w-8" />}
              title="Processo mais seguro"
              text="Dados da empresa, estudante, escola, supervisor, bolsa e seguro organizados em um só fluxo."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-8 w-8" />}
              title="Conformidade"
              text="Controle dos documentos necessários e histórico das ações realizadas no sistema."
            />
            <FeatureCard
              icon={<Sparkles className="h-8 w-8" />}
              title="Talentos em formação"
              text="O estágio ajuda a desenvolver novos profissionais e aproximar jovens do ambiente de trabalho."
            />
            <FeatureCard
              icon={<FileText className="h-8 w-8" />}
              title="Menos improviso"
              text="Contrato, anexos, alertas, financeiro e comunicação com o RH ficam mais organizados."
            />
          </div>
        </div>
      </section>

      <section id="estagiarios" className="bg-blue-950 px-6 py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-red-300">
              Para estudantes
            </p>
            <h2 className="mt-2 text-4xl font-black">
              Estágio é aprendizagem, orientação e oportunidade
            </h2>
            <p className="mt-4 text-lg font-semibold leading-8 text-blue-100">
              O estudante acompanha sua documentação, contratos e informações importantes pelo portal, mantendo o RH com dados atualizados.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/15 bg-white/10 p-5">
                <BookOpenCheck className="mb-3 h-7 w-7" />
                <p className="font-black">Aprendizagem prática</p>
                <p className="mt-2 text-sm font-semibold text-blue-100">Contato com rotinas reais de trabalho.</p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-5">
                <GraduationCap className="mb-3 h-7 w-7" />
                <p className="font-black">Compatível com estudo</p>
                <p className="mt-2 text-sm font-semibold text-blue-100">A jornada precisa respeitar a vida escolar.</p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-5">
                <ShieldCheck className="mb-3 h-7 w-7" />
                <p className="font-black">Documentação</p>
                <p className="mt-2 text-sm font-semibold text-blue-100">Contrato, seguro e dados do estágio organizados.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-7 text-blue-950 shadow-xl">
            <h3 className="text-2xl font-black">Acesso do estagiário</h3>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
              Use o portal para acompanhar informações vinculadas ao seu cadastro.
            </p>
            <a
              href={estagiarioUrl}
              className="btn-wisdom-red mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 font-black"
            >
              Entrar no portal do estagiário
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      <section id="duvidas" className="bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-red-600">
              Dúvidas frequentes
            </p>
            <h2 className="mt-2 text-4xl font-black text-blue-950">
              {settings.facts_section_title}
            </h2>
            <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">
              {settings.facts_section_text}
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <FactCard
              title="O que é estágio?"
              text="É um ato educativo supervisionado, desenvolvido no ambiente de trabalho, para preparar o estudante para a vida profissional."
            />
            <FactCard
              title="Precisa de contrato?"
              text="Sim. O estágio deve ser formalizado por Termo de Compromisso entre estudante, empresa e instituição de ensino."
            />
            <FactCard
              title="Tem limite de jornada?"
              text="Para ensino médio, técnico e superior, a jornada usual é limitada a 6 horas diárias e 30 horas semanais."
            />
            <FactCard
              title="Tem seguro?"
              text="A empresa concedente deve providenciar seguro contra acidentes pessoais compatível com valores de mercado."
            />
            <FactCard
              title="Tem recesso?"
              text="Quando o estágio dura um ano ou mais, o estudante tem direito a 30 dias de recesso, preferencialmente nas férias escolares."
            />
            <FactCard
              title="É vínculo CLT?"
              text="O estágio regular não gera vínculo empregatício, desde que respeite as exigências legais e educacionais."
            />
          </div>
        </div>
      </section>

      {gallery.length > 0 ? (
        <section className="px-6 py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-red-600">
                Galeria
              </p>
              <h2 className="mt-2 text-4xl font-black text-blue-950">
                Estrutura, alunos e oportunidades
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {gallery.slice(0, 9).map((item) => (
                <div key={item.id} className="overflow-hidden rounded-3xl bg-slate-50 shadow-sm">
                  <img
                    src={item.public_url || ""}
                    alt={item.title || "Imagem Wisdom"}
                    className="h-64 w-full object-cover"
                  />
                  {(item.title || item.description) ? (
                    <div className="p-5">
                      {item.title ? (
                        <h3 className="font-black text-blue-950">{item.title}</h3>
                      ) : null}
                      {item.description ? (
                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {data.updates.length > 0 ? (
        <section id="atualizacoes" className="bg-slate-50 px-6 py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-red-600">
                  Atualizações
                </p>
                <h2 className="mt-2 text-4xl font-black text-blue-950">
                  Publicações e novidades da Wisdom
                </h2>
                <p className="mt-3 max-w-2xl font-semibold leading-7 text-slate-600">
                  Links selecionados manualmente pelo RH para destacar conteúdos importantes das redes sociais.
                </p>
              </div>

              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-black text-blue-950 hover:bg-slate-50"
              >
                <Camera className="h-5 w-5 text-red-600" />
                Ver Instagram
              </a>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {data.updates.map((item) => (
                <a
                  key={item.id}
                  href={item.post_url}
                  target="_blank"
                  rel="noreferrer"
                  className="group overflow-hidden rounded-3xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-blue-950 text-white">
                      <Camera className="h-12 w-12" />
                    </div>
                  )}
                  <div className="p-5">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                      {item.badge || "Instagram"}
                    </span>
                    <h3 className="mt-3 text-lg font-black text-blue-950 group-hover:text-red-600">
                      {item.title}
                    </h3>
                    {item.description ? (
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-blue-950 p-8 text-center text-white md:p-12">
          <HelpCircle className="mx-auto h-12 w-12 text-blue-200" />
          <h2 className="mt-5 text-4xl font-black">
            Quer organizar os estágios da sua empresa?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-semibold leading-8 text-blue-100">
            Fale com o RH Wisdom e veja como podemos ajudar sua empresa a estruturar contratos, documentos, acompanhamento e financeiro.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={cadastroEmpresaUrl}
              className="btn-wisdom-red inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 font-black"
            >
              Cadastrar empresa
              <ArrowRight className="h-5 w-5" />
            </a>
            <a
              href={whatsappUrl}
              className="btn-wisdom-white inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 font-black"
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-slate-50 px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xl font-black text-blue-950">Wisdom Cursos e Estágios</p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Intermediação e gestão de estágios com organização, acompanhamento e responsabilidade.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a href={instagramUrl} target="_blank" rel="noreferrer" className="rounded-xl bg-white px-4 py-3 text-sm font-black text-blue-950">
              Instagram
            </a>
            <a href={empresaUrl} className="rounded-xl bg-white px-4 py-3 text-sm font-black text-blue-950">
              Empresa
            </a>
            <a href={estagiarioUrl} className="rounded-xl bg-white px-4 py-3 text-sm font-black text-blue-950">
              Estagiário
            </a>
            <a href={rhUrl} className="rounded-xl bg-white px-4 py-3 text-sm font-black text-blue-950">
              RH/Admin
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}