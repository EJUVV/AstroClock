-- =============================================================================
-- AstroClock · B7 · regras de registros, auditoria e ajustes de acesso
-- =============================================================================
-- Migração. Vem DEPOIS da migração da B6 (a que o db pull gerou).
-- Pode rodar de novo sem erro.
--
--   1. meu_setor_id(): setor de quem está logado (pedido na B3).
--   2. auditoria: o que o RH faz no registro de outro membro, com o motivo.
--   3. registros: quem lê e quem mexe
--        membro e rh         leem os próprios. Lançam, alteram e cancelam os
--                            próprios, com o prazo de 7 dias.
--        rh e diretor do RH  leem todos. Mexem em qualquer um (inclusive fora
--                            do prazo) só pelas funções do RH, com motivo:
--                            criar_registro_de_membro, editar_registro_de_membro,
--                            cancelar_registro_de_membro e revisar_cronometro.
--        presidente          lê todos.
--        diretor de setor    lê os dos membros do próprio setor.
--   4. metas e setores: grant de insert/update na tabela inteira. Antes era por
--      coluna, e o painel mostrava só "select" (parecia que faltava).
--   5. dispensas: removida (decidido em 09/11: o caminho é o requerimento).
--   6. rls_auto_enable: sem execute para anon e authenticated (aviso do Advisors).
-- =============================================================================


-- 1. meu_setor_id() -------------------------------------------------------------

create or replace function public.meu_setor_id()
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
$$;

comment on function public.meu_setor_id() is 'Setor do membro logado (ativo) ou null.';

revoke execute on function public.meu_setor_id() from public, anon;
grant  execute on function public.meu_setor_id() to authenticated;


-- 2. auditoria ------------------------------------------------------------------
-- Só as funções do banco gravam (ninguém escreve direto). Leem: rh, diretor do
-- RH e presidente. antes/depois guardam a linha inteira do registro.

create table if not exists public.auditoria (
  id          uuid primary key default gen_random_uuid(),
  tabela      text not null,
  registro_id uuid not null,
  acao        text not null,
  quem        uuid references public.membros (id),  -- null = direto no banco
  quando      timestamptz not null default now(),
  motivo      text not null,
  antes       jsonb,
  depois      jsonb,

  constraint auditoria_motivo_valido check (motivo ~ '\S' and char_length(motivo) <= 1000)
);

create index if not exists auditoria_registro on public.auditoria (tabela, registro_id, quando);

comment on table public.auditoria is
  'O que o RH fez em registro de outro membro (criar, editar, cancelar, revisar cronômetro), com motivo. Só funções do banco gravam.';

alter table public.auditoria enable row level security;

drop policy if exists "auditoria: quem vê tudo lê" on public.auditoria;
create policy "auditoria: quem vê tudo lê"
  on public.auditoria
  for select
  to authenticated
  using ((select public.ve_tudo()));

revoke all on public.auditoria from anon, authenticated;
grant select on public.auditoria to authenticated;


-- 3. registros -------------------------------------------------------------------

-- 3.1 Leitura: os próprios · rh, diretor do RH e presidente veem todos ·
--     diretor de setor vê os dos membros do setor dele
drop policy if exists "registros: leitura por perfil" on public.registros;
create policy "registros: leitura por perfil"
  on public.registros
  for select
  to authenticated
  using (
    membro_id = (select public.meu_id())
    or (select public.ve_tudo())
    or membro_id in (
      select m.id
      from public.membros m
      where m.setor_id = (select public.setor_que_dirijo())
    )
  );

-- 3.2 Escrita direta pelo site: cada um só nos próprios registros.
--     (Diretor não passa daqui: o trigger registros_so_quem_tem_meta barra.)
drop policy if exists "registros: cada um lança os próprios" on public.registros;
create policy "registros: cada um lança os próprios"
  on public.registros
  for insert
  to authenticated
  with check (membro_id = (select public.meu_id()));

drop policy if exists "registros: cada um altera os próprios" on public.registros;
create policy "registros: cada um altera os próprios"
  on public.registros
  for update
  to authenticated
  using (membro_id = (select public.meu_id()))
  with check (membro_id = (select public.meu_id()));

-- 3.3 Regras de quem mexe direto pelo site (erro 23514, ou 42501 ao aprovar)
--   Lançar:   só para datas de hoje até 7 dias atrás (horário de Brasília).
--             Registro novo não nasce cancelado nem em revisão.
--             Cronômetro começa agora e sem fim.
--   Alterar ou cancelar: até 7 dias depois de lançar. Cancelado não muda mais.
--             Registro encerrado não volta a ficar ligado. Só o RH tira da revisão.
--   Parar o cronômetro: vale a qualquer momento (mesmo esquecido há dias); o
--             início não muda e o fim não pode ser no futuro.
--   Cronômetro com mais de 10h: fica com 10h e vai para a revisão do RH.
-- O SQL Editor e as funções do RH rodam como dono do banco e não passam aqui.

create or replace function public.registros_regras_do_site()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  hoje    constant date := (now() at time zone 'America/Sao_Paulo')::date;
  parando boolean;
begin
  if current_user <> 'authenticated' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.cancelado or new.precisa_revisao then
      raise exception 'Registro novo não pode nascer cancelado ou em revisão.'
        using errcode = '23514';
    end if;
    if new.origem = 'cronometro'
       and (new.fim is not null
            or new.inicio not between now() - interval '5 minutes' and now() + interval '1 minute')
    then
      raise exception 'O cronômetro começa agora e sem fim.' using errcode = '23514';
    end if;
    if (new.inicio at time zone 'America/Sao_Paulo')::date not between hoje - 7 and hoje then
      raise exception 'Só dá para lançar horas de hoje até 7 dias atrás. Para outras datas, peça ao RH.'
        using errcode = '23514';
    end if;
    return new;
  end if;

  -- UPDATE
  if old.cancelado then
    raise exception 'Registro cancelado não pode mais ser alterado.' using errcode = '23514';
  end if;
  if old.fim is not null and new.fim is null then
    raise exception 'Registro encerrado não volta a ficar ligado.' using errcode = '23514';
  end if;
  if old.precisa_revisao and not new.precisa_revisao then
    raise exception 'Só o RH tira um cronômetro da revisão.' using errcode = '42501';
  end if;

  parando := new.origem = 'cronometro' and old.fim is null and new.fim is not null;

  if parando then
    if new.inicio is distinct from old.inicio then
      raise exception 'Ao parar o cronômetro, o início não muda.' using errcode = '23514';
    end if;
    if new.fim > now() + interval '1 minute' then
      raise exception 'O cronômetro não pode parar no futuro.' using errcode = '23514';
    end if;
  else
    if old.criado_em < now() - interval '7 days' then
      raise exception 'Só dá para alterar ou cancelar até 7 dias depois de lançar. Depois disso, peça ao RH.'
        using errcode = '23514';
    end if;
    if new.inicio is distinct from old.inicio
       and (new.inicio at time zone 'America/Sao_Paulo')::date not between hoje - 7 and hoje
    then
      raise exception 'Só dá para lançar horas de hoje até 7 dias atrás. Para outras datas, peça ao RH.'
        using errcode = '23514';
    end if;
  end if;

  if new.origem = 'cronometro' and new.fim is not null
     and new.fim - new.inicio > interval '10 hours'
  then
    new.fim := new.inicio + interval '10 hours';
    new.precisa_revisao := true;
  end if;

  return new;
end;
$$;

revoke all on function public.registros_regras_do_site() from public, anon, authenticated;

create or replace trigger registros_regras_do_site
  before insert or update on public.registros
  for each row execute function public.registros_regras_do_site();

-- 3.4 Funções do RH: rh e diretor do RH, motivo obrigatório, sem prazo.
--     Cada uma grava na auditoria. Pelo site: supabase.rpc('nome', { ... }).

-- (interna: as funções abaixo chamam; o site não chama)
create or replace function public.exigir_rh_com_motivo(p_motivo text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not public.eh_rh() then
    raise exception 'Só o RH e o diretor do RH corrigem registros de outros membros.'
      using errcode = '42501';
  end if;
  if p_motivo is null or p_motivo !~ '\S' then
    raise exception 'O motivo é obrigatório.' using errcode = '23514';
  end if;
end;
$$;

-- criarRegistroDeMembro(membroId, dados, motivo)
create or replace function public.criar_registro_de_membro(
  p_membro_id uuid,
  p_inicio    timestamptz,
  p_fim       timestamptz,
  p_local     public.local_registro,
  p_descricao text,
  p_motivo    text
)
returns public.registros
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.registros;
begin
  perform public.exigir_rh_com_motivo(p_motivo);

  insert into public.registros (membro_id, inicio, fim, local, descricao, origem)
  values (p_membro_id, p_inicio, p_fim, p_local, coalesce(p_descricao, ''), 'manual')
  returning * into r;

  insert into public.auditoria (tabela, registro_id, acao, quem, motivo, depois)
  values ('registros', r.id, 'criar', public.meu_id(), btrim(p_motivo), to_jsonb(r));

  return r;
end;
$$;

-- editarRegistroDeMembro(id, dados, motivo) · campo null = não muda
create or replace function public.editar_registro_de_membro(
  p_id        uuid,
  p_motivo    text,
  p_inicio    timestamptz           default null,
  p_fim       timestamptz           default null,
  p_local     public.local_registro default null,
  p_descricao text                  default null
)
returns public.registros
language plpgsql
security definer
set search_path = ''
as $$
declare
  antes public.registros;
  r     public.registros;
begin
  perform public.exigir_rh_com_motivo(p_motivo);

  select * into antes from public.registros where id = p_id for update;
  if not found then
    raise exception 'Registro não encontrado.' using errcode = 'P0002';
  end if;
  if antes.cancelado then
    raise exception 'Registro cancelado não pode mais ser alterado.' using errcode = '23514';
  end if;

  update public.registros
     set inicio    = coalesce(p_inicio, inicio),
         fim       = coalesce(p_fim, fim),
         local     = coalesce(p_local, local),
         descricao = coalesce(p_descricao, descricao)
   where id = p_id
  returning * into r;

  insert into public.auditoria (tabela, registro_id, acao, quem, motivo, antes, depois)
  values ('registros', r.id, 'editar', public.meu_id(), btrim(p_motivo), to_jsonb(antes), to_jsonb(r));

  return r;
end;
$$;

-- cancelarRegistroDeMembro(id, motivo)
create or replace function public.cancelar_registro_de_membro(
  p_id     uuid,
  p_motivo text
)
returns public.registros
language plpgsql
security definer
set search_path = ''
as $$
declare
  antes public.registros;
  r     public.registros;
begin
  perform public.exigir_rh_com_motivo(p_motivo);

  select * into antes from public.registros where id = p_id for update;
  if not found then
    raise exception 'Registro não encontrado.' using errcode = 'P0002';
  end if;
  if antes.cancelado then
    raise exception 'Esse registro já está cancelado.' using errcode = '23514';
  end if;

  update public.registros set cancelado = true where id = p_id
  returning * into r;

  insert into public.auditoria (tabela, registro_id, acao, quem, motivo, antes, depois)
  values ('registros', r.id, 'cancelar', public.meu_id(), btrim(p_motivo), to_jsonb(antes), to_jsonb(r));

  return r;
end;
$$;

-- revisarCronometro(id, aprovar) · aprovar: volta a contar na meta ·
-- reprovar: o registro é cancelado. Motivo opcional (tem um texto padrão).
create or replace function public.revisar_cronometro(
  p_id      uuid,
  p_aprovar boolean,
  p_motivo  text default null
)
returns public.registros
language plpgsql
security definer
set search_path = ''
as $$
declare
  antes public.registros;
  r     public.registros;
begin
  if not public.eh_rh() then
    raise exception 'Só o RH e o diretor do RH revisam cronômetros.' using errcode = '42501';
  end if;
  if p_aprovar is null then
    raise exception 'Informe se aprova ou reprova.' using errcode = '23514';
  end if;

  select * into antes from public.registros where id = p_id for update;
  if not found then
    raise exception 'Registro não encontrado.' using errcode = 'P0002';
  end if;
  if not antes.precisa_revisao or antes.cancelado then
    raise exception 'Esse registro não está esperando revisão.' using errcode = '23514';
  end if;

  update public.registros
     set precisa_revisao = false,
         cancelado       = not p_aprovar
   where id = p_id
  returning * into r;

  insert into public.auditoria (tabela, registro_id, acao, quem, motivo, antes, depois)
  values ('registros', r.id,
          case when p_aprovar then 'aprovar_cronometro' else 'reprovar_cronometro' end,
          public.meu_id(),
          coalesce(nullif(btrim(p_motivo), ''),
                   case when p_aprovar then 'Cronômetro aprovado na revisão'
                        else 'Cronômetro reprovado na revisão' end),
          to_jsonb(antes), to_jsonb(r));

  return r;
end;
$$;

revoke all on function public.exigir_rh_com_motivo(text) from public, anon, authenticated;

revoke execute on function
  public.criar_registro_de_membro(uuid, timestamptz, timestamptz, public.local_registro, text, text),
  public.editar_registro_de_membro(uuid, text, timestamptz, timestamptz, public.local_registro, text),
  public.cancelar_registro_de_membro(uuid, text),
  public.revisar_cronometro(uuid, boolean, text)
from public, anon;

grant execute on function
  public.criar_registro_de_membro(uuid, timestamptz, timestamptz, public.local_registro, text, text),
  public.editar_registro_de_membro(uuid, text, timestamptz, timestamptz, public.local_registro, text),
  public.cancelar_registro_de_membro(uuid, text),
  public.revisar_cronometro(uuid, boolean, text)
to authenticated;


-- 4. metas e setores: grant na tabela inteira -----------------------------------
-- Quem pode continua sendo decidido pelas policies (metas: só o diretor do RH,
-- da próxima semana em diante; setores: diretor do RH e presidente).
-- Na meta, alterado_por tem que ser quem está logado (policy) e o criado_em é
-- sempre do banco (trigger abaixo): o "vale a mais nova" não dá para burlar.

revoke insert on public.metas from authenticated;
grant  insert on public.metas to authenticated;

create or replace function public.metas_antes_de_gravar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.criado_em := now();
  return new;
end;
$$;

revoke all on function public.metas_antes_de_gravar() from public, anon, authenticated;

create or replace trigger metas_antes_de_gravar
  before insert on public.metas
  for each row execute function public.metas_antes_de_gravar();

revoke insert, update on public.setores from authenticated;
grant  insert, update on public.setores to authenticated;


-- 5. dispensas: removida ----------------------------------------------------------
-- O membro pede pelo requerimento (ausência total ou só remoto) e o diretor do
-- RH responde. As policies da tabela saem junto.

drop table if exists public.dispensas;


-- 6. rls_auto_enable: sem execute para anon e authenticated ---------------------
-- É a função do gatilho que liga o RLS sozinho em tabela nova. O gatilho
-- continua funcionando: o Postgres não confere execute quando dispara gatilho.

do $$
declare
  f regprocedure;
begin
  for f in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where p.proname = 'rls_auto_enable'
      and n.nspname not in ('pg_catalog', 'information_schema')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
  end loop;
end;
$$;
