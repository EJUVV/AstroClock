# Fase 0 — Especificação da configuração inicial

Este documento é a especificação que o assistente de código (Claude Code) segue para preparar o repositório antes de a equipe entrar. Execute **uma etapa por vez**, mostre o resultado e espere aprovação antes da próxima.

Leia antes: [`AGENTS.md`](../AGENTS.md), [`regras-de-negocio.md`](regras-de-negocio.md) e [`arquitetura.md`](arquitetura.md).

## Fora do escopo do assistente

Estas tarefas exigem login nas contas da EJUVV e são feitas pelo Victor manualmente:

- Criar os projetos `horas-dev` e `horas-prod` no Supabase.
- Criar o projeto e o Client ID OAuth no Google Cloud.
- Ativar o provedor Google no Supabase.
- Cadastrar o segredo `SUPABASE_PROD_DB_URL` no GitHub.
- Ativar a proteção da branch `main`.
- Convidar a equipe e criar issues no GitHub Projects.

O assistente **não cria** tabelas, migrações, RLS ou seed real (tarefa do Bernardo na semana 1) e **não cria telas** além do mínimo descrito aqui (tarefas do Guilherme e da Raíssa).

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
8. `.gitignore`: garantir `node_modules`, `dist`, `.env`, `.env.local`, `.env.*.local`, `supabase/.temp`, `.planejamento/`.

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

1. Conferir que estes arquivos já existem na raiz e em `docs/` (foram fornecidos): `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, `CLAUDE.md`, `docs/regras-de-negocio.md`, `docs/arquitetura.md`, `docs/fase-0.md`. Não reescreva; só corrija caminhos ou comandos que não batam com o que foi gerado nas etapas 1 e 2, e liste as mudanças.
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

Mostre ao Victor:
- a lista de arquivos criados;
- a saída de `npm run lint` e `npm run build`;
- qualquer desvio desta especificação e o motivo;
- o que ainda depende das tarefas manuais dele (lista do início deste documento).
