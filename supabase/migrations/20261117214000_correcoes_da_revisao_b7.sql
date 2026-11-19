-- =============================================================================
-- AstroClock · correções da revisão da B7
-- =============================================================================
-- Migração. Não mexe nas 6 anteriores: só redefine o que mudou.
--   1. revisar_cronometro: o presidente também revisa (rh, diretor do RH e
--      presidente = ve_tudo()). Diretor de setor e membro continuam com erro.
--   2. Parar o cronômetro pelo site: o banco grava fim = agora, ignorando o
--      horário que vier. Passou de 10h: fica com 10h e vai para revisão.
--   3. Fim no futuro: não pode ao lançar nem ao editar (folga de 1 minuto),
--      pelo site e pelas funções do RH.
--   4. setores: grant de novo só nas colunas nome e ativo (id e criado_em não
--      mudam). Metas fica com o grant na tabela: o gatilho já protege.
-- =============================================================================


-- 1. revisar_cronometro: presidente também revisa ------------------------------

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
  if not public.ve_tudo() then
    raise exception 'Só o RH, o diretor do RH e o presidente revisam cronômetros.' using errcode = '42501';
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


-- 2 e 3. Regras do site: parar grava agora; fim no futuro não pode -------------

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
    if new.inicio is distinct from old.inicio then
      raise exception 'Ao parar o cronômetro, o início não muda.' using errcode = '23514';
    end if;
    new.fim := now();   -- vale o horário do banco, não o que o site mandou
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

-- 3. Fim no futuro também nas funções do RH --------------------------------------

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

  if p_fim > now() + interval '1 minute' then
    raise exception 'O fim não pode ser no futuro.' using errcode = '23514';
  end if;

  insert into public.registros (membro_id, inicio, fim, local, descricao, origem)
  values (p_membro_id, p_inicio, p_fim, p_local, coalesce(p_descricao, ''), 'manual')
  returning * into r;

  insert into public.auditoria (tabela, registro_id, acao, quem, motivo, depois)
  values ('registros', r.id, 'criar', public.meu_id(), btrim(p_motivo), to_jsonb(r));

  return r;
end;
$$;

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

  if p_fim > now() + interval '1 minute' then
    raise exception 'O fim não pode ser no futuro.' using errcode = '23514';
  end if;

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


-- 4. setores: só nome e ativo ----------------------------------------------------
-- O painel mostra só "select" porque o grant é por coluna; funciona mesmo assim.

revoke insert, update on public.setores from authenticated;
grant insert (nome, ativo), update (nome, ativo) on public.setores to authenticated;
