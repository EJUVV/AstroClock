# Planejamento de novembro — piloto do AstroClock

Plano para desenvolver o piloto em novembro e começar o teste real em dezembro. Escopo do piloto: seção 14 do [`regras-de-negocio.md`](regras-de-negocio.md). Tarefas detalhadas da semana 1: [`tarefas-semana-1.md`](tarefas-semana-1.md).

Aprovado pelo Victor em 28/10/2026 e atualizado em 01/11/2026, com a reunião de 30/10 e as decisões do Victor. Alterações neste plano passam pelo Victor.

## 1. Objetivo

- **Novembro:** construir o piloto, em 4 semanas de desenvolvimento.
- **Dezembro:** colocar o sistema em uso real com os membros por **pelo menos 1 mês**, corrigindo o que aparecer durante o uso.
- **Critério de sucesso do piloto:** os membros registram as horas no AstroClock em vez do método atual, e o RH consegue ver, toda semana, quem cumpriu a meta e quem ficou abaixo, sem planilha paralela.

## 2. Estratégia

1. **Primeiro o que sustenta o teste, depois o que o enriquece.** Sem login, registro de horas e cálculo semanal confiáveis, não há teste. Ranking, gráfico e presença na sede melhoram a experiência, mas o teste começa sem eles se for preciso.
2. **Telas e banco em paralelo.** As telas usam as funções falsas de `src/compartilhado/api/` desde o primeiro dia. O Bernardo troca cada função pela real sem mudar a tela. Ninguém fica esperando ninguém.
3. **Contrato antes de tela.** Toda função nova entra primeiro no contrato (seção 6 do [`arquitetura.md`](arquitetura.md)) e em versão falsa; depois a tela é feita.
4. **Regra no banco.** Prazos, sobreposição, cronômetro único e permissões são garantidos no banco (RLS e restrições), não só na tela.
5. **Reunião toda quarta.** A equipe se reúne presencialmente na sede, depois das 11h, para mostrar o que já foi feito e o que falta. Cada um também manda um mini relatório diário para o Victor no WhatsApp.
6. **Regra não decidida não é implementada.** O que estiver como [PENDENTE] espera a resposta da diretora de RH.

## 3. Calendário

| Semana | Datas | Observação |
| --- | --- | --- |
| Kickoff | 30/10 | Feito na reunião presencial. 02/11 (segunda) é feriado de Finados |
| Semana 1 | 03/11 a 06/11 | Semana curta (4 dias). Reunião em 04/11 |
| Semana 2 | 09/11 a 13/11 | Reunião em 11/11 |
| Semana 3 | 16/11 a 19/11 | 20/11 (sexta) é feriado da Consciência Negra. Reunião em 18/11 e validação com o RH até 19/11 |
| Semana 4 | 23/11 a 27/11 | Reunião em 25/11 |
| Estabilização | 30/11 a 04/12 | Reunião em 02/12. Correções, produção no ar, cadastro dos membros reais, apresentação para a EJ |
| **Início do teste** | **07/12** | Segunda-feira: o teste começa numa semana inteira, para o cálculo semanal ficar limpo |
| Teste | 07/12 até pelo menos 08/01 | Cai nas férias de fim de ano (ver seção 7) |

## 4. Prioridades

### P0 — Sem isso o teste não começa

Precisa estar pronto até 04/12.

- Login com Google e os 5 perfis (`membro`, `rh`, `diretor_rh`, `diretor_setor`, `presidente`), acesso negado para quem não está cadastrado.
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
7. E-mail do requerimento para todo o RH.
8. Anexo do requerimento (atestado ou comprovante).
9. PWA básico instalável (manifest e ícone, sem funcionar offline e sem lojas de aplicativos).

### Fora do piloto (Fase 2)

Férias com meta própria, histórico e métricas por ano, selos de horas, relatórios CSV mensais e anuais, outros gráficos, comparativo e abas por setor, seletor de trimestre e ano, PDF, PWA offline e notificações, arquivamento de gestões.

### Backlog (sem decisão de entrar)

Relatório semanal automático com nota; cadastro de períodos de férias, feriado e sede fechada.

## 5. Plano por semana

**Atualizado em 09/11/2026:** as telas de Guilherme e Johannes das semanas 1 a 4 ficaram prontas no protótipo (com dados falsos) até 07/11. Para tirar carga do Bernardo, a partir da semana 2 **Guilherme e Johannes trocam as funções falsas pelas reais** das telas que fizeram, e assumem o e-mail e o anexo. O Bernardo fica com o núcleo do banco: tabelas, RLS, cálculos em SQL, login real, tarefas automáticas e produção. As tabelas abaixo já mostram essa divisão. Tarefas e prazos atualizados ficam no Notion.

Cada semana lista o que cada pessoa entrega. As tarefas detalhadas das semanas 2, 3 e 4 estão em [`tarefas-semanas-2-a-4.md`](tarefas-semanas-2-a-4.md) (escritas em 10/11/2026, depois da conversa com a diretora de RH).

### Semana 1 (03/11 a 06/11) — Base

Tarefas detalhadas em [`tarefas-semana-1.md`](tarefas-semana-1.md).

| Pessoa | Entrega |
| --- | --- |
| Bernardo | Modelagem (inclui o esboço de `requerimentos` e `presenca_sede`), migrações de `membros`, `setores`, `metas`, `registros`, RLS de `membros`, login Google real, seed |
| Johannes | Protótipo das telas (com o Guilherme), base visual, painel do RH vazio com navegação |
| Guilherme | Tela de login, `/inicio`, `RotaProtegida`, painel do membro vazio |
| Victor | Validação do protótipo com o RH e a diretora; confirmar o plano da hospedagem com o Rodrigo; ligar o provedor Google com o Bernardo a partir de 03/11 |

**Meta até 06/11:** login com Google de verdade levando ao painel certo.

### Semana 2 (09/11 a 13/11) — Registrar horas

| Pessoa | Entrega |
| --- | --- |
| Bernardo | Banco do `horas-dev` em migração e no GitHub; RLS de `registros`, `metas` e `setores`; prazos de 7 dias e sobreposição no banco; migrações de `requerimentos` e `presenca_sede` |
| Guilherme | Registro que passa da meia-noite; trocar as falsas de `registros.ts` e `cronometro.ts` pelas reais |
| Johannes | Tela de mudar setor; trocar as falsas de `membros.ts` e das metas pelas reais; Storage privado do anexo |
| Victor | Convidar Guilherme e Johannes para o Supabase dev; validar o protótipo com o RH; PWA instalável; revisar PRs |

**Meta até 13/11:** registrar horas manualmente e pelo cronômetro, com dados reais no `horas-dev`.

### Semana 3 (16/11 a 19/11) — Painéis e requerimento

Semana com feriado na sexta.

| Pessoa | Entrega |
| --- | --- |
| Bernardo | Cálculo semanal no banco (progresso, percentual, resumo, abaixo da meta, 2+ semanas seguidas, médias); cronômetro que encerra sozinho após 10h; tabela de requerimentos |
| Guilherme | Requerimento do membro real; e-mail do requerimento (função no Supabase) |
| Johannes | Requerimentos e revisão de cronômetros do RH reais; `linkDoAnexo` real; anexo apagado na aprovação |
| Victor | Conta `@ejuvv.com` que envia os e-mails, com senha de app (sem Resend); ajustes pedidos pelo RH |

**Meta até 19/11, validada com o RH:** uma semana inteira de horas aparecendo no painel do membro e no do RH.

**Ponto de decisão (reunião de 18/11):** se o P0 não estiver todo de pé, a semana 4 vira semana de completar o P0, e o P1 passa para dezembro.

### Semana 4 (23/11 a 27/11) — Complementos e produção

| Pessoa | Entrega |
| --- | --- |
| Bernardo | Ranking mensal no banco; presença que desmarca sozinha; migrações aplicadas no `horas-prod` |
| Guilherme | Presença na sede em tempo real na tela |
| Johannes | Anexos incluídos no backup diário |
| Victor | Produção: hospedagem, login Google no `horas-prod` (passo M5 no prod), restaurar um backup no `horas-dev` com o Bernardo |

**Meta até 27/11:** o piloto completo, já em produção.

### Estabilização (30/11 a 04/12)

- Corrigir os problemas encontrados nas reuniões e na validação com o RH.
- Cadastrar os membros reais no `horas-prod` (o RH, pelo próprio sistema).
- Teste com 2 ou 3 membros de verdade antes de abrir para todos.
- Apresentar o sistema para a EJ: como registrar, o que é o requerimento, a quem pedir ajuda.

## 6. Trabalho de fundo do Victor

Coisas que não são tela nem banco, mas travam o piloto se ficarem para o fim:

| O quê | Até quando | Por quê |
| --- | --- | --- |
| Conversa com a diretora de RH ([`pauta-diretora-rh.md`](pauta-diretora-rh.md)) | Até 06/11 | Aviso ao membro, dispensa direta e anexo ainda têm perguntas abertas |
| Confirmar com o Rodrigo o plano da Vercel e o que fazer com a Hostinger | Feito (10/11): produção na **Vercel**; a Hostinger fica como possibilidade para depois | Site de desenvolvimento no ar na semana 2 |
| Confirmar o serviço de e-mail | Feito (11/11): **Gmail da EJ** (conta `@ejuvv.com` com senha de app), sem Resend e sem depender do DNS | O Guilherme implementa na semana 3 (G8) |
| Tarefas detalhadas das semanas 2, 3 e 4 | Feito (10/11): [`tarefas-semanas-2-a-4.md`](tarefas-semanas-2-a-4.md) | Com a IA, no formato da semana 1 |
| Login Google no `horas-prod` | Semana 4 | Mesmo passo da M5, no prod, com a URL do site em produção |

## 7. Férias durante o teste

Decidido pelo Victor em 28/10/2026 e confirmado em 01/11/2026: a regra de férias continua na Fase 2. Durante o teste, a **diretora de RH especifica a meta de cada período** pela função de metas: **5h no total e 0h na sede** a partir da semana em que as férias começam, e 10h e 5h a partir da semana da volta.

Consequências práticas:

- A diretora escolhe a semana em que cada meta começa e pode programar as duas mudanças de uma vez, com antecedência. Nunca a semana atual nem uma passada.
- A meta vale para todos. Quem não estiver de férias também fica com 5h nessas semanas.
- A meta de sede pode ser **0**.
- As datas das férias da EJ ainda serão definidas.

## 8. Contrato das funções

Fechado em 01/11/2026 na seção 6 do [`arquitetura.md`](arquitetura.md), com as versões falsas no código. Só falta decidir `registrarDispensa`: sai do contrato ou fica, conforme a resposta da diretora de RH sobre dispensa direta.

## 9. Riscos

| Risco | Efeito | O que fazer |
| --- | --- | --- |
| Escopo apertado para 4 semanas (com 2 feriados) | P1 não termina em novembro | Prioridades da seção 4; ponto de decisão em 18/11 |
| Equipe com tempo parcial (EJ + faculdade) | Atrasos de dias por pessoa | PRs pequenos; uma tarefa por vez; avisar no grupo ao travar |
| Respostas da diretora atrasarem | Requerimento e presença sem regra | Conversa até 06/11; o que continuar pendente fica para dezembro |
| Hospedagem e e-mail sem definição | Produção e e-mail ficam para a última hora | Prazos da seção 6. O plano grátis da Vercel é só para uso pessoal e não comercial; se o Rodrigo entender que a EJ não se encaixa, usar Cloudflare Pages |
| Anexo com dado de saúde | Vazamento de dado sensível; arquivo perdido, porque o backup diário só copia o banco | Armazenamento privado, acesso só de quem enviou e do RH, e incluir os arquivos no backup antes de abrir em produção |
| RLS errado | Membro vendo dados de outro | Testar sempre pelos dois lados (membro e RH); PR de banco só com a aprovação do Victor |
| Presença na sede: o membro só vê a própria linha de `membros` | A lista "quem está na sede" não consegue mostrar os nomes | Prever na B1 uma visão ou função que mostre só o nome de quem está na sede |
| Encerramento automático do cronômetro após 10h | Precisa de algo rodando no banco sem ninguém abrir o site | Bernardo decide na semana 2 (tarefa agendada no banco ou cálculo na leitura) |
| Teste nas férias de fim de ano | Pouco uso; dados fracos para avaliar | Teste de pelo menos 1 mês; estender para janeiro se o uso for baixo |
