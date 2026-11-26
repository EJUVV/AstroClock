-- =============================================================================
-- AstroClock · setor desativado encerra a diretoria
-- (seção 5 do regras-de-negocio.md; decidido pelo líder do projeto em
--  26/11/2026, na revisão final das diretorias acumuladas)
-- =============================================================================
-- Migração nova, depois da diretorias_acumuladas. Não edita as anteriores.
--
-- Regras:
--   - Desativar um setor encerra a diretoria dele: sai de diretorias e o
--     histórico fecha (encerrado_por = quem desativou; null = direto no banco).
--   - Reativar o setor não devolve: ele volta vago (a diretoria é sempre
--     atribuída de propósito).
--
-- O que muda:
--   1. Gatilho em setores: só na passagem de ativo true para false.
--   2. setores_que_dirijo() e minhas_diretorias() ignoram setor inativo (por
--      garantia: com o gatilho, setor inativo não tem diretoria). Mesmas
--      assinaturas; o replace mantém os grants.
--   3. Limpeza: diretorias que já existam em setor inativo são encerradas
--      (direto no banco).
-- =============================================================================


-- 1. Gatilho: setor desativado fica sem diretor ------------------------------------

create or replace function public.setores_encerrar_diretoria()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.historico_diretorias h
     set fim = now(), encerrado_por = public.meu_id()
   where h.setor_id = new.id and h.fim is null;

  delete from public.diretorias d where d.setor_id = new.id;
  return null;
end;
$$;

comment on function public.setores_encerrar_diretoria() is
  'Interna (gatilho): ao desativar um setor, encerra a diretoria dele (o histórico fica).';

revoke all on function public.setores_encerrar_diretoria() from public, anon, authenticated;

create or replace trigger setores_encerrar_diretoria
  after update of ativo on public.setores
  for each row
  when (old.ativo and not new.ativo)
  execute function public.setores_encerrar_diretoria();


-- 2. Leitura das diretorias: só setores ativos ---------------------------------------

create or replace function public.setores_que_dirijo()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select d.setor_id
  from public.diretorias d
  join public.setores s on s.id = d.setor_id
  join public.membros m on m.id = d.membro_id
  where m.email = lower(auth.jwt() ->> 'email')
    and m.ativo
    and m.perfil in ('diretor_setor', 'diretor_rh', 'presidente')
    and s.ativo
$$;

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
    and s.ativo
  order by s.nome
$$;

comment on function public.setores_que_dirijo() is
  'ids dos setores ativos que o logado dirige (vazio para quem não dirige nenhum).';

-- Por garantia (o replace já mantém): só o site logado chama.
revoke execute on function public.setores_que_dirijo(), public.minhas_diretorias() from public, anon;
grant  execute on function public.setores_que_dirijo(), public.minhas_diretorias() to authenticated;


-- 3. Limpeza: diretoria que já esteja em setor inativo -------------------------------

update public.historico_diretorias h
   set fim = now()
  from public.setores s
 where s.id = h.setor_id and not s.ativo and h.fim is null;

delete from public.diretorias d
 using public.setores s
 where s.id = d.setor_id and not s.ativo;
