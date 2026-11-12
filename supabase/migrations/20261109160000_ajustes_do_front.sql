-- =============================================================================
-- AstroClock · ajustes para o banco bater com o front (src/compartilhado/api)
-- =============================================================================
-- Migração: só estrutura, não mexe em dados. Os dados de teste estão no seed.sql.
-- Mesmo conteúdo da parte 2 do 7_ajustes_do_front.sql (versão de colar).
--   2.1 setores: todo membro ativo lê · diretor do RH e presidente criam e alteram
--   2.2 metas: todo membro ativo lê · só o diretor do RH cria, da próxima semana
--       em diante · lista_de_metas
--   2.3 membros: o rh também desativa e troca o setor de quem é membro ou rh
--   2.4 no máximo 1 diretor do RH ativo e 1 presidente ativo
--   2.5 historico_setor · 2.6 dispensas · 2.7 meus_dados() ·
--   2.8 elegivel_na_semana() · 2.9 descrição obrigatória no registro manual
-- =============================================================================


-- 2.1 setores: todo membro ativo lê; diretor do RH e presidente criam e alteram
-- -----------------------------------------------------------------------------
-- O login (meusDados) e o listarSetores precisam ler. Conta sem cadastro, ou
-- desativada, não lê nada (meu_id() = null). Pelo site só dá pra mexer no nome
-- e no ativo. Setor não se apaga: desativa.

drop policy if exists "setores: membro ativo lê" on public.setores;
create policy "setores: membro ativo lê"
  on public.setores
  for select
  to authenticated
  using ((select public.meu_id()) is not null);

drop policy if exists "setores: diretor do RH e presidente criam" on public.setores;
create policy "setores: diretor do RH e presidente criam"
  on public.setores
  for insert
  to authenticated
  with check ((select public.meu_perfil()) in ('diretor_rh', 'presidente'));

drop policy if exists "setores: diretor do RH e presidente alteram" on public.setores;
create policy "setores: diretor do RH e presidente alteram"
  on public.setores
  for update
  to authenticated
  using ((select public.meu_perfil()) in ('diretor_rh', 'presidente'))
  with check ((select public.meu_perfil()) in ('diretor_rh', 'presidente'));

revoke insert, update on public.setores from authenticated;
grant insert (nome, ativo), update (nome, ativo) on public.setores to authenticated;


-- 2.2 metas: todo membro ativo lê; só o diretor do RH cria, da próxima semana
--     em diante
-- -----------------------------------------------------------------------------
-- Semana que já começou não muda (nem a atual). Para corrigir uma meta futura,
-- cria outra com a mesma semana de início: vale a mais nova.
-- O site manda só horas_total, horas_sede e vigente_desde. alterado_por e
-- criado_em são do banco.

drop policy if exists "metas: membro ativo lê" on public.metas;
create policy "metas: membro ativo lê"
  on public.metas
  for select
  to authenticated
  using ((select public.meu_id()) is not null);

drop policy if exists "metas: só o diretor do RH cria" on public.metas;
create policy "metas: só o diretor do RH cria"
  on public.metas
  for insert
  to authenticated
  with check (
    (select public.eh_diretor_rh())
    and alterado_por = (select public.meu_id())
    and vigente_desde > date_trunc('week', now() at time zone 'America/Sao_Paulo')::date
  );

revoke insert on public.metas from authenticated;
grant insert (horas_total, horas_sede, vigente_desde) on public.metas to authenticated;

-- lista_de_metas: uma linha por semana de início, só a versão mais nova (é o
-- listarMetas). A meta de uma semana é a linha com o maior vigente_desde
-- <= segunda-feira da semana. Respeita o RLS de metas (security_invoker).
create or replace view public.lista_de_metas
  with (security_invoker = true)
as
  select distinct on (m.vigente_desde)
         m.id, m.horas_total, m.horas_sede, m.vigente_desde, m.alterado_por, m.criado_em
  from public.metas m
  order by m.vigente_desde, m.criado_em desc, m.id desc;

comment on view public.lista_de_metas is
  'Metas sem as versões substituídas: uma por vigente_desde (a mais nova).';

revoke all on public.lista_de_metas from anon, authenticated;
grant select on public.lista_de_metas to authenticated;


-- 2.3 membros: o rh também desativa e troca o setor de quem é membro ou rh
-- -----------------------------------------------------------------------------
-- Como no front (desativarMembro e alterarSetor). Em diretor (diretor_rh,
-- diretor_setor e presidente) só o diretor do RH mexe. Nome, e-mail, perfil,
-- data de entrada e reativar também são só do diretor do RH.
-- A policy decide EM QUEM o rh mexe; o trigger decide EM QUÊ (erro 42501).

drop policy if exists "membros: só o diretor do RH altera" on public.membros;
drop policy if exists "membros: diretor do RH altera; rh desativa e troca setor" on public.membros;
create policy "membros: diretor do RH altera; rh desativa e troca setor"
  on public.membros
  for update
  to authenticated
  using (
    (select public.eh_diretor_rh())
    or ((select public.eh_rh()) and public.perfil_tem_meta(perfil))
  )
  with check (
    (select public.eh_diretor_rh())
    or ((select public.eh_rh()) and public.perfil_tem_meta(perfil))
  );

create or replace function public.membros_rh_so_desativa_e_troca_setor()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Só vale para quem vem pelo site. No SQL Editor (dono do banco) não trava.
  if current_user = 'authenticated' and not public.eh_diretor_rh() then
    if (new.id, new.nome, new.email, new.perfil, new.data_entrada, new.criado_em)
         is distinct from
       (old.id, old.nome, old.email, old.perfil, old.data_entrada, old.criado_em)
       or (new.ativo and not old.ativo)
    then
      raise exception 'O RH só desativa membros e troca o setor. O resto é com o diretor do RH.'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.membros_rh_so_desativa_e_troca_setor() from public, anon, authenticated;

create or replace trigger membros_rh_so_desativa_e_troca_setor
  before update on public.membros
  for each row execute function public.membros_rh_so_desativa_e_troca_setor();


-- 2.4 No máximo 1 diretor do RH ativo e 1 presidente ativo (erro 23505)
-- -----------------------------------------------------------------------------
-- Presidente: o diretor do RH tira o atual (muda o perfil ou desativa) e depois
-- nomeia o novo. Diretor do RH: pelo site não dá pra passar o cargo, porque
-- quem passa perde o poder no meio. A troca é feita no SQL Editor:
--   update public.membros set perfil = 'rh'         where email = 'atual@ejuvv.com';
--   update public.membros set perfil = 'diretor_rh' where email = 'novo@ejuvv.com';

create unique index if not exists membros_um_diretor_rh_e_um_presidente
  on public.membros (perfil)
  where ativo and perfil in ('diretor_rh', 'presidente');

comment on index public.membros_um_diretor_rh_e_um_presidente is
  'No máximo 1 diretor_rh ativo e 1 presidente ativo.';


-- 2.5 historico_setor: toda troca de setor fica registrada sozinha
-- -----------------------------------------------------------------------------
-- O banco grava quando membros.setor_id muda (pelo site ou pelo SQL Editor).
-- O site só lê. alterado_por = quem trocou (null = direto no banco).

create table if not exists public.historico_setor (
  id                uuid primary key default gen_random_uuid(),
  membro_id         uuid not null references public.membros (id),
  setor_anterior_id uuid not null references public.setores (id),
  setor_novo_id     uuid not null references public.setores (id),
  alterado_por      uuid references public.membros (id),
  alterado_em       timestamptz not null default now(),

  constraint historico_setor_mudou check (setor_anterior_id <> setor_novo_id)
);

create index if not exists historico_setor_membro
  on public.historico_setor (membro_id, alterado_em);

comment on table public.historico_setor is
  'Trocas de setor. O banco grava quando membros.setor_id muda; o site só lê.';

create or replace function public.membros_guardar_troca_de_setor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.historico_setor (membro_id, setor_anterior_id, setor_novo_id, alterado_por)
  values (new.id, old.setor_id, new.setor_id, public.meu_id());
  return null;
end;
$$;

revoke all on function public.membros_guardar_troca_de_setor() from public, anon, authenticated;

create or replace trigger membros_guardar_troca_de_setor
  after update of setor_id on public.membros
  for each row
  when (old.setor_id is distinct from new.setor_id)
  execute function public.membros_guardar_troca_de_setor();

alter table public.historico_setor enable row level security;

drop policy if exists "historico_setor: o próprio membro e quem vê tudo" on public.historico_setor;
create policy "historico_setor: o próprio membro e quem vê tudo"
  on public.historico_setor
  for select
  to authenticated
  using (
    membro_id = (select public.meu_id())
    or (select public.ve_tudo())
  );

revoke all on public.historico_setor from anon, authenticated;
grant select on public.historico_setor to authenticated;


-- 2.6 dispensas: o RH dispensa um membro da meta de uma semana
-- -----------------------------------------------------------------------------
-- Como o registrarDispensa do front. rh e diretor do RH registram. Uma por
-- membro por semana (semana = segunda-feira). Motivo obrigatório.
-- O motivo pode ter dado de saúde: só o próprio membro e quem vê tudo (rh,
-- diretor do RH e presidente) leem. O diretor de setor não lê; para ele o
-- "dispensado" vai vir pelas funções de cálculo da semana 2.
-- O site não altera nem apaga dispensa. Lançou errado: corrige no SQL Editor.

create table if not exists public.dispensas (
  id             uuid primary key default gen_random_uuid(),
  membro_id      uuid not null references public.membros (id),
  semana         date not null,
  motivo         text not null,
  registrado_por uuid default public.meu_id() references public.membros (id),  -- null = direto no banco
  criado_em      timestamptz not null default now(),

  constraint dispensas_semana_na_segunda check (extract(isodow from semana) = 1),
  constraint dispensas_motivo_valido     check (motivo ~ '\S' and char_length(motivo) <= 1000),
  constraint dispensas_uma_por_semana    unique (membro_id, semana)
);

comment on table public.dispensas is
  'Semanas em que o RH dispensou o membro da meta. O motivo pode ter dado de saúde: leitura restrita.';

alter table public.dispensas enable row level security;

drop policy if exists "dispensas: o próprio membro e quem vê tudo leem" on public.dispensas;
create policy "dispensas: o próprio membro e quem vê tudo leem"
  on public.dispensas
  for select
  to authenticated
  using (
    membro_id = (select public.meu_id())
    or (select public.ve_tudo())
  );

drop policy if exists "dispensas: só o RH registra" on public.dispensas;
create policy "dispensas: só o RH registra"
  on public.dispensas
  for insert
  to authenticated
  with check (
    (select public.eh_rh())
    and registrado_por = (select public.meu_id())
  );

revoke all on public.dispensas from anon, authenticated;
grant select on public.dispensas to authenticated;
grant insert (membro_id, semana, motivo) on public.dispensas to authenticated;


-- 2.7 meus_dados(): quem está logado, com o nome do setor
-- -----------------------------------------------------------------------------
-- É o meusDados() do login (B4): uma chamada só, supabase.rpc('meus_dados').
-- Volta vazio se o e-mail não tem cadastro ou está desativado: aí o front
-- mostra "sem acesso" e faz logout.

create or replace function public.meus_dados()
returns table (
  id           uuid,
  nome         text,
  email        text,
  perfil       public.perfil,
  setor        text,
  ativo        boolean,
  data_entrada date
)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.nome, m.email, m.perfil, s.nome, m.ativo, m.data_entrada
  from public.membros m
  join public.setores s on s.id = m.setor_id
  where m.email = lower(auth.jwt() ->> 'email')
    and m.ativo
$$;

comment on function public.meus_dados() is
  'Dados do membro logado (ativo), com o nome do setor. Usado por meusDados(). Vazio = sem acesso.';


-- 2.8 elegivel_na_semana(): quem entra no cálculo da meta numa semana
-- -----------------------------------------------------------------------------
-- Igual ao membrosElegiveis do front: ativo, perfil com meta (membro ou rh) e
-- entrada ANTES da segunda-feira da semana. Quem entra no meio da semana só
-- conta a partir da semana seguinte. p_semana = segunda-feira da semana.
-- A dispensa não entra aqui: é tratada no cálculo (semana 2).

create or replace function public.elegivel_na_semana(
  p_perfil       public.perfil,
  p_ativo        boolean,
  p_data_entrada date,
  p_semana       date
)
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  select p_ativo and public.perfil_tem_meta(p_perfil) and p_data_entrada < p_semana
$$;

comment on function public.elegivel_na_semana(public.perfil, boolean, date, date) is
  'true se o membro entra no cálculo da meta da semana (p_semana = segunda-feira).';

revoke execute on function
  public.meus_dados(),
  public.elegivel_na_semana(public.perfil, boolean, date, date)
from public, anon;

grant execute on function
  public.meus_dados(),
  public.elegivel_na_semana(public.perfil, boolean, date, date)
to authenticated;


-- 2.9 registros: descrição obrigatória no lançamento manual (erro 23514)
-- -----------------------------------------------------------------------------
-- Como o validarRegistro do front. No cronômetro continua livre por enquanto.

alter table public.registros drop constraint if exists registros_descricao_obrigatoria;
alter table public.registros
  add constraint registros_descricao_obrigatoria
  check (origem = 'cronometro' or descricao ~ '\S');


