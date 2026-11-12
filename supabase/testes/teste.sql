-- =============================================================================
-- AstroClock · teste do banco (B3, B6 e B7)
-- 5 perfis, membros, setores, metas, lista_de_metas, historico_setor,
-- meus_dados(), meu_setor_id(), elegibilidade, registros (pelo site e pelas
-- funções do RH), auditoria, 1 diretor do RH e 1 presidente
-- =============================================================================
-- Rode DEPOIS da migração da B7, no SQL Editor (não muda nada no banco). Cria dados de teste (prefixo zz), confere
-- pelos dois lados (quem deve ver, vê; quem não deve, não vê) e desfaz tudo no
-- final: não suja o banco.
-- Terminou com "OK: todos os testes passaram" = passou. Se falhar, a mensagem
-- diz o que quebrou (e também não fica nada no banco).
-- =============================================================================

do $$
declare
  c_setor_a  constant uuid := 'a0000000-0000-4000-8000-000000000001';
  c_setor_b  constant uuid := 'a0000000-0000-4000-8000-000000000002';
  c_membro   constant uuid := 'a0000000-0000-4000-8000-0000000000a1';
  c_rh       constant uuid := 'a0000000-0000-4000-8000-0000000000a2';
  c_diretora constant uuid := 'a0000000-0000-4000-8000-0000000000a3';
  c_inativo  constant uuid := 'a0000000-0000-4000-8000-0000000000a4';
  c_dsetor   constant uuid := 'a0000000-0000-4000-8000-0000000000a5';
  c_presid   constant uuid := 'a0000000-0000-4000-8000-0000000000a6';
  c_membro_b constant uuid := 'a0000000-0000-4000-8000-0000000000a7';
  seg        constant date := date_trunc('week', now() at time zone 'America/Sao_Paulo')::date;  -- segunda desta semana
  prox       constant date := seg + 7;                                                            -- segunda que vem
  hoje       constant date := (now() at time zone 'America/Sao_Paulo')::date;
  -- horários de Brasília usados nos registros das seções 11 e 12
  ontem_01   constant timestamptz := ((hoje - 1)::timestamp  + time '01:00') at time zone 'America/Sao_Paulo';
  ontem_02   constant timestamptz := ((hoje - 1)::timestamp  + time '02:00') at time zone 'America/Sao_Paulo';
  d1_03      constant timestamptz := ((hoje - 1)::timestamp  + time '03:00') at time zone 'America/Sao_Paulo';
  d1_04      constant timestamptz := ((hoje - 1)::timestamp  + time '04:00') at time zone 'America/Sao_Paulo';
  d3_13      constant timestamptz := ((hoje - 3)::timestamp  + time '13:00') at time zone 'America/Sao_Paulo';
  d3_23      constant timestamptz := ((hoje - 3)::timestamp  + time '23:00') at time zone 'America/Sao_Paulo';
  d6_01      constant timestamptz := ((hoje - 6)::timestamp  + time '01:00') at time zone 'America/Sao_Paulo';
  d6_02      constant timestamptz := ((hoje - 6)::timestamp  + time '02:00') at time zone 'America/Sao_Paulo';
  d7_01      constant timestamptz := ((hoje - 7)::timestamp  + time '01:00') at time zone 'America/Sao_Paulo';
  d7_02      constant timestamptz := ((hoje - 7)::timestamp  + time '02:00') at time zone 'America/Sao_Paulo';
  d8_01      constant timestamptz := ((hoje - 8)::timestamp  + time '01:00') at time zone 'America/Sao_Paulo';
  d8_02      constant timestamptz := ((hoje - 8)::timestamp  + time '02:00') at time zone 'America/Sao_Paulo';
  d8_05      constant timestamptz := ((hoje - 8)::timestamp  + time '05:00') at time zone 'America/Sao_Paulo';
  d8_06      constant timestamptz := ((hoje - 8)::timestamp  + time '06:00') at time zone 'America/Sao_Paulo';
  d9_13      constant timestamptz := ((hoje - 9)::timestamp  + time '13:00') at time zone 'America/Sao_Paulo';
  d10_03     constant timestamptz := ((hoje - 10)::timestamp + time '03:00') at time zone 'America/Sao_Paulo';
  d10_04     constant timestamptz := ((hoje - 10)::timestamp + time '04:00') at time zone 'America/Sao_Paulo';
  d15_03     constant timestamptz := ((hoje - 15)::timestamp + time '03:00') at time zone 'America/Sao_Paulo';
  d15_04     constant timestamptz := ((hoje - 15)::timestamp + time '04:00') at time zone 'America/Sao_Paulo';
  d20_03     constant timestamptz := ((hoje - 20)::timestamp + time '03:00') at time zone 'America/Sao_Paulo';
  d20_04     constant timestamptz := ((hoje - 20)::timestamp + time '04:00') at time zone 'America/Sao_Paulo';
  amanha_01  constant timestamptz := ((hoje + 1)::timestamp  + time '01:00') at time zone 'America/Sao_Paulo';
  amanha_02  constant timestamptz := ((hoje + 1)::timestamp  + time '02:00') at time zone 'America/Sao_Paulo';
  total      int;
  n_setor_a  int;
  n_setores  int;
  n_metas    int;
  n_hist     int;
  n_reg      int;
  n_reg_a    int;
  n_reg_m    int;
  n_aud      int;
  f          oid;
  n0         int;
  n          int;
  x          numeric;
  v_email    text;
  v_lista    text;
  r          public.registros;
  rr         public.registros;
  rr2        public.registros;
  r_esq      public.registros;
  r_velho    public.registros;
  r_site     public.registros;
  r_cron     public.registros;
  r_rev      public.registros;
  v_meta     public.metas;
  v_meta2    public.metas;
  eu         record;
begin
  begin   -- tudo o que o teste faz fica neste bloco e é desfeito no fim

  -- Só pode ter 1 diretor do RH e 1 presidente ativos, e o teste cria os dele.
  -- Os do seed ficam desativados só durante o teste.
  update public.membros set ativo = false where ativo and perfil in ('diretor_rh', 'presidente');

  insert into public.setores (id, nome) values
    (c_setor_a, 'zz Setor A'),
    (c_setor_b, 'zz Setor B');

  insert into public.membros (id, nome, email, perfil, setor_id, ativo) values
    (c_membro,   'zz Membro',        'zz.teste.membro@ejuvv.com',     'membro',        c_setor_a, true),
    (c_rh,       'zz RH',            'zz.teste.rh@ejuvv.com',         'rh',            c_setor_a, true),
    (c_diretora, 'zz Diretora RH',   'zz.teste.diretora@ejuvv.com',   'diretor_rh',    c_setor_a, true),
    (c_inativo,  'zz Inativo',       'zz.teste.inativo@ejuvv.com',    'membro',        c_setor_a, false),
    (c_dsetor,   'zz Diretor Setor', 'zz.teste.dsetor@ejuvv.com',     'diretor_setor', c_setor_a, true),
    (c_presid,   'zz Presidente',    'zz.teste.presidente@ejuvv.com', 'presidente',    c_setor_b, true),
    (c_membro_b, 'zz Membro B',      'zz.teste.membrob@ejuvv.com',    'membro',        c_setor_b, true);

  select count(*) into total     from public.membros;                          -- dono do banco: vê tudo
  select count(*) into n_setor_a from public.membros where setor_id = c_setor_a;
  select count(*) into n_setores from public.setores;
  select count(*) into n_metas   from public.metas;
  assert n_setor_a = 5, format('fixture: setor A deveria ter 5 membros (tem %s)', n_setor_a);

  ---------------------------------------------------------------------------
  -- 0. Quem tem meta: só membro e rh
  ---------------------------------------------------------------------------
  assert public.perfil_tem_meta('membro'),             'membro deveria ter meta';
  assert public.perfil_tem_meta('rh'),                 'rh deveria ter meta';
  assert not public.perfil_tem_meta('diretor_rh'),     'diretor_rh não deveria ter meta';
  assert not public.perfil_tem_meta('diretor_setor'),  'diretor_setor não deveria ter meta';
  assert not public.perfil_tem_meta('presidente'),     'presidente não deveria ter meta';

  ---------------------------------------------------------------------------
  -- 1. Membro comum
  ---------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.teste.membro@ejuvv.com"}', true);

  assert public.meu_id() = c_membro,      'membro: meu_id() errado';
  assert public.meu_perfil() = 'membro',  'membro: meu_perfil() deveria ser membro';
  assert not public.eh_rh(),              'membro: eh_rh() deveria ser false';
  assert not public.eh_diretor_rh(),      'membro: eh_diretor_rh() deveria ser false';
  assert not public.ve_tudo(),            'membro: ve_tudo() deveria ser false';
  assert public.setor_que_dirijo() is null, 'membro: setor_que_dirijo() deveria ser null';
  assert public.meu_setor_id() = c_setor_a, 'membro: meu_setor_id() errado';

  select count(*) into n from public.membros;
  assert n = 1, format('membro: deveria ver só a própria linha (viu %s)', n);

  update public.membros set nome = 'invadido' where id = c_rh;
  get diagnostics n = row_count;
  assert n = 0, 'membro: conseguiu alterar outro membro';

  update public.membros set perfil = 'rh' where id = c_membro;
  get diagnostics n = row_count;
  assert n = 0, 'membro: conseguiu mudar o próprio perfil';

  begin
    insert into public.membros (nome, email, setor_id) values ('x', 'zz.x@ejuvv.com', c_setor_a);
    raise exception 'FALHOU: membro conseguiu cadastrar membro';
  exception when insufficient_privilege then null;
  end;

  begin
    delete from public.membros where id = c_membro;
    raise exception 'FALHOU: membro conseguiu apagar membro';
  exception when insufficient_privilege then null;
  end;

  -- lê setores, metas e lista_de_metas (o login e as telas precisam)
  select count(*) into n from public.setores;
  assert n = n_setores, format('membro: deveria ler os %s setores (leu %s)', n_setores, n);
  select count(*) into n from public.metas;
  assert n = n_metas, format('membro: deveria ler as %s metas (leu %s)', n_metas, n);
  perform 1 from public.lista_de_metas;
  select count(*) into n from public.registros where membro_id <> c_membro;
  assert n = 0, format('membro: viu %s registros de outros membros', n);

  -- meus_dados(): a própria linha, com o nome do setor
  select count(*) into n from public.meus_dados();
  assert n = 1, format('membro: meus_dados() deveria ter 1 linha (tem %s)', n);
  select * into eu from public.meus_dados();
  assert eu.id = c_membro and eu.nome = 'zz Membro' and eu.email = 'zz.teste.membro@ejuvv.com'
     and eu.perfil = 'membro' and eu.setor = 'zz Setor A' and eu.ativo,
     'membro: meus_dados() devolveu dados errados';

  -- não cria nem altera setor, meta ou histórico
  begin
    insert into public.setores (nome) values ('zz Setor X');
    raise exception 'FALHOU: membro criou setor';
  exception when insufficient_privilege then null;
  end;

  update public.setores set nome = 'invadido' where id = c_setor_a;
  get diagnostics n = row_count;
  assert n = 0, 'membro: conseguiu alterar setor';

  begin
    insert into public.metas (horas_total, horas_sede, vigente_desde) values (10, 5, prox);
    raise exception 'FALHOU: membro criou meta';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.historico_setor (membro_id, setor_anterior_id, setor_novo_id)
    values (c_membro, c_setor_a, c_setor_b);
    raise exception 'FALHOU: membro escreveu no histórico de setor';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.exigir_rh_com_motivo('zz x');
    raise exception 'FALHOU: o site conseguiu chamar a função interna exigir_rh_com_motivo()';
  exception when insufficient_privilege then null;
  end;

  -- quem entra no cálculo da meta (semana de 02/11/2026, segunda-feira)
  assert public.elegivel_na_semana('membro', true, '2026-10-01', '2026-11-02'),         'elegível: membro antigo deveria entrar';
  assert public.elegivel_na_semana('rh', true, '2026-10-01', '2026-11-02'),             'elegível: rh deveria entrar';
  assert not public.elegivel_na_semana('diretor_rh', true, '2026-10-01', '2026-11-02'),    'elegível: diretor_rh não deveria entrar';
  assert not public.elegivel_na_semana('diretor_setor', true, '2026-10-01', '2026-11-02'), 'elegível: diretor_setor não deveria entrar';
  assert not public.elegivel_na_semana('presidente', true, '2026-10-01', '2026-11-02'),    'elegível: presidente não deveria entrar';
  assert not public.elegivel_na_semana('membro', false, '2026-10-01', '2026-11-02'),       'elegível: desativado não deveria entrar';
  assert not public.elegivel_na_semana('membro', true, '2026-11-02', '2026-11-02'),        'elegível: quem entrou na segunda só conta na semana seguinte';
  assert not public.elegivel_na_semana('membro', true, '2026-11-04', '2026-11-02'),        'elegível: quem entrou na quarta não conta nessa semana';
  assert public.elegivel_na_semana('membro', true, '2026-11-04', '2026-11-09'),            'elegível: quem entrou na quarta conta na semana seguinte';
  assert public.elegivel_na_semana('membro', true, '2026-11-01', '2026-11-02'),            'elegível: quem entrou no domingo conta a partir da segunda';

  -- e-mail com maiúsculas no token também acha a pessoa
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"ZZ.Teste.Membro@ejuvv.com"}', true);
  assert public.meu_id() = c_membro, 'e-mail com maiúsculas no token não achou o membro';

  ---------------------------------------------------------------------------
  -- 2. Conta @ejuvv.com sem cadastro: tem sessão, mas não vê nada
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.ninguem@ejuvv.com"}', true);

  assert public.meu_id() is null,      'sem cadastro: meu_id() deveria ser null';
  assert public.meu_perfil() is null,  'sem cadastro: meu_perfil() deveria ser null';
  assert not public.eh_rh(),           'sem cadastro: eh_rh() deveria ser false';
  assert not public.ve_tudo(),         'sem cadastro: ve_tudo() deveria ser false';
  assert public.setor_que_dirijo() is null, 'sem cadastro: setor_que_dirijo() deveria ser null';
  assert public.meu_setor_id() is null,     'sem cadastro: meu_setor_id() deveria ser null';
  select count(*) into n from public.membros;
  assert n = 0, format('sem cadastro: deveria ver 0 membros (viu %s)', n);
  select count(*) into n from public.setores;
  assert n = 0, format('sem cadastro: deveria ler 0 setores (leu %s)', n);
  select count(*) into n from public.metas;
  assert n = 0, format('sem cadastro: deveria ler 0 metas (leu %s)', n);
  select count(*) into n from public.meus_dados();
  assert n = 0, 'sem cadastro: meus_dados() deveria vir vazio';
  select count(*) into n from public.registros;
  assert n = 0, format('sem cadastro: deveria ver 0 registros (viu %s)', n);
  begin
    insert into public.registros (inicio, fim, local, descricao) values (ontem_01, ontem_02, 'sede', 'zz x');
    raise exception 'FALHOU: conta sem cadastro lançou horas';
  exception when check_violation or insufficient_privilege then null;
  end;

  ---------------------------------------------------------------------------
  -- 3. Membro desativado: mesmo efeito de sem cadastro
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.teste.inativo@ejuvv.com"}', true);

  assert public.meu_id() is null,     'desativado: meu_id() deveria ser null';
  assert public.meu_perfil() is null, 'desativado: meu_perfil() deveria ser null';
  assert public.meu_setor_id() is null, 'desativado: meu_setor_id() deveria ser null';
  select count(*) into n from public.membros;
  assert n = 0, format('desativado: deveria ver 0 membros (viu %s)', n);
  select count(*) into n from public.setores;
  assert n = 0, format('desativado: deveria ler 0 setores (leu %s)', n);
  select count(*) into n from public.meus_dados();
  assert n = 0, 'desativado: meus_dados() deveria vir vazio';
  select count(*) into n from public.registros;
  assert n = 0, format('desativado: deveria ver 0 registros (viu %s)', n);

  ---------------------------------------------------------------------------
  -- 4. RH (rh): vê todos, desativa e troca o setor de quem é membro ou rh.
  --    Não cadastra, não mexe no resto nem em diretor.
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.teste.rh@ejuvv.com"}', true);

  assert public.meu_perfil() = 'rh', 'rh: meu_perfil() deveria ser rh';
  assert public.eh_rh(),             'rh: eh_rh() deveria ser true';
  assert public.ve_tudo(),           'rh: ve_tudo() deveria ser true';
  assert not public.eh_diretor_rh(), 'rh: eh_diretor_rh() deveria ser false';
  select count(*) into n from public.membros;
  assert n = total, format('rh: deveria ver todos os %s membros (viu %s)', total, n);

  begin
    insert into public.membros (nome, email, setor_id) values ('x', 'zz.x@ejuvv.com', c_setor_a);
    raise exception 'FALHOU: rh conseguiu cadastrar membro';
  exception when insufficient_privilege then null;
  end;

  -- desativa (mas não reativa)
  update public.membros set ativo = false where id = c_membro;
  get diagnostics n = row_count;
  assert n = 1, 'rh: não conseguiu desativar um membro';

  begin
    update public.membros set ativo = true where id = c_membro;
    raise exception 'FALHOU: rh reativou um membro';
  exception when insufficient_privilege then null;
  end;

  -- troca o setor de membro e de rh; o banco guarda a troca e quem fez
  update public.membros set setor_id = c_setor_b where id = c_membro;
  get diagnostics n = row_count;
  assert n = 1, 'rh: não conseguiu trocar o setor de um membro';
  update public.membros set setor_id = c_setor_a where id = c_membro;

  update public.membros set setor_id = c_setor_b where id = c_rh;
  get diagnostics n = row_count;
  assert n = 1, 'rh: não conseguiu trocar o setor de quem é rh';
  update public.membros set setor_id = c_setor_a where id = c_rh;

  select count(*) into n from public.historico_setor where membro_id = c_membro and alterado_por = c_rh;
  assert n = 2, format('historico_setor: deveria ter 2 trocas do membro feitas pelo rh (tem %s)', n);
  select count(*) into n from public.historico_setor
   where membro_id = c_membro and setor_anterior_id = c_setor_a and setor_novo_id = c_setor_b;
  assert n = 1, 'historico_setor: gravou a troca errada';

  update public.membros set setor_id = c_setor_a where id = c_membro;   -- já está no A: não é troca
  select count(*) into n from public.historico_setor where membro_id = c_membro;
  assert n = 2, 'historico_setor: gravou troca que não mudou o setor';

  -- o resto é com o diretor do RH
  begin
    update public.membros set nome = 'x' where id = c_membro;
    raise exception 'FALHOU: rh mudou o nome de um membro';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.membros set email = 'zz.x@ejuvv.com' where id = c_membro;
    raise exception 'FALHOU: rh mudou o e-mail de um membro';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.membros set perfil = 'rh' where id = c_membro;
    raise exception 'FALHOU: rh mudou o perfil de um membro';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.membros set perfil = 'diretor_rh' where id = c_rh;
    raise exception 'FALHOU: rh se promoveu';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.membros set data_entrada = '2020-01-01' where id = c_membro;
    raise exception 'FALHOU: rh mudou a data de entrada';
  exception when insufficient_privilege then null;
  end;

  -- em diretor não mexe (a linha nem entra no update)
  update public.membros set ativo = false where id in (c_dsetor, c_presid, c_diretora);
  get diagnostics n = row_count;
  assert n = 0, 'rh: conseguiu desativar diretor';
  update public.membros set setor_id = c_setor_b where id = c_dsetor;
  get diagnostics n = row_count;
  assert n = 0, 'rh: conseguiu trocar o setor de um diretor';

  begin
    delete from public.membros where id = c_membro;
    raise exception 'FALHOU: rh conseguiu apagar membro';
  exception when insufficient_privilege then null;
  end;

  -- meta e setor não
  begin
    insert into public.metas (horas_total, horas_sede, vigente_desde) values (10, 5, prox);
    raise exception 'FALHOU: rh criou meta';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.setores (nome) values ('zz Setor X');
    raise exception 'FALHOU: rh criou setor';
  exception when insufficient_privilege then null;
  end;

  -- volta o membro (como dono do banco) para as próximas seções
  perform set_config('role', 'none', true);
  update public.membros set ativo = true where id = c_membro;
  perform set_config('role', 'authenticated', true);

  ---------------------------------------------------------------------------
  -- 5. Diretor de setor: vê só o próprio setor, não escreve
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.teste.dsetor@ejuvv.com"}', true);

  assert public.meu_id() = c_dsetor,               'diretor_setor: meu_id() errado';
  assert public.meu_perfil() = 'diretor_setor',    'diretor_setor: meu_perfil() errado';
  assert public.setor_que_dirijo() = c_setor_a,    'diretor_setor: setor_que_dirijo() errado';
  assert not public.eh_rh(),                       'diretor_setor: eh_rh() deveria ser false';
  assert not public.ve_tudo(),                     'diretor_setor: ve_tudo() deveria ser false';
  assert not public.eh_diretor_rh(),               'diretor_setor: eh_diretor_rh() deveria ser false';
  assert public.meu_setor_id() = c_setor_a,        'diretor_setor: meu_setor_id() errado';

  select count(*) into n from public.membros;
  assert n = n_setor_a, format('diretor_setor: deveria ver só os %s membros do setor (viu %s)', n_setor_a, n);
  select count(*) into n from public.membros where setor_id <> c_setor_a;
  assert n = 0, format('diretor_setor: viu %s membros de outros setores', n);
  select count(*) into n from public.membros where id = c_presid;
  assert n = 0, 'diretor_setor: viu o presidente (que é de outro setor)';

  select count(*) into n from public.setores;
  assert n = n_setores, format('diretor_setor: deveria ler os %s setores (leu %s)', n_setores, n);
  select count(*) into n from public.historico_setor;
  assert n = 0, format('diretor_setor: leu %s linhas do histórico de setor', n);

  update public.membros set nome = 'x' where id = c_membro;
  get diagnostics n = row_count;
  assert n = 0, 'diretor_setor: conseguiu alterar membro do próprio setor';

  update public.membros set perfil = 'presidente' where id = c_dsetor;
  get diagnostics n = row_count;
  assert n = 0, 'diretor_setor: conseguiu mudar o próprio perfil';

  begin
    insert into public.membros (nome, email, setor_id) values ('x', 'zz.x@ejuvv.com', c_setor_a);
    raise exception 'FALHOU: diretor_setor conseguiu cadastrar membro';
  exception when insufficient_privilege then null;
  end;

  begin
    delete from public.membros where id = c_membro;
    raise exception 'FALHOU: diretor_setor conseguiu apagar membro';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.setores (nome) values ('zz Setor X');
    raise exception 'FALHOU: diretor_setor criou setor';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.metas (horas_total, horas_sede, vigente_desde) values (10, 5, prox);
    raise exception 'FALHOU: diretor_setor criou meta';
  exception when insufficient_privilege then null;
  end;

  ---------------------------------------------------------------------------
  -- 6. Presidente: vê todos, só consulta membros; cria e altera setores
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.teste.presidente@ejuvv.com"}', true);

  assert public.meu_perfil() = 'presidente', 'presidente: meu_perfil() errado';
  assert public.ve_tudo(),                   'presidente: ve_tudo() deveria ser true';
  assert not public.eh_rh(),                 'presidente: eh_rh() deveria ser false';
  assert not public.eh_diretor_rh(),         'presidente: eh_diretor_rh() deveria ser false';
  assert public.setor_que_dirijo() is null,  'presidente: setor_que_dirijo() deveria ser null';
  assert public.meu_setor_id() = c_setor_b,  'presidente: meu_setor_id() errado';
  select count(*) into n from public.membros;
  assert n = total, format('presidente: deveria ver todos os %s membros (viu %s)', total, n);

  select * into eu from public.meus_dados();
  assert eu.id = c_presid and eu.perfil = 'presidente' and eu.setor = 'zz Setor B',
    'presidente: meus_dados() devolveu dados errados';

  select count(*) into n from public.historico_setor where membro_id = c_membro;
  assert n = 2, 'presidente: deveria ler o histórico de setor';

  update public.membros set nome = 'x' where id = c_membro;
  get diagnostics n = row_count;
  assert n = 0, 'presidente: conseguiu alterar membro';

  update public.membros set perfil = 'diretor_rh' where id = c_presid;
  get diagnostics n = row_count;
  assert n = 0, 'presidente: conseguiu mudar o próprio perfil';

  begin
    insert into public.membros (nome, email, setor_id) values ('x', 'zz.x@ejuvv.com', c_setor_a);
    raise exception 'FALHOU: presidente conseguiu cadastrar membro';
  exception when insufficient_privilege then null;
  end;

  begin
    delete from public.membros where id = c_membro;
    raise exception 'FALHOU: presidente conseguiu apagar membro';
  exception when insufficient_privilege then null;
  end;

  -- setores: cria, renomeia e desativa
  insert into public.setores (nome) values ('zz Setor C');
  update public.setores set nome = 'zz Setor C2', ativo = false where nome = 'zz Setor C';
  get diagnostics n = row_count;
  assert n = 1, 'presidente: não conseguiu alterar setor';

  begin
    delete from public.setores where nome = 'zz Setor C2';
    raise exception 'FALHOU: apagou setor';
  exception when insufficient_privilege then null;
  end;

  -- meta não
  begin
    insert into public.metas (horas_total, horas_sede, vigente_desde) values (10, 5, prox);
    raise exception 'FALHOU: presidente criou meta';
  exception when insufficient_privilege then null;
  end;

  ---------------------------------------------------------------------------
  -- 7. Visitante sem login (anon): nada
  ---------------------------------------------------------------------------
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);

  begin perform 1 from public.membros;         raise exception 'FALHOU: anon leu membros';         exception when insufficient_privilege then null; end;
  begin perform 1 from public.setores;         raise exception 'FALHOU: anon leu setores';         exception when insufficient_privilege then null; end;
  begin perform 1 from public.metas;           raise exception 'FALHOU: anon leu metas';           exception when insufficient_privilege then null; end;
  begin perform 1 from public.lista_de_metas;  raise exception 'FALHOU: anon leu lista_de_metas';  exception when insufficient_privilege then null; end;
  begin perform 1 from public.auditoria;       raise exception 'FALHOU: anon leu auditoria';       exception when insufficient_privilege then null; end;
  begin perform 1 from public.historico_setor; raise exception 'FALHOU: anon leu historico_setor'; exception when insufficient_privilege then null; end;
  begin perform 1 from public.registros;       raise exception 'FALHOU: anon leu registros';       exception when insufficient_privilege then null; end;

  begin perform public.meu_perfil();           raise exception 'FALHOU: anon executou meu_perfil()';           exception when insufficient_privilege then null; end;
  begin perform public.eh_diretor_rh();        raise exception 'FALHOU: anon executou eh_diretor_rh()';        exception when insufficient_privilege then null; end;
  begin perform public.ve_tudo();              raise exception 'FALHOU: anon executou ve_tudo()';              exception when insufficient_privilege then null; end;
  begin perform public.setor_que_dirijo();     raise exception 'FALHOU: anon executou setor_que_dirijo()';     exception when insufficient_privilege then null; end;
  begin perform public.perfil_tem_meta('rh');  raise exception 'FALHOU: anon executou perfil_tem_meta()';      exception when insufficient_privilege then null; end;
  begin perform * from public.meus_dados();    raise exception 'FALHOU: anon executou meus_dados()';           exception when insufficient_privilege then null; end;
  begin perform public.elegivel_na_semana('membro', true, '2026-10-01', '2026-11-02');
        raise exception 'FALHOU: anon executou elegivel_na_semana()';  exception when insufficient_privilege then null; end;
  begin perform public.meu_setor_id();         raise exception 'FALHOU: anon executou meu_setor_id()';         exception when insufficient_privilege then null; end;
  begin perform public.criar_registro_de_membro(c_membro, now() - interval '1 hour', now(), 'sede', 'x', 'x');
        raise exception 'FALHOU: anon executou criar_registro_de_membro()'; exception when insufficient_privilege then null; end;
  begin perform public.editar_registro_de_membro(p_id => c_membro, p_motivo => 'x');
        raise exception 'FALHOU: anon executou editar_registro_de_membro()'; exception when insufficient_privilege then null; end;
  begin perform public.cancelar_registro_de_membro(c_membro, 'x');
        raise exception 'FALHOU: anon executou cancelar_registro_de_membro()'; exception when insufficient_privilege then null; end;
  begin perform public.revisar_cronometro(c_membro, true);
        raise exception 'FALHOU: anon executou revisar_cronometro()';          exception when insufficient_privilege then null; end;

  ---------------------------------------------------------------------------
  -- 8. Diretor do RH: cadastra e altera membros, cria metas e setores
  ---------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.teste.diretora@ejuvv.com"}', true);

  assert public.meu_perfil() = 'diretor_rh', 'diretora: meu_perfil() deveria ser diretor_rh';
  assert public.eh_diretor_rh(),             'diretora: eh_diretor_rh() deveria ser true';
  assert public.eh_rh(),                     'diretora: eh_rh() deveria ser true';
  assert public.ve_tudo(),                   'diretora: ve_tudo() deveria ser true';
  select count(*) into n from public.membros;
  assert n = total, format('diretora: deveria ver todos os %s membros (viu %s)', total, n);

  -- cadastra (e o banco arruma e-mail e nome)
  insert into public.membros (nome, email, setor_id) values ('  zz Novo  ', '  ZZ.Novo@EJUVV.com ', c_setor_a);
  select count(*) into n from public.membros where email = 'zz.novo@ejuvv.com' and nome = 'zz Novo';
  assert n = 1, 'diretora: cadastro não normalizou e-mail/nome';

  begin
    insert into public.membros (nome, email, setor_id) values ('x', 'alguem@gmail.com', c_setor_a);
    raise exception 'FALHOU: aceitou e-mail fora do @ejuvv.com';
  exception when check_violation then null;
  end;

  begin
    insert into public.membros (nome, email, setor_id) values ('x', 'zz.teste.membro@ejuvv.com', c_setor_a);
    raise exception 'FALHOU: aceitou e-mail repetido';
  exception when unique_violation then null;
  end;

  -- altera perfil e nome, desativa e reativa
  update public.membros set perfil = 'rh' where id = c_membro;
  get diagnostics n = row_count;
  assert n = 1, 'diretora: não conseguiu promover membro a rh';

  update public.membros set nome = 'zz RH' where id = c_rh;
  get diagnostics n = row_count;
  assert n = 1, 'diretora: não conseguiu alterar quem é rh';

  update public.membros set ativo = false where id = c_membro;
  get diagnostics n = row_count;
  assert n = 1, 'diretora: não conseguiu desativar membro';
  update public.membros set ativo = true where id = c_membro;
  get diagnostics n = row_count;
  assert n = 1, 'diretora: não conseguiu reativar membro';

  -- no máximo 1 diretor do RH e 1 presidente ativos
  begin
    update public.membros set perfil = 'diretor_rh' where id = c_membro;
    raise exception 'FALHOU: ficaram 2 diretores do RH ativos';
  exception when unique_violation then null;
  end;

  begin
    update public.membros set perfil = 'presidente' where id = c_membro;
    raise exception 'FALHOU: ficaram 2 presidentes ativos';
  exception when unique_violation then null;
  end;

  begin
    insert into public.membros (nome, email, perfil, setor_id)
    values ('zz Outra Diretora', 'zz.outra.diretora@ejuvv.com', 'diretor_rh', c_setor_a);
    raise exception 'FALHOU: cadastrou um 2º diretor do RH ativo';
  exception when unique_violation then null;
  end;

  insert into public.membros (nome, email, perfil, setor_id, ativo)
  values ('zz Ex Presidente', 'zz.ex.presidente@ejuvv.com', 'presidente', c_setor_b, false);   -- desativado pode

  begin
    update public.membros set ativo = true where email = 'zz.ex.presidente@ejuvv.com';
    raise exception 'FALHOU: reativou presidente com outro ativo';
  exception when unique_violation then null;
  end;

  -- troca de presidente: tira o atual e depois nomeia o novo
  update public.membros set perfil = 'membro' where id = c_presid;
  update public.membros set perfil = 'presidente' where id = c_membro;
  get diagnostics n = row_count;
  assert n = 1, 'diretora: não conseguiu nomear presidente com a vaga livre';
  update public.membros set perfil = 'membro' where id = c_membro;
  update public.membros set perfil = 'presidente' where id = c_presid;
  get diagnostics n = row_count;
  assert n = 1, 'diretora: não conseguiu devolver o cargo ao presidente';

  -- troca o setor de um diretor (só ela pode); o histórico guarda quem fez
  update public.membros set setor_id = c_setor_b where id = c_dsetor;
  get diagnostics n = row_count;
  assert n = 1, 'diretora: não conseguiu trocar o setor de um diretor';
  update public.membros set setor_id = c_setor_a where id = c_dsetor;
  select count(*) into n from public.historico_setor where membro_id = c_dsetor and alterado_por = c_diretora;
  assert n = 2, format('historico_setor: deveria ter 2 trocas feitas pela diretora (tem %s)', n);

  -- no máximo 1 diretor de setor ativo por setor
  begin
    update public.membros set perfil = 'diretor_setor' where id = c_membro;      -- setor A já tem o c_dsetor ativo
    raise exception 'FALHOU: setor A ficou com 2 diretores de setor ativos';
  exception when unique_violation then null;
  end;

  begin
    insert into public.membros (nome, email, perfil, setor_id)
    values ('zz Outro Diretor', 'zz.outro.dsetor@ejuvv.com', 'diretor_setor', c_setor_a);
    raise exception 'FALHOU: cadastrou 2º diretor de setor ativo no mesmo setor';
  exception when unique_violation then null;
  end;

  update public.membros set perfil = 'diretor_setor' where id = c_membro_b;      -- setor B não tem diretor
  get diagnostics n = row_count;
  assert n = 1, 'diretora: não conseguiu nomear diretor de setor no setor B';
  update public.membros set perfil = 'membro' where id = c_membro_b;

  -- diretor desativado libera a vaga; reativar o antigo com a vaga ocupada falha
  update public.membros set ativo = false where id = c_dsetor;

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.teste.dsetor@ejuvv.com"}', true);
  assert public.setor_que_dirijo() is null, 'diretor_setor desativado ainda dirige o setor';
  select count(*) into n from public.membros;
  assert n = 0, format('diretor_setor desativado: deveria ver 0 membros (viu %s)', n);
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.teste.diretora@ejuvv.com"}', true);

  update public.membros set perfil = 'diretor_setor' where id = c_membro;
  get diagnostics n = row_count;
  assert n = 1, 'diretora: vaga de diretor de setor não foi liberada pela desativação';

  begin
    update public.membros set ativo = true where id = c_dsetor;
    raise exception 'FALHOU: reativou diretor de setor com a vaga ocupada';
  exception when unique_violation then null;
  end;

  update public.membros set perfil = 'membro' where id = c_membro;
  update public.membros set ativo = true where id = c_dsetor;
  get diagnostics n = row_count;
  assert n = 1, 'diretora: não conseguiu reativar o diretor de setor com a vaga livre';

  -- metas: só da próxima semana em diante; o banco guarda quem criou
  insert into public.metas (horas_total, horas_sede, vigente_desde) values (10, 5, prox)
  returning * into v_meta;
  assert v_meta.alterado_por = c_diretora, 'meta: alterado_por deveria ser quem criou';

  begin
    insert into public.metas (horas_total, horas_sede, vigente_desde) values (10, 5, seg);
    raise exception 'FALHOU: mudou a meta da semana atual';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.metas (horas_total, horas_sede, vigente_desde) values (10, 5, seg - 7);
    raise exception 'FALHOU: mudou a meta de uma semana que já passou';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.metas (horas_total, horas_sede, vigente_desde) values (5, 6, prox);
    raise exception 'FALHOU: meta aceitou sede maior que o total';
  exception when check_violation then null;
  end;

  begin
    insert into public.metas (horas_total, horas_sede, vigente_desde) values (10, 5, prox + 1);
    raise exception 'FALHOU: meta aceitou começar fora da segunda-feira';
  exception when check_violation then null;
  end;

  begin
    insert into public.metas (horas_total, horas_sede, vigente_desde, alterado_por) values (10, 5, prox, c_rh);
    raise exception 'FALHOU: o site conseguiu escolher o alterado_por da meta';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.metas set horas_total = 1 where id = v_meta.id;
    raise exception 'FALHOU: alterou uma meta (meta só recebe insert)';
  exception when insufficient_privilege then null;
  end;

  insert into public.metas (horas_total, horas_sede, vigente_desde) values (10, 0, prox + 7);  -- sede 0 pode

  insert into public.metas (horas_total, horas_sede, vigente_desde, criado_em) values (11, 5, prox + 14, '2000-01-01')
  returning * into v_meta2;
  assert v_meta2.criado_em = now(), 'meta: criado_em deveria vir do banco';

  -- corrigir a meta da semana que vem: cria outra igual; a lista mostra só a nova
  perform set_config('role', 'none', true);
  update public.metas set criado_em = now() - interval '1 day' where id = v_meta.id;   -- como se fosse de ontem
  select count(*) into n0 from public.metas where vigente_desde = prox;
  perform set_config('role', 'authenticated', true);

  insert into public.metas (horas_total, horas_sede, vigente_desde) values (12, 6, prox);
  select count(*) into n from public.metas where vigente_desde = prox;
  assert n = n0 + 1, 'metas: a versão antiga deveria continuar no histórico';
  select count(*) into n from public.lista_de_metas where vigente_desde = prox;
  assert n = 1, format('lista_de_metas: deveria ter 1 linha por semana (tem %s)', n);
  select l.horas_total into x from public.lista_de_metas l where l.vigente_desde = prox;
  assert x = 12, format('lista_de_metas: deveria mostrar a versão mais nova (mostrou %s)', x);

  -- setores
  insert into public.setores (nome) values ('zz Setor D');
  update public.setores set ativo = false where nome = 'zz Setor D';
  get diagnostics n = row_count;
  assert n = 1, 'diretora: não conseguiu desativar setor';

  -- ninguém apaga
  begin
    delete from public.membros where id = c_membro;
    raise exception 'FALHOU: diretora conseguiu apagar membro';
  exception when insufficient_privilege then null;
  end;

  -- desativar tira o acesso na hora
  update public.membros set ativo = false where id = c_rh;
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.teste.rh@ejuvv.com"}', true);
  assert not public.eh_rh(),  'rh desativado continuou com acesso de RH';
  assert not public.ve_tudo(), 'rh desativado continuou vendo tudo';
  select count(*) into n from public.membros;
  assert n = 0, format('rh desativado: deveria ver 0 membros (viu %s)', n);

  ---------------------------------------------------------------------------
  -- 9. Como dono do banco (SQL Editor, sem login)
  ---------------------------------------------------------------------------
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', '', true);
  update public.membros set ativo = true where id = c_rh;

  -- troca de setor feita aqui também vai pro histórico (alterado_por = null)
  update public.membros set setor_id = c_setor_a where id = c_membro_b;
  update public.membros set setor_id = c_setor_b where id = c_membro_b;
  select count(*) into n from public.historico_setor where membro_id = c_membro_b and alterado_por is null;
  assert n = 2, format('historico_setor: troca pelo SQL Editor deveria gravar 2 linhas sem autor (gravou %s)', n);

  -- 1 diretor do RH ativo vale aqui também
  begin
    update public.membros set perfil = 'diretor_rh' where id = c_membro;
    raise exception 'FALHOU: ficaram 2 diretores do RH ativos (SQL Editor)';
  exception when unique_violation then null;
  end;

  -- só membro e rh registram horas
  insert into public.registros (membro_id, inicio, fim, local, descricao, criado_em)
  values (c_membro, '2026-11-02 09:00-03', '2026-11-02 11:00-03', 'sede', 'zz teste', '2000-01-01')
  returning * into r;
  assert r.criado_em <> '2000-01-01', 'criado_em deveria vir do banco';

  insert into public.registros (membro_id, inicio, fim, local, descricao)
  values (c_rh, '2026-11-02 09:00-03', '2026-11-02 11:00-03', 'sede', 'zz teste');             -- rh também registra

  begin
    insert into public.registros (membro_id, inicio, fim, local, descricao)
    values (c_diretora, '2026-11-02 09:00-03', '2026-11-02 11:00-03', 'sede', 'zz teste');
    raise exception 'FALHOU: diretor_rh conseguiu registrar horas';
  exception when check_violation then null;
  end;

  begin
    insert into public.registros (membro_id, inicio, fim, local, descricao)
    values (c_dsetor, '2026-11-02 09:00-03', '2026-11-02 11:00-03', 'sede', 'zz teste');
    raise exception 'FALHOU: diretor_setor conseguiu registrar horas';
  exception when check_violation then null;
  end;

  begin
    insert into public.registros (membro_id, inicio, fim, local, origem)
    values (c_presid, now() - interval '1 hour', null, 'online', 'cronometro');
    raise exception 'FALHOU: presidente conseguiu ligar cronômetro';
  exception when check_violation then null;
  end;

  -- vale na hora de lançar: quem vira diretor depois não lança mais
  insert into public.registros (membro_id, inicio, fim, local, descricao)
  values (c_membro_b, '2026-11-02 09:00-03', '2026-11-02 10:00-03', 'sede', 'zz teste');
  update public.membros set perfil = 'diretor_setor' where id = c_membro_b;
  begin
    insert into public.registros (membro_id, inicio, fim, local, descricao)
    values (c_membro_b, '2026-11-03 09:00-03', '2026-11-03 10:00-03', 'sede', 'zz teste');
    raise exception 'FALHOU: quem virou diretor continuou registrando horas';
  exception when check_violation then null;
  end;
  select count(*) into n from public.registros where membro_id = c_membro_b;
  assert n = 1, 'o histórico de quem virou diretor deveria continuar lá';
  update public.membros set perfil = 'membro' where id = c_membro_b;

  ---------------------------------------------------------------------------
  -- 10. Restrições de registros e metas (como dono do banco)
  ---------------------------------------------------------------------------
  begin
    insert into public.registros (membro_id, inicio, fim, local, descricao)
    values (c_membro, '2026-11-02 10:00-03', '2026-11-02 12:00-03', 'online', 'zz teste');
    raise exception 'FALHOU: aceitou registro sobreposto';
  exception when exclusion_violation then null;
  end;

  -- encostado pode; cancelado não bloqueia
  insert into public.registros (membro_id, inicio, fim, local, descricao)
  values (c_membro, '2026-11-02 11:00-03', '2026-11-02 12:00-03', 'online', 'zz teste');
  insert into public.registros (membro_id, inicio, fim, local, descricao, cancelado)
  values (c_membro, '2026-11-02 10:00-03', '2026-11-02 10:30-03', 'sede', 'zz teste', true);

  begin
    insert into public.registros (membro_id, inicio, fim, local, descricao)
    values (c_membro, '2026-11-03 10:00-03', '2026-11-03 10:00-03', 'sede', 'zz teste');
    raise exception 'FALHOU: aceitou fim igual ao início';
  exception when check_violation then null;
  end;

  begin
    insert into public.registros (membro_id, inicio, local, descricao)
    values (c_membro, '2026-11-03 10:00-03', 'sede', 'zz teste');
    raise exception 'FALHOU: aceitou registro manual sem fim';
  exception when check_violation then null;
  end;

  -- descrição: obrigatória no manual
  begin
    insert into public.registros (membro_id, inicio, fim, local)
    values (c_membro, '2026-11-04 10:00-03', '2026-11-04 11:00-03', 'sede');
    raise exception 'FALHOU: aceitou registro manual sem descrição';
  exception when check_violation then null;
  end;

  begin
    insert into public.registros (membro_id, inicio, fim, local, descricao)
    values (c_membro, '2026-11-04 10:00-03', '2026-11-04 11:00-03', 'sede', E' \t\n ');
    raise exception 'FALHOU: aceitou descrição só com espaços';
  exception when check_violation then null;
  end;

  begin
    update public.registros set descricao = '' where id = r.id;
    raise exception 'FALHOU: apagou a descrição de um registro manual';
  exception when check_violation then null;
  end;

  -- cronômetro: sem descrição pode, e só um ligado por membro
  insert into public.registros (membro_id, inicio, local, origem)
  values (c_membro, now() - interval '1 hour', 'online', 'cronometro');

  begin
    insert into public.registros (membro_id, inicio, local, origem)
    values (c_membro, now(), 'online', 'cronometro');
    raise exception 'FALHOU: aceitou 2 cronômetros ligados';
  exception when unique_violation then null;
  end;

  -- membro e origem não mudam; criado_em não é sobrescrito
  begin
    update public.registros set membro_id = c_rh where id = r.id;
    raise exception 'FALHOU: trocou o membro de um registro';
  exception when check_violation then null;
  end;

  begin
    update public.registros set origem = 'cronometro' where id = r.id;
    raise exception 'FALHOU: trocou a origem de um registro';
  exception when check_violation then null;
  end;

  update public.registros set descricao = 'editado', criado_em = '2000-01-01'
  where id = r.id returning * into r;
  assert r.criado_em <> '2000-01-01', 'update sobrescreveu criado_em';

  -- metas (o dono do banco pode criar no passado, como o seed)
  insert into public.metas (horas_total, horas_sede, vigente_desde) values (10, 0, '2026-01-05');

  begin
    insert into public.metas (horas_total, horas_sede, vigente_desde) values (10, 5, '2026-12-22');
    raise exception 'FALHOU: meta aceitou começar fora da segunda-feira';
  exception when check_violation then null;
  end;

  begin
    insert into public.metas (horas_total, horas_sede, vigente_desde) values (5, 6, '2026-12-21');
    raise exception 'FALHOU: meta aceitou sede maior que o total';
  exception when check_violation then null;
  end;

  ---------------------------------------------------------------------------
  -- 11. Registros pelo site: cada um mexe nos próprios, com prazo de 7 dias
  ---------------------------------------------------------------------------
  -- (dono do banco) cancela o cronômetro da seção 10 e cria um esquecido,
  -- ligado há 9 dias
  update public.registros set cancelado = true where membro_id = c_membro and fim is null and not cancelado;

  alter table public.registros disable trigger registros_antes_de_gravar;   -- para poder pôr criado_em no passado
  insert into public.registros (membro_id, inicio, local, origem, criado_em)
  values (c_membro, d9_13, 'online', 'cronometro', now() - interval '9 days')
  returning * into r_esq;
  alter table public.registros enable trigger registros_antes_de_gravar;

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.teste.membro@ejuvv.com"}', true);

  -- parar o cronômetro esquecido vale mesmo depois de 7 dias; fica com 10h e vai para revisão
  begin
    update public.registros set fim = now() + interval '1 hour' where id = r_esq.id;
    raise exception 'FALHOU: parou o cronômetro no futuro';
  exception when check_violation then null;
  end;

  begin
    update public.registros set inicio = r_esq.inicio + interval '1 hour', fim = now() where id = r_esq.id;
    raise exception 'FALHOU: mudou o início ao parar o cronômetro';
  exception when check_violation then null;
  end;

  update public.registros set fim = now() where id = r_esq.id returning * into r_esq;
  assert r_esq.fim = r_esq.inicio + interval '10 hours' and r_esq.precisa_revisao,
    'cronômetro com mais de 10h deveria ficar com 10h e ir para a revisão do RH';

  begin
    update public.registros set precisa_revisao = false where id = r_esq.id;
    raise exception 'FALHOU: membro tirou o próprio cronômetro da revisão';
  exception when insufficient_privilege then null;
  end;

  -- (dono do banco) um registro lançado há 8 dias
  perform set_config('role', 'none', true);
  alter table public.registros disable trigger registros_antes_de_gravar;
  insert into public.registros (membro_id, inicio, fim, local, descricao, criado_em)
  values (c_membro, d8_05, d8_06, 'sede', 'zz lançado há 8 dias', now() - interval '8 days')
  returning * into r_velho;
  alter table public.registros enable trigger registros_antes_de_gravar;
  perform set_config('role', 'authenticated', true);

  -- lançar: de hoje até 7 dias atrás, só para si mesmo
  insert into public.registros (inicio, fim, local, descricao)
  values (ontem_01, ontem_02, 'sede', 'zz lançado pelo site')
  returning * into r_site;
  assert r_site.membro_id = c_membro, 'registro lançado pelo site deveria ficar com quem lançou';

  insert into public.registros (inicio, fim, local, descricao)
  values (d7_01, d7_02, 'online', 'zz 7 dias atrás');                                  -- no limite: pode

  begin
    insert into public.registros (inicio, fim, local, descricao) values (d8_01, d8_02, 'online', 'zz 8 dias');
    raise exception 'FALHOU: membro lançou horas de 8 dias atrás';
  exception when check_violation then null;
  end;

  begin
    insert into public.registros (inicio, fim, local, descricao) values (amanha_01, amanha_02, 'online', 'zz amanhã');
    raise exception 'FALHOU: membro lançou horas de amanhã';
  exception when check_violation then null;
  end;

  begin
    insert into public.registros (membro_id, inicio, fim, local, descricao) values (c_membro_b, ontem_01, ontem_02, 'sede', 'zz x');
    raise exception 'FALHOU: membro lançou horas para outro membro';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.registros (inicio, fim, local, descricao, cancelado) values (d6_01, d6_02, 'sede', 'zz x', true);
    raise exception 'FALHOU: registro novo nasceu cancelado';
  exception when check_violation then null;
  end;

  begin
    insert into public.registros (inicio, fim, local, descricao, precisa_revisao) values (d6_01, d6_02, 'sede', 'zz x', true);
    raise exception 'FALHOU: registro novo nasceu em revisão';
  exception when check_violation then null;
  end;

  -- cronômetro: começa agora e sem fim
  begin
    insert into public.registros (inicio, fim, local, origem) values (now() - interval '1 hour', now(), 'online', 'cronometro');
    raise exception 'FALHOU: cronômetro nasceu com fim';
  exception when check_violation then null;
  end;

  begin
    insert into public.registros (inicio, local, origem) values (now() - interval '1 hour', 'online', 'cronometro');
    raise exception 'FALHOU: cronômetro começou no passado';
  exception when check_violation then null;
  end;

  insert into public.registros (inicio, local, origem) values (now() - interval '4 minutes', 'online', 'cronometro')
  returning * into r_cron;
  update public.registros set fim = now() where id = r_cron.id returning * into r_cron;
  assert r_cron.fim = now() and not r_cron.precisa_revisao, 'parar o cronômetro deveria gravar o fim';

  begin
    update public.registros set fim = null where id = r_cron.id;
    raise exception 'FALHOU: religou um cronômetro encerrado';
  exception when check_violation then null;
  end;

  -- alterar e cancelar os próprios (até 7 dias depois de lançar)
  update public.registros set descricao = 'zz editado pelo site' where id = r_site.id;
  get diagnostics n = row_count;
  assert n = 1, 'membro: não conseguiu editar o próprio registro';

  begin
    update public.registros set inicio = d8_01, fim = d8_02 where id = r_site.id;
    raise exception 'FALHOU: membro levou o registro para 8 dias atrás';
  exception when check_violation then null;
  end;

  update public.registros set inicio = d6_01, fim = d6_02 where id = r_site.id;
  get diagnostics n = row_count;
  assert n = 1, 'membro: não conseguiu mudar a data do registro dentro do prazo';

  begin
    update public.registros set descricao = 'zz x' where id = r_velho.id;
    raise exception 'FALHOU: membro alterou registro lançado há mais de 7 dias';
  exception when check_violation then null;
  end;

  begin
    update public.registros set cancelado = true where id = r_velho.id;
    raise exception 'FALHOU: membro cancelou registro lançado há mais de 7 dias';
  exception when check_violation then null;
  end;

  update public.registros set cancelado = true where id = r_site.id;
  get diagnostics n = row_count;
  assert n = 1, 'membro: não conseguiu cancelar o próprio registro';

  begin
    update public.registros set descricao = 'zz x' where id = r_site.id;
    raise exception 'FALHOU: membro alterou registro cancelado';
  exception when check_violation then null;
  end;

  update public.registros set descricao = 'invadido' where membro_id = c_membro_b;
  get diagnostics n = row_count;
  assert n = 0, 'membro: alterou registro de outro membro';

  -- rh: os próprios pelo site (com o mesmo prazo); o de outro, só pela função com motivo
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.teste.rh@ejuvv.com"}', true);

  insert into public.registros (inicio, fim, local, descricao) values (d1_03, d1_04, 'sede', 'zz rh pelo site');

  begin
    insert into public.registros (inicio, fim, local, descricao) values (d10_03, d10_04, 'sede', 'zz 10 dias');
    raise exception 'FALHOU: rh lançou horas próprias de 10 dias atrás pelo site (é pela função, com motivo)';
  exception when check_violation then null;
  end;

  begin
    insert into public.registros (membro_id, inicio, fim, local, descricao) values (c_membro, d1_03, d1_04, 'sede', 'zz x');
    raise exception 'FALHOU: rh lançou direto para outro membro, sem motivo';
  exception when insufficient_privilege then null;
  end;

  update public.registros set descricao = 'zz x' where membro_id = c_membro;
  get diagnostics n = row_count;
  assert n = 0, 'rh: alterou direto o registro de outro membro, sem motivo';

  -- diretores não lançam horas pelo site (não têm meta)
  foreach v_email in array array['zz.teste.diretora@ejuvv.com', 'zz.teste.dsetor@ejuvv.com', 'zz.teste.presidente@ejuvv.com'] loop
    perform set_config('request.jwt.claims', json_build_object('role', 'authenticated', 'email', v_email)::text, true);
    begin
      insert into public.registros (inicio, fim, local, descricao) values (ontem_01, ontem_02, 'sede', 'zz x');
      raise exception 'FALHOU: % lançou horas pelo site', v_email;
    exception when check_violation then null;
    end;
  end loop;

  ---------------------------------------------------------------------------
  -- 12. Funções do RH (com motivo, sem prazo) e auditoria
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.teste.rh@ejuvv.com"}', true);

  -- lança para outro membro, 20 dias atrás
  select * into rr from public.criar_registro_de_membro(c_membro, d20_03, d20_04, 'sede', 'zz lançado pelo RH', '  zz esqueceu de lançar  ');
  assert rr.membro_id = c_membro and rr.origem = 'manual' and not rr.cancelado,
    'criar_registro_de_membro: registro errado';
  select count(*) into n from public.auditoria
   where tabela = 'registros' and registro_id = rr.id and acao = 'criar' and quem = c_rh
     and motivo = 'zz esqueceu de lançar' and antes is null and depois ->> 'id' = rr.id::text;
  assert n = 1, 'auditoria: deveria ter o lançamento do RH, com quem fez e o motivo';

  begin
    perform public.criar_registro_de_membro(c_membro, d20_03 + interval '2 hours', d20_04 + interval '2 hours', 'sede', 'zz x', null);
    raise exception 'FALHOU: RH lançou sem motivo';
  exception when check_violation then null;
  end;

  begin
    perform public.criar_registro_de_membro(c_membro, d20_03 + interval '2 hours', d20_04 + interval '2 hours', 'sede', 'zz x', E'  \n ');
    raise exception 'FALHOU: RH lançou com motivo vazio';
  exception when check_violation then null;
  end;

  begin
    perform public.criar_registro_de_membro(c_dsetor, d20_03, d20_04, 'sede', 'zz x', 'zz motivo');
    raise exception 'FALHOU: RH lançou horas para um diretor';
  exception when check_violation then null;
  end;

  begin
    perform public.criar_registro_de_membro(c_membro, d20_03, d20_04, 'sede', 'zz x', 'zz motivo');
    raise exception 'FALHOU: RH lançou registro sobreposto';
  exception when exclusion_violation then null;
  end;

  begin
    perform public.criar_registro_de_membro(c_membro, d20_03 + interval '2 hours', d20_04 + interval '2 hours', 'sede', '', 'zz motivo');
    raise exception 'FALHOU: RH lançou registro manual sem descrição';
  exception when check_violation then null;
  end;

  -- corrige (o que não vier fica igual), inclusive registro antigo, e cancela
  select * into rr from public.editar_registro_de_membro(p_id => rr.id, p_motivo => 'zz descrição errada', p_descricao => 'zz corrigido pelo RH');
  assert rr.descricao = 'zz corrigido pelo RH' and rr.inicio = d20_03 and rr.local = 'sede',
    'editar_registro_de_membro: não corrigiu certo';
  select count(*) into n from public.auditoria
   where registro_id = rr.id and acao = 'editar'
     and antes ->> 'descricao' = 'zz lançado pelo RH' and depois ->> 'descricao' = 'zz corrigido pelo RH';
  assert n = 1, 'auditoria: deveria guardar o antes e o depois da correção';

  select * into rr2 from public.editar_registro_de_membro(p_id => r_velho.id, p_motivo => 'zz era online', p_local => 'online');
  assert rr2.local = 'online' and rr2.descricao = r_velho.descricao, 'editar_registro_de_membro: não corrigiu o registro antigo';

  select * into rr from public.cancelar_registro_de_membro(rr.id, 'zz lançado em duplicidade');
  assert rr.cancelado, 'cancelar_registro_de_membro: não cancelou';

  begin
    perform public.cancelar_registro_de_membro(rr.id, 'zz de novo');
    raise exception 'FALHOU: cancelou o mesmo registro duas vezes';
  exception when check_violation then null;
  end;

  begin
    perform public.editar_registro_de_membro(p_id => rr.id, p_motivo => 'zz x', p_descricao => 'zz x');
    raise exception 'FALHOU: RH alterou registro cancelado';
  exception when check_violation then null;
  end;

  begin
    perform public.editar_registro_de_membro(p_id => gen_random_uuid(), p_motivo => 'zz x');
    raise exception 'FALHOU: editou registro que não existe';
  exception when no_data_found then null;
  end;

  -- revisa cronômetro: aprovar volta a contar; reprovar cancela
  select * into rr from public.revisar_cronometro(r_esq.id, true);
  assert not rr.precisa_revisao and not rr.cancelado, 'revisar_cronometro: aprovar deveria tirar da revisão';

  begin
    perform public.revisar_cronometro(r_esq.id, true);
    raise exception 'FALHOU: revisou cronômetro que não estava em revisão';
  exception when check_violation then null;
  end;

  begin
    perform public.revisar_cronometro(r_cron.id, null);
    raise exception 'FALHOU: revisou sem dizer se aprova';
  exception when check_violation then null;
  end;

  perform set_config('role', 'none', true);
  insert into public.registros (membro_id, inicio, fim, local, descricao, origem, precisa_revisao)
  values (c_membro_b, d3_13, d3_23, 'online', 'zz cronômetro esquecido', 'cronometro', true)
  returning * into r_rev;
  perform set_config('role', 'authenticated', true);

  select * into rr from public.revisar_cronometro(r_rev.id, false, 'zz não estava trabalhando');
  assert rr.cancelado and not rr.precisa_revisao, 'revisar_cronometro: reprovar deveria cancelar';

  select count(*) into n from public.auditoria where registro_id = r_esq.id and acao = 'aprovar_cronometro' and motivo = 'Cronômetro aprovado na revisão';
  assert n = 1, 'auditoria: deveria ter a aprovação do cronômetro (com o motivo padrão)';
  select count(*) into n from public.auditoria where registro_id = r_rev.id and acao = 'reprovar_cronometro' and motivo = 'zz não estava trabalhando';
  assert n = 1, 'auditoria: deveria ter a reprovação do cronômetro com o motivo';
  select count(*) into n from public.auditoria where quem = c_rh;
  assert n = 6, format('auditoria: deveria ter as 6 ações do rh (tem %s)', n);

  -- ninguém escreve direto na auditoria
  begin
    insert into public.auditoria (tabela, registro_id, acao, motivo) values ('registros', rr.id, 'x', 'x');
    raise exception 'FALHOU: escreveu direto na auditoria';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.auditoria set motivo = 'x';
    raise exception 'FALHOU: alterou a auditoria';
  exception when insufficient_privilege then null;
  end;

  begin
    delete from public.auditoria;
    raise exception 'FALHOU: apagou a auditoria';
  exception when insufficient_privilege then null;
  end;

  -- o diretor do RH também lança e corrige
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.teste.diretora@ejuvv.com"}', true);
  select * into rr from public.criar_registro_de_membro(c_membro_b, d15_03, d15_04, 'online', 'zz lançado pela diretora', 'zz reunião fora da sede');
  select count(*) into n from public.auditoria where registro_id = rr.id and quem = c_diretora and acao = 'criar';
  assert n = 1, 'diretora: o lançamento dela deveria ir para a auditoria';

  -- presidente, diretor de setor e membro não usam as funções do RH
  foreach v_email in array array['zz.teste.presidente@ejuvv.com', 'zz.teste.dsetor@ejuvv.com', 'zz.teste.membro@ejuvv.com'] loop
    perform set_config('request.jwt.claims', json_build_object('role', 'authenticated', 'email', v_email)::text, true);
    begin
      perform public.criar_registro_de_membro(c_membro, d20_03 + interval '5 hours', d20_04 + interval '5 hours', 'sede', 'zz x', 'zz motivo');
      raise exception 'FALHOU: % lançou horas para outro membro', v_email;
    exception when insufficient_privilege then null;
    end;
    begin
      perform public.editar_registro_de_membro(p_id => r_velho.id, p_motivo => 'zz motivo', p_descricao => 'zz x');
      raise exception 'FALHOU: % corrigiu registro de outro membro', v_email;
    exception when insufficient_privilege then null;
    end;
    begin
      perform public.cancelar_registro_de_membro(r_velho.id, 'zz motivo');
      raise exception 'FALHOU: % cancelou registro de outro membro', v_email;
    exception when insufficient_privilege then null;
    end;
    begin
      perform public.revisar_cronometro(r_esq.id, false);
      raise exception 'FALHOU: % revisou cronômetro', v_email;
    exception when insufficient_privilege then null;
    end;
  end loop;

  ---------------------------------------------------------------------------
  -- 13. Quem lê registros, auditoria e histórico de setor
  ---------------------------------------------------------------------------
  perform set_config('role', 'none', true);
  select count(*) into n_reg   from public.registros;
  select count(*) into n_reg_m from public.registros where membro_id = c_membro;
  select count(*) into n_reg_a from public.registros rg join public.membros mb on mb.id = rg.membro_id where mb.setor_id = c_setor_a;
  select count(*) into n_aud   from public.auditoria;
  select count(*) into n_hist  from public.historico_setor;
  perform set_config('role', 'authenticated', true);

  -- membro: só os próprios; auditoria não
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.teste.membro@ejuvv.com"}', true);
  select count(*) into n from public.registros;
  assert n = n_reg_m, format('membro: deveria ver os %s registros dele (viu %s)', n_reg_m, n);
  select count(*) into n from public.auditoria;
  assert n = 0, format('membro: leu %s linhas da auditoria', n);
  select count(*) into n from public.historico_setor;
  assert n = 2, format('membro: deveria ver só as 2 trocas de setor dele (viu %s)', n);
  select count(*) into n from public.historico_setor where membro_id <> c_membro;
  assert n = 0, 'membro: viu troca de setor de outro membro';

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.teste.membrob@ejuvv.com"}', true);
  select count(*) into n from public.registros where membro_id <> c_membro_b;
  assert n = 0, 'membro B: viu registro de outro membro';

  -- diretor de setor: os registros do setor dele; auditoria não; do histórico, só o dele
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.teste.dsetor@ejuvv.com"}', true);
  select count(*) into n from public.registros;
  assert n = n_reg_a, format('diretor_setor: deveria ver os %s registros do setor dele (viu %s)', n_reg_a, n);
  select count(*) into n from public.registros where membro_id = c_membro_b;
  assert n = 0, 'diretor_setor: viu registro de membro de outro setor';
  select count(*) into n from public.auditoria;
  assert n = 0, format('diretor_setor: leu %s linhas da auditoria', n);
  select count(*) into n from public.historico_setor where membro_id <> c_dsetor;
  assert n = 0, format('diretor_setor: leu %s trocas de setor de outros membros', n);
  select count(*) into n from public.historico_setor;
  assert n = 2, format('diretor_setor: deveria ver só as 2 trocas de setor dele (viu %s)', n);

  -- rh, diretora e presidente: tudo
  foreach v_email in array array['zz.teste.rh@ejuvv.com', 'zz.teste.diretora@ejuvv.com', 'zz.teste.presidente@ejuvv.com'] loop
    perform set_config('request.jwt.claims', json_build_object('role', 'authenticated', 'email', v_email)::text, true);
    select count(*) into n from public.registros;
    assert n = n_reg, format('%s: deveria ler os %s registros (leu %s)', v_email, n_reg, n);
    select count(*) into n from public.auditoria;
    assert n = n_aud, format('%s: deveria ler as %s linhas da auditoria (leu %s)', v_email, n_aud, n);
    select count(*) into n from public.historico_setor;
    assert n = n_hist, format('%s: deveria ler as %s trocas de setor (leu %s)', v_email, n_hist, n);
  end loop;

  ---------------------------------------------------------------------------
  -- 14. O que saiu (dispensas) e quem executa cada função
  ---------------------------------------------------------------------------
  perform set_config('role', 'none', true);
  assert to_regclass('public.dispensas') is null, 'a tabela dispensas deveria ter sido removida';
  for f in select p.oid from pg_proc p where p.proname = 'rls_auto_enable' loop
    assert not has_function_privilege('anon', f, 'execute'),
      'rls_auto_enable: anon ainda executa (a função não é do postgres? fala com o Victor)';
    assert not has_function_privilege('authenticated', f, 'execute'),
      'rls_auto_enable: authenticated ainda executa';
  end loop;

  -- o visitante sem login não chama nenhuma função (é o que o Advisors avisa)
  select string_agg(p.proname, ', ' order by p.proname) into v_lista
  from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
  where ns.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute');
  assert v_lista is null,
    format('o anon (sem login) consegue chamar estas funções: %s. Tire com revoke execute ... from public, anon', v_lista);

  -- funções internas (de gatilho e a exigir_rh_com_motivo) o site não chama
  select string_agg(p.proname, ', ' order by p.proname) into v_lista
  from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
  where ns.nspname = 'public' and has_function_privilege('authenticated', p.oid, 'execute')
    and (p.prorettype in ('trigger'::regtype, 'event_trigger'::regtype) or p.proname = 'exigir_rh_com_motivo');
  assert v_lista is null, format('o site consegue chamar estas funções internas: %s', v_lista);

  -- Chegou aqui = passou. Este erro é de propósito: desfaz tudo o que o teste fez.
  raise exception 'fim do teste' using errcode = 'ZZ999';
  exception when sqlstate 'ZZ999' then
    null;
  end;
end
$$;

select 'OK: todos os testes passaram' as resultado;
