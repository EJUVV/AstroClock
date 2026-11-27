-- =============================================================================
-- AstroClock · requerimentos de ausência (B8) com anexo privado (J6)
-- (seção 7 do regras-de-negocio.md; desenho em
--  docs/superpowers/specs/2026-11-27-requerimento-parte-1-design.md)
-- =============================================================================
-- Migração nova. A tabela antiga dispensas não é usada nem mexida.
--
-- Regras:
--   - O membro pede (datas, tipo e motivo). Só quem tem meta (membro e rh),
--     ativo, e só no próprio nome. O pedido nasce pendente.
--   - Dois tipos: so_remoto (a exigência de sede some) e ausencia_total (a
--     semana é dispensada). Vale para a semana inteira, da segunda de
--     data_inicio à segunda de data_fim.
--   - Leem: o próprio membro; rh, presidente e quem dirige o RH (ve_tudo)
--     leem todos. O diretor_setor não vê requerimentos nem anexos.
--   - Só quem dirige o RH (eh_diretor_rh) aprova ou reprova; ninguém responde
--     o próprio; só pendente; reprovar exige motivo. Ninguém altera nem apaga
--     o pedido direto: só pela função responder_requerimento.
--   - Anexo opcional (PDF, JPG ou PNG, até 5 MB) num bucket privado, no
--     caminho <membro_id>/<uuid>.<ext>. Abrem: o dono, rh, presidente e quem
--     dirige o RH.
--   - "Deve sumir": anexo de pedido aprovado, ou reprovado há mais de um mês.
--     O site apaga o arquivo (na aprovação, e quando o RH abre a tela de
--     Requerimentos) e chama anexo_apagado, que limpa anexo_caminho e mantém
--     anexo_nome (o histórico mostra que houve anexo).
--
-- Erros das regras com errcode P0002: o site (erroDoBanco) mostra a mensagem.
-- Pelo site (supabase.rpc, rh.ts): responder_requerimento, anexos_para_apagar
-- e anexo_apagado. A tabela é lida e criada direto (requerimentos.ts e rh.ts).
--
-- Partes:
--   A. Tabela, RLS, resposta e anexos (seções 1 a 6).
--   B. Cálculo da semana com os pedidos aprovados (a seguir, na parte B).
-- =============================================================================


-- =============================================================================
-- PARTE A · tabela, RLS, resposta e anexos
-- =============================================================================


-- 1. Tipos e tabela ---------------------------------------------------------------

create type public.tipo_requerimento as enum ('so_remoto', 'ausencia_total');
create type public.situacao_requerimento as enum ('pendente', 'aprovado', 'reprovado');

create table public.requerimentos (
  id              uuid primary key default gen_random_uuid(),
  membro_id       uuid not null default public.meu_id() references public.membros (id),
  tipo            public.tipo_requerimento not null,
  data_inicio     date not null,
  data_fim        date not null,
  motivo          text not null,
  situacao        public.situacao_requerimento not null default 'pendente',
  anexo_caminho   text,            -- caminho no bucket; null = sem anexo ou já apagado
  anexo_nome      text,            -- nome original do arquivo (fica depois de apagado)
  motivo_resposta text,
  criado_em       timestamptz not null default now(),
  respondido_por  uuid references public.membros (id),
  respondido_em   timestamptz,

  constraint requerimentos_datas check (data_fim >= data_inicio),
  constraint requerimentos_motivo check (char_length(btrim(motivo)) between 1 and 1000),
  constraint requerimentos_motivo_resposta check (motivo_resposta is null or char_length(motivo_resposta) <= 1000),
  constraint requerimentos_anexo_com_nome check (anexo_caminho is null or anexo_nome is not null),
  -- pendente = sem resposta; respondido = com data da resposta
  constraint requerimentos_resposta check ((situacao = 'pendente') = (respondido_em is null)),
  constraint requerimentos_reprovado_com_motivo check (situacao <> 'reprovado' or motivo_resposta is not null)
);

create index requerimentos_membro on public.requerimentos (membro_id, data_inicio);
create index requerimentos_situacao on public.requerimentos (situacao);

comment on table public.requerimentos is
  'Requerimentos de ausência (só remoto ou ausência total). Só aprovado muda a meta. Resposta só por responder_requerimento.';
comment on column public.requerimentos.anexo_caminho is
  'Caminho no bucket anexos-requerimentos (<membro_id>/<uuid>.<ext>). null = sem anexo ou já apagado.';
comment on column public.requerimentos.anexo_nome is
  'Nome original do anexo. Fica depois que o arquivo é apagado (o histórico mostra que houve anexo).';


-- 2. RLS ------------------------------------------------------------------------------
-- Leem: o próprio e quem vê tudo. Criam: só o próprio, perfil com meta, ativo
-- (meu_id só existe para ativo), pendente e sem resposta, com o anexo na
-- própria pasta. Ninguém altera nem apaga direto (sem policy e sem grant).
-- O grant de insert é só nas colunas do pedido: situação, resposta e
-- criado_em ficam sempre com o padrão do banco.

alter table public.requerimentos enable row level security;

create policy "requerimentos: o próprio e quem vê tudo leem"
  on public.requerimentos
  for select
  to authenticated
  using (
    membro_id = (select public.meu_id())
    or (select public.ve_tudo())
  );

create policy "requerimentos: quem tem meta cria o próprio"
  on public.requerimentos
  for insert
  to authenticated
  with check (
    membro_id = (select public.meu_id())
    and (select public.perfil_tem_meta(public.meu_perfil()))
    and situacao = 'pendente'
    and respondido_por is null
    and respondido_em is null
    and motivo_resposta is null
    and (anexo_caminho is null
         or (storage.foldername(anexo_caminho))[1] = (select public.meu_id())::text)
  );

revoke all on public.requerimentos from public, anon, authenticated;
grant select on public.requerimentos to authenticated;
grant insert (membro_id, tipo, data_inicio, data_fim, motivo, anexo_caminho, anexo_nome)
  on public.requerimentos to authenticated;


-- 3. "Deve sumir" (interna) ------------------------------------------------------------
-- Anexo de pedido aprovado, ou reprovado há mais de um mês. Única definição:
-- usada por anexos_para_apagar, anexo_apagado e pela regra de apagar do Storage.

create or replace function public.anexo_deve_sumir(
  p_situacao      public.situacao_requerimento,
  p_respondido_em timestamptz
)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_situacao = 'aprovado'
      or (p_situacao = 'reprovado' and p_respondido_em < now() - interval '1 month')
$$;

comment on function public.anexo_deve_sumir(public.situacao_requerimento, timestamptz) is
  'Interna: true se o anexo do pedido já deve ser apagado (aprovado, ou reprovado há mais de um mês).';


-- 4. responderRequerimento(id, aprovar, motivo?) ----------------------------------------

create or replace function public.responder_requerimento(
  p_id      uuid,
  p_aprovar boolean,
  p_motivo  text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_eu     uuid := public.meu_id();
  v_motivo text := nullif(btrim(p_motivo), '');
  v_req    public.requerimentos%rowtype;
begin
  if not public.eh_diretor_rh() then
    raise exception 'Só o diretor do RH responde requerimentos.' using errcode = 'P0002';
  end if;

  if p_aprovar is null then
    raise exception 'Informe se o requerimento é aprovado ou reprovado.' using errcode = 'P0002';
  end if;

  -- trava o pedido: duas respostas ao mesmo tempo esperam uma pela outra
  select * into v_req from public.requerimentos r where r.id = p_id for update;
  if not found then
    raise exception 'Requerimento não encontrado.' using errcode = 'P0002';
  end if;

  if v_req.membro_id = v_eu then
    raise exception 'Você não pode responder o próprio requerimento.' using errcode = 'P0002';
  end if;

  if v_req.situacao <> 'pendente' then
    raise exception 'Este requerimento já foi respondido.' using errcode = 'P0002';
  end if;

  if not p_aprovar and v_motivo is null then
    raise exception 'Para reprovar, informe o motivo.' using errcode = 'P0002';
  end if;

  if char_length(v_motivo) > 1000 then
    raise exception 'O motivo da resposta pode ter até 1000 caracteres.' using errcode = 'P0002';
  end if;

  update public.requerimentos r
     set situacao        = case when p_aprovar then 'aprovado' else 'reprovado' end::public.situacao_requerimento,
         motivo_resposta = v_motivo,
         respondido_por  = v_eu,
         respondido_em   = now()
   where r.id = p_id;
end;
$$;

comment on function public.responder_requerimento(uuid, boolean, text) is
  'Aprova ou reprova um requerimento pendente. Só quem dirige o RH; não o próprio; reprovar exige motivo. Usado por responderRequerimento().';


-- 5. Anexos que devem sumir -------------------------------------------------------------

-- anexosParaApagar(): pedidos com anexo que já deve ser apagado. Só quem vê tudo.
create or replace function public.anexos_para_apagar()
returns table (id uuid, anexo_caminho text)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.anexo_caminho
  from public.requerimentos r
  where public.ve_tudo()
    and r.anexo_caminho is not null
    and public.anexo_deve_sumir(r.situacao, r.respondido_em)
  order by r.respondido_em
$$;

-- anexoApagado(id): o site apagou o arquivo; limpa anexo_caminho e mantém
-- anexo_nome. Só quem vê tudo, e só em pedido cujo anexo deve sumir. Chamar
-- de novo não muda nada.
create or replace function public.anexo_apagado(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req public.requerimentos%rowtype;
begin
  if not public.ve_tudo() then
    raise exception 'Só o RH apaga anexos de requerimentos.' using errcode = 'P0002';
  end if;

  select * into v_req from public.requerimentos r where r.id = p_id for update;
  if not found then
    raise exception 'Requerimento não encontrado.' using errcode = 'P0002';
  end if;

  if not public.anexo_deve_sumir(v_req.situacao, v_req.respondido_em) then
    raise exception 'O anexo deste requerimento ainda não pode ser apagado.' using errcode = 'P0002';
  end if;

  update public.requerimentos r
     set anexo_caminho = null
   where r.id = p_id
     and r.anexo_caminho is not null;
end;
$$;

comment on function public.anexos_para_apagar() is
  'Pedidos com anexo que já deve ser apagado (aprovados, ou reprovados há mais de um mês). Só rh, presidente e quem dirige o RH. Usado por listarRequerimentos().';
comment on function public.anexo_apagado(uuid) is
  'Marca que o arquivo do anexo foi apagado (limpa anexo_caminho, mantém anexo_nome). Só quem vê tudo, só se o anexo deve sumir.';


-- 6. Storage: bucket privado anexos-requerimentos -----------------------------------------
-- Rodar de novo não duplica (on conflict). Regras em storage.objects:
--   enviar: só na própria pasta (<meu_id>/arquivo), perfil com meta, ativo;
--   abrir:  a própria pasta, ou quem vê tudo;
--   apagar: quem vê tudo, só arquivo de pedido cujo anexo deve sumir; o dono,
--           só arquivo da própria pasta que não está ligado a nenhum pedido
--           (limpeza quando a gravação do pedido falha depois do envio).
-- Sem regra de alterar: um arquivo enviado não é trocado.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('anexos-requerimentos', 'anexos-requerimentos', false, 5242880,
        array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- (interna) o arquivo pode ser apagado por quem chama? security definer: o
-- dono precisa saber se algum pedido (de qualquer um) aponta para o arquivo.
create or replace function public.anexo_pode_ser_apagado(p_caminho text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (
           public.ve_tudo()
           and exists (
             select 1 from public.requerimentos r
             where r.anexo_caminho = p_caminho
               and public.anexo_deve_sumir(r.situacao, r.respondido_em)
           )
         )
      or (
           (storage.foldername(p_caminho))[1] = public.meu_id()::text
           and not exists (
             select 1 from public.requerimentos r
             where r.anexo_caminho = p_caminho
           )
         )
$$;

comment on function public.anexo_pode_ser_apagado(text) is
  'Interna (regra do Storage): quem vê tudo apaga anexo que deve sumir; o dono apaga arquivo da própria pasta sem pedido.';

revoke all on function public.anexo_deve_sumir(public.situacao_requerimento, timestamptz) from public, anon, authenticated;
-- a regra do Storage roda como quem chama: precisa do execute
revoke all on function public.anexo_pode_ser_apagado(text) from public, anon;
grant execute on function public.anexo_pode_ser_apagado(text) to authenticated;

create policy "anexos-requerimentos: quem tem meta envia na própria pasta"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'anexos-requerimentos'
    and array_length(storage.foldername(name), 1) = 1
    and (storage.foldername(name))[1] = (select public.meu_id())::text
    and (select public.perfil_tem_meta(public.meu_perfil()))
  );

create policy "anexos-requerimentos: o dono e quem vê tudo abrem"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'anexos-requerimentos'
    and (
      (storage.foldername(name))[1] = (select public.meu_id())::text
      or (select public.ve_tudo())
    )
  );

create policy "anexos-requerimentos: apaga o que deve sumir ou o arquivo sem pedido"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'anexos-requerimentos'
    and public.anexo_pode_ser_apagado(name)
  );


-- 7. Quem chama (parte A) ----------------------------------------------------------------

revoke execute on function
  public.responder_requerimento(uuid, boolean, text),
  public.anexos_para_apagar(),
  public.anexo_apagado(uuid)
from public, anon;

grant execute on function
  public.responder_requerimento(uuid, boolean, text),
  public.anexos_para_apagar(),
  public.anexo_apagado(uuid)
to authenticated;


-- =============================================================================
-- PARTE B · cálculo da semana com os pedidos aprovados
-- =============================================================================
-- Só pedido aprovado muda a meta. O pedido vale para as semanas inteiras, da
-- segunda de data_inicio à segunda de data_fim. Se só remoto e ausência total
-- aprovados cobrem a mesma semana, vale a ausência total.
--   - só remoto: meta_sede = 0 na semana (o total continua);
--   - ausência total: a semana fica dispensada (fora do percentual, das médias
--     e de "abaixo da meta"; não conta como descumprimento).
-- cumpriu = elegível e não dispensada e horas >= metas.
-- No ranking do mês, dispensado = todas as semanas do mês (com meta, em que a
-- pessoa entra) dispensadas (seção 12).
--
-- Duas camadas, porque o diretor_setor (e o membro) não leem requerimentos:
--   ajuste_da_semana_interno  sem filtro; só para o ranking (horas_do_mes,
--                             security definer), que precisa do dispensado
--                             certo de todos, inclusive no pódio do membro.
--   ajuste_da_semana          o mesmo, mas só para quem o chamador já vê (ele
--                             mesmo, ve_tudo ou setor que dirige; igual ao RLS
--                             de membros); para os outros, false/false. Usada
--                             por progresso_de_membro e resumo_da_semana, que
--                             continuam security invoker.
-- progresso_de_membro, resumo_da_semana e horas_do_mes: mesma assinatura e
-- mesmas colunas (o replace mantém os grants). As que leem delas
-- (percentual_da_semana, abaixo_da_meta, medias_da_semana,
-- semanas_seguidas_abaixo, progresso_da_semana, progresso_do_mes e o ranking)
-- passam a refletir os pedidos sem mudança.


-- 8. Ajuste da semana -----------------------------------------------------------------

create or replace function public.ajuste_da_semana_interno(p_membro_id uuid, p_semana date)
returns table (dispensada boolean, so_remoto boolean)
language sql
stable
security definer
set search_path = ''
as $$
  with s as (
    select public.segunda_da_semana(p_semana) as seg
  ),
  tipos as (
    -- sem group by: sempre uma linha (null quando não há pedido)
    select bool_or(r.tipo = 'ausencia_total') as total,
           bool_or(r.tipo = 'so_remoto')      as remoto
    from public.requerimentos r
    cross join s
    where r.membro_id = p_membro_id
      and r.situacao = 'aprovado'
      and public.segunda_da_semana(r.data_inicio) <= s.seg
      and public.segunda_da_semana(r.data_fim)    >= s.seg
  )
  select coalesce(t.total, false),
         coalesce(t.remoto, false) and not coalesce(t.total, false)   -- ausência total vence
  from tipos t
$$;

comment on function public.ajuste_da_semana_interno(uuid, date) is
  'Interna (ranking): pedidos aprovados que cobrem a semana. dispensada = ausência total; so_remoto = só remoto (a ausência total vence). Sem filtro de quem vê.';

create or replace function public.ajuste_da_semana(p_membro_id uuid, p_semana date)
returns table (dispensada boolean, so_remoto boolean)
language sql
stable
security definer
set search_path = ''
as $$
  -- só para membro que quem chama já vê (igual ao RLS de membros); senão, false/false
  select coalesce(v.pode and a.dispensada, false),
         coalesce(v.pode and a.so_remoto, false)
  from (
    select p_membro_id = public.meu_id()
           or public.ve_tudo()
           or exists (
                select 1 from public.membros m
                where m.id = p_membro_id
                  and m.setor_id in (select public.setores_que_dirijo())
              ) as pode
  ) v
  cross join public.ajuste_da_semana_interno(p_membro_id, p_semana) a
$$;

comment on function public.ajuste_da_semana(uuid, date) is
  'Pedidos aprovados que cobrem a semana, só para membro que quem chama já vê (ele mesmo, ve_tudo ou setor que dirige); senão false/false.';

revoke all on function public.ajuste_da_semana_interno(uuid, date) from public, anon, authenticated;
-- progresso_de_membro e resumo_da_semana rodam como quem chama: precisam do execute
revoke all on function public.ajuste_da_semana(uuid, date) from public, anon;
grant execute on function public.ajuste_da_semana(uuid, date) to authenticated;


-- 9. progresso_de_membro (B9) com o ajuste ----------------------------------------------
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
         ms.sede,
         meta.horas_total,
         coalesce(e.ok and not aj.dispensada
                       and coalesce(h.horas_total, 0) >= meta.horas_total
                       and coalesce(h.horas_sede, 0) >= ms.sede, false),
         aj.dispensada,
         e.ok
  from public.membros m
  cross join s
  cross join meta
  cross join lateral (
    select public.elegivel_na_semana(m.perfil, m.ativo, m.data_entrada, s.seg)
           and meta.horas_total is not null as ok
  ) e
  cross join lateral public.ajuste_da_semana(m.id, s.seg) aj
  cross join lateral (
    -- só remoto: a exigência de sede some
    select case when aj.so_remoto and meta.horas_sede is not null then 0::numeric
                else meta.horas_sede end as sede
  ) ms
  left join public.horas_da_semana(s.seg, p_membro_id) h on h.membro_id = m.id
  where m.id = p_membro_id
$$;


-- 10. resumo_da_semana (versão das diretorias) com o ajuste ------------------------------
-- Filtro de setores igual ao das diretorias acumuladas.

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
         ms.sede,
         meta.horas_total,
         not aj.dispensada
           and coalesce(h.horas_total, 0) >= meta.horas_total
           and coalesce(h.horas_sede, 0) >= ms.sede,
         aj.dispensada
  from public.membros m
  join public.setores st on st.id = m.setor_id
  cross join s
  cross join meta
  cross join filtro
  cross join lateral public.ajuste_da_semana(m.id, s.seg) aj
  cross join lateral (
    -- só remoto: a exigência de sede some
    select case when aj.so_remoto then 0::numeric else meta.horas_sede end as sede
  ) ms
  left join public.horas_da_semana(s.seg) h on h.membro_id = m.id
  where public.elegivel_na_semana(m.perfil, m.ativo, m.data_entrada, s.seg)
    and meta.horas_total is not null
    and (filtro.setores is null or m.setor_id = any (filtro.setores))
  order by m.nome
$$;


-- 11. horas_do_mes (ranking) com o ajuste ---------------------------------------------------
-- dispensado = todas as semanas do mês (com meta, em que a pessoa entra)
-- dispensadas. Usa a camada interna: o pódio e a posição do membro precisam do
-- dispensado certo de todos. Continua interna (sem execute para ninguém).

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
    -- uma linha por pessoa; dispensado só se todas as semanas em que entra foram
    select m.id, m.setor_id, bool_and(aj.dispensada) as dispensado
    from public.membros m
    join com_meta c on public.elegivel_na_semana(m.perfil, m.ativo, m.data_entrada, c.seg)
    cross join lateral public.ajuste_da_semana_interno(m.id, c.seg) aj
    group by m.id, m.setor_id
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
         q.dispensado
  from quem_entra q
  left join horas h on h.membro_id = q.id
$$;
