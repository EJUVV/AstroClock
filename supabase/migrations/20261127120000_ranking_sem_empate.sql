-- =============================================================================
-- AstroClock · ranking sem posições repetidas
-- (seção 12 do regras-de-negocio.md; decidido pelo líder do projeto em 27/11/2026)
-- =============================================================================
-- Migração nova, depois da ranking_e_podio e da diretorias_acumuladas. Não edita
-- as anteriores: recria as funções que dão as posições.
--
-- O que muda:
--   - Cada pessoa tem uma posição só dela (1º, 2º, 3º...): ninguém divide posição.
--   - Ordem dos membros: horas totais; depois horas na sede; depois quem chegou
--     primeiro (o último registro que conta no mês terminou antes); se ainda
--     empatar, o nome em ordem alfabética. Dispensados continuam no fim.
--   - Ordem dos setores: média total; depois média na sede; depois o nome.
--   - O pódio continua sendo até a 5ª posição na EJ e até a 3ª no setor; agora
--     são no máximo 5 e 3 pessoas.
--   - Funções do site e parâmetros continuam iguais.
-- =============================================================================


-- Quando cada membro fechou as horas do mês (interna) ------------------------------
-- Fim do último registro que conta no mês: as mesmas semanas (com meta, no mês da
-- segunda-feira) e os mesmos registros do horas_da_semana (B9).
create or replace function public.ultimo_registro_do_mes(p_mes text)
returns table (membro_id uuid, ultimo_fim timestamptz)
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
  )
  select r.membro_id, max(r.fim)
  from public.registros r
  join com_meta c
    on r.inicio >= c.seg::timestamp at time zone 'America/Sao_Paulo'
   and r.inicio <  (c.seg + 7)::timestamp at time zone 'America/Sao_Paulo'
  where r.fim is not null
    and not r.cancelado
    and not r.precisa_revisao
  group by r.membro_id
$$;


-- Ranking com as posições na EJ e no setor, sem repetir (interna) ------------------
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
         (row_number() over (order by h.dispensado, h.horas_total desc, h.horas_sede desc,
                                      u.ultimo_fim asc nulls last, m.nome, h.membro_id))::int,
         (row_number() over (partition by h.setor_id
                             order by h.dispensado, h.horas_total desc, h.horas_sede desc,
                                      u.ultimo_fim asc nulls last, m.nome, h.membro_id))::int
  from public.horas_do_mes(p_mes) h
  join public.membros m on m.id = h.membro_id
  join public.setores st on st.id = h.setor_id
  left join public.ultimo_registro_do_mes(p_mes) u on u.membro_id = h.membro_id
$$;


-- rankingDosSetores(mes): média por membro, sem os dispensados, sem repetir -------
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
  select (row_number() over (order by s.media_total desc, s.media_sede desc, s.setor))::int,
         s.setor, s.n, s.media_total, s.media_sede
  from s
  order by 1
$$;


-- Quem chama ---------------------------------------------------------------------
revoke execute on function public.ultimo_registro_do_mes(text) from public, anon, authenticated;

comment on function public.ranking_dos_setores(text) is
  'Setores ativos ordenados pela média de horas por membro no mês (desempate: média na sede, depois o nome), sem os dispensados.';
