-- =============================================================================
-- AstroClock · horas por dia de quem está logado (B12, gráfico do painel do membro)
-- =============================================================================
-- Migração nova. Só leitura: nenhum total fica guardado em tabela.
-- Mesmos registros do cálculo da semana (horas_da_semana, B9): encerrados, não
-- cancelados e fora de revisão. O dia é o do início do registro, no horário de
-- Brasília (o banco já divide o registro na meia-noite, B10).
--
-- horas_por_dia(p_semana): os 7 dias da semana (segunda a domingo) de qualquer dia
-- informado, com 0 nos dias sem registro. Só as horas de quem chama (meu_id()).
-- Pelo site: horasPorDia (progresso.ts).
-- =============================================================================

create or replace function public.horas_por_dia(p_semana date)
returns table (dia date, horas_sede numeric, horas_total numeric)
language sql
stable
set search_path = ''
as $$
  with dias as (
    select (public.segunda_da_semana(p_semana) + i) as dia
    from generate_series(0, 6) as i
  ),
  horas as (
    select (r.inicio at time zone 'America/Sao_Paulo')::date as dia,
           sum(extract(epoch from r.fim - r.inicio)) filter (where r.local = 'sede') / 3600 as sede,
           sum(extract(epoch from r.fim - r.inicio)) / 3600 as total
    from public.registros r
    where r.membro_id = public.meu_id()
      and r.inicio >= public.segunda_da_semana(p_semana)::timestamp at time zone 'America/Sao_Paulo'
      and r.inicio <  (public.segunda_da_semana(p_semana) + 7)::timestamp at time zone 'America/Sao_Paulo'
      and r.fim is not null
      and not r.cancelado
      and not r.precisa_revisao
    group by 1
  )
  select d.dia,
         round(coalesce(h.sede, 0), 2),
         round(coalesce(h.total, 0), 2)
  from dias d
  left join horas h on h.dia = d.dia
  order by d.dia
$$;

revoke execute on function public.horas_por_dia(date) from public, anon;
grant execute on function public.horas_por_dia(date) to authenticated;

comment on function public.horas_por_dia(date) is
  'Horas de quem chama em cada dia (segunda a domingo) da semana do dia informado, com 0 nos dias sem registro.';
