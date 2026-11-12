-- =============================================================================
-- AstroClock · seed (dados FALSOS) · só para o horas-dev e para o banco local
-- =============================================================================
-- Nunca rodar na produção. Roda com o banco vazio, depois das migrações
-- (supabase db reset no banco local). O horas-dev já tem estes dados.
-- Os nomes são inventados: os e-mails teste.* não existem no Google, então
-- ninguém entra com eles.
--
-- Setores iguais aos do front. Diretores não registram horas (o banco
-- bloqueia) e ficam fora do cálculo da meta.
--
-- Cenários para os painéis e cálculos das semanas 2 e 3:
--   Equipe     Victor diretor do RH · Johannes rh · Bernardo e Guilherme membros
--   Ana        bate a meta toda semana (6h sede + 5h online)
--   Diego      passa de 10h, mas só 3h na sede · veio do Marketing (historico_setor)
--   Elisa      abaixo da meta nas 2 últimas semanas, seguidas
--   Felipe     bate a sede, mas fica em 7h no total
--   Gabriela   exatamente na meta (5h sede + 5h online)
--   Henrique   cronômetro ligado agora + um de 10h esperando revisão do RH
--   Isabela    registros cancelados (um deles sobreposto a um válido)
--   João       membro desativado, com histórico antigo
--   Lucas      entrou nesta semana: só entra no cálculo a partir da próxima
--   Bruno e Carla  rh fictícios, batem a meta
--   Diretores  Rafael presidente (Gestão e Qualidade) · Marcos (Comercial),
--              Paula (Projetos) e Renata (Marketing) diretores de setor ·
--              Antônio, ex-diretor do Comercial, desativado · RH e Gestão e
--              Qualidade sem diretor de setor, de propósito
--   Metas      8h/4h até 2 semanas atrás, depois 10h/5h (testa o histórico)
--
-- As datas são relativas à semana atual: tem dados da semana corrente (só o
-- que já passou) e das 3 anteriores.
-- Os e-mails troque.* são da equipe: troque pelos @ejuvv.com reais quando
-- souber (comando no fim do arquivo). Os teste.* não existem no Google.


-- 3.1 Setores (os mesmos do front) --------------------------------------------

insert into public.setores (nome) values
  ('Projetos'),
  ('Comercial'),
  ('RH'),
  ('Marketing'),
  ('Gestão e Qualidade')
on conflict do nothing;


-- 3.2 Equipe do AstroClock ------------------------------------------------------

insert into public.membros (nome, email, perfil, setor_id, data_entrada)
select v.nome, v.email, v.perfil::public.perfil, s.id, date '2026-03-10'
from (values
  ('Victor',    'troque.victor@ejuvv.com',    'diretor_rh', 'RH'),
  ('Johannes',  'troque.johannes@ejuvv.com',  'rh',         'RH'),
  ('Bernardo',  'bernardo.quintas@ejuvv.com', 'membro',     'Projetos'),
  ('Guilherme', 'troque.guilherme@ejuvv.com', 'membro',     'Projetos')
) as v(nome, email, perfil, setor)
join public.setores s on s.nome = v.setor
on conflict do nothing;


-- 3.3 Membros fictícios (e-mails teste.* não existem no Google) ----------------

insert into public.membros (nome, email, perfil, setor_id, ativo, data_entrada)
select f.nome, f.email, f.perfil::public.perfil, s.id, f.ativo, f.entrada::date
from (values
  ('Carla Mendes',     'teste.carla@ejuvv.com',    'rh',            'RH',                 true,  '2025-03-01'),
  ('Bruno Costa',      'teste.bruno@ejuvv.com',    'rh',            'RH',                 true,  '2025-08-15'),
  ('Rafael Souza',     'teste.rafael@ejuvv.com',   'presidente',    'Gestão e Qualidade', true,  '2025-03-01'),
  ('Marcos Teixeira',  'teste.marcos@ejuvv.com',   'diretor_setor', 'Comercial',          true,  '2025-03-01'),
  ('Paula Ribeiro',    'teste.paula@ejuvv.com',    'diretor_setor', 'Projetos',           true,  '2025-08-15'),
  ('Renata Gomes',     'teste.renata@ejuvv.com',   'diretor_setor', 'Marketing',          true,  '2025-08-15'),
  ('Antônio Barros',   'teste.antonio@ejuvv.com',  'diretor_setor', 'Comercial',          false, '2024-08-15'),
  ('Ana Lima',         'teste.ana@ejuvv.com',      'membro',        'Projetos',           true,  '2025-03-01'),
  ('Diego Rocha',      'teste.diego@ejuvv.com',    'membro',        'Comercial',          true,  '2025-08-15'),
  ('Elisa Martins',    'teste.elisa@ejuvv.com',    'membro',        'Marketing',          true,  '2026-03-10'),
  ('Felipe Araújo',    'teste.felipe@ejuvv.com',   'membro',        'Projetos',           true,  '2026-03-10'),
  ('Gabriela Nunes',   'teste.gabriela@ejuvv.com', 'membro',        'Gestão e Qualidade', true,  '2026-03-10'),
  ('Henrique Dias',    'teste.henrique@ejuvv.com', 'membro',        'Comercial',          true,  '2026-08-20'),
  ('Isabela Freitas',  'teste.isabela@ejuvv.com',  'membro',        'Marketing',          true,  '2026-08-20'),
  ('João Pedro Alves', 'teste.joao@ejuvv.com',     'membro',        'Projetos',           false, '2025-03-01')
) as f(nome, email, perfil, setor, ativo, entrada)
join public.setores s on s.nome = f.setor
on conflict do nothing;

-- Lucas: entrou na segunda desta semana
insert into public.membros (nome, email, perfil, setor_id, data_entrada)
select 'Lucas Prado', 'teste.lucas@ejuvv.com', 'membro', s.id,
       date_trunc('week', now() at time zone 'America/Sao_Paulo')::date
from public.setores s
where s.nome = 'Marketing'
on conflict do nothing;


-- 3.4 Troca de setor: Diego veio do Marketing há 4 semanas (feita pela Carla) --

insert into public.historico_setor (membro_id, setor_anterior_id, setor_novo_id, alterado_por, alterado_em)
select d.id, ant.id, d.setor_id, c.id,
       ((date_trunc('week', now() at time zone 'America/Sao_Paulo')::date - 28)::timestamp
          + time '10:00') at time zone 'America/Sao_Paulo'
from public.membros d
join public.setores ant on ant.nome = 'Marketing'
join public.membros c on c.email = 'teste.carla@ejuvv.com'
where d.email = 'teste.diego@ejuvv.com'
  and not exists (select 1 from public.historico_setor);


-- 3.5 Metas (histórico) --------------------------------------------------------

insert into public.metas (horas_total, horas_sede, vigente_desde, alterado_por)
select v.total, v.sede, seg.d + v.dias, v.por
from (select date_trunc('week', now() at time zone 'America/Sao_Paulo')::date as d) as seg
cross join (values
  ( 8, 4, -56, null::uuid),   -- meta antiga, criada direto no banco
  (10, 5, -14, (select id from public.membros where perfil = 'diretor_rh' and ativo))
) as v(total, sede, dias, por)
where not exists (select 1 from public.metas);


-- 3.6 Registros ----------------------------------------------------------------
-- Só quem tem meta (membro e rh) aparece aqui. Se alguém puser um diretor neste
-- plano, o banco recusa o insert (é de propósito).
-- semana: 0 = atual, -1 = passada... · dia: 0 = segunda ... 6 = domingo
-- Horários de São Paulo. Nenhum passa da meia-noite (regra da semana 2).

with seg as (
  select date_trunc('week', now() at time zone 'America/Sao_Paulo')::date as d
),
plano (nomes, semanas, dia, hora, horas, local, descricao, origem, cancelado, revisao) as (
  values
  -- equipe com meta: Bernardo, Johannes e Guilherme · 9h; Guilherme 11h
  (array['Bernardo','Johannes','Guilherme'], array[-2,-1,0], 0, '10:00', 3.0, 'sede',   'Desenvolvimento do AstroClock', 'manual', false, false),
  (array['Bernardo','Johannes','Guilherme'], array[-2,-1,0], 2, '11:00', 2.0, 'sede',   'Reunião de quarta',             'manual', false, false),
  (array['Bernardo','Johannes','Guilherme'], array[-2,-1,0], 3, '19:00', 4.0, 'online', 'Desenvolvimento do AstroClock', 'manual', false, false),
  (array['Guilherme'],                       array[-2,-1,0], 5, '10:00', 2.0, 'online', 'Testes do painel do membro',    'manual', false, false),

  -- Ana: bate a meta
  (array['Ana Lima'], array[-3,-2,-1,0], 0, '09:00', 3.0, 'sede',   'Reunião semanal do projeto', 'manual', false, false),
  (array['Ana Lima'], array[-3,-2,-1,0], 2, '14:00', 3.0, 'sede',   'Desenvolvimento do projeto', 'manual', false, false),
  (array['Ana Lima'], array[-3,-2,-1,0], 3, '19:00', 2.5, 'online', 'Documentação do projeto',    'manual', false, false),
  (array['Ana Lima'], array[-3,-2,-1,0], 5, '10:00', 2.5, 'online', 'Estudo de ferramenta',       'manual', false, false),

  -- Diego: 11h, mas só 3h na sede
  (array['Diego Rocha'], array[-3,-2,-1,0], 1, '10:00', 3.0, 'sede',   'Prospecção de clientes', 'manual', false, false),
  (array['Diego Rocha'], array[-3,-2,-1,0], 2, '19:00', 4.0, 'online', 'Propostas comerciais',   'manual', false, false),
  (array['Diego Rocha'], array[-3,-2,-1,0], 4, '18:00', 4.0, 'online', 'Follow-up com clientes', 'manual', false, false),

  -- Elisa: ok há 3 semanas, abaixo nas 2 últimas
  (array['Elisa Martins'], array[-3],    0, '09:00', 5.0, 'sede',   'Campanha de redes sociais', 'manual', false, false),
  (array['Elisa Martins'], array[-3],    3, '14:00', 5.0, 'online', 'Criação de posts',          'manual', false, false),
  (array['Elisa Martins'], array[-2,-1], 1, '14:00', 2.0, 'sede',   'Reunião de marketing',      'manual', false, false),
  (array['Elisa Martins'], array[-2,-1], 3, '20:00', 2.0, 'online', 'Criação de posts',          'manual', false, false),
  (array['Elisa Martins'], array[0],     0, '09:00', 2.0, 'sede',   'Reunião de marketing',      'manual', false, false),

  -- Felipe: 5h na sede, 7h no total
  (array['Felipe Araújo'], array[-3,-2,-1,0], 0, '13:00', 2.5, 'sede',   'Pesquisa de mercado',  'manual', false, false),
  (array['Felipe Araújo'], array[-3,-2,-1,0], 2, '13:00', 2.5, 'sede',   'Reunião com cliente',  'manual', false, false),
  (array['Felipe Araújo'], array[-3,-2,-1,0], 6, '15:00', 2.0, 'online', 'Relatório do projeto', 'manual', false, false),

  -- Gabriela: exatamente 5h + 5h
  (array['Gabriela Nunes'], array[-3,-2,-1,0], 1, '08:00', 2.5, 'sede',   'Controle financeiro',      'manual', false, false),
  (array['Gabriela Nunes'], array[-3,-2,-1,0], 3, '08:00', 2.5, 'sede',   'Indicadores de qualidade', 'manual', false, false),
  (array['Gabriela Nunes'], array[-3,-2,-1,0], 2, '18:00', 5.0, 'online', 'Orçamento do semestre',    'manual', false, false),

  -- Henrique: cronômetro (o ligado agora entra na seção 3.7)
  (array['Henrique Dias'], array[-3,-2,-1], 0, '09:00',  3.0, 'sede',   'Visita a cliente',            'manual',     false, false),
  (array['Henrique Dias'], array[-3,-2,-1], 4, '14:00',  4.0, 'online', 'Proposta para cliente',       'manual',     false, false),
  (array['Henrique Dias'], array[-2],       2, '15:00',  3.0, 'sede',   'Reunião de alinhamento',      'cronometro', false, false),
  (array['Henrique Dias'], array[-1],       1, '08:00', 10.0, 'online', 'Cronômetro esquecido ligado', 'cronometro', false, true),

  -- Isabela: 10h válidas + cancelados
  (array['Isabela Freitas'], array[-3,-2,-1,0], 1, '09:00', 3.0, 'sede',   'Design de peças',        'manual', false, false),
  (array['Isabela Freitas'], array[-3,-2,-1,0], 3, '09:00', 3.0, 'sede',   'Reunião de pauta',       'manual', false, false),
  (array['Isabela Freitas'], array[-3,-2,-1,0], 4, '19:00', 4.0, 'online', 'Edição de vídeo',        'manual', false, false),
  (array['Isabela Freitas'], array[-1],         3, '10:00', 2.0, 'sede',   'Lançado em duplicidade', 'manual', true,  false),
  (array['Isabela Freitas'], array[-2],         5, '10:00', 5.0, 'online', 'Lançado por engano',     'manual', true,  false),

  -- Bruno e Carla (rh) também cumprem a meta
  (array['Bruno Costa','Carla Mendes'], array[-3,-2,-1,0], 0, '09:00', 4.0, 'sede',   'Entrevistas do processo seletivo', 'manual', false, false),
  (array['Bruno Costa','Carla Mendes'], array[-3,-2,-1,0], 2, '09:00', 2.0, 'sede',   'Planejamento do RH',               'manual', false, false),
  (array['Bruno Costa','Carla Mendes'], array[-3,-2,-1,0], 3, '18:00', 5.0, 'online', 'Feedbacks individuais',            'manual', false, false),

  -- João (desativado): histórico antigo
  (array['João Pedro Alves'], array[-3,-2], 0, '09:00', 4.0, 'sede',   'Reunião de projeto',         'manual', false, false),
  (array['João Pedro Alves'], array[-3,-2], 2, '19:00', 4.0, 'online', 'Desenvolvimento do projeto', 'manual', false, false)
)
insert into public.registros (membro_id, inicio, fim, local, descricao, origem, cancelado, precisa_revisao)
select m.id,
       x.inicio,
       x.inicio + x.duracao,
       p.local::public.local_registro,
       p.descricao,
       p.origem::public.origem_registro,
       p.cancelado,
       p.revisao
from plano p
cross join seg
cross join lateral unnest(p.nomes) as n(nome)
cross join lateral unnest(p.semanas) as s(semana)
cross join lateral (
  select ((seg.d + s.semana * 7 + p.dia)::timestamp + p.hora::time)
           at time zone 'America/Sao_Paulo'           as inicio,
         make_interval(mins => (p.horas * 60)::int)   as duracao
) as x
join public.membros m on m.nome = n.nome
where x.inicio + x.duracao <= now()                    -- semana atual: só o que já passou
  and not exists (select 1 from public.registros);


-- 3.7 Cronômetro ligado agora (Henrique) ----------------------------------------

insert into public.registros (membro_id, inicio, local, descricao, origem)
select m.id, now() - interval '50 minutes', 'sede', 'Atendimento ao cliente', 'cronometro'
from public.membros m
where m.email = 'teste.henrique@ejuvv.com'
  and not exists (
    select 1 from public.registros r
    where r.membro_id = m.id and r.fim is null and not r.cancelado
  );


