-- =============================================================================
-- AstroClock · cálculo da semana (seção 8 do regras-de-negocio.md)
-- =============================================================================
-- Migração. Só funções de leitura: nenhum total fica guardado em tabela.
-- Todas respeitam o RLS de quem chama (security invoker): rh, diretor do RH e
-- presidente veem a EJ toda; o diretor de setor, só o setor dele (mesmo que a
-- tela peça outro); o membro, só ele mesmo.
--
-- Regras:
--   - Só contam registros encerrados, não cancelados e fora de revisão.
--   - O registro conta na semana do início (horário de Brasília). Semana =
--     segunda-feira; qualquer dia que vier vira a segunda da semana dele.
--   - Meta da semana: a de maior vigente_desde até a segunda (lista_de_metas).
--   - Elegível: ativo, perfil membro ou rh, cadastrado antes da semana, e a
--     semana já tem meta cadastrada. Semana anterior à primeira meta não conta
--     para ninguém (o sistema ainda não valia); sem isso, quem tem data de
--     entrada antiga aparece "abaixo da meta" em todas as semanas antes do piloto.
--   - Cumpriu: total >= meta total E sede >= meta sede.
--   - Percentual: quem cumpriu ÷ (elegíveis − dispensados), por membros.
--   - Médias: entre os elegíveis não dispensados; diária = total ÷ 5.
--   - Requerimentos (B8) ainda não existem: ninguém está dispensado e o "só
--     remoto" não muda a meta. Entram aqui quando a tabela existir.
--
-- Pelo site (supabase.rpc):
--   painel do RH:     percentual_da_semana, resumo_da_semana, abaixo_da_meta,
--                     medias_da_semana, progresso_de_membro, semanas_seguidas_abaixo
--   painel do membro: progresso_da_semana, progresso_do_mes
-- =============================================================================


-- Segunda-feira da semana de um dia --------------------------------------------
create or replace function public.segunda_da_semana(p_dia date)
returns date
language sql
immutable
parallel safe
set search_path = ''
as $$
  select p_dia - (extract(isodow from p_dia)::int - 1)
$$;


-- Meta vigente na semana (null nas duas = semana antes da primeira meta) --------
create or replace function public.meta_da_semana(p_semana date)
returns table (horas_total numeric, horas_sede numeric)
language sql
stable
set search_path = ''
as $$
  select m.horas_total, m.horas_sede
  from (select public.segunda_da_semana(p_semana) as seg) s
  left join lateral (
    select l.horas_total, l.horas_sede
    from public.lista_de_metas l
    where l.vigente_desde <= s.seg
    order by l.vigente_desde desc
    limit 1
  ) m on true
$$;


-- Horas de cada membro na semana (só os registros que contam) ------------------
create or replace function public.horas_da_semana(p_semana date, p_membro_id uuid default null)
returns table (membro_id uuid, horas_sede numeric, horas_total numeric)
language sql
stable
set search_path = ''
as $$
  with s as (
    select public.segunda_da_semana(p_semana) as seg
  )
  select r.membro_id,
         coalesce(sum(extract(epoch from r.fim - r.inicio)) filter (where r.local = 'sede'), 0) / 3600,
         sum(extract(epoch from r.fim - r.inicio)) / 3600
  from public.registros r
  cross join s
  where r.inicio >= s.seg::timestamp at time zone 'America/Sao_Paulo'
    and r.inicio <  (s.seg + 7)::timestamp at time zone 'America/Sao_Paulo'
    and r.fim is not null
    and not r.cancelado
    and not r.precisa_revisao
    and (p_membro_id is null or r.membro_id = p_membro_id)
  group by r.membro_id
$$;


-- resumoDaSemana(semana, setor?): uma linha por membro elegível ----------------
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
  filtro as (
    -- diretor de setor: sempre o setor dele; os outros: o setor pedido (ou todos)
    select coalesce(public.setor_que_dirijo(), st.id) as setor_id,
           public.setor_que_dirijo() is not null or p_setor is not null as filtra
    from (select 1) um
    left join public.setores st on st.nome = p_setor
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
    and (not filtro.filtra or m.setor_id = filtro.setor_id)
  order by m.nome
$$;


-- percentualDaSemana(semana, setor?): 0 a 100, por membros (não por horas) -----
create or replace function public.percentual_da_semana(p_semana date, p_setor text default null)
returns numeric
language sql
stable
set search_path = ''
as $$
  select coalesce(
           round(100.0 * count(*) filter (where r.cumpriu and not r.dispensada)
                 / nullif(count(*) filter (where not r.dispensada), 0), 1),
           0)
  from public.resumo_da_semana(p_semana, p_setor) r
$$;


-- abaixoDaMeta(semana, setor?) ---------------------------------------------------
create or replace function public.abaixo_da_meta(p_semana date, p_setor text default null)
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
  select r.* from public.resumo_da_semana(p_semana, p_setor) r
  where not r.cumpriu and not r.dispensada
$$;


-- mediasDaSemana(semana, setor?): por membro, sem quem foi dispensado ------------
create or replace function public.medias_da_semana(p_semana date, p_setor text default null)
returns table (media_total numeric, media_sede numeric, media_diaria numeric)
language sql
stable
set search_path = ''
as $$
  select coalesce(round(avg(r.horas_total) filter (where not r.dispensada), 2), 0),
         coalesce(round(avg(r.horas_sede)  filter (where not r.dispensada), 2), 0),
         coalesce(round(avg(r.horas_total) filter (where not r.dispensada) / 5, 2), 0)
  from public.resumo_da_semana(p_semana, p_setor) r
$$;


-- progressoDeMembro(membroId, semana) ------------------------------------------
-- Sem linha = o membro não existe ou quem chamou não pode ver.
-- elegivel = false: a semana não conta para ele (entrou depois, desativado,
-- diretor, ou a semana é de antes da primeira meta).
create or replace function public.progresso_de_membro(p_membro_id uuid, p_semana date)
returns table (
  semana      date,
  horas_sede  numeric,
  horas_total numeric,
  meta_sede   numeric,
  meta_total  numeric,
  cumpriu     boolean,
  dispensada  boolean,
  elegivel    boolean
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
  )
  select s.seg,
         round(coalesce(h.horas_sede, 0), 2),
         round(coalesce(h.horas_total, 0), 2),
         meta.horas_sede,
         meta.horas_total,
         coalesce(e.ok and coalesce(h.horas_total, 0) >= meta.horas_total
                       and coalesce(h.horas_sede, 0) >= meta.horas_sede, false),
         false,
         e.ok
  from public.membros m
  cross join s
  cross join meta
  cross join lateral (
    select public.elegivel_na_semana(m.perfil, m.ativo, m.data_entrada, s.seg)
           and meta.horas_total is not null as ok
  ) e
  left join public.horas_da_semana(s.seg, p_membro_id) h on h.membro_id = m.id
  where m.id = p_membro_id
$$;


-- semanasSeguidasAbaixo(semana): quem está abaixo da meta 2 semanas seguidas ou
-- mais, contando para trás a partir da semana pedida (seção 10) -----------------
create or replace function public.semanas_seguidas_abaixo(p_semana date)
returns table (
  membro_id        uuid,
  nome             text,
  email            text,
  perfil           public.perfil,
  setor            text,
  ativo            boolean,
  data_entrada     date,
  semanas_seguidas integer
)
language plpgsql
stable
set search_path = ''
as $$
declare
  r record;
  p record;
  w date;
  n integer;
begin
  for r in
    select x.* from public.resumo_da_semana(p_semana) x
    where not x.cumpriu and not x.dispensada
  loop
    n := 0;
    w := public.segunda_da_semana(p_semana);
    loop
      select y.* into p from public.progresso_de_membro(r.membro_id, w) y;
      exit when not found or not p.elegivel or p.cumpriu or p.dispensada or n >= 104;
      n := n + 1;
      w := w - 7;
    end loop;

    if n >= 2 then
      membro_id        := r.membro_id;
      nome             := r.nome;
      email            := r.email;
      perfil           := r.perfil;
      setor            := r.setor;
      ativo            := r.ativo;
      data_entrada     := r.data_entrada;
      semanas_seguidas := n;
      return next;
    end if;
  end loop;
end;
$$;


-- Painel do membro: progressoDaSemana(semana) e progressoDoMes(mes) -------------
create or replace function public.progresso_da_semana(p_semana date)
returns table (
  semana      date,
  horas_sede  numeric,
  horas_total numeric,
  meta_sede   numeric,
  meta_total  numeric,
  cumpriu     boolean,
  dispensada  boolean,
  elegivel    boolean
)
language sql
stable
set search_path = ''
as $$
  select p.* from public.progresso_de_membro(public.meu_id(), p_semana) p
$$;

-- mês = 'AAAA-MM'; uma linha por segunda-feira do mês (semana entre dois meses
-- conta no mês da segunda)
create or replace function public.progresso_do_mes(p_mes text)
returns table (
  semana      date,
  horas_sede  numeric,
  horas_total numeric,
  meta_sede   numeric,
  meta_total  numeric,
  cumpriu     boolean,
  dispensada  boolean,
  elegivel    boolean
)
language sql
stable
set search_path = ''
as $$
  select p.*
  from generate_series(to_date(p_mes || '-01', 'YYYY-MM-DD'),
                       (to_date(p_mes || '-01', 'YYYY-MM-DD') + interval '1 month - 1 day'),
                       interval '1 day') as d(dia)
  cross join lateral public.progresso_de_membro(public.meu_id(), d.dia::date) p
  where extract(isodow from d.dia) = 1
  order by p.semana
$$;


-- Quem chama ---------------------------------------------------------------------
revoke execute on function
  public.segunda_da_semana(date),
  public.meta_da_semana(date),
  public.horas_da_semana(date, uuid),
  public.resumo_da_semana(date, text),
  public.percentual_da_semana(date, text),
  public.abaixo_da_meta(date, text),
  public.medias_da_semana(date, text),
  public.progresso_de_membro(uuid, date),
  public.semanas_seguidas_abaixo(date),
  public.progresso_da_semana(date),
  public.progresso_do_mes(text)
from public, anon;

grant execute on function
  public.segunda_da_semana(date),
  public.meta_da_semana(date),
  public.horas_da_semana(date, uuid),
  public.resumo_da_semana(date, text),
  public.percentual_da_semana(date, text),
  public.abaixo_da_meta(date, text),
  public.medias_da_semana(date, text),
  public.progresso_de_membro(uuid, date),
  public.semanas_seguidas_abaixo(date),
  public.progresso_da_semana(date),
  public.progresso_do_mes(text)
to authenticated;
