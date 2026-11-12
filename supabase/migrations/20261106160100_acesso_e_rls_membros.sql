-- =============================================================================
-- AstroClock · Semana 1 · B3
-- meu_id(), eh_rh(), meu_perfil() e RLS de membros
-- =============================================================================
--   • As 3 funções são security definer: leem membros sem passar pelo RLS
--     (senão a policy de membros chamaria ela mesma). search_path vazio e
--     nomes sempre com schema.
--   • Acham a pessoa pelo e-mail do JWT (auth.jwt() ->> 'email') e só valem
--     para membro ativo. Conta sem cadastro, ou desativada, tem sessão mas
--     meu_id() = null, meu_perfil() = null e eh_rh() = false: não vê nada.
--   • Nas policies, sempre (select public.x()): roda 1 vez por consulta,
--     e não 1 vez por linha.
--   • O front chama meu_perfil() pelo rpc (meuPerfil()). meu_id() e eh_rh()
--     são para as policies, mas não tem problema chamar: só devolvem dados de
--     quem está logado.
-- =============================================================================

create function public.meu_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.id
  from public.membros m
  where m.email = lower(auth.jwt() ->> 'email')
    and m.ativo
$$;

create function public.meu_perfil()
returns public.perfil
language sql
stable
security definer
set search_path = ''
as $$
  select m.perfil
  from public.membros m
  where m.email = lower(auth.jwt() ->> 'email')
    and m.ativo
$$;

create function public.eh_rh()
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
      and m.perfil in ('rh', 'diretor_rh')
  )
$$;

comment on function public.meu_id() is 'id do membro logado (ativo) ou null.';
comment on function public.meu_perfil() is 'Perfil do membro logado (ativo) ou null. Usado por meuPerfil().';
comment on function public.eh_rh() is 'true se o logado é rh ou diretor_rh (ativo).';

-- "Expose new tables" desligado: função também precisa de grant explícito.
revoke execute on function public.meu_id(), public.meu_perfil(), public.eh_rh() from public, anon;
grant  execute on function public.meu_id(), public.meu_perfil(), public.eh_rh() to authenticated;


-- Defaults que dependem do logado ---------------------------------------------

alter table public.registros alter column membro_id    set default public.meu_id();
alter table public.metas     alter column alterado_por set default public.meu_id();


-- RLS de membros ----------------------------------------------------------------
-- Membro vê só a própria linha; RH vê todas (inclusive desativados).
-- Só RH cadastra e altera. Ninguém apaga (sem policy e sem grant de delete).
-- Só diretor_rh mexe em quem é diretor_rh ou dá esse perfil: assim um rh não
-- se promove sozinho para editar metas.

create policy "membros: cada um vê a própria linha, RH vê todas"
  on public.membros
  for select
  to authenticated
  using (
    id = (select public.meu_id())
    or (select public.eh_rh())
  );

create policy "membros: só RH cadastra"
  on public.membros
  for insert
  to authenticated
  with check (
    (select public.eh_rh())
    and (perfil <> 'diretor_rh' or (select public.meu_perfil()) = 'diretor_rh')
  );

create policy "membros: só RH altera"
  on public.membros
  for update
  to authenticated
  using (
    (select public.eh_rh())
    and (perfil <> 'diretor_rh' or (select public.meu_perfil()) = 'diretor_rh')
  )
  with check (
    (select public.eh_rh())
    and (perfil <> 'diretor_rh' or (select public.meu_perfil()) = 'diretor_rh')
  );
