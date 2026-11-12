-- =============================================================================
-- AstroClock · ajuste de 08/11/2026 · passo 2 de 2
-- Regras dos 5 perfis: membro, rh, diretor_rh, diretor_setor e presidente
-- =============================================================================
-- Rodar DEPOIS do novos_perfis.sql, em outra execução.
--
-- Quem faz o quê em membros (as outras tabelas ganham RLS na semana 2):
--   membro         vê só a própria linha · registra horas · tem meta
--   rh             vê todos · registra horas · tem meta · NÃO cadastra nem altera
--   diretor_rh     vê todos · cadastra e altera membros, perfis e setor · sem meta
--   diretor_setor  vê só os membros do próprio setor · sem meta · só consulta
--   presidente     vê todos · sem meta · só consulta
--
--   • Só membro e rh têm meta e registram horas. Diretores ficam fora do
--     cálculo semanal, do ranking e das médias. A definição de "tem meta" fica
--     num lugar só, perfil_tem_meta(): todo cálculo parte dela.
--   • Cada setor tem no máximo um diretor_setor ativo (índice único parcial).
--   • Quem já tinha registros e vira diretor mantém o histórico; só não lança
--     registros novos.
--   • As funções de apoio olham o e-mail do JWT e só valem para membro ativo,
--     como meu_id() e eh_rh(). eh_rh() continua sendo "rh ou diretor_rh".
-- =============================================================================


-- Quem tem meta ----------------------------------------------------------------

create function public.perfil_tem_meta(p public.perfil)
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  select p in ('membro', 'rh')
$$;

comment on function public.perfil_tem_meta(public.perfil) is
  'true para membro e rh. Única definição de quem tem meta: semana, ranking e médias partem dela.';


-- Quem sou eu (mesmo molde de meu_id e eh_rh) ----------------------------------

create function public.eh_diretor_rh()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.membros m
    where m.email = lower(auth.jwt() ->> 'email')
      and m.ativo
      and m.perfil = 'diretor_rh'
  )
$$;

-- rh, diretor_rh e presidente enxergam todos os membros (e, na semana 2,
-- registros, requerimentos e anexos). diretor_setor não entra aqui.
create function public.ve_tudo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.membros m
    where m.email = lower(auth.jwt() ->> 'email')
      and m.ativo
      and m.perfil in ('rh', 'diretor_rh', 'presidente')
  )
$$;

-- Setor que o logado dirige. null se não for diretor_setor ativo.
create function public.setor_que_dirijo()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.setor_id
  from public.membros m
  where m.email = lower(auth.jwt() ->> 'email')
    and m.ativo
    and m.perfil = 'diretor_setor'
$$;

comment on function public.eh_diretor_rh() is 'true se o logado é diretor_rh ativo.';
comment on function public.ve_tudo() is 'true se o logado é rh, diretor_rh ou presidente (ativo).';
comment on function public.setor_que_dirijo() is 'id do setor do logado se ele é diretor_setor ativo, senão null.';

revoke execute on function
  public.perfil_tem_meta(public.perfil),
  public.eh_diretor_rh(),
  public.ve_tudo(),
  public.setor_que_dirijo()
from public, anon;

grant execute on function
  public.perfil_tem_meta(public.perfil),
  public.eh_diretor_rh(),
  public.ve_tudo(),
  public.setor_que_dirijo()
to authenticated;


-- Um diretor de setor ativo por setor (erro 23505) -----------------------------
-- Diretor desativado libera a vaga. Reativar um antigo com a vaga ocupada falha.

create unique index membros_um_diretor_de_setor_ativo
  on public.membros (setor_id)
  where perfil = 'diretor_setor' and ativo;

comment on index public.membros_um_diretor_de_setor_ativo is
  'Cada setor tem no máximo um diretor de setor ativo.';


-- Só quem tem meta registra horas (erro 23514) ---------------------------------
-- Vale na hora de lançar. O RH lançar para outro membro continua permitido,
-- desde que o membro de destino tenha meta (membro ou rh).

create function public.registros_so_quem_tem_meta()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.membros m
    where m.id = new.membro_id
      and public.perfil_tem_meta(m.perfil)
  ) then
    raise exception 'Este perfil não registra horas.' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.registros_so_quem_tem_meta() from public, anon, authenticated;

create trigger registros_so_quem_tem_meta
  before insert on public.registros
  for each row execute function public.registros_so_quem_tem_meta();


-- RLS de membros: troca as 3 policies antigas ----------------------------------
-- Leitura: própria linha · rh, diretor_rh e presidente veem todos ·
--          diretor_setor vê os membros do próprio setor.
-- Escrita: só o diretor_rh cadastra e altera (nome, e-mail, perfil, setor,
--          ativo). Ninguém apaga: sem policy e sem grant de delete.

drop policy if exists "membros: cada um vê a própria linha, RH vê todas" on public.membros;
drop policy if exists "membros: só RH cadastra" on public.membros;
drop policy if exists "membros: só RH altera" on public.membros;

create policy "membros: leitura por perfil"
  on public.membros
  for select
  to authenticated
  using (
    id = (select public.meu_id())
    or (select public.ve_tudo())
    or setor_id = (select public.setor_que_dirijo())
  );

create policy "membros: só o diretor do RH cadastra"
  on public.membros
  for insert
  to authenticated
  with check ((select public.eh_diretor_rh()));

create policy "membros: só o diretor do RH altera"
  on public.membros
  for update
  to authenticated
  using ((select public.eh_diretor_rh()))
  with check ((select public.eh_diretor_rh()));
