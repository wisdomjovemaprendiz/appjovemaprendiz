-- =========================================================
-- MIGRATION 002 - CADASTROS FLEXÍVEIS, PENDÊNCIAS, SKILLS E MATCH
-- =========================================================

-- Empresas: cadastro rápido sem campos obrigatórios
alter table public.companies
  alter column nome_responsavel drop not null,
  alter column cnpj drop not null,
  alter column razao_social drop not null,
  alter column endereco drop not null,
  alter column email drop not null,
  alter column telefone drop not null;

-- Estagiários: cadastro rápido sem campos obrigatórios
alter table public.students
  alter column nome drop not null,
  alter column data_nascimento drop not null,
  alter column telefone drop not null,
  alter column email drop not null,
  alter column serie_ano drop not null,
  alter column turno drop not null,
  alter column escola drop not null,
  alter column endereco drop not null;

alter table public.students
  add column if not exists cidade text default 'Salvador',
  add column if not exists estado text default 'Bahia';

-- Contratos: permitir rascunho incompleto
alter table public.internship_contracts
  alter column student_id drop not null,
  alter column company_id drop not null,
  alter column data_inicio drop not null,
  alter column data_fim drop not null;

-- Financeiro: permitir rascunhos
alter table public.financial_charges
  alter column company_id drop not null,
  alter column descricao drop not null,
  alter column data_vencimento drop not null,
  alter column valor drop not null;

-- Catálogo de skills
create table if not exists public.skill_catalog (
  id uuid primary key default uuid_generate_v4(),
  area text not null,
  nome text not null,
  tipo text not null check (tipo in ('perfil', 'funcao', 'tecnica', 'comportamental')),
  ensino_medio boolean not null default true,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  unique(area, nome)
);

-- Skills desejadas pela empresa/vaga
create table if not exists public.company_skill_requirements (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade,
  skill_id uuid references public.skill_catalog(id),
  nome_skill text not null,
  peso integer not null default 1,
  criado_em timestamptz not null default now()
);

create index if not exists idx_company_skill_company on public.company_skill_requirements(company_id);

-- Skills do estagiário
create table if not exists public.student_skills (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references public.students(id) on delete cascade,
  skill_id uuid references public.skill_catalog(id),
  nome_skill text not null,
  nivel text default 'informado',
  criado_em timestamptz not null default now()
);

create index if not exists idx_student_skills_student on public.student_skills(student_id);

-- Lembretes de pendências cadastrais
create table if not exists public.completion_reminders (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null check (entity_type in ('empresa', 'estagiario', 'contrato', 'financeiro')),
  entity_id uuid not null,
  campo text not null,
  mensagem text not null,
  ativo boolean not null default true,
  lembrar_em timestamptz,
  ignorar_definitivo boolean not null default false,
  resolvido boolean not null default false,
  resolvido_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_completion_reminders_entity on public.completion_reminders(entity_type, entity_id);
create index if not exists idx_completion_reminders_ativo on public.completion_reminders(ativo, resolvido);

drop trigger if exists trg_completion_reminders_updated_at on public.completion_reminders;
create trigger trg_completion_reminders_updated_at
before update on public.completion_reminders
for each row execute function public.set_updated_at();

-- Empresas/vagas ignoradas no match por decisão do recrutador
create table if not exists public.match_decisions (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  decisao text not null check (decisao in ('encaminhar', 'ignorar', 'analisar_depois')),
  observacao text,
  decidido_por uuid references auth.users(id),
  criado_em timestamptz not null default now(),
  unique(company_id, student_id)
);

-- View simples de match por percentual de skills
create or replace view public.vw_student_company_match as
with empresa_skills as (
  select
    company_id,
    array_agg(distinct lower(nome_skill)) as skills,
    count(distinct lower(nome_skill)) as total
  from public.company_skill_requirements
  group by company_id
),
aluno_skills as (
  select
    student_id,
    array_agg(distinct lower(nome_skill)) as skills
  from public.student_skills
  group by student_id
)
select
  c.id as company_id,
  c.razao_social,
  c.nome_fantasia,
  s.id as student_id,
  s.nome as student_name,
  s.serie_ano,
  s.turno,
  es.total as total_skills_empresa,
  coalesce((
    select count(*)
    from unnest(es.skills) skill
    where skill = any(coalesce(al.skills, array[]::text[]))
  ), 0) as total_match,
  case
    when es.total = 0 then 0
    else round(
      (
        coalesce((
          select count(*)
          from unnest(es.skills) skill
          where skill = any(coalesce(al.skills, array[]::text[]))
        ), 0)::numeric / es.total::numeric
      ) * 100,
      0
    )
  end as match_percent
from public.companies c
cross join public.students s
left join empresa_skills es on es.company_id = c.id
left join aluno_skills al on al.student_id = s.id
where c.status = 'ativo'
  and s.status = 'ativo';

alter table public.skill_catalog enable row level security;
alter table public.company_skill_requirements enable row level security;
alter table public.student_skills enable row level security;
alter table public.completion_reminders enable row level security;
alter table public.match_decisions enable row level security;
