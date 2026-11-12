-- =============================================================================
-- AstroClock · Semana 1 · B2
-- Tabelas base: setores, membros, metas e registros
-- =============================================================================
-- Decisões de modelagem (B1 — revisar com Victor e anotar no docs/arquitetura.md):
--   • ids uuid (gen_random_uuid). No TypeScript viram string.
--   • perfil, local e origem são enum: o "gen types" gera união de strings
--     ('membro' | 'rh' | 'diretor_rh', 'sede' | 'online', 'manual' | 'cronometro').
--   • Nada é apagado: não existe grant de delete. Registro é cancelado;
--     membro e setor são desativados.
--   • Totais nunca são armazenados: nenhuma coluna de horas somadas.
--   • metas só recebe insert (é o histórico). A meta de uma semana é a linha
--     com o maior vigente_desde <= segunda-feira da semana; empate = a criada
--     por último. "Sempre futura" entra na policy de insert (semana 2).
--   • RLS ligado nas 4 tabelas. Nesta semana só membros ganha policies (B3);
--     setores, metas e registros ficam fechadas até as policies da semana 2.
--   • "Expose new tables" está desligado: os grants no fim são obrigatórios.
--     anon não recebe nada, porque o site só lê dados depois do login.
--   • Ficam para a semana 2: prazos de 7 dias, virada da meia-noite e quem
--     pode mudar precisa_revisao/cancelado.
-- =============================================================================

create extension if not exists btree_gist with schema extensions;


-- Tipos ----------------------------------------------------------------------

create type public.perfil as enum ('membro', 'rh', 'diretor_rh');
create type public.local_registro as enum ('sede', 'online');
create type public.origem_registro as enum ('manual', 'cronometro');


-- setores --------------------------------------------------------------------

create table public.setores (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null,
  ativo     boolean not null default true,
  criado_em timestamptz not null default now(),

  constraint setores_nome_valido check (btrim(nome) <> '' and char_length(nome) <= 80)
);

create unique index setores_nome_unico on public.setores (lower(nome));

comment on table public.setores is 'Setores da EJ. Nunca apagar: desativar (ativo = false).';


-- membros --------------------------------------------------------------------

create table public.membros (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  email        text not null,
  perfil       public.perfil not null default 'membro',
  setor_id     uuid not null references public.setores (id),
  ativo        boolean not null default true,
  data_entrada date not null default (now() at time zone 'America/Sao_Paulo')::date,
  criado_em    timestamptz not null default now(),

  constraint membros_email_unico unique (email),
  constraint membros_email_ejuvv check (email ~ '^[^@\s]+@ejuvv\.com$'),
  constraint membros_nome_valido check (btrim(nome) <> '' and char_length(nome) <= 120)
);

create index membros_setor_id on public.membros (setor_id);

comment on table public.membros is
  'Quem pode entrar e com qual perfil. O login acha a pessoa pelo e-mail do Google. Nunca apagar: desativar.';

-- E-mail sempre minúsculo e sem espaços (o RH pode digitar de qualquer jeito).
create function public.membros_normalizar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.email := lower(btrim(new.email));
  new.nome  := btrim(new.nome);
  return new;
end;
$$;

create trigger membros_normalizar
  before insert or update of email, nome on public.membros
  for each row execute function public.membros_normalizar();


-- metas ----------------------------------------------------------------------

create table public.metas (
  id            uuid primary key default gen_random_uuid(),
  horas_total   numeric(5,2) not null,
  horas_sede    numeric(5,2) not null,
  vigente_desde date not null,
  alterado_por  uuid references public.membros (id),  -- null = criada direto no banco
  criado_em     timestamptz not null default now(),

  constraint metas_horas_total_valida check (horas_total > 0 and horas_total <= 168),
  constraint metas_horas_sede_valida  check (horas_sede >= 0 and horas_sede <= horas_total),
  constraint metas_comeca_na_segunda  check (extract(isodow from vigente_desde) = 1)
);

create index metas_vigencia on public.metas (vigente_desde desc, criado_em desc);

comment on table public.metas is
  'Histórico de metas semanais (só insert). Vale a de maior vigente_desde <= segunda da semana; empate = a mais recente.';


-- registros ------------------------------------------------------------------

create table public.registros (
  id              uuid primary key default gen_random_uuid(),
  membro_id       uuid not null references public.membros (id),
  inicio          timestamptz not null default now(),
  fim             timestamptz,              -- null = cronômetro ligado
  local           public.local_registro not null,
  descricao       text not null default '',
  origem          public.origem_registro not null default 'manual',
  cancelado       boolean not null default false,
  precisa_revisao boolean not null default false,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),

  constraint registros_fim_depois_do_inicio check (fim is null or fim > inicio),
  constraint registros_manual_tem_fim check (origem = 'cronometro' or fim is not null),
  constraint registros_descricao_tamanho check (char_length(descricao) <= 1000)
);

-- Um cronômetro ligado por membro. Criado ANTES da exclusion constraint de
-- propósito: o Postgres confere os índices na ordem de criação, então um 2º
-- cronômetro dá erro 23505 neste índice ("já tem cronômetro ligado"), e não
-- erro de sobreposição.
create unique index registros_um_cronometro_ativo
  on public.registros (membro_id)
  where fim is null and not cancelado;

-- Sobreposição bloqueada por membro, ignorando cancelados (erro 23P01).
-- '[)' deixa um registro começar exatamente quando o outro termina.
-- Cronômetro ligado (fim null) ocupa de inicio em diante.
alter table public.registros
  add constraint registros_sem_sobreposicao exclude using gist (
    membro_id with =,
    tstzrange(inicio, fim, '[)') with &&
  ) where (not cancelado);

create index registros_membro_inicio on public.registros (membro_id, inicio);

comment on table public.registros is 'Horas lançadas (manual ou cronômetro). Nunca apagar: cancelar.';
comment on column public.registros.fim is 'null = cronômetro ligado.';
comment on column public.registros.precisa_revisao is
  'Cronômetro encerrado sozinho após 10h: não conta na meta até o RH aprovar.';

-- criado_em e atualizado_em são do banco (o prazo de 7 dias depende deles);
-- membro e origem não mudam depois de criados.
create function public.registros_antes_de_gravar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.criado_em := now();
  else
    if new.membro_id is distinct from old.membro_id then
      raise exception 'Não é possível trocar o membro de um registro.'
        using errcode = '23514';
    end if;
    if new.origem is distinct from old.origem then
      raise exception 'Não é possível trocar a origem de um registro.'
        using errcode = '23514';
    end if;
    new.criado_em := old.criado_em;
  end if;
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger registros_antes_de_gravar
  before insert or update on public.registros
  for each row execute function public.registros_antes_de_gravar();


-- Funções de trigger não são chamadas pelo site -------------------------------

revoke all on function public.membros_normalizar() from public, anon, authenticated;
revoke all on function public.registros_antes_de_gravar() from public, anon, authenticated;


-- RLS (toda tabela nasce com RLS) ---------------------------------------------

alter table public.setores   enable row level security;
alter table public.membros   enable row level security;
alter table public.metas     enable row level security;
alter table public.registros enable row level security;


-- Grants (só o que o site usa; sem delete; nada para anon) --------------------
-- O revoke deixa a migração certa mesmo se o "expose" estiver ligado em algum
-- projeto (aí o Supabase daria ALL para anon e authenticated).

revoke all on public.setores, public.membros, public.metas, public.registros from anon, authenticated;

grant select, insert, update on public.setores   to authenticated;
grant select, insert, update on public.membros   to authenticated;
grant select, insert         on public.metas     to authenticated;
grant select, insert, update on public.registros to authenticated;
