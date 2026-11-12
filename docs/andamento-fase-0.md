# Andamento da Fase 0

Retrato de onde a Fase 0 parou (atualizado em 10/11/2026). Ao retomar com uma IA, peça para ela ler este arquivo e o [`fase-0.md`](fase-0.md). Quando a Fase 0 terminar, este arquivo pode ser apagado (antes, passe a seção "Ambientes" para o `arquitetura.md` ou o `README.md`).

## Próxima sessão: comece por aqui

Onde paramos (10/11/2026, semana 2): **o login com Google funciona de verdade no `horas-dev`.** O Victor entrou com a própria conta e caiu no painel do RH como `diretor_rh`. As regras estão fechadas no [`regras-de-negocio.md`](regras-de-negocio.md) (a diretora de RH já alinhou tudo), e as tarefas das semanas 2 a 4 estão em [`tarefas-semanas-2-a-4.md`](tarefas-semanas-2-a-4.md).

### Feito em 10/11/2026 (Claude Code com o Victor)

- Conexões conferidas: Supabase (`horas-dev` e `horas-prod`), Notion (Central Ejuvv) e Vercel (time ejuvv, projeto `astro-clock`, com acesso liberado ao time).
- **Login real (B4)**, branch `feat/login-google`: `auth.ts` real, login falso movido para `auth-falso.ts` e ligado só com `VITE_LOGIN_FALSO=true`. A tela de login destrava o botão "Entrando..." quando a pessoa volta do Google pelo botão "voltar" do navegador.
- Provedor Google ligado no `horas-dev` (M5) e e-mail provisório `troque.victor@ejuvv.com` trocado pelo do Victor no seed do banco.
- Variável `VITE_LOGIN_FALSO=true` criada na Vercel (preview e production), para o site de protótipo continuar com a troca de perfil depois do merge.
- Tarefas das semanas 2 a 4 escritas em [`tarefas-semanas-2-a-4.md`](tarefas-semanas-2-a-4.md). A semana 2 já estava no Notion; as semanas 3 e 4 ainda serão ajustadas pelo Victor antes de ir para o Notion.

### Como está o `horas-dev` (10/11/2026)

- Já existem `membros`, `setores`, `metas`, `registros`, `historico_setor` e `dispensas`, com RLS e as funções `meu_id`, `meu_perfil`, `meus_dados`, `eh_rh`, etc. Seed com 20 membros (5 perfis) e 115 registros.
- **Tudo foi criado pelo painel, sem migração:** `supabase/migrations/` está vazia. É a B6 do Bernardo.
- `registros` ainda não tem regras de acesso, `metas` não aceita insert e `dispensas` precisa sair: é a B7 do Bernardo.

### Próximos passos

O login real já está na `main` (PR #3, juntado em 10/11/2026).

1. Bernardo: B6 e B7 até 11/11. Sem elas, as telas continuam com dados falsos.
2. Depois da B7: Guilherme e Johannes trocam as funções falsas pelas reais (G6 e J5).
3. Victor decide o que adianta das semanas 3 e 4; depois disso, as tarefas vão para o Notion.

### Tarefas do Victor fora da IA

- **V4:** convidar Guilherme e Johannes para a organização "EJUVV Dev" no Supabase (até 11/11).
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

1. Registro que passa da meia-noite: qual dos dois registros `criarRegistro()` / `pararCronometro()` devolvem no sistema real (com o Bernardo, antes da semana 2).
2. Férias durante o piloto: decidido em 28/10 (o RH muda a meta na mão). Falta a diretora concordar e informar as datas.
3. Prazo ("Vira real") das 3 funções novas do RH em `arquitetura.md`.
4. shadcn/ui na stack: decidir junto com Johannes.
5. As 5 skills do projeto: achar no pacote original ou escrever a partir dos docs.
6. Pendentes de `regras-de-negocio.md`: ver [`pauta-diretora-rh.md`](pauta-diretora-rh.md).
