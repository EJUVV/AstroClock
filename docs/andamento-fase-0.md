# Andamento da Fase 0

Retrato de onde a Fase 0 parou (atualizado em 17/11/2026). Ao retomar com uma IA, peça para ela ler este arquivo e o [`fase-0.md`](fase-0.md). Quando a Fase 0 terminar, este arquivo pode ser apagado (antes, passe a seção "Ambientes" para o `arquitetura.md` ou o `README.md`).

## Próxima sessão: comece por aqui

Onde paramos (16/11/2026, início da semana 3): **registros e cronômetro já usam o banco de verdade (G5 e G6 na `main`), mas o resto do painel ainda é falso.** A semana 2 fechou pela metade: as tarefas do Johannes (J4, J5, J6) e as 5 correções da B7 não chegaram. A semana 3 foi replanejada em 16/11 para focar no P0 (ver "Revisão de 16/11" e o [`tarefas-semanas-2-a-4.md`](tarefas-semanas-2-a-4.md)). O login com Google funciona de verdade no `horas-dev` desde 10/11 para o Victor, o Bernardo e o Guilherme. Só o Johannes ainda está com e-mail provisório no banco (conferido em 17/11). As regras estão fechadas no [`regras-de-negocio.md`](regras-de-negocio.md), e as tarefas das semanas 2 a 4 estão em [`tarefas-semanas-2-a-4.md`](tarefas-semanas-2-a-4.md).

### Conferência de 17/11/2026

Conferido no GitHub, no código e no `horas-dev` (só leitura):

- **GitHub:** nada novo desde 16/11. Ainda não há branch da B7.1 (Bernardo) nem da J5 (Johannes), as duas com prazo em 17/11. A `atualDev` continua parada em 13/11.
- **Código:** `npm run lint` sem erros (6 avisos `only-export-components`) e `npm run build` OK (aviso de um pedaço de 656 kB, acima do limite de 500 kB do Vite).
- **`horas-dev`:** as 6 migrações da pasta `supabase/migrations/` aparecem como aplicadas; 6 tabelas, todas com RLS (117 registros, auditoria vazia). O e-mail do Guilherme já foi trocado; falta só o `troque.johannes`.
- **Correção da revisão de 16/11:** o conector do Supabase voltou a funcionar (enxerga o `horas-dev` e o `horas-prod`), e o CLI deste computador está logado e ligado ao `horas-dev`.
- **Atenção:** o conector do Supabase tem permissão de escrita nos dois bancos, inclusive no `horas-prod`. Quem impede uma IA de mexer na produção é a regra do `AGENTS.md`, não a permissão do conector.
- **Ferramentas deste computador:** sem GitHub CLI (`gh`), sem Python e sem Docker. Sem o `gh`, a IA não abre nem revisa PRs. Python e Docker não fazem falta hoje.
- **Arquivo solto no repositório:** `Claude outputs/AstroClock-visual-roxo.zip` (34 kB, do commit `11756ac`). Decidir se sai do repositório.

### Revisão da G10 (17/11/2026)

O Guilherme subiu a G10 na branch `feat/Revisão-de-cronômetros-e-correções-do-RH-reais` (commit `30f31d0`, 17/11 às 12:28). Revisada pelo Victor com a IA; **ainda não juntada na `main`**.

- **Bom:** as 6 funções de `rh.ts` (`cronometrosEmRevisao`, `revisarCronometro`, `buscarRegistrosDoMembro`, `criarRegistroDeMembro`, `editarRegistroDeMembro`, `cancelarRegistroDeMembro`) seguem o contrato do `arquitetura.md` e usam as funções do banco da B7. Motivo obrigatório no site e no banco. A versão falsa foi para `rh-falso.ts` (com `VITE_LOGIN_FALSO=true`), no mesmo padrão da G6. Correção que passa da meia-noite usa o `partesPorDia` e desfaz as partes criadas se uma falhar. `erroDoBanco` diz "deste membro" quando é o RH. Lint e build OK; as assinaturas das 4 funções batem com o `horas-dev`; sem conflito com a `main`.
- **Trava o teste:** a tela do membro no RH (`DetalheMembro.tsx`) e a revisão de cronômetros pegam os membros da lista falsa (`membros.ts`, ids `m1`, `m2`...). Com login real, o id falso vai para o banco, que recusa: o RH veria "Não foi possível salvar. Tente de novo." ao abrir um membro, e a revisão fica sem os nomes. **A G10 só pode ser testada por inteiro depois da J5** (membros reais, do Johannes).
- **Correções pedidas ao Guilherme:**
  1. Gerar de novo o `tipos-banco.ts` com `npx supabase gen types typescript --linked > src/compartilhado/tipos-banco.ts`. Foi editado à mão e ainda tem a `dispensas` (já apagada) e não tem a `auditoria`.
  2. Branch sem acento e em minúsculas (ex.: `feat/g10-revisao-e-correcoes-rh`), commit no formato `feat: ...` (o atual é "atualizacion") e PR para a `main`.
  3. `editarRegistroDeMembro`: se o registro era um cronômetro ainda ligado e uma parte falha, o desfazer não volta ele para "ligado". Avisar no erro ou bloquear a edição de cronômetro ligado pelo RH (o Guilherme escolhe e conta ao Victor).
- **Perfil do Guilherme no `horas-dev`:** trocado de `membro` para `rh` em 17/11, a pedido do Victor, para ele testar a G10 (o banco só deixa o RH revisar e corrigir). **Voltar para `membro` antes do teste da G11.** O Victor também está como `rh` no `horas-dev` (o seed dizia `diretor_rh`).
- **No `horas-dev`:** 1 registro esperando revisão e `auditoria` vazia; ninguém testou essas funções no banco ainda.

### Revisão de 16/11/2026 (início da semana 3)

Conferido no GitHub, no Notion, no código e no `horas-dev` (só leitura):

- **Guilherme:** G5 e G6 na `main` e testadas. A branch `atualDev` (13/11) tem uma tela de Configurações (foto de perfil guardada no aparelho e botão para desligar o fundo animado). Está fora do plano, partiu de uma `main` antiga e tem cópias de rascunho (`LayoutPainel-1.tsx`, `PainelMembro-1.tsx`); a decisão do que fazer com ela fica com o Victor e o Guilherme.
- **Johannes:** J4, J5 e J6 vencidas em 15/11, sem branch no GitHub. `membros.ts` e as metas do `rh.ts` não fazem nenhuma chamada ao banco, e nenhuma tela chama o `alterarSetor`.
- **Bernardo:** as 5 correções da B7 não começaram (sem branch).
- **`horas-dev`:** sem login, nenhuma tabela é lida (protegido). `requerimentos` e `presenca_sede` ainda não existem; `dispensas` já saiu. O conector do Supabase pede nova autorização e o CLI deste computador está desligado do projeto, então o histórico de migrações não foi conferido.
- **Replanejamento:** a semana 3 ficou só com o P0 (cálculo semanal, cronômetro que para sozinho, revisão e correções do RH, membros e metas reais). O requerimento inteiro (B8, G7, G8, J6, J7) passou para a semana 4. A J8 passou do Johannes para o Guilherme, como G10, e o Guilherme ganhou a G11 (painel do membro com o cálculo real). Tarefas novas no Notion: B7.1, B9, B10, G10 e G11; J4, J5 e J6 marcadas como atrasadas, com prazo novo.

### Feito em 13 e 14/11/2026

- **G5 e G6 do Guilherme na `main`** (commit `8b80bf4`, juntado em 14/11): `registros.ts` e `cronometro.ts` reais, com as versões falsas em `registros-falso.ts` e `cronometro-falso.ts` (ligadas por `VITE_LOGIN_FALSO=true`). Novo `banco.ts` com o que as funções reais compartilham: tradução dos erros do banco para português e `meuId()`. Registro que passa da meia-noite vira um por dia (`partesPorDia` em `datas.ts`), com as marcas "Continua no dia seguinte" e "Continuação do dia anterior" na lista. Testado pelo Victor no `horas-dev`.
- **Data e fluidez** (branch `feat/form-data-e-fundo-leve`, juntada em 14/11, pedido do Victor depois de testar a G6):
  - Formulário de registro: botões Hoje, Ontem e "Outro dia", que abre um calendário com só os dias permitidos (7 dias para o membro, sem limite para o RH). A duração aparece embaixo dos horários.
  - Fundo animado mais leve: ~30 quadros por segundo, linhas desenhadas em grupo, resolução limitada a 1,5x e pausa enquanto uma janela está aberta.
  - Janelas (gaveta, diálogo, confirmação) sem desfoque atrás: o desfoque era refeito a cada quadro por cima do fundo animado e travava a abertura. No lugar, uma camada escura um pouco mais forte.
  - `meuId()` guardado durante a sessão, sem uma consulta extra a cada busca.
- As branches de 14/11 entraram na `main` direto pelo Git, a pedido do Victor (sem a tela de PR, porque o GitHub CLI não está instalado neste computador).
- **Limpeza:** apagadas 9 branches já juntadas na `main`. Sobrou só a `atualDev`, do Guilherme, que tem commits fora da `main`.
- **Responsividade** (branch `ui/responsividade`, juntada em 14/11): revisão automática em 44 combinações de tela (360, 390, celular deitado e 1024 px) nos perfis membro, diretor do RH e diretor de setor, mais conferência visual tela por tela.
  - Login no celular: o logo alargava o cartão e empurrava tudo para a direita, cortando o botão do Google. Agora fica centralizado.
  - Painel do RH, diretores e presidência: abaixo de 1024 px, barra embaixo com Visão geral, Membros e Requerimentos (o diretor de setor fica com Ranking) e um botão "Mais" com o resto, no lugar do menu ☰ (decisão do Victor). A barra é a mesma do membro (`BarraInferior.tsx`), com fundo opaco.
  - Tabela de membros sem a coluna Status cortada; cartões com selo usando a largura toda quando estreitos; gráfico das 8 semanas, revisão de cronômetros e ranking cabendo no celular.
- **Notion:** B6, B7, G5 e G6 marcadas como concluídas. O trabalho de 14/11 entrou como V8 (calendário e fluidez) e V9 (responsividade), já concluídas.

### Feito em 11 e 12/11/2026

- **E-mail pelo Gmail da EJ, sem Resend** (PR #4, 11/11): V5 e G8 reescritas em [`tarefas-semanas-2-a-4.md`](tarefas-semanas-2-a-4.md).
- **`horas-prod` recriado em São Paulo** (PR #5, 11/11, juntado em 12/11): ref `gzjmavrrkqfqtqjycdnq`, ainda vazio. Ver a seção "Ambientes".
- **Bernardo subiu B6 e B7** (commit `6d90a69`, 12/11 às 17:55): 6 arquivos em `supabase/migrations/`, `supabase/seed.sql` e `supabase/testes/teste.sql`. A B7 (`20261112170000_regras_de_registros.sql`) cria as regras de `registros`, a tabela `auditoria`, `meu_setor_id()`, libera o insert em `metas` e `setores` e apaga `dispensas`.
  - **Atenção:** o commit foi direto na `main` por engano: no "Add files via upload" do GitHub, o destino padrão é a `main`, e a branch `db/migracoes` (criada por ele, ainda vazia) não foi escolhida. O [`CONTRIBUTING.md`](../CONTRIBUTING.md) proíbe commit direto na `main` e pede aprovação do Victor para tudo que mexe em `supabase/migrations/` ou RLS.
  - Depois do commit, ele rodou a B7 à mão (SQL Editor) no `horas-dev`.
- **Revisão da B6 e da B7 pelo Victor** (12/11): estrutura boa, prazos de 7 dias e regras do cronômetro batendo com o `regras-de-negocio.md`. Decisões novas de regra, já passadas para o `regras-de-negocio.md`: o `presidente` revisa cronômetro e lê a auditoria; o `diretor_setor` não revisa; o fim do cronômetro é sempre a hora em que a pessoa clica em parar; o registro manual não termina no futuro.
- **Correções pedidas ao Bernardo** (migração nova na `db/migracoes`, com PR):
  1. `revisar_cronometro`: liberar também para o `presidente` (hoje só `rh` e `diretor_rh`).
  2. Parar o cronômetro pelo site: o banco grava `fim = now()`, ignorando o horário mandado.
  3. Registro manual: o fim não pode ser no futuro (no lançamento e na edição pelo site).
  4. `setores`: voltar o grant de insert e update só para `nome` e `ativo`.
  5. Atualizar a `supabase/testes/teste.sql` com esses casos.
  - A auditoria lida pelo `presidente` fica como está (já é o que a B7 faz).

### Feito em 10/11/2026 (Claude Code com o Victor)

- Conexões conferidas: Supabase (`horas-dev` e `horas-prod`), Notion (Central Ejuvv) e Vercel (time ejuvv, projeto `astro-clock`, com acesso liberado ao time).
- **Login real (B4)**, branch `feat/login-google`: `auth.ts` real, login falso movido para `auth-falso.ts` e ligado só com `VITE_LOGIN_FALSO=true`. A tela de login destrava o botão "Entrando..." quando a pessoa volta do Google pelo botão "voltar" do navegador.
- Provedor Google ligado no `horas-dev` (M5) e e-mail provisório `troque.victor@ejuvv.com` trocado pelo do Victor no seed do banco.
- Variável `VITE_LOGIN_FALSO=true` criada na Vercel (preview e production), para o site de protótipo continuar com a troca de perfil depois do merge.
- Tarefas das semanas 2 a 4 escritas em [`tarefas-semanas-2-a-4.md`](tarefas-semanas-2-a-4.md). A semana 2 já estava no Notion; as semanas 3 e 4 ainda serão ajustadas pelo Victor antes de ir para o Notion.

### Como está o `horas-dev` (conferido em 12/11/2026, depois da B7)

- Tabelas: `membros`, `setores`, `metas`, `registros`, `historico_setor` e `auditoria` (a `dispensas` saiu). Todas com RLS; `registros` com leitura por perfil e escrita só nos próprios. Seed com 20 membros (5 perfis) e 115 registros.
- Funções do RH para corrigir registros e revisar cronômetros já existem (ver `arquitetura.md`, seção 5).
- **Histórico de migrações em dia** (13/11/2026): o Victor rodou o `migration repair` no `horas-dev`, e as 6 migrações aparecem como aplicadas no `npx supabase migration list`. A próxima migração já pode ir pelo `npx supabase db push`.
- **CLI:** use `--linked` nos comandos `migration list`, `migration repair` e `db push`. O CLI avisa que, na próxima versão grande (v3), esses comandos passam a mirar o banco local se o `--linked` não for passado. Este computador está na v2.122.0, ligado ao `horas-dev`. A v3.2.0 já saiu (aviso de 17/11); a recomendação é ficar na v2 até o fim da semana 3 e, ao atualizar, sempre passar o `--linked`.

### Próximos passos

Semana 3 (16 a 19/11; 20/11 é feriado). Reunião de decisão em 18/11. Detalhes no [`tarefas-semanas-2-a-4.md`](tarefas-semanas-2-a-4.md).

1. **Bernardo:** B7.1 (as 5 correções acima, numa migração nova na `db/migracoes`, recriada a partir da `main` atualizada) até 17/11; B9 (cálculo semanal, primeiro sem os requerimentos) até 18/11; B10 (cronômetro que para sozinho após 10h) até 19/11. Combinado: migração só pelo CLI e por PR, e só aplica no dev depois de aprovada.
2. **Johannes:** J5 (membros e metas reais) até 17/11; J4 (mudar setor) até 18/11; J6 só se der tempo.
3. **Guilherme** (combinado em 17/11, ver "Revisão da G10"):
   - Hoje: as 3 correções da G10 e abrir o PR.
   - Testar a revisão de cronômetros no `horas-dev` com o perfil `rh` (sair e entrar de novo no site). O resto da G10 só depois da J5.
   - G11 (`progresso.ts` real) até 19/11: combinar já com o Bernardo o nome e o formato da função da B9, para a G11 ser só a troca quando a B9 sair.
   - G8: só se o Victor fizer a V5 (adiantar parte da semana 4, mandando só para o próprio e-mail). Senão, fica para a semana 4.
   - `atualDev`: decidir com o Victor na reunião de 18/11. Se aprovada, refazer a partir da `main` atual, sem as cópias `-1`, depois do P0.
4. **Victor:** reunião de 18/11. Se a B9 e a G10 não estiverem de pé, a semana 4 vira semana de completar o P0 e o requerimento vai para dezembro. Levar o risco da J5: ela trava a G10, e o Johannes está atrasado desde a semana 2.

### Tarefas do Victor fora da IA

- **E-mail do Johannes no `horas-dev`:** trocar `troque.johannes@ejuvv.com` (tabela `membros`) pelo `@ejuvv.com` real. Sem isso, ele passa pelo Google, mas o site responde "Acesso negado. Procure o RH." O do Guilherme já foi trocado (conferido em 17/11).
- **Mandar ao Guilherme a revisão da G10** (as 3 correções, o teste com perfil `rh` e o que adiantar). Mensagem pronta escrita pela IA em 17/11.
- **Decidir a G8 antecipada:** se quiser que o Guilherme comece a G8 nesta semana, fazer a V5 agora e passar a senha de app a ele só por canal privado.
- **Perfil do Guilherme:** pedir para voltar para `membro` no `horas-dev` quando ele for testar a G11.
- **GitHub CLI:** instalar neste computador (`winget install --id GitHub.cli`, depois `gh auth login`), para a IA conseguir abrir e revisar os PRs que o `CONTRIBUTING.md` pede.
- **V6:** validação com o RH até 19/11 e reunião de decisão em 18/11.
- **Regra a decidir com o Bernardo:** no cronômetro que passa da meia-noite, a parte do dia seguinte é salva como lançamento manual e pode escapar do corte de 10h e da revisão do RH.
- **Resend:** revogar a chave criada antes da decisão de usar o Gmail da EJ.
- **Google Cloud:** antes de ligar o login na produção (semana 4), trocar o URI de redirecionamento do prod antigo (`zetjgqdagnlkodbexnoe`, apagado) pelo novo: `https://gzjmavrrkqfqtqjycdnq.supabase.co/auth/v1/callback`.
- **V5:** criar a conta `@ejuvv.com` que envia os e-mails e a senha de app (semana 3). Decidido em 11/11/2026: e-mail pelo Gmail da EJ, sem Resend.
- **Domínio:** o `ejuvv.com` continua ativo até 21/02/2027 (registro pela Tucows), mas o DNS ainda está na HostGator. Descobrir com o Rodrigo quem tem acesso e quem renova, porque o e-mail da EJ inteira depende disso.
- **Hospedagem:** decidido em 10/11/2026 que a produção fica na **Vercel** (a Hostinger fica como possibilidade para depois).
- **Segredos:** o Victor optou por guardar o ID do cliente e a chave secreta do Google num bloco de notas no computador (a IA recomendou um gerenciador de senhas).

## Já feito (Claude Code)

As 4 etapas do [`fase-0.md`](fase-0.md) estão prontas e commitadas na `main`:

| Commit | O quê |
| --- | --- |
| `d897fd8` | Etapa 1: projeto Vite + React + TS, Tailwind, rotas, pastas, Supabase CLI |
| `24acac1` | `fase-0.md` atualizado e `.claude/settings.local.json` ignorado |
| `edc7e9f` | Etapa 2: tipos, funções de dados falsas, dados falsos, login ligado |
| `498ed25` | Decisões do Victor (meta na semana seguinte, prazos de 7 dias) e 3 funções do RH |
| `c292dc8` | Etapa 3: seção Skills no `AGENTS.md`, modelos de issue e PR, 22 skills |
| `2581494` | `.gitattributes` (quebras de linha LF) |
| `41f7fbf` | Etapa 4: CI e backup diário |
| `f9008e4` | Correção do README (`cd AstroClock`) |

Teste de clone limpo seguindo o README: 9 de 9 verificações OK no navegador, 0 erros no console. `npm run lint` e `npm run build` sem erros.

### Desvios do `fase-0.md` (e por quê)

- Lint com **oxlint** em vez de ESLint (o Vite 8 já vem assim; o comando continua `npm run lint`).
- `"strict": true` no `tsconfig.app.json` (o `AGENTS.md` exige TypeScript estrito).
- `index.html` com `lang="pt-BR"` e título "AstroClock".
- `src/index.css` tem `@source not "../.claude"` e `.oxlintrc.json` ignora `.claude/`: sem isso, os exemplos das skills entravam no CSS e no lint.
- `.gitignore` com `.superpowers/` e `/*.sql` a mais.
- 3 funções novas no contrato (`buscarRegistrosDoMembro`, `editarRegistroDeMembro`, `cancelarRegistroDeMembro`), já em `arquitetura.md`.
- As 5 skills do projeto (`nova-migracao`, `funcao-de-dados`, `regras-de-calculo`, `nova-tela`, `revisar-pr`) não existem no repositório; no lugar entraram 22 skills de terceiros escolhidas pelo Victor.

## Parte M (Victor)

| # | Tarefa | Situação |
| --- | --- | --- |
| M1 | Repositório no GitHub | Feito (`EJUVV/AstroClock`, privado) |
| M2 | `horas-dev` e `horas-prod` no Supabase | Feito (27/10). Ver "Ambientes" |
| M3 | `.env.local` com URL e chave pública do `horas-dev` | Feito (27/10) |
| M4 | Projeto e Client ID OAuth no Google Cloud (tipo Interno) | Feito (27/10). Ver "Ambientes" |
| M5 | Provedor Google no Supabase dev | Feito (10/11), login testado com a conta do Victor. Ver "Login com Google (M5)" |
| M6 | `git push` e CI passando no GitHub | Feito (27/10): CI verde |
| M7 | Segredo `SUPABASE_PROD_DB_URL` e backup rodado uma vez | Feito (27/10): backup verde, artefato gerado |
| M8 | Proteção da `main` | Decidido (27/10): sem proteção. Ver "Decisões tomadas" |
| M9 | Tarefas da semana 1 | Feito (27/10): em vez do GitHub Projects, as tarefas ficam em [`tarefas-semana-1.md`](tarefas-semana-1.md) e no Notion. Falta passar para o Notion e enviar à equipe |
| M10 | Convites, grupo do WhatsApp, guias, kickoff | A fazer |
| M11 | Checklist final | A fazer |

## Ambientes

Nada desta seção é segredo. Senhas, chaves secretas e connection strings ficam só no gerenciador de senhas da EJUVV (peça ao Victor).

### Supabase

Os dois projetos estão na conta `@ejuvv.com` da diretoria de projetos, plano gratuito, **na mesma organização** (decisão de 10/11/2026). Regiões: `horas-dev` no leste dos EUA (`us-east-1`) e `horas-prod` em **São Paulo** (`sa-east-1`). O `horas-prod` foi recriado em São Paulo em 11/11/2026, ainda vazio, para ficar perto dos membros; o antigo (`zetjgqdagnlkodbexnoe`, oeste dos EUA) foi apagado.

| | Dev | Prod |
| --- | --- | --- |
| Organização | EJUVV Dev | EJUVV Dev (a mesma) |
| Projeto | `horas-dev` | `horas-prod` |
| Ref | `cwvnzzqpqohvqjzigalu` | `gzjmavrrkqfqtqjycdnq` |
| URL da API | `https://cwvnzzqpqohvqjzigalu.supabase.co` | `https://gzjmavrrkqfqtqjycdnq.supabase.co` |
| Painel | [abrir](https://supabase.com/dashboard/project/cwvnzzqpqohvqjzigalu) | [abrir](https://supabase.com/dashboard/project/gzjmavrrkqfqtqjycdnq) |
| Bernardo | Convidar na M10 | Sem acesso |

Opções usadas ao criar os dois: GitHub **não conectado**, Data API **ligada**, "Automatically expose new tables" **desligado**, RLS automático **ligado**.

Para o Bernardo (semana 1):

- Ligar o CLI ao dev: `npx supabase link --project-ref cwvnzzqpqohvqjzigalu` (pede a senha do banco do dev).
- Aplicar migrações: `npx supabase db push` (sempre no dev primeiro).
- Como "expose new tables" está desligado, cada migração precisa de `grant` nas tabelas que o site usa; senão o site recebe "permission denied".
- O `.env.local` usa a chave **publishable** do dev (`sb_publishable_...`). Nunca usar a chave `secret`/`service_role` no front.

### Google Cloud

- Projeto `astroclock-512918` (nome AstroClock), na organização ejuvv.com, conta `victor.gomes@ejuvv.com`.
- Tela de consentimento (Google Auth Platform): app "AstroClock", público **Interno** (só contas `@ejuvv.com` entram).
- Cliente OAuth "AstroClock Supabase" (Aplicativo da Web), com os URIs de redirecionamento:
  - `https://cwvnzzqpqohvqjzigalu.supabase.co/auth/v1/callback`
  - `https://gzjmavrrkqfqtqjycdnq.supabase.co/auth/v1/callback` (prod em São Paulo; trocar no Google Cloud antes de ligar o login na produção)
- O ID do cliente e a chave secreta estão no gerenciador de senhas.

### Login com Google (M5)

No `horas-dev` (o prod fica para antes do piloto):

1. Authentication → Sign In / Providers → Google: ligar e colar o ID do cliente e a chave secreta.
2. Authentication → URL Configuration: Site URL `http://localhost:5173`; Redirect URLs `http://localhost:5173/inicio` e `https://*-ejuvv.vercel.app/inicio` (prévias da Vercel).
3. Clicar em **Save** em cada tela. Para conferir: `<VITE_SUPABASE_URL>/auth/v1/settings` (com a chave pública no cabeçalho `apikey`) mostra `"google": true`.

Feito no `horas-dev` em 10/11/2026. Erros que apareceram no caminho:

- `Unsupported provider: provider is not enabled`: o Google ainda não estava ligado (ou faltou o Save).
- "Acesso negado. Procure o RH." logo depois de escolher a conta: o login funcionou, mas o e-mail não está em `membros` (ou está com `ativo = false`).

No `horas-prod` (semana 4, V7), repetir com a URL do site de produção no lugar do `localhost`.

### GitHub

- CI (`ci.yml`): lint e build em todo PR e push na `main`.
- Backup (`backup.yml`): todo dia às 3h (Brasília), exporta o `horas-prod` e guarda como artefato por 30 dias. Usa o segredo `SUPABASE_PROD_DB_URL` (Session pooler).

## Decisões tomadas

- **M8 (27/10/2026):** a organização está no plano Free e o repositório é privado, então o GitHub não aplica proteção na `main`. Decisão: manter privado e sem proteção técnica. Vale a regra do `CONTRIBUTING.md` (nada direto na `main`, sempre PR com revisão) e só aprovar PR com o CI verde. Reavaliar se a EJUVV obtiver o plano Team (por exemplo, pelo GitHub for Nonprofits).

- **M9 (27/10/2026):** as tarefas não usam issues nem GitHub Projects; ficam documentadas em [`tarefas-semana-1.md`](tarefas-semana-1.md) e no Notion. O modelo de PR (`Fecha #`) e o modelo de issue continuam como estão por enquanto. O `CONTRIBUTING.md` já foi ajustado para tarefas no Notion.

- **Diretora de RH (27/10/2026):** respostas registradas no [`regras-de-negocio.md`](regras-de-negocio.md). O que ainda falta perguntar está em [`pauta-diretora-rh.md`](pauta-diretora-rh.md). Escopo do piloto decidido pelo Victor (seção 14 das regras). Requerimento de ausência e presença na sede mudam o esboço do banco (`dispensas`) no `arquitetura.md`: rever na B1, com o Bernardo.

- **Equipe (28/10/2026):** Raíssa saiu do projeto por motivos externos. Johannes assume as mesmas frentes (identidade visual, base visual em `src/compartilhado/ui/`, protótipo com o Guilherme e painel do RH), sem mudança no plano. Convite e guia individual (M10) vão para Johannes.

## Lembretes

- Reforçar no kickoff que a `main` não tem bloqueio: a regra de PR depende da equipe.
- Antes do piloto: baixar um backup e restaurar no `horas-dev`, com o Bernardo.
- Quem tem acesso ao repositório consegue baixar os backups na aba Actions. Quando houver dados reais, considerar isso nas permissões da equipe e na LGPD.
- `.env.local` não vai para o Git: em cada máquina nova, criar de novo a partir do `.env.example`.

## Decisões em aberto

1. ~~Registro que passa da meia-noite: qual dos dois registros `criarRegistro()` / `pararCronometro()` devolvem no sistema real.~~ Resolvido na G6 (14/11): as duas devolvem a primeira parte. No cronômetro, as partes depois da meia-noite entram como origem "manual", porque o banco só aceita registro novo de origem "cronometro" ligado e sem fim.
2. Férias durante o piloto: decidido em 28/10 (o RH muda a meta na mão). Falta a diretora concordar e informar as datas.
3. Prazo ("Vira real") das 3 funções novas do RH em `arquitetura.md`.
4. shadcn/ui na stack: decidir junto com Johannes.
5. As 5 skills do projeto: achar no pacote original ou escrever a partir dos docs.
6. Pendentes de `regras-de-negocio.md`: ver [`pauta-diretora-rh.md`](pauta-diretora-rh.md).
