# Planejamento de novembro — piloto do AstroClock

Plano para desenvolver o piloto em novembro e começar o teste real em dezembro. Escopo do piloto: seção 14 do [`regras-de-negocio.md`](regras-de-negocio.md). Tarefas detalhadas da semana 1: [`tarefas-semana-1.md`](tarefas-semana-1.md).

Aprovado pelo Victor em 28/10/2026. Alterações neste plano passam pelo Victor.

## 1. Objetivo

- **Novembro:** construir o piloto, em 4 semanas de desenvolvimento.
- **Dezembro:** colocar o sistema em uso real com os membros por **pelo menos 1 mês**, corrigindo o que aparecer durante o uso.
- **Critério de sucesso do piloto:** os membros registram as horas no AstroClock em vez do método atual, e o RH consegue ver, toda semana, quem cumpriu a meta e quem ficou abaixo, sem planilha paralela.

## 2. Estratégia

1. **Primeiro o que sustenta o teste, depois o que o enriquece.** Sem login, registro de horas e cálculo semanal confiáveis, não há teste. Ranking, gráfico e presença na sede melhoram a experiência, mas o teste começa sem eles se for preciso.
2. **Telas e banco em paralelo.** As telas usam as funções falsas de `src/compartilhado/api/` desde o primeiro dia. O Bernardo troca cada função pela real sem mudar a tela. Ninguém fica esperando ninguém.
3. **Contrato antes de tela.** Toda função nova entra primeiro no contrato (seção 6 do [`arquitetura.md`](arquitetura.md)) e em versão falsa; depois a tela é feita.
4. **Regra no banco.** Prazos, sobreposição, cronômetro único e permissões são garantidos no banco (RLS e restrições), não só na tela.
5. **Demo toda sexta.** Cada semana termina com algo que dá para mostrar funcionando. A demo da semana 3 já é com o RH.
6. **Regra não decidida não é implementada.** O que estiver como [PENDENTE] espera a resposta da diretora de RH.

## 3. Calendário

| Semana | Datas | Observação |
| --- | --- | --- |
| Kickoff | até 03/11 | 02/11 (segunda) é feriado de Finados |
| Semana 1 | 03/11 a 06/11 | Semana curta (4 dias) |
| Semana 2 | 09/11 a 13/11 | |
| Semana 3 | 16/11 a 20/11 | 20/11 (sexta) é feriado da Consciência Negra: demo na quinta, 19/11 |
| Semana 4 | 23/11 a 27/11 | |
| Estabilização | 30/11 a 04/12 | Correções, produção no ar, cadastro dos membros reais, apresentação para a EJ |
| **Início do teste** | **07/12** | Segunda-feira: o teste começa numa semana inteira, para o cálculo semanal ficar limpo |
| Teste | 07/12 até pelo menos 08/01 | Cai nas férias de fim de ano (ver seção 7) |

## 4. Prioridades

### P0 — Sem isso o teste não começa

Precisa estar pronto até 04/12.

- Login com Google e perfis (`membro`, `rh`, `diretor_rh`), acesso negado para quem não está cadastrado.
- Cadastro de membros e setores pelo RH (o RH precisa cadastrar a EJ inteira antes do teste).
- Registro manual com prazos de 7 dias, sobreposição bloqueada e virada da meia-noite.
- Cronômetro, incluindo o encerramento automático após 10h e a **revisão pelo RH** (sem a revisão, os registros encerrados sozinhos ficam presos sem contar na meta).
- Metas com histórico; o diretor do RH altera (necessário para a regra de férias do piloto).
- Cálculo semanal.
- Painel do membro: barras sede x/5h e total x/10h, indicador de meta.
- Painel do RH: % de cumprimento, lista de quem ficou abaixo, detalhe por membro com edição e cancelamento (motivo obrigatório).
- Site em produção, login Google no `horas-prod`, backup diário rodando.

### P1 — Faz parte do piloto; pode chegar durante o teste

Em ordem de importância. Se a semana 4 atrasar, o que faltar daqui entra nas primeiras semanas de dezembro.

1. Requerimento de ausência (o membro envia, o RH aprova ou reprova), ainda sem e-mail. Enquanto não existir, o RH resolve fora do sistema.
2. Destaque de quem ficou abaixo da meta 2+ semanas seguidas.
3. Painel do membro: barras de tempo (dia, semana, mês, ano), resumo, grade de semanas do mês, histórico.
4. Presença na sede em tempo real.
5. Ranking mensal (completo para o RH; para o membro, a posição na EJ e no setor).
6. Gráfico de horas por dia.
7. E-mail do requerimento para o RH.
8. PWA básico instalável (manifest e ícone, sem funcionar offline).

### P2 — Só se houver tempo

- Comparativo e abas por setor.
- Seletor de trimestre e ano.

### Fora do piloto (Fase 2)

Férias com meta própria, histórico e métricas por ano, selos de horas, relatórios CSV mensais e anuais, outros gráficos, PDF, PWA offline e notificações, arquivamento de gestões.

## 5. Plano por semana

Cada semana lista o que cada pessoa entrega. As tarefas detalhadas (formato do [`tarefas-semana-1.md`](tarefas-semana-1.md)) das semanas 2, 3 e 4 são escritas depois da conversa com a diretora de RH, porque o requerimento e a presença dependem das respostas dela.

### Semana 1 (03/11 a 06/11) — Base

Tarefas detalhadas em [`tarefas-semana-1.md`](tarefas-semana-1.md).

| Pessoa | Entrega |
| --- | --- |
| Bernardo | Modelagem (inclui o esboço de `requerimentos` e `presenca_sede`), migrações de `membros`, `setores`, `metas`, `registros`, RLS de `membros`, login Google real, seed |
| Johannes | Protótipo das telas (com o Guilherme), base visual, painel do RH vazio com navegação |
| Guilherme | Tela de login, `/inicio`, `RotaProtegida`, painel do membro vazio |
| Victor | Validação do protótipo com o RH e a diretora; decidir hospedagem |

**Demo (06/11):** login com Google de verdade levando ao painel certo.

### Semana 2 (09/11 a 13/11) — Registrar horas

| Pessoa | Entrega |
| --- | --- |
| Bernardo | RLS de `registros`, `metas` e `setores`; prazos de 7 dias e sobreposição no banco; funções reais de registros, cronômetro (com encerramento após 10h), metas e membros; migrações de `requerimentos` e `presenca_sede` |
| Guilherme | Formulário de registro manual (com o aviso "Não registre reuniões e eventos."), lista de registros da semana com editar e cancelar, cronômetro na tela |
| Johannes | Cadastro, lista e desativação de membros; alterar perfil e metas (só `diretor_rh`) |
| Victor | Site de desenvolvimento no ar na hospedagem escolhida; revisar PRs |

**Demo (13/11):** registrar horas manualmente e pelo cronômetro, com dados reais no `horas-dev`.

### Semana 3 (16/11 a 19/11) — Painéis e requerimento

Semana com feriado na sexta.

| Pessoa | Entrega |
| --- | --- |
| Bernardo | Cálculo semanal no banco (progresso, percentual, resumo, abaixo da meta, 2+ semanas seguidas); revisão de cronômetro; requerimentos reais |
| Guilherme | Painel do membro: barras sede e total, indicador de meta, barras de tempo, resumo, grade de semanas do mês, histórico; formulário de requerimento |
| Johannes | Painel do RH: % de cumprimento, quem ficou abaixo, destaque 2+ semanas, detalhe por membro (editar e cancelar com motivo), requerimentos (aprovar e reprovar), revisão de cronômetros |
| Victor | Demo com o RH (19/11) |

**Demo (19/11), com o RH:** uma semana inteira de horas aparecendo no painel do membro e no do RH.

**Ponto de decisão (19/11):** se o P0 não estiver todo de pé, a semana 4 vira semana de completar o P0, e o P1 passa para dezembro.

### Semana 4 (23/11 a 27/11) — Complementos e produção

| Pessoa | Entrega |
| --- | --- |
| Bernardo | Ranking mensal no banco; presença na sede real (atualizando em tempo real); e-mail do requerimento; migrações aplicadas no `horas-prod` |
| Guilherme | Gráfico de horas por dia, posição no ranking, botão "estou na sede" com lista de quem está e o lembrete de desmarcar, PWA básico |
| Johannes | Ranking completo no painel do RH, quem está na sede no painel do RH |
| Victor | Produção: hospedagem, login Google no `horas-prod` (passo M5 no prod), restaurar um backup no `horas-dev` com o Bernardo |

**Demo (27/11):** o piloto completo, já em produção.

### Estabilização (30/11 a 04/12)

- Corrigir os problemas encontrados nas demos.
- Cadastrar os membros reais no `horas-prod` (o RH, pelo próprio sistema).
- Teste com 2 ou 3 membros de verdade antes de abrir para todos.
- Apresentar o sistema para a EJ: como registrar, o que é o requerimento, a quem pedir ajuda.

## 6. Trabalho de fundo do Victor

Coisas que não são tela nem banco, mas travam o piloto se ficarem para o fim:

| O quê | Até quando | Por quê |
| --- | --- | --- |
| Conversa com a diretora de RH ([`pauta-diretora-rh.md`](pauta-diretora-rh.md)) | 29/10 | Requerimento e presença dependem das respostas |
| Atualizar o contrato e as funções falsas (seção 8) | Antes do kickoff | Johannes e Guilherme precisam das funções falsas para começar as telas novas |
| Decidir a hospedagem (Vercel ou Cloudflare Pages, ver `AGENTS.md`) | Semana 1 | Site de desenvolvimento no ar na semana 2 |
| Escolher o serviço de e-mail do requerimento | Semana 2 | O Bernardo implementa na semana 4 |
| Tarefas detalhadas das semanas 2, 3 e 4 | Antes de cada semana | Com a IA, no formato da semana 1 |
| Login Google no `horas-prod` | Semana 4 | Mesmo passo da M5, no prod, com a URL do site em produção |

## 7. Férias durante o teste

Decidido pelo Victor em 28/10/2026: a regra de férias continua na Fase 2. Durante o teste, a **diretora de RH altera a meta na mão** pela função de metas: **5h no total e 0h na sede** durante as férias, e volta para 10h e 5h depois.

Consequências práticas:

- Uma alteração de meta vale **na semana seguinte**. A diretora precisa mudar a meta na semana **antes** de as férias começarem e de novo na semana antes de terminarem.
- A meta vale para todos. Quem não estiver de férias também fica com 5h nessas semanas.
- A meta de sede precisa poder ser **0**. Hoje a função falsa `alterarMetas` recusa 0; isso é corrigido junto com a seção 8.
- Falta saber as datas das férias da EJ (pergunta na pauta).

## 8. Mudanças no contrato antes do kickoff

O contrato da seção 6 do [`arquitetura.md`](arquitetura.md) não cobre todo o escopo do piloto. Já acrescentado no `arquitetura.md` em 28/10/2026 (ainda sem versão falsa no código):

- Requerimento de ausência: `enviarRequerimento`, `meusRequerimentos`, `listarRequerimentos`, `responderRequerimento`.
- Presença na sede: `quemEstaNaSede`, `estouNaSede`, `marcarNaSede`, `desmarcarNaSede`.

Ainda falta acrescentar ao contrato:

- Revisão de cronômetro (listar os em revisão, aprovar ou reprovar).
- Ranking mensal (completo e a posição do membro).
- Horas por dia (para o gráfico).
- Lista de setores e mudança de setor de um membro.
- Semanas seguidas abaixo da meta (para o destaque 2+).
- `motivo` em `editarRegistroDeMembro` e `cancelarRegistroDeMembro` (a regra exige motivo; hoje a função não recebe).
- Meta de sede igual a 0 aceita em `alterarMetas` (férias).
- `registrarDispensa`: sai do contrato ou fica, conforme a pergunta 6 da pauta.

Depois, criar as versões falsas no código. Precisa estar pronto antes do kickoff.

## 9. Riscos

| Risco | Efeito | O que fazer |
| --- | --- | --- |
| Escopo apertado para 4 semanas (com 2 feriados) | P1 não termina em novembro | Prioridades da seção 4; ponto de decisão em 19/11 |
| Equipe com tempo parcial (EJ + faculdade) | Atrasos de dias por pessoa | PRs pequenos; uma tarefa por vez; avisar no grupo ao travar |
| Respostas da diretora atrasarem | Requerimento e presença sem regra | Conversa em 29/10; o que continuar pendente fica para dezembro |
| Hospedagem e e-mail sem definição | Produção e e-mail ficam para a última hora | Prazos da seção 6 |
| RLS errado | Membro vendo dados de outro | Testar sempre pelos dois lados (membro e RH); PR de banco só com a aprovação do Victor |
| Presença na sede: o membro só vê a própria linha de `membros` | A lista "quem está na sede" não consegue mostrar os nomes | Prever na B1 uma visão ou função que mostre só o nome de quem está na sede |
| Encerramento automático do cronômetro após 10h | Precisa de algo rodando no banco sem ninguém abrir o site | Bernardo decide na semana 2 (tarefa agendada no banco ou cálculo na leitura) |
| Teste nas férias de fim de ano | Pouco uso; dados fracos para avaliar | Teste de pelo menos 1 mês; estender para janeiro se o uso for baixo |
