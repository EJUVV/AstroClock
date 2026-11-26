-- =============================================================================
-- AstroClock · diretorias acumuladas (vacância)
-- (seção 5 do regras-de-negocio.md; desenho em
--  docs/superpowers/specs/2026-11-26-diretorias-acumuladas-design.md;
--  decidido pelo líder do projeto em 26/11/2026)
-- =============================================================================
-- Migração nova, depois da ranking_e_podio. Não edita as anteriores: recria
-- aqui as funções e as policies que mudam de significado.
--
-- Regras:
--   - Cada setor tem no máximo um diretor (chave de diretorias), mas uma pessoa
--     pode dirigir vários setores. Quem acumula tem, em cada setor, os mesmos
--     poderes do titular.
--   - Diretor do RH = quem dirige o setor marcado com setores.eh_rh (inclusive
--     o presidente). O perfil diretor_rh sozinho não dá mais os poderes.
--   - Só dirigem setores: diretor_setor, diretor_rh e presidente (ativos).
--   - Registram e tiram diretorias: quem dirige o RH e o presidente. Atribuir
--     um setor que já tem diretor troca o diretor (fecha o anterior no
--     histórico).
--   - Desativar alguém, ou mudar o perfil para membro ou rh, encerra as
--     diretorias dele (gatilho). O histórico fica.
--   - Continua havendo um único presidente ativo.
--
-- O que muda:
--   1. setores.eh_rh (no máximo um true; a migração marca o setor "RH"). Só o
--      dono do banco marca: pelo site, não.
--   2. diretorias e historico_diretorias (só as funções do banco gravam).
--   3. Carga inicial: cada diretor_setor ativo dirige o próprio setor; o
--      diretor_rh ativo, o setor RH.
--   4. Funções novas: dirige_rh (interna), setores_que_dirijo,
--      minhas_diretorias, situacao_dos_setores, atribuir_diretoria e
--      remover_diretoria.
--   5. Mudam de significado (mesma assinatura, os chamadores continuam iguais):
--        eh_diretor_rh() = dirige o setor RH
--        eh_rh()         = perfil rh ou dirige o setor RH
--        ve_tudo()       = perfil rh ou presidente ou dirige o setor RH
--   6. setor_que_dirijo() sai, trocada por setores_que_dirijo() na leitura de
--      membros e de registros, no resumo_da_semana e no ranking_do_mes.
--   7. setores: criam e alteram quem dirige o RH e o presidente.
--   8. Índices: sai o de um diretor_setor ativo por setor (a chave de
--      diretorias faz o papel); o de diretor_rh e presidente vira só o do
--      presidente.
--   9. Gatilho que encerra as diretorias de quem sai ou deixa de ser diretor.
--
-- Pelo site (supabase.rpc): minhas_diretorias, situacao_dos_setores,
-- atribuir_diretoria e remover_diretoria (diretorias.ts).
-- =============================================================================


-- 1. setores.eh_rh ---------------------------------------------------------------
-- Marca o setor RH sem depender do nome (o nome pode mudar).

alter table public.setores
  add column if not exists eh_rh boolean not null default false;

create unique index if not exists setores_um_rh
  on public.setores (eh_rh)
  where eh_rh;

comment on column public.setores.eh_rh is
  'true no setor RH (no máximo um). Quem dirige este setor tem os poderes do diretor do RH.';
comment on index public.setores_um_rh is 'No máximo um setor marcado como RH.';

update public.setores set eh_rh = true where lower(nome) = 'rh';

-- Pelo site ninguém marca nem desmarca o setor RH: trocar a marca mudaria quem
-- tem os poderes do diretor do RH sem passar pelas diretorias. No SQL Editor
-- (dono do banco) não trava.
create or replace function public.setores_eh_rh_so_no_banco()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated'
     and ((tg_op = 'INSERT' and new.eh_rh)
          or (tg_op = 'UPDATE' and new.eh_rh is distinct from old.eh_rh))
  then
    raise exception 'O setor RH só é marcado direto no banco.' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.setores_eh_rh_so_no_banco() from public, anon, authenticated;

create or replace trigger setores_eh_rh_so_no_banco
  before insert or update on public.setores
  for each row execute function public.setores_eh_rh_so_no_banco();


-- 2. diretorias e historico_diretorias -------------------------------------------
-- diretorias: uma linha = o setor tem diretor. A chave é o setor: dois
-- diretores no mesmo setor não cabem (erro 23505).
-- historico_diretorias: quem dirigiu cada setor e quando (fim null = vale).

create table if not exists public.diretorias (
  setor_id       uuid primary key references public.setores (id),
  membro_id      uuid not null references public.membros (id),
  desde          timestamptz not null default now(),
  registrado_por uuid references public.membros (id)   -- null = direto no banco
);

create index if not exists diretorias_membro on public.diretorias (membro_id);

comment on table public.diretorias is
  'Quem dirige cada setor agora (um diretor por setor; uma pessoa pode dirigir vários). Só funções do banco gravam.';

create table if not exists public.historico_diretorias (
  id             uuid primary key default gen_random_uuid(),
  setor_id       uuid not null references public.setores (id),
  membro_id      uuid not null references public.membros (id),
  inicio         timestamptz not null default now(),
  fim            timestamptz,                           -- null = ainda vale
  registrado_por uuid references public.membros (id),   -- null = direto no banco
  encerrado_por  uuid references public.membros (id),   -- null = direto no banco

  constraint historico_diretorias_fim_depois check (fim is null or fim >= inicio)
);

create unique index if not exists historico_diretorias_uma_aberta_por_setor
  on public.historico_diretorias (setor_id)
  where fim is null;

create index if not exists historico_diretorias_membro
  on public.historico_diretorias (membro_id, inicio);

comment on table public.historico_diretorias is
  'Quem dirigiu cada setor e quando (fim null = ainda vale). Só funções do banco gravam.';


-- 3. Carga inicial ------------------------------------------------------------------
-- Primeiro o diretor_rh (setor RH); depois cada diretor_setor no próprio setor
-- (se um diretor_setor fosse do setor RH, fica com o diretor_rh). O histórico
-- começa na data da migração.

insert into public.diretorias (setor_id, membro_id, desde)
select s.id, m.id, now()
from public.membros m
cross join public.setores s
where m.ativo and m.perfil = 'diretor_rh' and s.eh_rh
on conflict (setor_id) do nothing;

insert into public.diretorias (setor_id, membro_id, desde)
select m.setor_id, m.id, now()
from public.membros m
where m.ativo and m.perfil = 'diretor_setor'
on conflict (setor_id) do nothing;

insert into public.historico_diretorias (setor_id, membro_id, inicio)
select d.setor_id, d.membro_id, d.desde
from public.diretorias d
where not exists (
  select 1 from public.historico_diretorias h
  where h.setor_id = d.setor_id and h.fim is null
);


-- 4. Funções de quem sou eu ---------------------------------------------------------

-- (interna) a pessoa dirige o setor RH? Só vale para diretor ou presidente ativo.
create or replace function public.dirige_rh(p_membro_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.diretorias d
    join public.setores s on s.id = d.setor_id
    join public.membros m on m.id = d.membro_id
    where d.membro_id = p_membro_id
      and s.eh_rh
      and m.ativo
      and m.perfil in ('diretor_setor', 'diretor_rh', 'presidente')
  )
$$;

-- Setores que o logado dirige (vazio para quem não dirige nenhum).
create or replace function public.setores_que_dirijo()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select d.setor_id
  from public.diretorias d
  join public.membros m on m.id = d.membro_id
  where m.email = lower(auth.jwt() ->> 'email')
    and m.ativo
    and m.perfil in ('diretor_setor', 'diretor_rh', 'presidente')
$$;

-- Mudam de significado: o poder do diretor do RH vem da diretoria do setor RH.
create or replace function public.eh_diretor_rh()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.dirige_rh(public.meu_id())
$$;

create or replace function public.eh_rh()
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
             and m.perfil = 'rh'
         )
         or public.eh_diretor_rh()
$$;

create or replace function public.ve_tudo()
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
             and m.perfil in ('rh', 'presidente')
         )
         or public.eh_diretor_rh()
$$;

comment on function public.dirige_rh(uuid) is
  'Interna: true se o membro (diretor ou presidente ativo) dirige o setor RH.';
comment on function public.setores_que_dirijo() is
  'ids dos setores que o logado dirige (vazio para quem não dirige nenhum).';
comment on function public.eh_diretor_rh() is
  'true se o logado dirige o setor RH (é o diretor do RH, inclusive o presidente).';
comment on function public.eh_rh() is
  'true se o logado é rh (ativo) ou dirige o setor RH.';
comment on function public.ve_tudo() is
  'true se o logado é rh ou presidente (ativo) ou dirige o setor RH.';

-- eh_diretor_rh, eh_rh e ve_tudo já existiam: o replace mantém os grants.
revoke all on function public.dirige_rh(uuid) from public, anon, authenticated;
revoke execute on function public.setores_que_dirijo() from public, anon;
grant  execute on function public.setores_que_dirijo() to authenticated;


-- 5. RLS de diretorias e historico_diretorias --------------------------------------
-- Leem quem tem painel do RH: quem vê tudo e quem dirige algum setor.
-- Ninguém escreve direto: só as funções abaixo (sem grant de escrita).

alter table public.diretorias enable row level security;
alter table public.historico_diretorias enable row level security;

drop policy if exists "diretorias: quem tem painel do RH lê" on public.diretorias;
create policy "diretorias: quem tem painel do RH lê"
  on public.diretorias
  for select
  to authenticated
  using (
    (select public.ve_tudo())
    or exists (select 1 from public.setores_que_dirijo())
  );

drop policy if exists "historico_diretorias: quem tem painel do RH lê" on public.historico_diretorias;
create policy "historico_diretorias: quem tem painel do RH lê"
  on public.historico_diretorias
  for select
  to authenticated
  using (
    (select public.ve_tudo())
    or exists (select 1 from public.setores_que_dirijo())
  );

revoke all on public.diretorias from anon, authenticated;
revoke all on public.historico_diretorias from anon, authenticated;
grant select on public.diretorias to authenticated;
grant select on public.historico_diretorias to authenticated;


-- 6. Funções para o site -------------------------------------------------------------

-- minhasDiretorias(): setores que o logado dirige (o site monta o cargo e as
-- permissões). eh_rh = true: é o setor RH.
create or replace function public.minhas_diretorias()
returns table (
  setor        text,
  eh_rh        boolean,
  diretor_id   uuid,
  diretor_nome text,
  desde        timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.nome, s.eh_rh, m.id, m.nome, d.desde
  from public.diretorias d
  join public.setores s on s.id = d.setor_id
  join public.membros m on m.id = d.membro_id
  where d.setor_id in (select public.setores_que_dirijo())
  order by s.nome
$$;

-- situacaoDosSetores(): setores ativos com o diretor atual (null = vago). Só
-- quem tem painel do RH (vê tudo ou dirige algum setor) recebe linhas.
create or replace function public.situacao_dos_setores()
returns table (
  setor        text,
  eh_rh        boolean,
  diretor_id   uuid,
  diretor_nome text,
  desde        timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.nome, s.eh_rh, m.id, m.nome, d.desde
  from public.setores s
  left join public.diretorias d on d.setor_id = s.id
  left join public.membros m on m.id = d.membro_id
  where s.ativo
    and ((select public.ve_tudo())
         or exists (select 1 from public.setores_que_dirijo()))
  order by s.nome
$$;

-- atribuirDiretoria(setor, membroId): só quem dirige o RH e o presidente.
-- Setor com diretor: troca (fecha o anterior no histórico). Mesma pessoa: nada muda.
create or replace function public.atribuir_diretoria(p_setor text, p_membro_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_eu    uuid := public.meu_id();
  v_setor uuid;
  v_atual uuid;
begin
  if not (public.eh_diretor_rh() or public.meu_perfil() is not distinct from 'presidente') then
    raise exception 'Só o diretor do RH e o presidente registram diretorias.' using errcode = '42501';
  end if;

  -- trava o setor: duas atribuições ao mesmo tempo esperam uma pela outra
  select s.id into v_setor
  from public.setores s
  where lower(s.nome) = lower(btrim(p_setor))
    and s.ativo
  for update;
  if v_setor is null then
    raise exception 'Setor não encontrado.' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.membros m
    where m.id = p_membro_id
      and m.ativo
      and m.perfil in ('diretor_setor', 'diretor_rh', 'presidente')
  ) then
    raise exception 'Só diretores e o presidente dirigem setores.' using errcode = '23514';
  end if;

  select d.membro_id into v_atual from public.diretorias d where d.setor_id = v_setor;
  if v_atual is not distinct from p_membro_id then
    return;   -- já é o diretor
  end if;

  update public.historico_diretorias h
     set fim = now(), encerrado_por = v_eu
   where h.setor_id = v_setor and h.fim is null;

  insert into public.diretorias as d (setor_id, membro_id, desde, registrado_por)
  values (v_setor, p_membro_id, now(), v_eu)
  on conflict (setor_id) do update
    set membro_id = excluded.membro_id,
        desde = excluded.desde,
        registrado_por = excluded.registrado_por;

  insert into public.historico_diretorias (setor_id, membro_id, inicio, registrado_por)
  values (v_setor, p_membro_id, now(), v_eu);
end;
$$;

-- removerDiretoria(setor): só quem dirige o RH e o presidente. O setor fica vago.
create or replace function public.remover_diretoria(p_setor text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_eu    uuid := public.meu_id();
  v_setor uuid;
begin
  if not (public.eh_diretor_rh() or public.meu_perfil() is not distinct from 'presidente') then
    raise exception 'Só o diretor do RH e o presidente registram diretorias.' using errcode = '42501';
  end if;

  select s.id into v_setor
  from public.setores s
  where lower(s.nome) = lower(btrim(p_setor))
  for update;
  if v_setor is null then
    raise exception 'Setor não encontrado.' using errcode = 'P0002';
  end if;

  delete from public.diretorias d where d.setor_id = v_setor;
  if not found then
    raise exception 'Este setor já está vago.' using errcode = 'P0002';
  end if;

  update public.historico_diretorias h
     set fim = now(), encerrado_por = v_eu
   where h.setor_id = v_setor and h.fim is null;
end;
$$;

comment on function public.minhas_diretorias() is
  'Setores que o logado dirige (eh_rh = setor RH). Vazio para quem não dirige. Usado por minhasDiretorias().';
comment on function public.situacao_dos_setores() is
  'Setores ativos com o diretor atual (diretor null = vago). Só quem tem painel do RH recebe linhas. Usado por situacaoDosSetores().';
comment on function public.atribuir_diretoria(text, uuid) is
  'Registra quem dirige o setor (troca o diretor, se houver). Só o diretor do RH e o presidente. Usado por atribuirDiretoria().';
comment on function public.remover_diretoria(text) is
  'Deixa o setor vago. Só o diretor do RH e o presidente. Usado por removerDiretoria().';

revoke execute on function
  public.minhas_diretorias(),
  public.situacao_dos_setores(),
  public.atribuir_diretoria(text, uuid),
  public.remover_diretoria(text)
from public, anon;

grant execute on function
  public.minhas_diretorias(),
  public.situacao_dos_setores(),
  public.atribuir_diretoria(text, uuid),
  public.remover_diretoria(text)
to authenticated;


-- 7. Gatilho: quem sai ou deixa de ser diretor perde as diretorias --------------------
-- Desativado, ou perfil membro ou rh: apaga de diretorias e fecha o histórico
-- (encerrado_por = quem fez; null = direto no banco). Reativar ou voltar a ser
-- diretor não devolve: a diretoria é sempre atribuída de propósito.

create or replace function public.membros_encerrar_diretorias()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.historico_diretorias h
     set fim = now(), encerrado_por = public.meu_id()
   where h.membro_id = new.id and h.fim is null;

  delete from public.diretorias d where d.membro_id = new.id;
  return null;
end;
$$;

revoke all on function public.membros_encerrar_diretorias() from public, anon, authenticated;

create or replace trigger membros_encerrar_diretorias
  after update on public.membros
  for each row
  when (not new.ativo or new.perfil in ('membro', 'rh'))
  execute function public.membros_encerrar_diretorias();


-- 8. Leitura de membros e de registros: os setores que dirijo -------------------------

drop policy if exists "membros: leitura por perfil" on public.membros;
create policy "membros: leitura por perfil"
  on public.membros
  for select
  to authenticated
  using (
    id = (select public.meu_id())
    or (select public.ve_tudo())
    or setor_id in (select public.setores_que_dirijo())
  );

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
      where m.setor_id in (select public.setores_que_dirijo())
    )
  );


-- 9. setores: criam e alteram quem dirige o RH e o presidente -------------------------

drop policy if exists "setores: diretor do RH e presidente criam" on public.setores;
create policy "setores: diretor do RH e presidente criam"
  on public.setores
  for insert
  to authenticated
  with check (
    (select public.eh_diretor_rh())
    or (select public.meu_perfil()) = 'presidente'
  );

drop policy if exists "setores: diretor do RH e presidente alteram" on public.setores;
create policy "setores: diretor do RH e presidente alteram"
  on public.setores
  for update
  to authenticated
  using (
    (select public.eh_diretor_rh())
    or (select public.meu_perfil()) = 'presidente'
  )
  with check (
    (select public.eh_diretor_rh())
    or (select public.meu_perfil()) = 'presidente'
  );


-- 10. resumo_da_semana (B9): os setores que dirijo ----------------------------------
-- Quem vê tudo (e o membro): como antes, o setor pedido ou todos.
-- Quem dirige setores: o setor pedido, se for um dos dele; senão, todos os dele.
-- Mesma assinatura e mesmas colunas. O RLS de membros continua valendo.

create or replace function public.resumo_da_semana(p_semana date, p_setor text default null)
returns table (
  membro_id    uuid,
  nome         text,
  email        text,
  perfil       public.perfil,
  setor        text,
  ativo        boolean,
  data_entrada date,
  horas_sede   numeric,
  horas_total  numeric,
  meta_sede    numeric,
  meta_total   numeric,
  cumpriu      boolean,
  dispensada   boolean
)
language sql
stable
set search_path = ''
as $$
  with s as (
    select public.segunda_da_semana(p_semana) as seg
  ),
  meta as (
    select mt.horas_total, mt.horas_sede from public.meta_da_semana(p_semana) mt
  ),
  pedido as (
    select st.id from public.setores st where st.nome = p_setor
  ),
  meus as (
    select x.setor_id from public.setores_que_dirijo() x(setor_id)
  ),
  filtro as (
    -- null = todos os setores; senão, só os da lista
    select case
             when public.ve_tudo() or not exists (select 1 from meus) then
               case when p_setor is null then null::uuid[] else array(select p.id from pedido p) end
             when exists (select 1 from meus mm join pedido p on p.id = mm.setor_id) then
               array(select p.id from pedido p)
             else
               array(select mm.setor_id from meus mm)
           end as setores
  )
  select m.id, m.nome, m.email, m.perfil, st.nome, m.ativo, m.data_entrada,
         round(coalesce(h.horas_sede, 0), 2),
         round(coalesce(h.horas_total, 0), 2),
         meta.horas_sede,
         meta.horas_total,
         coalesce(h.horas_total, 0) >= meta.horas_total and coalesce(h.horas_sede, 0) >= meta.horas_sede,
         false
  from public.membros m
  join public.setores st on st.id = m.setor_id
  cross join s
  cross join meta
  cross join filtro
  left join public.horas_da_semana(s.seg) h on h.membro_id = m.id
  where public.elegivel_na_semana(m.perfil, m.ativo, m.data_entrada, s.seg)
    and meta.horas_total is not null
    and (filtro.setores is null or m.setor_id = any (filtro.setores))
  order by m.nome
$$;


-- 11. ranking_do_mes: os setores que dirijo (posição dentro de cada setor) ----------

create or replace function public.ranking_do_mes(p_mes text)
returns table (
  posicao      int,
  membro_id    uuid,
  nome         text,
  email        text,
  perfil       public.perfil,
  setor        text,
  ativo        boolean,
  data_entrada date,
  horas_total  numeric,
  horas_sede   numeric,
  dispensado   boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select case when public.ve_tudo() then r.posicao_ej else r.posicao_setor end,
         r.membro_id, r.nome, m.email, m.perfil, r.setor, m.ativo, m.data_entrada,
         r.horas_total, r.horas_sede, r.dispensado
  from public.ranking_interno(p_mes) r
  join public.membros m on m.id = r.membro_id
  where public.ve_tudo()
     or r.setor_id in (select public.setores_que_dirijo())
  order by 1, r.nome
$$;

comment on function public.ranking_do_mes(text) is
  'Ranking completo do mês (AAAA-MM): rh, presidente e quem dirige o RH veem a EJ; quem dirige setores, só esses setores (posição no setor); membro, nada.';


-- 12. setor_que_dirijo() sai ----------------------------------------------------------

drop function if exists public.setor_que_dirijo();


-- 13. Índices de perfil -----------------------------------------------------------------
-- Um diretor por setor agora é a chave de diretorias. Fica só "um presidente".

drop index if exists public.membros_um_diretor_de_setor_ativo;
drop index if exists public.membros_um_diretor_rh_e_um_presidente;

create unique index if not exists membros_um_presidente
  on public.membros (perfil)
  where ativo and perfil = 'presidente';

comment on index public.membros_um_presidente is 'No máximo 1 presidente ativo.';
