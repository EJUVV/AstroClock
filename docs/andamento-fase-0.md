# Andamento da Fase 0

Retrato de onde a Fase 0 parou (atualizado em 01/11/2026). Ao retomar com uma IA, peça para ela ler este arquivo e o [`fase-0.md`](fase-0.md). Quando a Fase 0 terminar, este arquivo pode ser apagado (antes, passe a seção "Ambientes" para o `arquitetura.md` ou o `README.md`).

## Próxima sessão: comece por aqui

Onde paramos (01/11/2026): o kickoff foi feito na reunião presencial de 30/10. As respostas do Victor estão no [`regras-de-negocio.md`](regras-de-negocio.md), o contrato está fechado no [`arquitetura.md`](arquitetura.md) e as funções falsas novas estão no código. O que sobrou para a Maria, diretora de RH, está no [`pauta-diretora-rh.md`](pauta-diretora-rh.md).

### Próximos passos com a IA (depois da conversa com a diretora)

1. Passar as respostas da diretora para o `regras-de-negocio.md` e ajustar o que mudar em `requerimentos` e `presenca_sede`.
2. Escrever as tarefas detalhadas das semanas 2, 3 e 4 no formato do [`tarefas-semana-1.md`](tarefas-semana-1.md).

### Tarefas do Victor fora da IA

- **M10:** convites no GitHub (write) e no Supabase (só o Bernardo, só "EJUVV Dev"), grupo do WhatsApp (equipe, Rodrigo e Maria), tarefas no Notion e envio dos documentos. A primeira reunião de quarta é em 04/11.
- **M11:** checklist final, assim que chamar a equipe para o grupo.
- **Diretora de RH:** repassar o [`pauta-diretora-rh.md`](pauta-diretora-rh.md). Urgentes para o piloto: perguntas 1 a 9.
- **Rodrigo:** plano da Vercel, Hostinger e quem mexe no domínio `ejuvv.com`.
- **Provedor Google no `horas-dev`:** o ID e a chave estão no notebook da EJUVV, acessível a partir de terça (03/11).
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
| M5 | Provedor Google no Supabase dev | Semana 1, com o Bernardo. Ver "Login com Google (M5)" |
| M6 | `git push` e CI passando no GitHub | Feito (27/10): CI verde |
| M7 | Segredo `SUPABASE_PROD_DB_URL` e backup rodado uma vez | Feito (27/10): backup verde, artefato gerado |
| M8 | Proteção da `main` | Decidido (27/10): sem proteção. Ver "Decisões tomadas" |
| M9 | Tarefas da semana 1 | Feito (27/10): em vez do GitHub Projects, as tarefas ficam em [`tarefas-semana-1.md`](tarefas-semana-1.md) e no Notion. Falta passar para o Notion e enviar à equipe |
| M10 | Convites, grupo do WhatsApp, guias, kickoff | A fazer |
| M11 | Checklist final | A fazer |

## Ambientes

Nada desta seção é segredo. Senhas, chaves secretas e connection strings ficam só no gerenciador de senhas da EJUVV (peça ao Victor).

### Supabase

Os dois projetos estão na conta `@ejuvv.com` da diretoria de projetos, plano gratuito, região **South America (São Paulo)**.

| | Dev | Prod |
| --- | --- | --- |
| Organização | EJUVV Dev | EJUVV Prod |
| Projeto | `horas-dev` | `horas-prod` |
| Ref | `cwvnzzqpqohvqjzigalu` | `zetjgqdagnlkodbexnoe` |
| URL da API | `https://cwvnzzqpqohvqjzigalu.supabase.co` | `https://zetjgqdagnlkodbexnoe.supabase.co` |
| Painel | [abrir](https://supabase.com/dashboard/project/cwvnzzqpqohvqjzigalu) | [abrir](https://supabase.com/dashboard/project/zetjgqdagnlkodbexnoe) |
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
  - `https://zetjgqdagnlkodbexnoe.supabase.co/auth/v1/callback`
- O ID do cliente e a chave secreta estão no gerenciador de senhas.

### Login com Google (M5)

No `horas-dev` (o prod fica para antes do piloto):

1. Authentication → Sign In / Providers → Google: ligar e colar o ID do cliente e a chave secreta.
2. Authentication → URL Configuration: Site URL `http://localhost:5173`; Redirect URLs `http://localhost:5173/inicio`.

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
