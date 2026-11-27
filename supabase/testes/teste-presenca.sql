-- =============================================================================
-- AstroClock · teste da presença na sede (seção 13 do regras-de-negocio.md;
-- migração presenca_sede)
-- =============================================================================
-- Rode DEPOIS da migração presenca_sede, no SQL Editor ou pelo CLI
-- (npx supabase db query --linked -f supabase/testes/teste-presenca.sql).
-- Cria dados de teste (prefixo zz), confere pelos dois lados e desfaz tudo no
-- final: não suja o banco. Terminou com "OK: presença passou" = passou.
--
-- Cenário: Ana e Beto (membros ativos), Caio (desativado, com presença aberta
-- de hoje gravada direto no banco) e uma conta sem cadastro.
-- =============================================================================

do $$
declare
  c_setor constant uuid := 'c0000000-0000-4000-8000-000000000001';
  c_ana   constant uuid := 'c0000000-0000-4000-8000-0000000000a1';
  c_beto  constant uuid := 'c0000000-0000-4000-8000-0000000000a2';
  c_caio  constant uuid := 'c0000000-0000-4000-8000-0000000000a3';
  hoje    date := (now() at time zone 'America/Sao_Paulo')::date;
  n       int;
  ok1     boolean;
  msg     text;
  v_lista text;
  v_saida timestamptz;
begin
  begin   -- tudo o que o teste faz fica neste bloco e é desfeito no fim

  insert into public.setores (id, nome) values (c_setor, 'zz Presença');
  insert into public.membros (id, nome, email, perfil, setor_id, ativo, data_entrada) values
    (c_ana,  'zz Ana',  'zz.pres.ana@ejuvv.com',  'membro', c_setor, true,  '2020-01-01'),
    (c_beto, 'zz Beto', 'zz.pres.beto@ejuvv.com', 'membro', c_setor, true,  '2020-01-01'),
    (c_caio, 'zz Caio', 'zz.pres.caio@ejuvv.com', 'membro', c_setor, false, '2020-01-01');

  -- Caio (desativado) com presença aberta de hoje: não pode aparecer na lista.
  insert into public.presenca_sede (membro_id, entrada) values (c_caio, now());

  ---------------------------------------------------------------------------
  -- 1. Ana marca, não marca duas vezes, e o Beto vê só nome, setor e desde
  ---------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.pres.ana@ejuvv.com"}', true);

  assert not public.estou_na_sede(), 'Ana: não deveria estar na sede antes de marcar';
  perform public.marcar_na_sede();
  assert public.estou_na_sede(), 'Ana: deveria estar na sede depois de marcar';

  begin
    perform public.marcar_na_sede();
    msg := null;
  exception when others then
    msg := sqlstate || ':' || sqlerrm;
  end;
  assert msg like 'P0002:%já está marcado%', format('Ana: marcar duas vezes deveria dar erro (%s)', msg);

  -- Ninguém lê a tabela direto (só pelas funções).
  begin
    select count(*) into n from public.presenca_sede;
  exception when insufficient_privilege then
    n := 0;
  end;
  assert n = 0, format('a tabela presenca_sede não deveria ser lida direto (leu %s linhas)', n);

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.pres.beto@ejuvv.com"}', true);
  select string_agg(q.nome || ':' || q.setor, ',' order by q.nome) into v_lista
    from public.quem_esta_na_sede() q where q.nome like 'zz %';
  assert v_lista = 'zz Ana:zz Presença', format('Beto: deveria ver só a Ana na sede (%s)', v_lista);

  select bool_or(to_jsonb(q) ? 'email' or to_jsonb(q) ? 'perfil' or to_jsonb(q) ? 'entrada') into ok1
    from public.quem_esta_na_sede() q;
  assert not coalesce(ok1, false), 'Beto: a lista trouxe mais que nome, setor e desde';
  select count(*) into n from public.quem_esta_na_sede() q where q.desde is null;
  assert n = 0, 'Beto: toda linha deveria ter o "desde"';

  ---------------------------------------------------------------------------
  -- 2. Ana desmarca; desmarcar de novo dá erro
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.pres.ana@ejuvv.com"}', true);
  perform public.desmarcar_na_sede();
  assert not public.estou_na_sede(), 'Ana: deveria ter saído da sede';
  select count(*) into n from public.quem_esta_na_sede() q where q.nome like 'zz %';
  assert n = 0, format('depois de desmarcar, ninguém zz deveria estar na sede (%s)', n);

  begin
    perform public.desmarcar_na_sede();
    msg := null;
  exception when others then
    msg := sqlstate || ':' || sqlerrm;
  end;
  assert msg like 'P0002:%não está marcado%', format('Ana: desmarcar sem estar deveria dar erro (%s)', msg);

  ---------------------------------------------------------------------------
  -- 3. Presença esquecida de ontem: não aparece e a tarefa fecha à meia-noite
  ---------------------------------------------------------------------------
  perform set_config('role', 'postgres', true);
  insert into public.presenca_sede (membro_id, entrada)
    values (c_beto, ((hoje - 1) + time '20:00') at time zone 'America/Sao_Paulo');

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.pres.beto@ejuvv.com"}', true);
  assert not public.estou_na_sede(), 'Beto: presença de ontem não deveria contar como na sede';
  select count(*) into n from public.quem_esta_na_sede() q where q.nome like 'zz %';
  assert n = 0, 'presença de ontem não deveria aparecer na lista';

  perform set_config('role', 'postgres', true);
  n := public.encerrar_presencas_de_ontem();
  -- >= 1: no horas-dev pode haver presenças reais esquecidas de ontem.
  assert n >= 1, format('a tarefa deveria fechar a presença de ontem (fechou %s)', n);
  select p.saida into v_saida from public.presenca_sede p where p.membro_id = c_beto;
  assert v_saida = (hoje::timestamp at time zone 'America/Sao_Paulo'),
    format('a presença de ontem deveria fechar à meia-noite de Brasília (%s)', v_saida);

  -- Com a de ontem esquecida, marcar hoje também funciona (fecha a antiga antes).
  insert into public.presenca_sede (membro_id, entrada)
    values (c_ana, ((hoje - 1) + time '21:00') at time zone 'America/Sao_Paulo');
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.pres.ana@ejuvv.com"}', true);
  perform public.marcar_na_sede();
  assert public.estou_na_sede(), 'Ana: deveria conseguir marcar hoje mesmo com uma presença de ontem aberta';

  ---------------------------------------------------------------------------
  -- 4. Conta sem cadastro: lista vazia e não marca
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.pres.ninguem@ejuvv.com"}', true);
  select count(*) into n from public.quem_esta_na_sede();
  assert n = 0, format('conta sem cadastro: não deveria ver ninguém (viu %s)', n);
  begin
    perform public.marcar_na_sede();
    msg := null;
  exception when others then
    msg := sqlstate || ':' || sqlerrm;
  end;
  assert msg is not null, 'conta sem cadastro: marcar deveria dar erro';

  perform set_config('request.jwt.claims', '', true);

  -- Chegou aqui = passou. Este erro é de propósito: desfaz tudo o que o teste fez.
  raise exception 'fim do teste' using errcode = 'ZZ999';
  exception when sqlstate 'ZZ999' then
    null;
  end;
end
$$;

select 'OK: presença passou' as resultado;
