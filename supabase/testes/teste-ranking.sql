-- =============================================================================
-- AstroClock · teste do ranking com pódio e do ranking dos setores
-- (seção 12 do regras-de-negocio.md; migração ranking_e_podio)
-- =============================================================================
-- Rode DEPOIS das migrações do PR #9 (cálculo da semana), da ranking_e_podio e
-- da diretorias_acumuladas, no SQL Editor. Cria dados de teste (prefixo zz) num mês antigo (março de 2021,
-- com meta própria), confere pelos dois lados (quem deve ver, vê; quem não deve,
-- não vê) e desfaz tudo no final: não suja o banco.
-- Terminou com "OK: ranking passou" = passou. Se falhar, a mensagem diz o que
-- quebrou (e também não fica nada no banco).
--
-- Cenário (março de 2021):
--   Setor A: Ana 10h (4h na sede), Beto 8h, Caio 8h (empate com o Beto), Duda 0h
--            (um registro em revisão e um cancelado, que não contam),
--            um membro novo (entrou em 29/03: não entra no ranking do mês) e
--            um diretor do setor (sem meta, fora do ranking).
--   Setor B: Eva 6h e um RH novo (entrou em 29/03).
--   Ninguém do seed entra em março de 2021 (todos entraram depois), então a EJ
--   inteira do mês é só o pessoal zz.
-- =============================================================================

do $$
declare
  c_setor_a constant uuid := 'b0000000-0000-4000-8000-000000000001';
  c_setor_b constant uuid := 'b0000000-0000-4000-8000-000000000002';
  c_ana     constant uuid := 'b0000000-0000-4000-8000-0000000000a1';
  c_beto    constant uuid := 'b0000000-0000-4000-8000-0000000000a2';
  c_caio    constant uuid := 'b0000000-0000-4000-8000-0000000000a3';
  c_duda    constant uuid := 'b0000000-0000-4000-8000-0000000000a4';
  c_novo    constant uuid := 'b0000000-0000-4000-8000-0000000000a5';
  c_dsetor  constant uuid := 'b0000000-0000-4000-8000-0000000000a6';
  c_eva     constant uuid := 'b0000000-0000-4000-8000-0000000000b1';
  c_rh      constant uuid := 'b0000000-0000-4000-8000-0000000000b2';
  c_mes     constant text := '2021-03';
  n         int;
  v_lista   text;
  eu        record;
  st        record;
  ok1       boolean;
begin
  begin   -- tudo o que o teste faz fica neste bloco e é desfeito no fim

  insert into public.setores (id, nome) values
    (c_setor_a, 'zz Ranking A'),
    (c_setor_b, 'zz Ranking B');

  insert into public.membros (id, nome, email, perfil, setor_id, ativo, data_entrada) values
    (c_ana,    'zz Ana',    'zz.rank.ana@ejuvv.com',    'membro',        c_setor_a, true, '2020-01-01'),
    (c_beto,   'zz Beto',   'zz.rank.beto@ejuvv.com',   'membro',        c_setor_a, true, '2020-01-01'),
    (c_caio,   'zz Caio',   'zz.rank.caio@ejuvv.com',   'membro',        c_setor_a, true, '2020-01-01'),
    (c_duda,   'zz Duda',   'zz.rank.duda@ejuvv.com',   'membro',        c_setor_a, true, '2020-01-01'),
    (c_novo,   'zz Novo',   'zz.rank.novo@ejuvv.com',   'membro',        c_setor_a, true, '2021-03-29'),
    (c_dsetor, 'zz Dir A',  'zz.rank.dsetor@ejuvv.com', 'diretor_setor', c_setor_a, true, '2020-01-01'),
    (c_eva,    'zz Eva',    'zz.rank.eva@ejuvv.com',    'membro',        c_setor_b, true, '2020-01-01'),
    (c_rh,     'zz RH',     'zz.rank.rh@ejuvv.com',     'rh',            c_setor_b, true, '2021-03-29');

  -- Desde as diretorias acumuladas, o perfil sozinho não dirige: o diretor do
  -- setor A precisa da diretoria registrada.
  insert into public.diretorias (setor_id, membro_id) values (c_setor_a, c_dsetor);

  insert into public.metas (horas_total, horas_sede, vigente_desde) values (10, 5, '2021-02-22');

  insert into public.registros (membro_id, inicio, fim, local, descricao, origem, cancelado, precisa_revisao) values
    (c_ana,  '2021-03-01 09:00-03', '2021-03-01 13:00-03', 'sede',   'zz', 'manual',     false, false),
    (c_ana,  '2021-03-02 09:00-03', '2021-03-02 15:00-03', 'online', 'zz', 'manual',     false, false),
    (c_beto, '2021-03-03 09:00-03', '2021-03-03 17:00-03', 'online', 'zz', 'manual',     false, false),
    (c_caio, '2021-03-08 09:00-03', '2021-03-08 17:00-03', 'online', 'zz', 'manual',     false, false),
    (c_duda, '2021-03-04 09:00-03', '2021-03-04 12:00-03', 'online', 'zz', 'cronometro', false, true),
    (c_duda, '2021-03-05 09:00-03', '2021-03-05 12:00-03', 'online', 'zz', 'manual',     true,  false),
    (c_eva,  '2021-03-09 09:00-03', '2021-03-09 15:00-03', 'online', 'zz', 'manual',     false, false);

  ---------------------------------------------------------------------------
  -- 1. Como a Duda (membro, 0h)
  ---------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.rank.duda@ejuvv.com"}', true);

  -- Pódio da EJ: Ana 1º, Beto e Caio 2º (empate), Eva 4º; a Duda (0h) não aparece.
  select string_agg(p.nome || ':' || p.posicao, ',' order by p.posicao, p.nome) into v_lista
    from public.podio_do_mes(c_mes) p where p.escopo = 'ej';
  assert v_lista = 'zz Ana:1,zz Beto:2,zz Caio:2,zz Eva:4',
    format('Duda: pódio da EJ errado (%s)', v_lista);

  -- Pódio do setor A: Ana 1º, Beto e Caio 2º.
  select string_agg(p.nome || ':' || p.posicao, ',' order by p.posicao, p.nome) into v_lista
    from public.podio_do_mes(c_mes) p where p.escopo = 'setor';
  assert v_lista = 'zz Ana:1,zz Beto:2,zz Caio:2',
    format('Duda: pódio do setor errado (%s)', v_lista);

  -- O pódio não traz e-mail nem nada além de nome, setor e horas.
  select bool_or(to_jsonb(p) ? 'email' or to_jsonb(p) ? 'perfil') into ok1 from public.podio_do_mes(c_mes) p;
  assert not coalesce(ok1, false), 'Duda: o pódio trouxe e-mail ou perfil';

  -- Posição: 5º de 5 na EJ, 4º de 4 no setor. O pódio da EJ tem 4 pessoas (há vaga):
  -- faltam 0,5h. O do setor A está cheio (Ana, Beto, Caio): faltam 8h para alcançar o Beto e o Caio.
  select * into eu from public.minha_posicao_no_ranking(c_mes);
  assert found, 'Duda: deveria ter posição no ranking';
  assert eu.horas_total = 0, format('Duda: horas deveriam ser 0 (são %s)', eu.horas_total);
  assert eu.posicao_ej = 5 and eu.total_ej = 5,
    format('Duda: posição na EJ errada (%s de %s)', eu.posicao_ej, eu.total_ej);
  assert eu.posicao_setor = 4 and eu.total_setor = 4,
    format('Duda: posição no setor errada (%s de %s)', eu.posicao_setor, eu.total_setor);
  assert eu.faltam_para_podio_ej = 0.5, format('Duda: o pódio da EJ tem vaga, faltam deveria ser 0,5 (é %s)', eu.faltam_para_podio_ej);
  assert eu.faltam_para_podio_setor = 8, format('Duda: faltam para o pódio do setor deveria ser 8 (é %s)', eu.faltam_para_podio_setor);

  -- O membro não vê a lista completa.
  select count(*) into n from public.ranking_do_mes(c_mes);
  assert n = 0, format('Duda: viu %s linhas do ranking completo', n);

  -- Ranking dos setores: A (6,5h de média, 4 membros) em 1º, B (6h) em 2º.
  select * into st from public.ranking_dos_setores(c_mes) s where s.setor = 'zz Ranking A';
  assert found and st.posicao = 1 and st.membros_contados = 4 and st.media_total = 6.5 and st.media_sede = 1,
    format('Duda: setor A errado (%s)', to_jsonb(st));
  select * into st from public.ranking_dos_setores(c_mes) s where s.setor = 'zz Ranking B';
  assert found and st.posicao = 2 and st.membros_contados = 1 and st.media_total = 6,
    format('Duda: setor B errado (%s)', to_jsonb(st));

  -- Mês sem meta: tudo vazio.
  select count(*) into n from public.podio_do_mes('2020-01');
  assert n = 0, 'mês sem meta: pódio deveria estar vazio';
  select count(*) into n from public.minha_posicao_no_ranking('2020-01');
  assert n = 0, 'mês sem meta: posição deveria estar vazia';
  select count(*) into n from public.ranking_dos_setores('2020-01');
  assert n = 0, 'mês sem meta: ranking dos setores deveria estar vazio';

  ---------------------------------------------------------------------------
  -- 2. Como o Beto (no pódio) e como o membro novo (fora do ranking do mês)
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.rank.beto@ejuvv.com"}', true);
  select * into eu from public.minha_posicao_no_ranking(c_mes);
  assert eu.posicao_setor = 2 and eu.faltam_para_podio_setor = 0 and eu.faltam_para_podio_ej = 0,
    format('Beto: está no pódio, faltam deveria ser 0 (%s)', to_jsonb(eu));

  -- Eva: sozinha no setor B e no pódio dele.
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.rank.eva@ejuvv.com"}', true);
  select * into eu from public.minha_posicao_no_ranking(c_mes);
  assert eu.posicao_setor = 1 and eu.total_setor = 1 and eu.faltam_para_podio_setor = 0,
    format('Eva: deveria ser 1ª de 1 no setor B, no pódio (%s)', to_jsonb(eu));

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.rank.novo@ejuvv.com"}', true);
  select count(*) into n from public.minha_posicao_no_ranking(c_mes);
  assert n = 0, 'membro novo: não deveria ter posição no ranking do mês';

  ---------------------------------------------------------------------------
  -- 3. Como o diretor do setor A e como o RH
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.rank.dsetor@ejuvv.com"}', true);
  select string_agg(r.nome || ':' || r.posicao, ',' order by r.posicao, r.nome) into v_lista
    from public.ranking_do_mes(c_mes) r;
  assert v_lista = 'zz Ana:1,zz Beto:2,zz Caio:2,zz Duda:4',
    format('diretor de setor: deveria ver só o setor A, com posições no setor (%s)', v_lista);

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.rank.rh@ejuvv.com"}', true);
  select count(*) into n from public.ranking_do_mes(c_mes);
  assert n = 5, format('RH: deveria ver os 5 do ranking da EJ (viu %s)', n);
  select r.email into v_lista from public.ranking_do_mes(c_mes) r where r.posicao = 1;
  assert v_lista = 'zz.rank.ana@ejuvv.com', 'RH: a Ana deveria ser a 1ª do ranking completo';

  perform set_config('request.jwt.claims', '', true);

  -- Chegou aqui = passou. Este erro é de propósito: desfaz tudo o que o teste fez.
  raise exception 'fim do teste' using errcode = 'ZZ999';
  exception when sqlstate 'ZZ999' then
    null;
  end;
end
$$;

select 'OK: ranking passou' as resultado;
