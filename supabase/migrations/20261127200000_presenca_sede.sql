-- =============================================================================
-- AstroClock · presença na sede em tempo real (B13)
-- (seção 13 do regras-de-negocio.md; desenho em
-- docs/superpowers/specs/2026-11-27-presenca-sede-design.md)
-- =============================================================================
-- Migração nova. A presença não registra horas: só avisa quem está na sede agora.
--
-- Regras:
--   - Cada pessoa marca e desmarca só a própria presença; uma aberta por vez.
--   - Todos (logados e ativos) veem quem está na sede: só nome, setor e desde.
--   - Quem esquece é desmarcado na virada do dia (meia-noite de Brasília): a
--     tarefa agendada roda a cada 10 minutos e fecha as presenças de dias
--     anteriores. As funções de leitura já ignoram presença de ontem, então
--     ninguém aparece na sede depois da meia-noite, mesmo antes da tarefa rodar.
--   - A tabela não é lida direto pelo site: tudo passa pelas funções abaixo.
--
-- Erros das regras com errcode P0002: o site (erroDoBanco) mostra a mensagem.
-- Pelo site (supabase.rpc, presenca.ts): quem_esta_na_sede, estou_na_sede,
-- marcar_na_sede e desmarcar_na_sede.
-- =============================================================================


-- 1. Tabela -------------------------------------------------------------------------

create table public.presenca_sede (
  id        uuid primary key default gen_random_uuid(),
  membro_id uuid not null references public.membros (id),
  entrada   timestamptz not null default now(),
  saida     timestamptz,
  constraint presenca_sede_saida_depois check (saida is null or saida >= entrada)
);

comment on table public.presenca_sede is
  'Presença na sede (não registra horas). saida null = está na sede agora. Lida só pelas funções.';

-- Uma única presença aberta por pessoa.
create unique index presenca_sede_uma_aberta on public.presenca_sede (membro_id) where saida is null;

alter table public.presenca_sede enable row level security;
revoke all on table public.presenca_sede from public, anon, authenticated;


-- 2. Início do dia de hoje em Brasília (interna) -------------------------------------

create or replace function public.inicio_de_hoje()
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select ((now() at time zone 'America/Sao_Paulo')::date)::timestamp at time zone 'America/Sao_Paulo'
$$;


-- 3. quemEstaNaSede(): só nome, setor e desde, de quem está ativo ------------------

create or replace function public.quem_esta_na_sede()
returns table (membro_id uuid, nome text, setor text, desde timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.nome, s.nome, p.entrada
  from public.presenca_sede p
  join public.membros m on m.id = p.membro_id
  join public.setores s on s.id = m.setor_id
  where public.meu_id() is not null
    and p.saida is null
    and p.entrada >= public.inicio_de_hoje()
    and m.ativo
  order by m.nome
$$;


-- 4. estouNaSede() -----------------------------------------------------------------

create or replace function public.estou_na_sede()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.presenca_sede p
    where p.membro_id = public.meu_id()
      and p.saida is null
      and p.entrada >= public.inicio_de_hoje()
  )
$$;


-- 5. marcarNaSede() / desmarcarNaSede() -------------------------------------------

create or replace function public.marcar_na_sede()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  eu uuid := public.meu_id();
begin
  if eu is null then
    raise exception 'Você não está logado. Entre novamente.' using errcode = '42501';
  end if;

  -- Presença esquecida de um dia anterior: fecha na meia-noite seguinte à entrada.
  update public.presenca_sede
     set saida = (((entrada at time zone 'America/Sao_Paulo')::date + 1)::timestamp at time zone 'America/Sao_Paulo')
   where membro_id = eu
     and saida is null
     and entrada < public.inicio_de_hoje();

  insert into public.presenca_sede (membro_id) values (eu);
exception
  when unique_violation then
    raise exception 'Você já está marcado como na sede' using errcode = 'P0002';
end;
$$;

create or replace function public.desmarcar_na_sede()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  eu uuid := public.meu_id();
  n  integer;
begin
  if eu is null then
    raise exception 'Você não está logado. Entre novamente.' using errcode = '42501';
  end if;

  update public.presenca_sede
     set saida = now()
   where membro_id = eu
     and saida is null
     and entrada >= public.inicio_de_hoje();
  get diagnostics n = row_count;

  if n = 0 then
    raise exception 'Você não está marcado como na sede' using errcode = 'P0002';
  end if;
end;
$$;


-- 6. Tarefa agendada: fecha as presenças esquecidas de dias anteriores -------------

create or replace function public.encerrar_presencas_de_ontem()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  update public.presenca_sede
     set saida = (((entrada at time zone 'America/Sao_Paulo')::date + 1)::timestamp at time zone 'America/Sao_Paulo')
   where saida is null
     and entrada < public.inicio_de_hoje();
  get diagnostics n = row_count;
  return n;
end;
$$;

comment on function public.encerrar_presencas_de_ontem() is
  'Fecha as presenças de dias anteriores na meia-noite seguinte (Brasília). Roda pelo pg_cron a cada 10 minutos.';

-- mesmo nome = atualiza a tarefa (rodar de novo não duplica); pg_cron já ligado na B10
select cron.schedule(
  'encerrar-presencas-de-ontem',
  '*/10 * * * *',
  'select public.encerrar_presencas_de_ontem()'
);


-- 7. Quem chama ----------------------------------------------------------------------

revoke execute on function
  public.inicio_de_hoje(),
  public.encerrar_presencas_de_ontem()
from public, anon, authenticated;

revoke execute on function
  public.quem_esta_na_sede(),
  public.estou_na_sede(),
  public.marcar_na_sede(),
  public.desmarcar_na_sede()
from public, anon;

grant execute on function
  public.quem_esta_na_sede(),
  public.estou_na_sede(),
  public.marcar_na_sede(),
  public.desmarcar_na_sede()
to authenticated;

comment on function public.quem_esta_na_sede() is
  'Quem está na sede agora (presença aberta de hoje, membro ativo): só nome, setor e desde. Para qualquer pessoa logada e ativa.';
comment on function public.estou_na_sede() is 'true se quem chama está marcado na sede hoje.';
comment on function public.marcar_na_sede() is 'Marca quem chama como na sede (fecha antes uma presença esquecida de dia anterior).';
comment on function public.desmarcar_na_sede() is 'Desmarca quem chama da sede.';
