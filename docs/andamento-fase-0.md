# Andamento da Fase 0

Retrato de onde a Fase 0 parou (atualizado em 26/10/2026). Ao retomar com uma IA, peça para ela ler este arquivo e o [`fase-0.md`](fase-0.md). Quando a Fase 0 terminar, este arquivo pode ser apagado.

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

## Falta fazer (Victor, Parte M do `fase-0.md`)

| # | Tarefa | Situação |
| --- | --- | --- |
| M1 | Repositório no GitHub | Feito (`EJUVV/AstroClock`) |
| M6 | `git push` dos commits e conferir o CI na aba Actions | A fazer. Se aparecer aviso de versão das actions, avisar a IA |
| M2 | `horas-dev` (org "EJUVV Dev") e `horas-prod` (org "EJUVV Prod") no Supabase | **Em andamento** (ver opções abaixo) |
| M3 | `.env.local` com URL e chave pública do `horas-dev` | Depois da M2 |
| M4 | Projeto e Client ID OAuth no Google Cloud (tipo Interno) | A fazer |
| M5 | Provedor Google no Supabase dev | Pode ficar para a semana 1, com o Bernardo |
| M7 | Segredo `SUPABASE_PROD_DB_URL` no GitHub e rodar o backup uma vez | A fazer. Até lá o backup falha todo dia e o GitHub manda e-mail (esperado) |
| M8 | Proteção da `main` (ou decisão registrada de não proteger) | A fazer |
| M9 | GitHub Projects com as issues da semana 1 | A fazer (a IA pode gerar os textos) |
| M10 | Convites, grupo do WhatsApp, guias, kickoff | A fazer |
| M11 | Checklist final | A fazer |

### Opções escolhidas ao criar os projetos no Supabase (M2)

Usar as **mesmas opções** no dev e no prod:

- Uma conta só (`@ejuvv.com`), duas organizações.
- GitHub: **não conectar** (migrações são aplicadas pelo Bernardo com `npx supabase db push`).
- Nome: `horas-dev` / `horas-prod`.
- Senha: gerada pelo Supabase, guardada no gerenciador de senhas (uma diferente para cada).
- Região: **South America (São Paulo)**, em "Need a specific region?".
- Enable Data API: **ligado**.
- Automatically expose new tables: **desligado**.
- Enable automatic RLS: **ligado**.
- Depois de criar, conferir que os dois projetos gratuitos aparecem como ativos.

## Lembretes

- **Avisar o Bernardo (semana 1):** como "expose new tables" está desligado, cada migração precisa de `grant` para as tabelas que o site usa; senão o site recebe "permission denied".
- `.env.local` não vai para o Git: em cada máquina nova, criar de novo a partir do `.env.example`.
- Nunca usar a chave `service_role` no front.

## Decisões em aberto

1. Registro que passa da meia-noite: qual dos dois registros `criarRegistro()` / `pararCronometro()` devolvem no sistema real (com o Bernardo, antes da semana 2).
2. Limite de 7 dias para lançar horas: confirmar com a diretoria.
3. Prazo ("Vira real") das 3 funções novas do RH em `arquitetura.md`.
4. shadcn/ui na stack: decidir com a Raíssa.
5. As 5 skills do projeto: achar no pacote original ou escrever a partir dos docs.
6. Pendentes de `regras-de-negocio.md`: férias, quem cadastra membros, se o RH cumpre meta, LGPD, arquivamento.
