# Fase 0 — Tudo o que precisa estar pronto antes do kickoff

Período: **26/10 a 01/11/2026**. Responsável: **Victor**, com ajuda do Claude Code na parte de código.

Este documento é o checklist completo da Fase 0. Cada item tem um dono:

- **[Claude Code]** — feito pelo assistente, nas Etapas 1 a 4 abaixo, uma por vez, com aprovação do Victor entre elas.
- **[Victor]** — exige login nas contas da EJUVV (GitHub, Supabase, Google Cloud) ou contato com pessoas; feito manualmente, seguindo a Parte M no fim deste documento.

Leia antes: [`AGENTS.md`](../AGENTS.md), [`regras-de-negocio.md`](regras-de-negocio.md) e [`arquitetura.md`](arquitetura.md).

## Checklist geral

| # | Item | Dono | Onde |
| --- | --- | --- | --- |
| 1 | Repositório `astroclock` criado (privado) na organização da EJUVV e clonado | Victor | M1 |
| 2 | Projeto Vite + React + TS + Tailwind + React Router + Supabase CLI, pastas e rotas | Claude Code | Etapa 1 |
| 3 | Dois projetos no Supabase (`horas-dev` e `horas-prod`) em organizações separadas | Victor | M2 |
| 4 | `.env.local` preenchido com os valores do `horas-dev` | Victor | M3 |
| 5 | Cliente do Supabase, `.env.example`, tipos e todas as funções de dados falsas | Claude Code | Etapa 2 |
| 6 | Projeto e Client ID OAuth no Google Cloud (tipo Interno) | Victor | M4 |
| 7 | Provedor Google ativado no Supabase dev | Victor (pode ser no dia 4–5 da semana 1, com o Bernardo) | M5 |
| 8 | README, CONTRIBUTING, AGENTS, CLAUDE, regras, arquitetura e skills conferidos; modelos de issue e PR | Claude Code | Etapa 3 |
| 9 | Workflows de CI e de backup | Claude Code | Etapa 4 |
| 10 | Push para o GitHub e conferir o CI rodando | Victor | M6 |
| 11 | Segredo `SUPABASE_PROD_DB_URL` cadastrado e backup rodado manualmente uma vez | Victor (pode ficar para a semana 1; obrigatório antes do piloto) | M7 |
| 12 | Proteção da `main` (ou decisão de manter sem bloqueio) | Victor | M8 |
| 13 | Quadro no GitHub Projects com as issues da semana 1 atribuídas | Victor | M9 |
| 14 | Convites: GitHub, Supabase dev (Bernardo), grupo do WhatsApp | Victor | M10 |
| 15 | Guias enviados para a equipe ler antes do kickoff | Victor | M10 |
| 16 | Teste final: clone limpo seguindo só o README | Victor + Claude Code | M11 |
| 17 | Kickoff marcado (dia, horário, local na sede) | Victor | M10 |

**Commits na `main`:** durante a Fase 0, os commits das etapas vão direto na `main`. É a única exceção à regra do `CONTRIBUTING.md`, porque a equipe ainda não entrou e a proteção da branch ainda não foi ativada.

O assistente **não cria** tabelas, migrações, RLS ou seed real (tarefa do Bernardo na semana 1) e **não cria telas** além do mínimo descrito aqui (tarefas de Guilherme e Johannes).

---

## Etapa 1 — Projeto base

**Fazer**

1. Projeto Vite com o template `react-ts` na raiz do repositório.
2. Dependências:
   ```bash
   npm install react-router-dom @supabase/supabase-js
   npm install -D supabase tailwindcss @tailwindcss/vite
   ```
3. Tailwind: plugin `tailwindcss()` em `vite.config.ts` e `src/index.css` contendo só `@import "tailwindcss";`.
4. Remover o conteúdo de demonstração do Vite (logos, contador, `App.css`).
5. Criar a estrutura de pastas, com um `.gitkeep` nas vazias:
   ```text
   src/membro/
   src/rh/
   src/compartilhado/api/
   src/compartilhado/ui/
   ```
6. Rotas em `src/App.tsx` com `react-router-dom`:
   - `/` → `src/membro/TelaLogin.tsx` (só o título "AstroClock" e um botão "Entrar com Google" sem estilo, chamando `entrarComGoogle()` — a função vem na etapa 2; até lá, deixe o botão sem ação)
   - `/inicio` → `src/membro/Inicio.tsx` (só "Carregando...")
   - `/membro` → `src/membro/PainelMembro.tsx` (só o título "Painel do membro")
   - `/rh` → `src/rh/PainelRH.tsx` (só o título "Painel do RH")
   - qualquer outra → redireciona para `/`
7. `npx supabase init` (cria `supabase/config.toml`). Criar `supabase/migrations/.gitkeep` e `supabase/seed.sql` vazio com um comentário explicando que o Bernardo preenche na semana 1.
8. `.gitignore`: garantir `node_modules`, `dist`, `.env`, `.env.local`, `.env.*.local`, `supabase/.temp`, `.planejamento/` e `.claude/settings.local.json`. **Não** ignorar `.claude/skills/` (as skills são do projeto e vão para o Git).

**Pronto quando:** `npm run dev` abre as quatro rotas; `npm run lint` e `npm run build` passam.

**Commit:** `chore: estrutura inicial do projeto`

---

## Etapa 2 — Contrato de dados com funções falsas

**Fazer**

1. `src/compartilhado/supabase.ts`:
   ```ts
   import { createClient } from '@supabase/supabase-js'

   export const supabase = createClient(
     import.meta.env.VITE_SUPABASE_URL ?? 'http://localhost',
     import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'chave-ausente',
   )
   ```
   E tipagem das variáveis em `src/vite-env.d.ts` (`ImportMetaEnv` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`).
2. `.env.example` na raiz:
   ```bash
   # Valores do projeto horas-dev no Supabase (peça ao Victor)
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   ```
3. `src/compartilhado/tipos.ts` exatamente com os tipos da seção 6 de [`arquitetura.md`](arquitetura.md).
4. **Todas** as funções da tabela da seção 6 de `arquitetura.md`, nos arquivos indicados (`auth.ts`, `registros.ts`, `cronometro.ts`, `progresso.ts`, `membros.ts`, `rh.ts`), com:
   - nome, parâmetros e retorno **exatamente** como na tabela;
   - o comentário `// FALSO: trocar pela versão real (ver docs/arquitetura.md)` na primeira linha de cada arquivo;
   - **nenhum** uso do `supabase` (as falsas não precisam dele);
   - um pequeno atraso simulado (~300 ms) para as telas poderem mostrar "Carregando...".
5. Dados falsos em memória num arquivo `src/compartilhado/api/dados-falsos.ts`, compartilhado pelas funções. Devem cobrir os casos difíceis:
   - 8 a 10 membros em setores diferentes, incluindo 1 `rh`, 1 `diretor_rh` e 1 desativado;
   - registros na semana atual para o membro logado falso: um caso com 10h totais mas menos de 5h na sede;
   - um membro que cumpriu as duas metas, um abaixo nas duas, e uma semana dispensada;
   - um registro que passa da meia-noite já dividido em dois;
   - metas atuais 10h e 5h.
6. Comportamentos mínimos das falsas:
   - `entrarComGoogle()` navega para `/inicio` (`window.location.assign('/inicio')`).
   - `sair()` navega para `/`.
   - `meuPerfil()` lê `localStorage.getItem('perfilFalso')` (`'membro'`, `'rh'`, `'diretor_rh'` ou `'nenhum'` → `null`), com padrão `'membro'`. Envolva em try/catch. Isso permite testar os dois painéis sem mudar código.
   - `criarRegistro()` rejeita com `Error('Este horário se sobrepõe a outro registro seu')` se houver sobreposição com outro registro não cancelado do mesmo membro, e com `Error('A descrição é obrigatória')` se a descrição estiver vazia.
   - `iniciarCronometro()` rejeita se já existir cronômetro ativo.
   - Os dados podem sumir ao recarregar a página (é aceitável).
7. Ligar o botão de `TelaLogin` a `entrarComGoogle()` e fazer `Inicio.tsx` chamar `meuPerfil()` e redirecionar: `'membro'` → `/membro`; `'rh'` ou `'diretor_rh'` → `/rh`; `null` → mostrar "Acesso negado. Procure o RH." com um botão "Voltar" que chama `sair()`. Mantenha mínimo e sem estilo: o Guilherme refaz.

**Pronto quando:** clicar em "Entrar com Google" leva ao painel do membro; com `localStorage.perfilFalso = 'rh'` leva ao painel do RH; com `'nenhum'` mostra acesso negado; lint e build passam; `grep -r "supabase" src/membro src/rh` não encontra nada.

**Commit:** `feat: contrato de dados com funções falsas`

---

## Etapa 3 — Documentação e modelos

**Fazer**

1. Conferir que estes arquivos já existem (foram fornecidos): `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, `CLAUDE.md`, `docs/regras-de-negocio.md`, `docs/arquitetura.md`, `docs/fase-0.md` e as skills em `.claude/skills/` (`nova-migracao`, `funcao-de-dados`, `regras-de-calculo`, `nova-tela`, `revisar-pr`). Não reescreva; só corrija caminhos ou comandos que não batam com o que foi gerado nas etapas 1 e 2, e liste as mudanças.
   - Conferir que cada `SKILL.md` começa com o bloco `---` de frontmatter na primeira linha e que as skills aparecem no menu `/` do Claude Code.
2. `.github/ISSUE_TEMPLATE/tarefa.md`:
   ```markdown
   ---
   name: Tarefa
   about: Uma tarefa da sprint
   ---
   ## O que fazer

   ## Como saber que terminou

   ## Depende de
   ```
3. `.github/pull_request_template.md`:
   ```markdown
   ## O que mudou

   ## Como testar

   ## Print ou vídeo

   ## Checklist
   - [ ] Nenhuma tela importa o `supabase`
   - [ ] Revisei o código gerado por IA e sei explicar cada linha
   - [ ] Sem chaves, senhas ou `.env` no commit
   - [ ] Se mexeu no banco: migração nova, RLS ativado e tipos regerados

   Fecha #
   ```

**Commit:** `docs: documentação e modelos de issue e PR`

---

## Etapa 4 — CI e backup

**Fazer**

1. `.github/workflows/ci.yml`:
   ```yaml
   name: CI
   on:
     pull_request:
     push:
       branches: [main]
   jobs:
     verificar:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 22
             cache: npm
         - run: npm ci
         - run: npm run lint
         - run: npm run build
   ```
2. `.github/workflows/backup.yml` — backup diário do banco de **produção**, guardado como artefato por 30 dias. Não roda com sucesso até o Victor cadastrar o segredo `SUPABASE_PROD_DB_URL` (connection string do **Session pooler**):
   ```yaml
   name: Backup diario
   on:
     schedule:
       - cron: '0 6 * * *'   # 3h em Brasilia
     workflow_dispatch:
   jobs:
     backup:
       runs-on: ubuntu-latest
       steps:
         - uses: supabase/setup-cli@v1
           with:
             version: latest
         - name: Exportar banco
           env:
             DB_URL: ${{ secrets.SUPABASE_PROD_DB_URL }}
           run: |
             if [ -z "$DB_URL" ]; then echo "Segredo SUPABASE_PROD_DB_URL ausente"; exit 1; fi
             supabase db dump --db-url "$DB_URL" -f roles.sql --role-only
             supabase db dump --db-url "$DB_URL" -f esquema.sql
             supabase db dump --db-url "$DB_URL" -f dados.sql --use-copy --data-only
         - uses: actions/upload-artifact@v4
           with:
             name: backup-${{ github.run_id }}
             path: '*.sql'
             retention-days: 30
   ```
3. Nunca salvar arquivos de backup dentro do repositório.

**Pronto quando:** os dois arquivos existem, o YAML é válido, e lint e build continuam passando.

**Commit:** `chore: CI e backup diário`

---

## Ao terminar

**Teste de clone limpo:** clone o repositório local numa pasta temporária (`git clone . <pasta-temporaria>`), siga **apenas** o `README.md` (instalar, copiar `.env.example`, rodar) e confirme que o site abre e que "Entrar com Google" leva ao painel do membro com as funções falsas. Corrija o README se algum passo faltar. Depois apague a pasta temporária.

Mostre ao Victor:
- a lista de arquivos criados;
- a saída de `npm run lint` e `npm run build`;
- qualquer desvio desta especificação e o motivo;
- quais itens da Parte M ainda dependem dele.

---

# Parte M — Tarefas manuais do Victor

O assistente não executa esta parte. Se for consultado sobre ela, apenas explica e confere.

## M1 — Repositório

- GitHub da EJUVV → New repository → nome `astroclock` → **Private** → sem README → criar.
- Clonar na máquina e copiar para a raiz os arquivos do pacote de documentação (incluindo a pasta oculta `.claude/`).

## M2 — Projetos no Supabase

Com a conta `@ejuvv.com`, região **São Paulo**:

1. Criar a organização **"EJUVV Dev"** e, nela, o projeto `horas-dev`.
2. Criar a organização **"EJUVV Prod"** e, nela, o projeto `horas-prod`.
3. Guardar as senhas dos bancos num gerenciador de senhas (nunca no repositório).

Por que duas organizações: no plano gratuito, quem entra numa organização vê todos os projetos dela. Assim o Bernardo acessa só o dev. Conferir que os dois projetos gratuitos continuam ativos com essa divisão.

## M3 — `.env.local`

Em `horas-dev` → Project Settings → API: copiar a URL e a chave pública (anon/publishable) para o `.env.local` na raiz do projeto (o arquivo não vai para o Git). **Nunca** usar a chave `service_role` no front.

## M4 — Google Cloud (cerca de 15 min)

Em console.cloud.google.com, com a conta `@ejuvv.com`:

1. Criar o projeto `astroclock`.
2. Tela de consentimento OAuth: tipo **Interno**, nome "AstroClock", seu e-mail. Escopos básicos (e-mail, perfil, openid). Se "Interno" não aparecer, usar "Externo".
3. Credenciais → Criar ID do cliente OAuth → Aplicativo da Web.
4. URIs de redirecionamento autorizados:
   - `https://<ref-do-dev>.supabase.co/auth/v1/callback`
   - `https://<ref-do-prod>.supabase.co/auth/v1/callback`
5. Guardar o ID do cliente e a chave secreta (fora do repositório).

Se o Google Cloud estiver bloqueado para a organização, pedir à diretoria para liberar.

## M5 — Login Google no Supabase dev

Pode ser feito no dia 4 ou 5 da semana 1, junto com o Bernardo:

- Authentication → Providers → Google: colar o ID do cliente e a chave secreta.
- Authentication → URL Configuration: Site URL `http://localhost:5173`; Redirect URLs `http://localhost:5173/inicio`.

## M6 — Push e CI

- `git push` dos commits das Etapas 1 a 4.
- Na aba **Actions** do GitHub, confirmar que o workflow **CI** rodou e passou.

## M7 — Segredo do backup

- `horas-prod` → **Connect** → copiar a connection string do **Session pooler** (com a senha do banco).
- GitHub → Settings → Secrets and variables → Actions → New repository secret → nome `SUPABASE_PROD_DB_URL`.
- Actions → **Backup diario** → Run workflow. Conferir que o artefato `backup-...` aparece.
- Antes do piloto: baixar um backup e restaurar no `horas-dev` com o Bernardo.

## M8 — Proteção da `main`

- Ver o plano da organização em Settings → Billing.
- **Team ou superior** (inclusive pelo programa do GitHub para ONGs): Settings → Rules → nova regra para `main` exigindo PR, 1 aprovação e o CI passando, e bloqueando push direto.
- **Free com repositório privado:** a regra não funciona. Escolher entre deixar o repositório público (o código não tem dados nem segredos) ou manter privado e confiar na regra da equipe + CI. Registrar a escolha.

## M9 — GitHub Projects e issues da semana 1

Criar um quadro com as colunas **A fazer**, **Em andamento**, **Em revisão** e **Pronto**, e as issues abaixo, já atribuídas, usando o modelo de tarefa:

| Pessoa | Issues da semana 1 |
| --- | --- |
| Bernardo | Modelar tabelas iniciais com o Victor · Migrações de `membros`, `setores`, `metas` e `registros` · RLS de `membros` e funções `meu_id`, `eh_rh` e `meu_perfil` · Login Google real (`entrarComGoogle`, `sair`, `meuPerfil`, `meuNome`) · Seed inicial e tipos gerados |
| Johannes | Protótipo das 4 telas (com o Guilherme) · Base visual em `src/compartilhado/ui/` · Painel do RH vazio com navegação |
| Guilherme | Tela de login · Página `/inicio` com redirecionamento (em par com o Victor) · `RotaProtegida` · Painel do membro vazio com "Olá, nome" e sair |
| Victor | Backup diário funcionando · Validação do protótipo com o RH e a diretora |

O assistente pode gerar os textos dessas issues se o Victor pedir.

## M10 — Equipe

- Convidar Bernardo, Johannes e Guilherme para o repositório com permissão **write**.
- Convidar o Bernardo para a organização **"EJUVV Dev"** no Supabase.
- Criar o grupo do WhatsApp.
- Enviar a cada um o Guia geral e o guia individual, pedindo para lerem antes do kickoff.
- Marcar o kickoff (1h, presencial na sede) e a primeira demo.

## M11 — Pronto para o kickoff

A Fase 0 está concluída quando:

- [ ] Um clone limpo do repositório, seguindo só o `README.md`, roda o site e "Entrar com Google" leva ao painel do membro (funções falsas).
- [ ] O CI passa no GitHub.
- [ ] Os dois projetos do Supabase existem e o Bernardo tem acesso só ao dev.
- [ ] O Client ID do Google existe (a ativação no Supabase pode ficar para a semana 1).
- [ ] As issues da semana 1 estão no quadro, atribuídas.
- [ ] A equipe foi convidada, recebeu os guias e sabe dia e local do kickoff.
