-- =========================================================
-- SISTEMA RH WISDOM - SCHEMA INICIAL
-- Supabase/PostgreSQL
-- =========================================================

create extension if not exists "uuid-ossp";

-- =========================================================
-- ENUMS
-- =========================================================

do $$ begin
  create type user_role as enum ('rh_master', 'rh_operador', 'empresa', 'estagiario');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type status_registro as enum ('ativo', 'inativo', 'arquivado');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type status_contrato as enum ('rascunho', 'gerado', 'enviado', 'assinado', 'vencido', 'encerrado', 'cancelado');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type status_pagamento as enum ('aberto', 'pago', 'atrasado', 'cancelado', 'renegociado');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type tipo_documento as enum (
    'rg',
    'cpf',
    'comprovante_residencia',
    'declaracao_escolar',
    'contrato_estagio',
    'apolice_seguro',
    'cnpj',
    'contrato_social',
    'logo',
    'foto',
    'carne',
    'recibo',
    'relatorio',
    'outro'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type nivel_alerta as enum ('critico', 'atencao', 'informativo');
exception when duplicate_object then null;
end $$;

-- =========================================================
-- FUNÇÕES BASE
-- =========================================================

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =========================================================
-- PERFIS / USUÁRIOS
-- =========================================================

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  telefone text,
  role user_role not null default 'rh_operador',
  empresa_id uuid,
  estagiario_id uuid,
  status status_registro not null default 'ativo',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

-- =========================================================
-- CONFIGURAÇÕES DO RH WISDOM
-- =========================================================

create table if not exists public.rh_settings (
  id uuid primary key default uuid_generate_v4(),
  nome_fantasia text not null default 'RH Wisdom Opportunities',
  razao_social text,
  cnpj text,
  telefone text,
  email text,
  site text,
  endereco text,
  logo_file_id text,
  assinatura_file_id text,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

drop trigger if exists trg_rh_settings_updated_at on public.rh_settings;
create trigger trg_rh_settings_updated_at
before update on public.rh_settings
for each row execute function public.set_updated_at();

-- =========================================================
-- EMPRESAS
-- =========================================================

create table if not exists public.companies (
  id uuid primary key default uuid_generate_v4(),
  nome_responsavel text not null,
  cnpj text not null,
  razao_social text not null,
  nome_fantasia text,
  ramo_atuacao text,
  inscricao_estadual text,
  endereco text not null,
  bairro text,
  cidade text default 'Salvador',
  estado text default 'Bahia',
  cep text,
  email text not null,
  telefone text not null,
  perfil_candidato text,
  funcoes_estagiario text,
  valor_bolsa numeric(12,2),
  logo_file_id text,
  observacoes text,
  status status_registro not null default 'ativo',
  criado_por uuid references auth.users(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  inativado_em timestamptz,
  motivo_inativacao text
);

create unique index if not exists idx_companies_cnpj_unique on public.companies(cnpj);

drop trigger if exists trg_companies_updated_at on public.companies;
create trigger trg_companies_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

-- =========================================================
-- INSTITUIÇÕES DE ENSINO
-- =========================================================

create table if not exists public.educational_institutions (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  cnpj text,
  endereco text,
  bairro text,
  cidade text default 'Salvador',
  estado text default 'Bahia',
  representante_legal text,
  cargo_representante text,
  telefone text,
  email text,
  status status_registro not null default 'ativo',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

drop trigger if exists trg_educational_institutions_updated_at on public.educational_institutions;
create trigger trg_educational_institutions_updated_at
before update on public.educational_institutions
for each row execute function public.set_updated_at();

-- =========================================================
-- ESTAGIÁRIOS
-- =========================================================

create table if not exists public.students (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  data_nascimento date not null,
  cpf text,
  rg text,
  telefone text not null,
  email text not null,
  serie_ano text not null,
  turno text not null,
  escola text not null,
  institution_id uuid references public.educational_institutions(id),
  endereco text not null,
  bairro text,
  cidade text default 'Salvador',
  estado text default 'Bahia',
  cep text,
  empresa_id uuid references public.companies(id),
  loja_trabalho text,
  funcao text,
  valor_bolsa numeric(12,2),
  data_vencimento_seguro date,
  numero_apolice text,
  seguradora text,
  foto_file_id text,
  observacoes text,
  status status_registro not null default 'ativo',
  criado_por uuid references auth.users(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  inativado_em timestamptz,
  motivo_inativacao text
);

create index if not exists idx_students_empresa_id on public.students(empresa_id);
create index if not exists idx_students_serie_ano on public.students(serie_ano);
create index if not exists idx_students_vencimento_seguro on public.students(data_vencimento_seguro);

drop trigger if exists trg_students_updated_at on public.students;
create trigger trg_students_updated_at
before update on public.students
for each row execute function public.set_updated_at();

-- =========================================================
-- CONTRATOS DE ESTÁGIO
-- =========================================================

create table if not exists public.internship_contracts (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students(id),
  company_id uuid not null references public.companies(id),
  institution_id uuid references public.educational_institutions(id),
  numero_contrato text,
  versao integer not null default 1,
  data_inicio date not null,
  data_fim date not null,
  horario text,
  carga_horaria_semanal text,
  bolsa_auxilio numeric(12,2),
  auxilio_transporte text,
  atividades text,
  supervisor_nome text,
  supervisor_cargo text,
  supervisor_email text,
  apolice_numero text,
  seguradora text,
  data_vencimento_seguro date,
  status status_contrato not null default 'rascunho',
  pdf_file_id text,
  contrato_assinado_file_id text,
  observacoes text,
  criado_por uuid references auth.users(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  cancelado_em timestamptz,
  motivo_cancelamento text
);

create index if not exists idx_contracts_student_id on public.internship_contracts(student_id);
create index if not exists idx_contracts_company_id on public.internship_contracts(company_id);
create index if not exists idx_contracts_data_fim on public.internship_contracts(data_fim);
create index if not exists idx_contracts_status on public.internship_contracts(status);

drop trigger if exists trg_internship_contracts_updated_at on public.internship_contracts;
create trigger trg_internship_contracts_updated_at
before update on public.internship_contracts
for each row execute function public.set_updated_at();

-- =========================================================
-- FINANCEIRO
-- =========================================================

create table if not exists public.financial_charges (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id),
  descricao text not null,
  competencia text,
  data_vencimento date not null,
  valor numeric(12,2) not null,
  status status_pagamento not null default 'aberto',
  carne_pdf_file_id text,
  observacoes text,
  criado_por uuid references auth.users(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  cancelado_em timestamptz,
  motivo_cancelamento text
);

create index if not exists idx_financial_company_id on public.financial_charges(company_id);
create index if not exists idx_financial_vencimento on public.financial_charges(data_vencimento);
create index if not exists idx_financial_status on public.financial_charges(status);

drop trigger if exists trg_financial_charges_updated_at on public.financial_charges;
create trigger trg_financial_charges_updated_at
before update on public.financial_charges
for each row execute function public.set_updated_at();

create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  charge_id uuid not null references public.financial_charges(id),
  company_id uuid not null references public.companies(id),
  data_pagamento date not null,
  valor_pago numeric(12,2) not null,
  forma_pagamento text,
  recibo_pdf_file_id text,
  observacoes text,
  baixado_por uuid references auth.users(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

-- =========================================================
-- DOCUMENTOS / GOOGLE DRIVE
-- =========================================================

create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null check (entity_type in ('empresa', 'estagiario', 'contrato', 'financeiro', 'rh', 'landing')),
  entity_id uuid,
  tipo tipo_documento not null default 'outro',
  categoria text,
  nome_arquivo text not null,
  mime_type text,
  tamanho_bytes bigint,
  drive_file_id text,
  drive_folder_id text,
  url_visualizacao text,
  url_download text,
  versao integer not null default 1,
  substitui_documento_id uuid references public.documents(id),
  arquivado boolean not null default false,
  observacoes text,
  enviado_por uuid references auth.users(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_documents_entity on public.documents(entity_type, entity_id);
create index if not exists idx_documents_drive_file_id on public.documents(drive_file_id);

drop trigger if exists trg_documents_updated_at on public.documents;
create trigger trg_documents_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

-- =========================================================
-- PDFs GERADOS
-- =========================================================

create table if not exists public.generated_pdfs (
  id uuid primary key default uuid_generate_v4(),
  tipo text not null,
  titulo text not null,
  entity_type text,
  entity_id uuid,
  versao integer not null default 1,
  file_id text,
  numero_documento text,
  status text not null default 'gerado',
  gerado_por uuid references auth.users(id),
  criado_em timestamptz not null default now(),
  observacoes text
);

create index if not exists idx_generated_pdfs_entity on public.generated_pdfs(entity_type, entity_id);

-- =========================================================
-- ALERTAS
-- =========================================================

create table if not exists public.alerts (
  id uuid primary key default uuid_generate_v4(),
  nivel nivel_alerta not null default 'informativo',
  titulo text not null,
  descricao text,
  entity_type text,
  entity_id uuid,
  data_referencia date,
  resolvido boolean not null default false,
  resolvido_por uuid references auth.users(id),
  resolvido_em timestamptz,
  criado_em timestamptz not null default now()
);

create index if not exists idx_alerts_resolvido on public.alerts(resolvido);
create index if not exists idx_alerts_data_referencia on public.alerts(data_referencia);

-- =========================================================
-- LANDING PAGE
-- =========================================================

create table if not exists public.landing_settings (
  id uuid primary key default uuid_generate_v4(),
  titulo_hero text not null default 'Sua empresa precisa de estagiários?',
  subtitulo_hero text,
  texto_botao_principal text default 'Quero contratar estagiários',
  url_whatsapp text,
  url_instagram text,
  url_youtube_video text,
  logo_file_id text,
  ativo boolean not null default true,
  atualizado_por uuid references auth.users(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

drop trigger if exists trg_landing_settings_updated_at on public.landing_settings;
create trigger trg_landing_settings_updated_at
before update on public.landing_settings
for each row execute function public.set_updated_at();

create table if not exists public.landing_images (
  id uuid primary key default uuid_generate_v4(),
  titulo text not null,
  descricao text,
  area text not null,
  ordem integer not null default 0,
  file_id text,
  url_publica text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

drop trigger if exists trg_landing_images_updated_at on public.landing_images;
create trigger trg_landing_images_updated_at
before update on public.landing_images
for each row execute function public.set_updated_at();

-- =========================================================
-- AUDITORIA
-- =========================================================

create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  user_email text,
  acao text not null,
  tabela text,
  entity_type text,
  entity_id uuid,
  campo text,
  valor_anterior jsonb,
  valor_novo jsonb,
  motivo text,
  ip text,
  user_agent text,
  criado_em timestamptz not null default now()
);

create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);
create index if not exists idx_audit_logs_user_id on public.audit_logs(user_id);
create index if not exists idx_audit_logs_criado_em on public.audit_logs(criado_em);

-- =========================================================
-- RLS - ATIVAÇÃO INICIAL
-- Políticas completas serão refinadas quando integrarmos Auth.
-- =========================================================

alter table public.user_profiles enable row level security;
alter table public.rh_settings enable row level security;
alter table public.companies enable row level security;
alter table public.educational_institutions enable row level security;
alter table public.students enable row level security;
alter table public.internship_contracts enable row level security;
alter table public.financial_charges enable row level security;
alter table public.payments enable row level security;
alter table public.documents enable row level security;
alter table public.generated_pdfs enable row level security;
alter table public.alerts enable row level security;
alter table public.landing_settings enable row level security;
alter table public.landing_images enable row level security;
alter table public.audit_logs enable row level security;
