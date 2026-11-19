-- =============================================================================
-- AstroClock · B10 · cronômetro encerra sozinho depois de 10h
-- =============================================================================
-- Migração. Vem depois da correcoes_da_revisao_b7. Pode rodar de novo sem erro.
--
--   1. Parar o cronômetro, por qualquer caminho (site, tarefa agendada ou SQL
--      Editor), passa por um gatilho só:
--        - pelo site, o fim é a hora do servidor (o que o site mandar é ignorado);
--        - passou de 10h: fica com 10h e vai para a revisão do RH;
--        - passou da meia-noite (Brasília): o banco divide, um registro por dia
--          (seção 2 do regras-de-negocio). O registro do cronômetro fica com o
--          primeiro dia e o banco cria os outros, com a mesma descrição, local e
--          revisão. O update devolve a primeira parte.
--      Antes quem dividia era o front (pararCronometro, no cronometro.ts). Com o
--      fim vindo do servidor, o front não sabe mais onde cortar: agora ele só
--      manda o update, e o banco divide.
--   2. Tarefa agendada (pg_cron), a cada 5 minutos: encerra os cronômetros
--      ligados há mais de 10h, mesmo sem ninguém abrir o site.
--   3. Cronômetro novo pelo site precisa de descrição (o front já exige).
-- =============================================================================


-- 1. Parar o cronômetro ------------------------------------------------------------

-- 1.1 Antes de gravar: fim, teto de 10h e corte na meia-noite.
--     Roda como quem fez o update, para saber se veio do site.
create or replace function public.registros_ao_parar_cronometro()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_fim_real   timestamptz;
  v_meia_noite timestamptz;
begin
  if not (new.origem = 'cronometro' and old.fim is null and new.fim is not null and not new.cancelado) then
    return new;
  end if;

  -- pelo site, vale a hora do servidor
  if current_user = 'authenticated' then
    new.fim := now();
  end if;

  v_fim_real := new.fim;

  -- mais de 10h: fica com 10h e vai para a revisão do RH
  if v_fim_real - new.inicio > interval '10 hours' then
    v_fim_real := new.inicio + interval '10 hours';
    new.precisa_revisao := true;
  end if;

  -- passou da meia-noite: este registro fica só com o primeiro dia, e o gatilho
  -- de depois do update cria o resto (o fim de verdade fica guardado até lá)
  v_meia_noite := (((new.inicio at time zone 'America/Sao_Paulo')::date + 1)::timestamp)
                  at time zone 'America/Sao_Paulo';
  if v_fim_real > v_meia_noite then
    new.fim := v_meia_noite;
    perform set_config('astroclock.fim_real_' || replace(new.id::text, '-', '_'), v_fim_real::text, true);
  else
    new.fim := v_fim_real;
  end if;

  return new;
end;
$$;

revoke all on function public.registros_ao_parar_cronometro() from public, anon, authenticated;

create or replace trigger registros_ao_parar_cronometro
  before update on public.registros
  for each row execute function public.registros_ao_parar_cronometro();

-- 1.2 Depois de gravar: cria as partes dos dias seguintes.
--     Roda como dono do banco: as partes podem ser de mais de 7 dias atrás
--     (cronômetro esquecido) e já nascem com fim.
create or replace function public.registros_partes_do_cronometro()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_chave    text;
  v_fim_real timestamptz;
  v_ini      timestamptz;
  v_fim      timestamptz;
begin
  v_chave    := 'astroclock.fim_real_' || replace(new.id::text, '-', '_');
  v_fim_real := nullif(current_setting(v_chave, true), '')::timestamptz;
  if v_fim_real is null then
    return null;
  end if;
  perform set_config(v_chave, '', true);

  v_ini := new.fim;
  while v_ini < v_fim_real loop
    v_fim := least(v_fim_real,
                   (((v_ini at time zone 'America/Sao_Paulo')::date + 1)::timestamp) at time zone 'America/Sao_Paulo');
    insert into public.registros (membro_id, inicio, fim, local, descricao, origem, precisa_revisao)
    values (new.membro_id, v_ini, v_fim, new.local, new.descricao, 'cronometro', new.precisa_revisao);
    v_ini := v_fim;
  end loop;

  return null;
end;
$$;

revoke all on function public.registros_partes_do_cronometro() from public, anon, authenticated;

create or replace trigger registros_partes_do_cronometro
  after update on public.registros
  for each row
  when (new.origem = 'cronometro' and old.fim is null and new.fim is not null)
  execute function public.registros_partes_do_cronometro();

-- 1.3 Regras do site: o fim e o teto ao parar saíram daqui (estão no 1.1).
--     Entrou: cronômetro novo precisa de descrição.
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
    if new.origem = 'cronometro' and new.descricao !~ '\S' then
      raise exception 'A descrição é obrigatória.' using errcode = '23514';
    end if;
    if new.fim > now() + interval '1 minute' then
      raise exception 'O fim não pode ser no futuro.' using errcode = '23514';
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
    -- o fim (hora do servidor), o teto de 10h e a meia-noite são do gatilho 1.1
    if new.inicio is distinct from old.inicio then
      raise exception 'Ao parar o cronômetro, o início não muda.' using errcode = '23514';
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
    if new.fim is distinct from old.fim and new.fim > now() + interval '1 minute' then
      raise exception 'O fim não pode ser no futuro.' using errcode = '23514';
    end if;
    -- editar um cronômetro já parado para mais de 10h: fica com 10h e vai para revisão
    if new.origem = 'cronometro' and new.fim is not null
       and new.fim - new.inicio > interval '10 hours'
    then
      new.fim := new.inicio + interval '10 hours';
      new.precisa_revisao := true;
    end if;
  end if;

  return new;
end;
$$;


-- 2. Tarefa agendada: encerra os cronômetros ligados há mais de 10h ---------------

create or replace function public.encerrar_cronometros_esquecidos()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  -- o gatilho 1.1 corta em 10h, manda para revisão e divide na meia-noite
  update public.registros
     set fim = now()
   where origem = 'cronometro'
     and fim is null
     and not cancelado
     and inicio <= now() - interval '10 hours';
  get diagnostics n = row_count;
  return n;
end;
$$;

comment on function public.encerrar_cronometros_esquecidos() is
  'Encerra os cronômetros ligados há mais de 10h (ficam com 10h e em revisão). Roda pelo pg_cron a cada 5 minutos.';

revoke all on function public.encerrar_cronometros_esquecidos() from public, anon, authenticated;

-- pg_cron, como na documentação do Supabase (Integrations → Cron)
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- mesmo nome = atualiza a tarefa (rodar de novo não duplica)
select cron.schedule(
  'encerrar-cronometros-esquecidos',
  '*/5 * * * *',
  'select public.encerrar_cronometros_esquecidos()'
);
