-- Campos complementares da instituição de ensino vinculada ao estagiário.
-- Necessários para alimentar o Termo de Compromisso de Estágio.

alter table public.students
  add column if not exists escola_endereco text,
  add column if not exists escola_bairro text,
  add column if not exists escola_cnpj text,
  add column if not exists escola_inscricao_estadual text;
