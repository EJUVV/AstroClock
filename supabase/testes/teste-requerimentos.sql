-- =============================================================================
-- AstroClock · teste dos requerimentos de ausência (seção 7 do
-- regras-de-negocio.md; migração requerimentos)
-- =============================================================================
-- Rode DEPOIS da migração requerimentos, no SQL Editor ou pelo CLI
-- (npx supabase db query --linked -f supabase/testes/teste-requerimentos.sql).
-- Cria dados de teste (prefixo zz), confere pelos dois lados e desfaz tudo no
-- final: não suja o banco. Terminou com "OK: requerimentos passou" = passou.
--
-- Parte A: tabela, quem lê, quem cria, resposta, anexos e Storage.
--
-- Cenário: Ana e Beto (membros do setor zz), Carla (rh, sem diretoria), Dani
-- (diretor_rh, dirige o setor RH existente), Edu (diretor_setor, dirige o
-- setor zz de Ana e Beto).
-- =============================================================================

do $$
declare
  c_setor  constant uuid := 'f1000000-0000-4000-8000-000000000001';
  c_ana    constant uuid := 'f1000000-0000-4000-8000-0000000000a1';
  c_beto   constant uuid := 'f1000000-0000-4000-8000-0000000000a2';
  c_carla  constant uuid := 'f1000000-0000-4000-8000-0000000000a3';
  c_dani   constant uuid := 'f1000000-0000-4000-8000-0000000000a4';
  c_edu    constant uuid := 'f1000000-0000-4000-8000-0000000000a5';
  -- caminhos dos anexos no bucket: <membro_id>/<uuid>.<ext>
  p_ana1   constant text := 'f1000000-0000-4000-8000-0000000000a1/f1000000-0000-4000-8000-00000000f001.pdf';
  p_orfao  constant text := 'f1000000-0000-4000-8000-0000000000a1/f1000000-0000-4000-8000-00000000f002.png';
  p_beto1  constant text := 'f1000000-0000-4000-8000-0000000000a2/f1000000-0000-4000-8000-00000000f003.jpg';
  p_beto40 constant text := 'f1000000-0000-4000-8000-0000000000a2/f1000000-0000-4000-8000-00000000f004.pdf';
  p_beto10 constant text := 'f1000000-0000-4000-8000-0000000000a2/f1000000-0000-4000-8000-00000000f005.pdf';
  v_setor_rh uuid;
  r_ana1   uuid;   -- Ana, pendente com anexo (Dani aprova)
  r_ana2   uuid;   -- Ana, pendente sem anexo (Dani reprova)
  r_beto1  uuid;   -- Beto, pendente com anexo
  r_beto40 uuid;   -- Beto, reprovado há 40 dias, com anexo (gravado direto)
  r_beto10 uuid;   -- Beto, reprovado há 10 dias, com anexo (gravado direto)
  r_dani   uuid;   -- Dani, pendente (gravado direto: Dani não tem meta)
  n        int;
  msg      text;
  v_lista  text;
  v_req    public.requerimentos%rowtype;
begin
  begin   -- tudo o que o teste faz fica neste bloco e é desfeito no fim

  -- Setor RH: o existente (o índice deixa só um marcado); se não houver, um zz.
  select s.id into v_setor_rh from public.setores s where s.eh_rh;
  if v_setor_rh is null then
    v_setor_rh := 'f1000000-0000-4000-8000-000000000002';
    insert into public.setores (id, nome, eh_rh) values (v_setor_rh, 'zz RH Requerimentos', true);
  end if;

  insert into public.setores (id, nome) values (c_setor, 'zz Requerimentos');
  insert into public.membros (id, nome, email, perfil, setor_id, ativo, data_entrada) values
    (c_ana,   'zz Ana',   'zz.req.ana@ejuvv.com',   'membro',        c_setor,    true, '2020-01-01'),
    (c_beto,  'zz Beto',  'zz.req.beto@ejuvv.com',  'membro',        c_setor,    true, '2020-01-01'),
    (c_carla, 'zz Carla', 'zz.req.carla@ejuvv.com', 'rh',            c_setor,    true, '2020-01-01'),
    (c_dani,  'zz Dani',  'zz.req.dani@ejuvv.com',  'diretor_rh',    v_setor_rh, true, '2020-01-01'),
    (c_edu,   'zz Edu',   'zz.req.edu@ejuvv.com',   'diretor_setor', c_setor,    true, '2020-01-01');

  -- Dani dirige o setor RH (no lugar de quem dirige hoje: desfeito no fim);
  -- Edu dirige o setor de Ana e Beto.
  delete from public.diretorias d where d.setor_id = v_setor_rh;
  insert into public.diretorias (setor_id, membro_id) values (v_setor_rh, c_dani), (c_setor, c_edu);

  ---------------------------------------------------------------------------
  -- 1. Quem cria: só o próprio, só pendente, perfil com meta
  ---------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.ana@ejuvv.com"}', true);

  insert into public.requerimentos (membro_id, tipo, data_inicio, data_fim, motivo, anexo_caminho, anexo_nome)
    values (c_ana, 'ausencia_total', '2026-12-02', '2026-12-04', 'Consulta médica', p_ana1, 'atestado.pdf')
    returning id into r_ana1;
  -- sem membro_id: o banco preenche com quem está logado
  insert into public.requerimentos (tipo, data_inicio, data_fim, motivo)
    values ('so_remoto', '2026-12-09', '2026-12-09', 'Viagem')
    returning id into r_ana2;

  select * into v_req from public.requerimentos r where r.id = r_ana1;
  assert v_req.situacao = 'pendente', format('Ana: pedido novo deveria nascer pendente (%s)', v_req.situacao);
  select r.membro_id into v_req.membro_id from public.requerimentos r where r.id = r_ana2;
  assert v_req.membro_id = c_ana, 'Ana: pedido sem membro_id deveria ficar com a Ana';

  begin
    insert into public.requerimentos (membro_id, tipo, data_inicio, data_fim, motivo)
      values (c_beto, 'ausencia_total', '2026-12-02', '2026-12-04', 'Pelo Beto');
    msg := null;
  exception when others then
    msg := sqlstate || ':' || sqlerrm;
  end;
  assert msg is not null, 'Ana: não deveria criar pedido no nome do Beto';

  begin
    insert into public.requerimentos (tipo, data_inicio, data_fim, motivo, situacao)
      values ('ausencia_total', '2026-12-02', '2026-12-04', 'Já aprovado', 'aprovado');
    msg := null;
  exception when others then
    msg := sqlstate || ':' || sqlerrm;
  end;
  assert msg is not null, 'Ana: não deveria criar pedido já aprovado';

  begin
    insert into public.requerimentos (tipo, data_inicio, data_fim, motivo, anexo_caminho, anexo_nome)
      values ('ausencia_total', '2026-12-02', '2026-12-04', 'Anexo alheio', p_beto1, 'x.jpg');
    msg := null;
  exception when others then
    msg := sqlstate || ':' || sqlerrm;
  end;
  assert msg is not null, 'Ana: não deveria apontar o anexo para a pasta do Beto';

  begin
    insert into public.requerimentos (tipo, data_inicio, data_fim, motivo)
      values ('ausencia_total', '2026-12-04', '2026-12-02', 'Datas trocadas');
    msg := null;
  exception when others then
    msg := sqlstate || ':' || sqlerrm;
  end;
  assert msg like '23514:%', format('Ana: data_fim antes de data_inicio deveria dar erro (%s)', msg);

  begin
    insert into public.requerimentos (tipo, data_inicio, data_fim, motivo)
      values ('ausencia_total', '2026-12-02', '2026-12-04', '   ');
    msg := null;
  exception when others then
    msg := sqlstate || ':' || sqlerrm;
  end;
  assert msg like '23514:%', format('Ana: motivo vazio deveria dar erro (%s)', msg);

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.beto@ejuvv.com"}', true);
  insert into public.requerimentos (tipo, data_inicio, data_fim, motivo, anexo_caminho, anexo_nome)
    values ('ausencia_total', '2026-12-14', '2026-12-18', 'Cirurgia', p_beto1, 'laudo.jpg')
    returning id into r_beto1;

  -- Edu (diretor_setor) e Dani (diretor_rh) não têm meta: não criam.
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.edu@ejuvv.com"}', true);
  begin
    insert into public.requerimentos (tipo, data_inicio, data_fim, motivo)
      values ('ausencia_total', '2026-12-02', '2026-12-04', 'Edu');
    msg := null;
  exception when others then
    msg := sqlstate || ':' || sqlerrm;
  end;
  assert msg is not null, 'Edu (sem meta): não deveria criar pedido';

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.dani@ejuvv.com"}', true);
  begin
    insert into public.requerimentos (tipo, data_inicio, data_fim, motivo)
      values ('ausencia_total', '2026-12-02', '2026-12-04', 'Dani');
    msg := null;
  exception when others then
    msg := sqlstate || ':' || sqlerrm;
  end;
  assert msg is not null, 'Dani (sem meta): não deveria criar pedido';

  -- Gravados direto no banco: dois reprovados de Beto (40 e 10 dias atrás) e um de Dani.
  perform set_config('role', 'postgres', true);
  insert into public.requerimentos (membro_id, tipo, data_inicio, data_fim, motivo, situacao,
                                    anexo_caminho, anexo_nome, motivo_resposta, respondido_por, respondido_em)
    values (c_beto, 'ausencia_total', '2026-10-05', '2026-10-09', 'Antigo', 'reprovado',
            p_beto40, 'antigo.pdf', 'Sem atestado', c_dani, now() - interval '40 days')
    returning id into r_beto40;
  insert into public.requerimentos (membro_id, tipo, data_inicio, data_fim, motivo, situacao,
                                    anexo_caminho, anexo_nome, motivo_resposta, respondido_por, respondido_em)
    values (c_beto, 'ausencia_total', '2026-11-09', '2026-11-13', 'Recente', 'reprovado',
            p_beto10, 'recente.pdf', 'Sem atestado', c_dani, now() - interval '10 days')
    returning id into r_beto10;
  insert into public.requerimentos (membro_id, tipo, data_inicio, data_fim, motivo)
    values (c_dani, 'ausencia_total', '2026-12-02', '2026-12-04', 'Pedido da Dani')
    returning id into r_dani;

  ---------------------------------------------------------------------------
  -- 2. Quem lê: o próprio; rh, presidente e quem dirige o RH, todos; diretor_setor, nada
  ---------------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.ana@ejuvv.com"}', true);
  select count(*) into n from public.requerimentos;
  assert n = 2, format('Ana: deveria ver só os 2 dela (viu %s)', n);
  select count(*) into n from public.requerimentos r where r.membro_id <> c_ana;
  assert n = 0, format('Ana: não deveria ver pedidos de outros (viu %s)', n);

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.beto@ejuvv.com"}', true);
  select count(*) into n from public.requerimentos r where r.membro_id = c_ana;
  assert n = 0, format('Beto: não deveria ver os da Ana (viu %s)', n);
  select count(*) into n from public.requerimentos r where r.membro_id = c_beto;
  assert n = 3, format('Beto: deveria ver os 3 dele (viu %s)', n);

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.carla@ejuvv.com"}', true);
  select count(*) into n from public.requerimentos r where r.membro_id in (c_ana, c_beto, c_dani);
  assert n = 6, format('Carla (rh): deveria ver todos os 6 (viu %s)', n);

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.dani@ejuvv.com"}', true);
  select count(*) into n from public.requerimentos r where r.membro_id in (c_ana, c_beto, c_dani);
  assert n = 6, format('Dani (dirige o RH): deveria ver todos os 6 (viu %s)', n);

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.edu@ejuvv.com"}', true);
  select count(*) into n from public.requerimentos;
  assert n = 0, format('Edu (diretor_setor): não deveria ver nenhum (viu %s)', n);

  -- Ninguém altera nem apaga direto (nem o RH).
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.carla@ejuvv.com"}', true);
  begin
    update public.requerimentos set situacao = 'aprovado' where id = r_ana1;
    msg := null;
  exception when others then
    msg := sqlstate || ':' || sqlerrm;
  end;
  assert msg is not null, 'Carla: não deveria alterar pedido direto';
  begin
    delete from public.requerimentos where id = r_ana1;
    msg := null;
  exception when others then
    msg := sqlstate || ':' || sqlerrm;
  end;
  assert msg is not null, 'Carla: não deveria apagar pedido direto';

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.ana@ejuvv.com"}', true);
  begin
    update public.requerimentos set motivo = 'Mudei' where id = r_ana1;
    msg := null;
  exception when others then
    msg := sqlstate || ':' || sqlerrm;
  end;
  assert msg is not null, 'Ana: não deveria alterar o próprio pedido direto';

  ---------------------------------------------------------------------------
  -- 3. Resposta: só quem dirige o RH; não o próprio; só pendente; reprovar exige motivo
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.carla@ejuvv.com"}', true);
  begin
    perform public.responder_requerimento(r_ana1, true);
    msg := null;
  exception when others then
    msg := sqlstate || ':' || sqlerrm;
  end;
  assert msg like 'P0002:%', format('Carla (rh sem diretoria): responder deveria dar erro P0002 (%s)', msg);

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.edu@ejuvv.com"}', true);
  begin
    perform public.responder_requerimento(r_ana1, true);
    msg := null;
  exception when others then
    msg := sqlstate || ':' || sqlerrm;
  end;
  assert msg like 'P0002:%', format('Edu (diretor_setor): responder deveria dar erro P0002 (%s)', msg);

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.ana@ejuvv.com"}', true);
  begin
    perform public.responder_requerimento(r_ana1, true);
    msg := null;
  exception when others then
    msg := sqlstate || ':' || sqlerrm;
  end;
  assert msg like 'P0002:%', format('Ana: responder o próprio deveria dar erro P0002 (%s)', msg);

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.dani@ejuvv.com"}', true);
  perform public.responder_requerimento(r_ana1, true);
  select * into v_req from public.requerimentos r where r.id = r_ana1;
  assert v_req.situacao = 'aprovado', format('Dani: o da Ana deveria ficar aprovado (%s)', v_req.situacao);
  assert v_req.respondido_por = c_dani, 'Dani: respondido_por deveria ser a Dani';
  assert v_req.respondido_em is not null, 'Dani: respondido_em deveria estar preenchido';

  begin
    perform public.responder_requerimento(r_ana1, true);
    msg := null;
  exception when others then
    msg := sqlstate || ':' || sqlerrm;
  end;
  assert msg like 'P0002:%já foi respondido%', format('Dani: aprovar de novo deveria dar erro (%s)', msg);

  begin
    perform public.responder_requerimento(r_ana2, false);
    msg := null;
  exception when others then
    msg := sqlstate || ':' || sqlerrm;
  end;
  assert msg like 'P0002:%motivo%', format('Dani: reprovar sem motivo deveria dar erro (%s)', msg);

  begin
    perform public.responder_requerimento(r_ana2, false, '   ');
    msg := null;
  exception when others then
    msg := sqlstate || ':' || sqlerrm;
  end;
  assert msg like 'P0002:%motivo%', format('Dani: reprovar com motivo em branco deveria dar erro (%s)', msg);

  perform public.responder_requerimento(r_ana2, false, 'Sem comprovante');
  select * into v_req from public.requerimentos r where r.id = r_ana2;
  assert v_req.situacao = 'reprovado', format('Dani: o segundo da Ana deveria ficar reprovado (%s)', v_req.situacao);
  assert v_req.motivo_resposta = 'Sem comprovante', format('Dani: motivo da resposta errado (%s)', v_req.motivo_resposta);

  begin
    perform public.responder_requerimento(r_dani, true);
    msg := null;
  exception when others then
    msg := sqlstate || ':' || sqlerrm;
  end;
  assert msg like 'P0002:%próprio%', format('Dani: responder o próprio deveria dar erro (%s)', msg);

  begin
    perform public.responder_requerimento('f1000000-0000-4000-8000-00000000ffff', true);
    msg := null;
  exception when others then
    msg := sqlstate || ':' || sqlerrm;
  end;
  assert msg like 'P0002:%não encontrado%', format('Dani: pedido que não existe deveria dar erro (%s)', msg);

  ---------------------------------------------------------------------------
  -- 4. Storage: bucket privado; envia na própria pasta; abre o dono e o RH;
  --    apaga o RH (só o que deve sumir) e o dono (só arquivo sem pedido)
  ---------------------------------------------------------------------------
  perform set_config('role', 'postgres', true);
  select count(*) into n from storage.buckets b
   where b.id = 'anexos-requerimentos'
     and not b.public
     and b.file_size_limit = 5242880
     and b.allowed_mime_types @> array['application/pdf', 'image/jpeg', 'image/png']
     and array_length(b.allowed_mime_types, 1) = 3;
  assert n = 1, 'o bucket anexos-requerimentos deveria existir, privado, 5 MB, só PDF/JPG/PNG';

  -- Arquivos do Beto gravados direto (os reprovados vieram de antes).
  insert into storage.objects (bucket_id, name) values
    ('anexos-requerimentos', p_beto40),
    ('anexos-requerimentos', p_beto10);

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.ana@ejuvv.com"}', true);
  insert into storage.objects (bucket_id, name) values ('anexos-requerimentos', p_ana1);
  insert into storage.objects (bucket_id, name) values ('anexos-requerimentos', p_orfao);
  begin
    insert into storage.objects (bucket_id, name)
      values ('anexos-requerimentos', 'f1000000-0000-4000-8000-0000000000a2/f1000000-0000-4000-8000-00000000f009.pdf');
    msg := null;
  exception when others then
    msg := sqlstate || ':' || sqlerrm;
  end;
  assert msg is not null, 'Ana: não deveria enviar arquivo na pasta do Beto';
  begin
    insert into storage.objects (bucket_id, name) values ('anexos-requerimentos', 'solto.pdf');
    msg := null;
  exception when others then
    msg := sqlstate || ':' || sqlerrm;
  end;
  assert msg is not null, 'Ana: não deveria enviar arquivo fora de uma pasta';

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.beto@ejuvv.com"}', true);
  insert into storage.objects (bucket_id, name) values ('anexos-requerimentos', p_beto1);

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.edu@ejuvv.com"}', true);
  begin
    insert into storage.objects (bucket_id, name)
      values ('anexos-requerimentos', 'f1000000-0000-4000-8000-0000000000a5/f1000000-0000-4000-8000-00000000f00a.pdf');
    msg := null;
  exception when others then
    msg := sqlstate || ':' || sqlerrm;
  end;
  assert msg is not null, 'Edu (sem meta): não deveria enviar arquivo nem na própria pasta';

  -- Quem abre
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.ana@ejuvv.com"}', true);
  select count(*) into n from storage.objects o where o.bucket_id = 'anexos-requerimentos' and o.name like 'f1000000-%';
  assert n = 2, format('Ana: deveria abrir só os 2 arquivos dela (abriu %s)', n);

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.beto@ejuvv.com"}', true);
  select count(*) into n from storage.objects o where o.bucket_id = 'anexos-requerimentos' and o.name = p_ana1;
  assert n = 0, 'Beto: não deveria abrir o anexo da Ana';

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.edu@ejuvv.com"}', true);
  select count(*) into n from storage.objects o where o.bucket_id = 'anexos-requerimentos' and o.name like 'f1000000-%';
  assert n = 0, format('Edu (diretor_setor): não deveria abrir nenhum anexo (abriu %s)', n);

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.carla@ejuvv.com"}', true);
  select count(*) into n from storage.objects o where o.bucket_id = 'anexos-requerimentos' and o.name like 'f1000000-%';
  assert n = 5, format('Carla (rh): deveria abrir os 5 arquivos (abriu %s)', n);

  -- Quem apaga (o Storage só deixa apagar pela API; no teste, liberamos a
  -- trava de apagar direto, e as regras de acesso continuam valendo)
  perform set_config('storage.allow_delete_query', 'true', true);

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.ana@ejuvv.com"}', true);
  delete from storage.objects o where o.bucket_id = 'anexos-requerimentos' and o.name = p_ana1;
  get diagnostics n = row_count;
  assert n = 0, 'Ana: não deveria apagar o arquivo ligado a um pedido';
  delete from storage.objects o where o.bucket_id = 'anexos-requerimentos' and o.name = p_orfao;
  get diagnostics n = row_count;
  assert n = 1, 'Ana: deveria apagar o próprio arquivo sem pedido';

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.carla@ejuvv.com"}', true);
  delete from storage.objects o where o.bucket_id = 'anexos-requerimentos' and o.name in (p_beto1, p_beto10);
  get diagnostics n = row_count;
  assert n = 0, format('Carla: não deveria apagar anexo de pendente nem de reprovado há 10 dias (apagou %s)', n);
  delete from storage.objects o where o.bucket_id = 'anexos-requerimentos' and o.name in (p_ana1, p_beto40);
  get diagnostics n = row_count;
  assert n = 2, format('Carla: deveria apagar o do aprovado e o do reprovado há 40 dias (apagou %s)', n);

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.edu@ejuvv.com"}', true);
  delete from storage.objects o where o.bucket_id = 'anexos-requerimentos' and o.name like 'f1000000-%';
  get diagnostics n = row_count;
  assert n = 0, format('Edu: não deveria apagar nenhum anexo (apagou %s)', n);

  perform set_config('storage.allow_delete_query', 'false', true);

  ---------------------------------------------------------------------------
  -- 5. anexos_para_apagar e anexo_apagado: aprovado, ou reprovado há mais de um mês
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.carla@ejuvv.com"}', true);
  select string_agg(a.anexo_caminho, ',' order by a.anexo_caminho) into v_lista
    from public.anexos_para_apagar() a
   where a.id in (r_ana1, r_ana2, r_beto1, r_beto40, r_beto10, r_dani);
  assert v_lista = p_ana1 || ',' || p_beto40,
    format('Carla: anexos_para_apagar deveria trazer só o aprovado e o reprovado há 40 dias (%s)', v_lista);

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.ana@ejuvv.com"}', true);
  select count(*) into n from public.anexos_para_apagar();
  assert n = 0, format('Ana: anexos_para_apagar não deveria trazer nada (trouxe %s)', n);
  begin
    perform public.anexo_apagado(r_ana1);
    msg := null;
  exception when others then
    msg := sqlstate || ':' || sqlerrm;
  end;
  assert msg like 'P0002:%', format('Ana: anexo_apagado deveria dar erro P0002 (%s)', msg);

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.edu@ejuvv.com"}', true);
  select count(*) into n from public.anexos_para_apagar();
  assert n = 0, format('Edu: anexos_para_apagar não deveria trazer nada (trouxe %s)', n);

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.carla@ejuvv.com"}', true);
  begin
    perform public.anexo_apagado(r_beto10);
    msg := null;
  exception when others then
    msg := sqlstate || ':' || sqlerrm;
  end;
  assert msg like 'P0002:%', format('Carla: anexo_apagado no reprovado há 10 dias deveria dar erro (%s)', msg);
  begin
    perform public.anexo_apagado(r_beto1);
    msg := null;
  exception when others then
    msg := sqlstate || ':' || sqlerrm;
  end;
  assert msg like 'P0002:%', format('Carla: anexo_apagado no pendente deveria dar erro (%s)', msg);

  perform public.anexo_apagado(r_ana1);
  select * into v_req from public.requerimentos r where r.id = r_ana1;
  assert v_req.anexo_caminho is null, 'Carla: anexo_apagado deveria limpar o anexo_caminho';
  assert v_req.anexo_nome = 'atestado.pdf', format('Carla: anexo_apagado deveria manter o anexo_nome (%s)', v_req.anexo_nome);
  perform public.anexo_apagado(r_ana1);   -- de novo: não muda nada nem dá erro

  perform set_config('request.jwt.claims', '{"role":"authenticated","email":"zz.req.dani@ejuvv.com"}', true);
  perform public.anexo_apagado(r_beto40);
  select string_agg(a.anexo_caminho, ',') into v_lista
    from public.anexos_para_apagar() a
   where a.id in (r_ana1, r_ana2, r_beto1, r_beto40, r_beto10, r_dani);
  assert v_lista is null, format('depois de apagados, anexos_para_apagar não deveria trazer nada (%s)', v_lista);

  perform set_config('request.jwt.claims', '', true);

  -- Chegou aqui = passou. Este erro é de propósito: desfaz tudo o que o teste fez.
  raise exception 'fim do teste' using errcode = 'ZZ999';
  exception when sqlstate 'ZZ999' then
    null;
  end;
end
$$;

select 'OK: requerimentos passou' as resultado;
