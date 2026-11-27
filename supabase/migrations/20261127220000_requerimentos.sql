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
