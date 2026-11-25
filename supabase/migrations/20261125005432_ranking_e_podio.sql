-- =============================================================================
-- AstroClock · ranking do mês com pódio e ranking dos setores
-- (seção 12 do regras-de-negocio.md; decidido pelo líder do projeto em 24/11/2026)
-- =============================================================================
-- Migração. Só funções de leitura: nenhum total fica guardado em tabela.
-- Depende das funções do cálculo da semana (B9): segunda_da_semana,
-- meta_da_semana e horas_da_semana.
--
-- Regras:
--   - Mês = 'AAAA-MM'. A semana conta no mês da segunda-feira, e só contam as
--     semanas que já têm meta (igual ao progresso_do_mes da B9).
--   - Entra no ranking do mês quem é elegível (elegivel_na_semana) em pelo
--     menos uma dessas semanas. Diretores e presidência ficam de fora.
--   - Só contam registros encerrados, não cancelados e fora de revisão (B9).
--   - Ordem: horas totais; desempate por horas na sede; dispensados no fim.
--     Empate nas duas divide a posição (rank).
--   - Dispensado no mês = todas as semanas dispensadas. Requerimentos (B8)
--     ainda não existem: ninguém está dispensado.
--   - Pódio: até a 5ª posição na EJ e até a 3ª no setor de quem chama, só com
--     quem tem horas e não foi dispensado. Empate na última vaga mostra todos.
--   - Faltam para o pódio: 0 para quem está no pódio; meia hora se o pódio
--     ainda tem vaga (menos de 5 na EJ ou de 3 no setor); senão, horas para
--     alcançar o último do pódio, arredondadas para cima em meia hora (mínimo
--     de meia hora).
--   - Setores: só setores ativos com alguém que conte; média por membro, sem os
--     dispensados; ordem pela média total, desempate pela média na sede.
--
-- Quem vê o quê (as funções são security definer e decidem por dentro):
--   ranking_do_mes            rh, diretor do RH e presidente: a EJ toda;
--                             diretor de setor: só o setor dele (posição no
--                             setor); membro: nada.
--   podio_do_mes,             qualquer pessoa logada e ativa; só nome, setor e
--   minha_posicao_no_ranking, horas dos outros, nunca e-mail ou registros.
--   ranking_dos_setores
--
-- Pelo site (supabase.rpc): podio_do_mes, minha_posicao_no_ranking,
-- ranking_dos_setores (ranking.ts) e ranking_do_mes (rh.ts, depois da J10).
-- =============================================================================


-- Horas de cada membro que entra no ranking do mês (interna) -------------------
create or replace function public.horas_do_mes(p_mes text)
returns table (
  membro_id   uuid,
  setor_id    uuid,
  horas_total numeric,
  horas_sede  numeric,
  dispensado  boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with segundas as (
    select d::date as seg
    from generate_series(to_date(p_mes || '-01', 'YYYY-MM-DD'),
                         to_date(p_mes || '-01', 'YYYY-MM-DD') + interval '1 month - 1 day',
                         interval '1 day') as d
    where extract(isodow from d) = 1
  ),
  com_meta as (
    select s.seg
    from segundas s
    cross join lateral public.meta_da_semana(s.seg) mt
    where mt.horas_total is not null
  ),
  quem_entra as (
    select distinct m.id, m.setor_id
    from public.membros m
    join com_meta c on public.elegivel_na_semana(m.perfil, m.ativo, m.data_entrada, c.seg)
  ),
  horas as (
    select h.membro_id, sum(h.horas_total) as total, sum(h.horas_sede) as sede
    from com_meta c
    cross join lateral public.horas_da_semana(c.seg) h
    group by h.membro_id
  )
  select q.id, q.setor_id,
         round(coalesce(h.total, 0), 2),
         round(coalesce(h.sede, 0), 2),
         false
  from quem_entra q
  left join horas h on h.membro_id = q.id
$$;


-- Ranking com as posições na EJ e no setor (interna) ---------------------------
create or replace function public.ranking_interno(p_mes text)
returns table (
  membro_id     uuid,
  setor_id      uuid,
  nome          text,
  setor         text,
  horas_total   numeric,
  horas_sede    numeric,
  dispensado    boolean,
  posicao_ej    int,
  posicao_setor int
)
language sql
stable
security definer
set search_path = ''
as $$
  select h.membro_id, h.setor_id, m.nome, st.nome, h.horas_total, h.horas_sede, h.dispensado,
         (rank() over (order by h.dispensado, h.horas_total desc, h.horas_sede desc))::int,
         (rank() over (partition by h.setor_id
                       order by h.dispensado, h.horas_total desc, h.horas_sede desc))::int
  from public.horas_do_mes(p_mes) h
  join public.membros m on m.id = h.membro_id
  join public.setores st on st.id = h.setor_id
$$;


-- rankingDoMes(mes): lista completa, só para quem pode ver ----------------------
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
     or (public.setor_que_dirijo() is not null and r.setor_id = public.setor_que_dirijo())
  order by 1, r.nome
$$;


-- podioDoMes(mes): 5 primeiros da EJ e 3 primeiros do setor de quem chama -------
create or replace function public.podio_do_mes(p_mes text)
returns table (
  escopo      text,
  posicao     int,
  membro_id   uuid,
  nome        text,
  setor       text,
  horas_total numeric,
  horas_sede  numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  with r as (
    select * from public.ranking_interno(p_mes)
    where public.meu_id() is not null
      and horas_total > 0
      and not dispensado
  )
  select 'ej'::text, r.posicao_ej, r.membro_id, r.nome, r.setor, r.horas_total, r.horas_sede
  from r where r.posicao_ej <= 5
  union all
  select 'setor'::text, r.posicao_setor, r.membro_id, r.nome, r.setor, r.horas_total, r.horas_sede
  from r where r.posicao_setor <= 3 and r.setor_id = public.meu_setor_id()
  order by 1, 2, 4
$$;


-- minhaPosicaoNoRanking(mes): sem linha = não entra no ranking do mês ----------
create or replace function public.minha_posicao_no_ranking(p_mes text)
returns table (
  posicao_ej              int,
  total_ej                int,
  posicao_setor           int,
  total_setor             int,
  horas_total             numeric,
  faltam_para_podio_ej    numeric,
  faltam_para_podio_setor numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  with r as (
    select * from public.ranking_interno(p_mes)
  ),
  eu as (
    select * from r where r.membro_id = public.meu_id()
  ),
  podio as (
    select * from r where r.horas_total > 0 and not r.dispensado
  ),
  corte as (   -- quantos estão no pódio e as horas do último dele
    select (select count(*) from podio p where p.posicao_ej <= 5) as ej_n,
           (select min(p.horas_total) from podio p where p.posicao_ej <= 5) as ej,
           (select count(*) from podio p, eu
             where p.posicao_setor <= 3 and p.setor_id = eu.setor_id) as setor_n,
           (select min(p.horas_total) from podio p, eu
             where p.posicao_setor <= 3 and p.setor_id = eu.setor_id) as setor
  )
  select eu.posicao_ej,
         (select count(*) from r)::int,
         eu.posicao_setor,
         (select count(*) from r where r.setor_id = eu.setor_id)::int,
         eu.horas_total,
         case
           when eu.horas_total > 0 and not eu.dispensado and eu.posicao_ej <= 5 then 0
           when c.ej_n < 5 then 0.5   -- ainda há vaga: meia hora já põe no pódio
           else greatest(0.5, ceil((c.ej - eu.horas_total) * 2) / 2)
         end,
         case
           when eu.horas_total > 0 and not eu.dispensado and eu.posicao_setor <= 3 then 0
           when c.setor_n < 3 then 0.5
           else greatest(0.5, ceil((c.setor - eu.horas_total) * 2) / 2)
         end
  from eu
  cross join corte c
$$;


-- rankingDosSetores(mes): média por membro, sem os dispensados ------------------
create or replace function public.ranking_dos_setores(p_mes text)
returns table (
  posicao          int,
  setor            text,
  membros_contados int,
  media_total      numeric,
  media_sede       numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  with s as (
    select st.nome as setor,
           count(*)::int as n,
           round(avg(r.horas_total), 2) as media_total,
           round(avg(r.horas_sede), 2) as media_sede
    from public.ranking_interno(p_mes) r
    join public.setores st on st.id = r.setor_id
    where st.ativo
      and not r.dispensado
      and public.meu_id() is not null
    group by st.nome
  )
  select (rank() over (order by s.media_total desc, s.media_sede desc))::int,
         s.setor, s.n, s.media_total, s.media_sede
  from s
  order by 1, 2
$$;


-- Quem chama ---------------------------------------------------------------------
revoke execute on function
  public.horas_do_mes(text),
  public.ranking_interno(text)
from public, anon, authenticated;

revoke execute on function
  public.ranking_do_mes(text),
  public.podio_do_mes(text),
  public.minha_posicao_no_ranking(text),
  public.ranking_dos_setores(text)
from public, anon;

grant execute on function
  public.ranking_do_mes(text),
  public.podio_do_mes(text),
  public.minha_posicao_no_ranking(text),
  public.ranking_dos_setores(text)
to authenticated;

comment on function public.ranking_do_mes(text) is
  'Ranking completo do mês (AAAA-MM): rh, diretor do RH e presidente veem a EJ; diretor de setor, só o setor (posição no setor); membro, nada.';
comment on function public.podio_do_mes(text) is
  'Pódio do mês: escopo ej (até a 5ª posição) e setor (até a 3ª, setor de quem chama). Só nome, setor e horas.';
comment on function public.minha_posicao_no_ranking(text) is
  'Posição de quem chama no mês, na EJ e no setor, e horas que faltam para o pódio. Sem linha = não entra no ranking.';
comment on function public.ranking_dos_setores(text) is
  'Setores ativos ordenados pela média de horas por membro no mês, sem os dispensados.';
