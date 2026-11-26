-- =============================================================================
-- AstroClock · teste das diretorias acumuladas (vacância)
-- (seção 5 do regras-de-negocio.md; migração diretorias_acumuladas)
-- =============================================================================
-- Rode DEPOIS das migrações diretorias_acumuladas e
-- encerrar_diretoria_setor_inativo, no SQL Editor. Cria dados de
-- teste (prefixo zz), confere pelos dois lados (quem deve poder, pode; quem não
-- deve, não pode) e desfaz tudo no final: não suja o banco.
-- Terminou com "OK: diretorias passaram" = passou. Se falhar, a mensagem diz o
-- que quebrou (e também não fica nada no banco).
--
-- Cenário:
--   Setores: zz A, zz B, zz C e zz RH (o setor RH do teste; o RH de verdade
--            fica desmarcado só durante o teste).
--   Pessoas: zz Pres (presidente, zz RH), zz DirA (diretor_setor, zz A),
--            zz DirA2 (diretor_setor, zz C), zz Mem (membro, zz B, com 3h na
--            sede na semana de 03/05/2021), zz MemC (membro, zz C) e
--            zz Rh (rh, zz A).
--   Semana de 03/05/2021, com meta própria (10h/5h): ninguém do seed entrou
--   antes dela, então o resumo e o ranking só têm o pessoal zz.
-- =============================================================================

do $$
declare
  c_a        constant uuid := 'd0000000-0000-4000-8000-000000000001';
  c_b        constant uuid := 'd0000000-0000-4000-8000-000000000002';
  c_c        constant uuid := 'd0000000-0000-4000-8000-000000000003';
  c_setor_rh constant uuid := 'd0000000-0000-4000-8000-000000000004';
  c_pres     constant uuid := 'd0000000-0000-4000-8000-0000000000a1';
  c_dira     constant uuid := 'd0000000-0000-4000-8000-0000000000a2';
  c_dira2    constant uuid := 'd0000000-0000-4000-8000-0000000000a3';
  c_mem      constant uuid := 'd0000000-0000-4000-8000-0000000000a4';
  c_memc     constant uuid := 'd0000000-0000-4000-8000-0000000000a5';
  c_rh       constant uuid := 'd0000000-0000-4000-8000-0000000000a6';
  seg        constant date := '2021-05-03';   -- segunda-feira
  c_mes      constant text := '2021-05';
  prox       constant date := date_trunc('week', now() at time zone 'America/Sao_Paulo')::date + 7;  -- segunda que vem
  n          int;
  x          numeric;
  v_lista    text;
  ok1        boolean;
begin
  begin   -- tudo o que o teste faz fica neste bloco e é desfeito no fim

  -- Só pode ter 1 presidente ativo, e o teste cria o dele. O presidente e o
  -- diretor do RH do seed ficam desativados só durante o teste (o gatilho
  -- encerra as diretorias deles), e o setor RH de verdade fica desmarcado.
  update public.membros set ativo = false where ativo and perfil in ('diretor_rh', 'presidente');
  update public.setores set eh_rh = false where eh_rh;

  insert into public.setores (id, nome, eh_rh) values
    (c_a,        'zz A',  false),
    (c_b,        'zz B',  false),
    (c_c,        'zz C',  false),
    (c_setor_rh, 'zz RH', true);

  insert into public.membros (id, nome, email, perfil, setor_id, ativo, data_entrada) values
    (c_pres,  'zz Pres',  'zz.dir.pres@ejuvv.com',  'presidente',    c_setor_rh, true, '2020-01-01'),
    (c_dira,  'zz DirA',  'zz.dir.dira@ejuvv.com',  'diretor_setor', c_a,        true, '2020-01-01'),
    (c_dira2, 'zz DirA2', 'zz.dir.dira2@ejuvv.com', 'diretor_setor', c_c,        true, '2020-01-01'),
    (c_mem,   'zz Mem',   'zz.dir.mem@ejuvv.com',   'membro',        c_b,        true, '2020-01-01'),
    (c_memc,  'zz MemC',  'zz.dir.memc@ejuvv.com',  'membro',        c_c,        true, '2020-01-01'),
    (c_rh,    'zz Rh',    'zz.dir.rh@ejuvv.com',    'rh',            c_a,        true, '2020-01-01');

  insert into public.metas (horas_total, horas_sede, vigente_desde) values (10, 5, seg);

  insert into public.registros (membro_id, inicio, fim, local, descricao, origem, cancelado, precisa_revisao) values
    (c_mem, '2021-05-04 09:00-03', '2021-05-04 12:00-03', 'sede', 'zz', 'manual', false, false);

  -- Perfil de diretor sozinho não dirige nada: a diretoria é atribuída de propósito.
  select count(*) into n from public.diretorias where setor_id in (c_a, c_b, c_c, c_setor_rh);
  assert n = 0, format('fixture: os setores zz não deveriam ter diretor ainda (têm %s)', n);

  ---------------------------------------------------------------------------
  -- 1. Membro e rh não registram diretorias
  ---------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.dir.mem@ejuvv.com"}', true);

  begin
    perform public.atribuir_diretoria('zz A', c_dira);
    raise exception 'FALHOU: membro registrou diretoria';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.remover_diretoria('zz A');
    raise exception 'FALHOU: membro tirou diretoria';
  exception when insufficient_privilege then null;
  end;

  assert not exists (select 1 from public.setores_que_dirijo()), 'membro: setores_que_dirijo() deveria vir vazio';
  select count(*) into n from public.minhas_diretorias();
  assert n = 0, format('membro: minhas_diretorias() deveria vir vazio (veio %s)', n);
  select count(*) into n from public.situacao_dos_setores();
  assert n = 0, format('membro: não tem painel do RH, situacao_dos_setores() deveria vir vazio (veio %s)', n);
  select count(*) into n from public.diretorias;
  assert n = 0, format('membro: leu %s linhas de diretorias', n);
  select count(*) into n from public.historico_diretorias;
  assert n = 0, format('membro: leu %s linhas do histórico de diretorias', n);

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.dir.rh@ejuvv.com"}', true);
  begin
    perform public.atribuir_diretoria('zz A', c_dira);
    raise exception 'FALHOU: rh registrou diretoria';
  exception when insufficient_privilege then null;
  end;

  ---------------------------------------------------------------------------
  -- 2. Presidente (RH vago) atribui A e B ao DirA e o RH a si mesmo
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.dir.pres@ejuvv.com"}', true);

  assert not public.eh_diretor_rh(), 'presidente: antes de assumir o RH, eh_diretor_rh() deveria ser false';

  perform public.atribuir_diretoria('zz A', c_dira);
  perform public.atribuir_diretoria('zz B', c_dira);
  perform public.atribuir_diretoria('zz RH', c_pres);

  select string_agg(s.setor || ':' || coalesce(s.diretor_nome, 'vago'), ',' order by s.setor) into v_lista
    from public.situacao_dos_setores() s where s.setor like 'zz %';
  assert v_lista = 'zz A:zz DirA,zz B:zz DirA,zz C:vago,zz RH:zz Pres',
    format('presidente: situacao_dos_setores() errada (%s)', v_lista);
  select s.eh_rh into ok1 from public.situacao_dos_setores() s where s.setor = 'zz RH';
  assert ok1, 'situacao_dos_setores(): zz RH deveria vir com eh_rh';
  select count(*) into n from public.situacao_dos_setores() s where s.setor = 'zz C' and s.diretor_id is null and s.desde is null;
  assert n = 1, 'situacao_dos_setores(): zz C deveria vir vago';

  ---------------------------------------------------------------------------
  -- 3. Presidente que dirige o RH tem os poderes do diretor do RH
  ---------------------------------------------------------------------------
  assert public.eh_diretor_rh(), 'presidente no RH: eh_diretor_rh() deveria ser true';
  assert public.eh_rh(),         'presidente no RH: eh_rh() deveria ser true';
  assert public.ve_tudo(),       'presidente no RH: ve_tudo() deveria ser true';
  select string_agg(d.setor || ':' || d.eh_rh, ',' order by d.setor) into v_lista from public.minhas_diretorias() d;
  assert v_lista = 'zz RH:true', format('presidente: minhas_diretorias() errada (%s)', v_lista);

  insert into public.metas (horas_total, horas_sede, vigente_desde) values (10, 5, prox);
  get diagnostics n = row_count;
  assert n = 1, 'presidente no RH: não conseguiu cadastrar a meta da semana que vem';

  insert into public.membros (nome, email, setor_id) values ('zz Novo', 'zz.dir.novo@ejuvv.com', c_c);
  get diagnostics n = row_count;
  assert n = 1, 'presidente no RH: não conseguiu cadastrar membro';

  -- ninguém escreve direto nas diretorias nem marca o setor RH pelo site
  begin
    insert into public.diretorias (setor_id, membro_id) values (c_c, c_dira);
    raise exception 'FALHOU: o site gravou direto em diretorias';
  exception when insufficient_privilege then null;
  end;

  begin
    delete from public.diretorias where setor_id = c_a;
    raise exception 'FALHOU: o site apagou direto de diretorias';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.historico_diretorias (setor_id, membro_id, inicio) values (c_c, c_dira, now());
    raise exception 'FALHOU: o site gravou direto no histórico de diretorias';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.setores set eh_rh = false where id = c_setor_rh;
    raise exception 'FALHOU: o site desmarcou o setor RH';
  exception when insufficient_privilege then null;
  end;

  ---------------------------------------------------------------------------
  -- 4. DirA dirige A e B: vê os dois, não vê o C
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.dir.dira@ejuvv.com"}', true);

  assert not public.eh_diretor_rh(), 'DirA: eh_diretor_rh() deveria ser false';
  assert not public.eh_rh(),         'DirA: eh_rh() deveria ser false';
  assert not public.ve_tudo(),       'DirA: ve_tudo() deveria ser false';
  select count(*) into n from public.setores_que_dirijo();
  assert n = 2, format('DirA: deveria dirigir 2 setores (dirige %s)', n);
  select string_agg(d.setor, ',' order by d.setor) into v_lista from public.minhas_diretorias() d;
  assert v_lista = 'zz A,zz B', format('DirA: minhas_diretorias() errada (%s)', v_lista);

  select count(*) into n from public.membros where id = c_mem;
  assert n = 1, 'DirA: deveria ver o zz Mem (setor B)';
  select count(*) into n from public.registros where membro_id = c_mem;
  assert n = 1, format('DirA: deveria ver o registro do zz Mem (viu %s)', n);
  select count(*) into n from public.membros where id = c_memc;
  assert n = 0, 'DirA: viu o zz MemC (setor C, que ele não dirige)';
  select count(*) into n from public.membros where setor_id = c_c;
  assert n = 0, format('DirA: viu %s membros do setor C', n);

  -- B9: sem setor, todos os dele; pedindo um que não dirige, também todos os dele
  select string_agg(distinct r.setor, ',' order by r.setor) into v_lista from public.resumo_da_semana(seg) r;
  assert v_lista = 'zz A,zz B', format('DirA: resumo_da_semana() deveria ter os setores A e B (veio %s)', v_lista);
  select count(*) into n from public.resumo_da_semana(seg) r where r.setor = 'zz C';
  assert n = 0, 'DirA: resumo_da_semana() trouxe o setor C';
  select r.horas_total into x from public.resumo_da_semana(seg) r where r.membro_id = c_mem;
  assert x = 3, format('DirA: o zz Mem deveria ter 3h no resumo (tem %s)', x);
  select count(*) into n from public.resumo_da_semana(seg, 'zz C') r where r.setor = 'zz C';
  assert n = 0, 'DirA: resumo_da_semana(seg, zz C) trouxe o setor C';
  select string_agg(distinct r.setor, ',' order by r.setor) into v_lista from public.resumo_da_semana(seg, 'zz C') r;
  assert v_lista = 'zz A,zz B', format('DirA: pedindo o setor C deveria ver os dele (veio %s)', v_lista);
  select string_agg(distinct r.setor, ',' order by r.setor) into v_lista from public.resumo_da_semana(seg, 'zz B') r;
  assert v_lista = 'zz B', format('DirA: pedindo o setor B deveria ver só o B (veio %s)', v_lista);

  -- ranking: os setores que dirige, com a posição dentro de cada setor
  select string_agg(r.nome || ':' || r.posicao, ',' order by r.posicao, r.nome) into v_lista
    from public.ranking_do_mes(c_mes) r;
  assert v_lista = 'zz Mem:1,zz Rh:1', format('DirA: ranking_do_mes() errado (%s)', v_lista);

  -- tem painel do RH: lê as diretorias; mas não registra
  select count(*) into n from public.diretorias where setor_id in (c_a, c_b, c_c, c_setor_rh);
  assert n = 3, format('DirA: deveria ler as 3 diretorias dos setores zz (leu %s)', n);
  begin
    perform public.atribuir_diretoria('zz C', c_dira);
    raise exception 'FALHOU: diretor de setor registrou diretoria';
  exception when insufficient_privilege then null;
  end;

  ---------------------------------------------------------------------------
  -- 5. Só diretores e o presidente dirigem; setor tem que existir
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.dir.pres@ejuvv.com"}', true);

  begin
    perform public.atribuir_diretoria('zz C', c_mem);
    raise exception 'FALHOU: membro virou diretor de setor';
  exception when check_violation then null;
  end;

  begin
    perform public.atribuir_diretoria('zz C', c_rh);
    raise exception 'FALHOU: rh virou diretor de setor';
  exception when check_violation then null;
  end;

  begin
    perform public.atribuir_diretoria('zz Setor Que Não Existe', c_dira);
    raise exception 'FALHOU: atribuiu diretoria de setor que não existe';
  exception when no_data_found then null;
  end;

  ---------------------------------------------------------------------------
  -- 6. Chegou o titular: atribuir A ao DirA2 troca o diretor
  ---------------------------------------------------------------------------
  perform public.atribuir_diretoria('zz A', c_dira2);
  perform public.atribuir_diretoria('zz A', c_dira2);   -- de novo: nada muda

  select count(*) into n from public.historico_diretorias
   where setor_id = c_a and membro_id = c_dira and fim is not null and encerrado_por = c_pres;
  assert n = 1, 'histórico: a diretoria do DirA no setor A deveria estar fechada pelo presidente';
  select count(*) into n from public.historico_diretorias where setor_id = c_a and fim is null;
  assert n = 1, format('histórico: o setor A deveria ter 1 diretoria aberta (tem %s)', n);
  select count(*) into n from public.historico_diretorias where setor_id = c_a and membro_id = c_dira2 and fim is null;
  assert n = 1, 'histórico: a diretoria do DirA2 no setor A deveria estar aberta';
  select count(*) into n from public.historico_diretorias where setor_id = c_a;
  assert n = 2, format('histórico: atribuir de novo à mesma pessoa não deveria criar linha (o setor A tem %s)', n);

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.dir.dira@ejuvv.com"}', true);
  select string_agg(d.setor, ',' order by d.setor) into v_lista from public.minhas_diretorias() d;
  assert v_lista = 'zz B', format('DirA: deveria ficar só com o B (ficou com %s)', v_lista);
  select count(*) into n from public.membros where id = c_rh;
  assert n = 0, 'DirA: continuou vendo o zz Rh (setor A, que não dirige mais)';

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.dir.dira2@ejuvv.com"}', true);
  select string_agg(d.setor, ',' order by d.setor) into v_lista from public.minhas_diretorias() d;
  assert v_lista = 'zz A', format('DirA2: deveria dirigir o A (dirige %s)', v_lista);

  ---------------------------------------------------------------------------
  -- 7. Presidente deixa o RH vago: perde os poderes do diretor do RH, mas
  --    continua presidente (vê tudo e registra diretorias)
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.dir.pres@ejuvv.com"}', true);

  perform public.remover_diretoria('zz RH');
  assert not public.eh_diretor_rh(), 'presidente sem o RH: eh_diretor_rh() deveria ser false';
  assert not public.eh_rh(),         'presidente sem o RH: eh_rh() deveria ser false';
  assert public.ve_tudo(),           'presidente sem o RH: ve_tudo() deveria continuar true';

  select count(*) into n from public.historico_diretorias
   where setor_id = c_setor_rh and membro_id = c_pres and fim is not null and encerrado_por = c_pres;
  assert n = 1, 'histórico: a diretoria do RH do presidente deveria estar fechada';

  begin
    perform public.remover_diretoria('zz RH');
    raise exception 'FALHOU: tirou a diretoria de um setor vago';
  exception when no_data_found then null;
  end;

  begin
    insert into public.membros (nome, email, setor_id) values ('zz Novo 2', 'zz.dir.novo2@ejuvv.com', c_c);
    raise exception 'FALHOU: presidente sem o RH cadastrou membro';
  exception when insufficient_privilege then null;
  end;

  -- o RH vago não trava: o presidente registra de novo
  perform public.atribuir_diretoria('zz RH', c_pres);
  assert public.eh_diretor_rh(), 'presidente: deveria conseguir assumir o RH vago de novo';

  ---------------------------------------------------------------------------
  -- 8. Desativar um setor dirigido encerra a diretoria; reativar deixa vago
  --    (migração encerrar_diretoria_setor_inativo)
  ---------------------------------------------------------------------------
  perform public.atribuir_diretoria('zz C', c_dira);   -- DirA passa a dirigir B e C

  update public.setores set ativo = false where id = c_c;
  get diagnostics n = row_count;
  assert n = 1, 'presidente: não conseguiu desativar o setor C';

  select count(*) into n from public.diretorias where setor_id = c_c;
  assert n = 0, 'setor desativado: a diretoria do setor C deveria sumir';
  select count(*) into n from public.historico_diretorias where setor_id = c_c and fim is null;
  assert n = 0, 'setor desativado: o histórico do setor C deveria estar fechado';
  select count(*) into n from public.historico_diretorias
   where setor_id = c_c and membro_id = c_dira and fim is not null and encerrado_por = c_pres;
  assert n = 1, 'setor desativado: a diretoria do DirA no setor C deveria estar fechada pelo presidente';

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.dir.dira@ejuvv.com"}', true);
  select count(*) into n from public.setores_que_dirijo() t(setor_id) where t.setor_id = c_c;
  assert n = 0, 'setor desativado: setores_que_dirijo() do DirA ainda traz o setor C';
  select string_agg(d.setor, ',' order by d.setor) into v_lista from public.minhas_diretorias() d;
  assert v_lista = 'zz B', format('setor desativado: o DirA deveria ficar só com o B (ficou com %s)', v_lista);
  select count(*) into n from public.membros where id = c_memc;
  assert n = 0, 'setor desativado: o DirA continuou vendo o zz MemC (setor C)';

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.dir.pres@ejuvv.com"}', true);
  update public.setores set ativo = true where id = c_c;
  get diagnostics n = row_count;
  assert n = 1, 'presidente: não conseguiu reativar o setor C';
  select count(*) into n from public.situacao_dos_setores() s where s.setor = 'zz C' and s.diretor_id is null;
  assert n = 1, 'setor reativado: o setor C deveria voltar vago';
  select count(*) into n from public.diretorias where setor_id = c_c;
  assert n = 0, 'setor reativado: o setor C não deveria ganhar diretor sozinho';

  ---------------------------------------------------------------------------
  -- 9. Como dono do banco: um diretor por setor; desativar ou rebaixar encerra
  ---------------------------------------------------------------------------
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', '', true);

  begin
    insert into public.diretorias (setor_id, membro_id) values (c_b, c_dira2);
    raise exception 'FALHOU: o setor B ficou com 2 diretores';
  exception when unique_violation then null;
  end;

  update public.membros set ativo = false where id = c_dira;
  select count(*) into n from public.diretorias where setor_id = c_b;
  assert n = 0, 'desativar: o setor B deveria ficar vago';
  select count(*) into n from public.diretorias where membro_id = c_dira;
  assert n = 0, 'desativar: o DirA não deveria dirigir mais nada';
  select count(*) into n from public.historico_diretorias where membro_id = c_dira and fim is null;
  assert n = 0, 'desativar: o histórico do DirA deveria estar fechado';
  select count(*) into n from public.historico_diretorias
   where setor_id = c_b and membro_id = c_dira and fim is not null and encerrado_por is null;
  assert n = 1, 'desativar: o histórico do setor B deveria ter a diretoria do DirA fechada (direto no banco)';

  update public.membros set perfil = 'membro' where id = c_dira2;
  select count(*) into n from public.diretorias where setor_id = c_a;
  assert n = 0, 'virar membro: o setor A deveria ficar vago';
  select count(*) into n from public.historico_diretorias where setor_id = c_a and fim is null;
  assert n = 0, 'virar membro: o histórico do setor A deveria estar fechado';

  -- Chegou aqui = passou. Este erro é de propósito: desfaz tudo o que o teste fez.
  raise exception 'fim do teste' using errcode = 'ZZ999';
  exception when sqlstate 'ZZ999' then
    null;
  end;
end
$$;

select 'OK: diretorias passaram' as resultado;
