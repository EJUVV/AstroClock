# Presença na sede real — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** trocar a presença na sede de demonstração pela real (B13 + G9) e religá-la no login real.

**Architecture:** tabela `presenca_sede` sem leitura direta; tudo por funções `security definer` que usam `meu_id()`. Fechamento das presenças esquecidas por pg_cron a cada 10 minutos. Site com versão real/falsa no padrão `if (loginFalso)`.

**Tech Stack:** Supabase (Postgres, RLS, pg_cron), CLI v2.122 (`npx --no-install supabase`), React + TypeScript.

**Spec:** `docs/superpowers/specs/2026-11-27-presenca-sede-design.md`

## Global Constraints

- Nunca editar migração aplicada; migração nova `supabase/migrations/20261127200000_presenca_sede.sql`.
- Telas não importam `supabase`; só `src/compartilhado/api/`. Versão falsa em arquivo que começa com `// FALSO:`.
- "Hoje" = data em `America/Sao_Paulo`.
- Mensagens: "Você já está marcado como na sede" e "Você não está marcado como na sede".
- Nada no `horas-prod` (entra na B14). Aplicar no `horas-dev` e juntar na `main` só com o OK do Victor.

## Review Focus

- Duas abas marcando ao mesmo tempo → só uma presença aberta (índice único); a segunda recebe "Você já está marcado como na sede".
- Pessoa desativada com presença aberta → não aparece na lista.
- Presença aberta de ontem (antes da tarefa rodar) → não aparece e `estou_na_sede()` é false; marcar de novo funciona (a de ontem é fechada antes de abrir a nova).
- Usuário sem cadastro (`meu_id()` null) → lista vazia e marcar dá erro, sem expor nada.
- Ler `presenca_sede` direto como `authenticated` → 0 linhas / sem permissão.

---

### Task 1: Banco

**Files:**
- Create: `supabase/migrations/20261127200000_presenca_sede.sql`
- Create: `supabase/testes/teste-presenca.sql`

**Interfaces:**
- Produces (RPC): `quem_esta_na_sede() → table(membro_id uuid, nome text, setor text, desde timestamptz)`; `estou_na_sede() → boolean`; `marcar_na_sede() → void`; `desmarcar_na_sede() → void`; `encerrar_presencas_de_ontem() → integer` (interna, só pg_cron). Execução de `quem_esta_na_sede`, `estou_na_sede`, `marcar_na_sede`, `desmarcar_na_sede` para `authenticated`.

- [ ] **Step 1: Escrever `teste-presenca.sql`** no padrão do `teste-ranking.sql` (bloco `do`, prefixo zz, `raise exception ... 'ZZ999'` no fim para desfazer, `select 'OK: presença passou'`). Asserts: Ana marca → `estou_na_sede()` true; Ana marca de novo → erro com "já está marcado"; Beto vê Ana em `quem_esta_na_sede()` com só as colunas membro_id/nome/setor/desde; `select count(*) from presenca_sede` como authenticated dá erro de permissão ou 0; Ana desmarca → some da lista; desmarcar de novo → erro "não está marcado"; presença de Beto com `entrada` ontem às 20h → não aparece, `estou_na_sede()` de Beto false, `encerrar_presencas_de_ontem()` devolve 1 e grava `saida` = hoje 00:00 Brasília; membro desativado com presença aberta de hoje não aparece; claims com e-mail não cadastrado → lista vazia e marcar dá erro.
- [ ] **Step 2: Rodar em ensaio** (`begin; <teste>; rollback;` via `npx --no-install supabase db query --linked -f`) → falha porque as funções não existem.
- [ ] **Step 3: Escrever a migração**: tabela, índice único parcial `presenca_sede_uma_aberta (membro_id) where saida is null`, RLS ligado sem políticas para authenticated, as 5 funções (`marcar_na_sede` fecha antes a presença aberta de dia anterior), `revoke` de public/anon, `grant` das 4 para authenticated, pg_cron `'encerrar-presencas-de-ontem'` com `'*/10 * * * *'`, comentários em português.
- [ ] **Step 4: Ensaio com migração + teste** (`begin; migração; teste; rollback;`) → "OK: presença passou"; rodar também `teste.sql` junto da migração → "OK: todos os testes passaram".
- [ ] **Step 5: Commit** `feat: presença na sede no banco (B13)`.

### Task 2: Site

**Files:**
- Create: `src/compartilhado/api/presenca-falso.ts` (conteúdo atual do `presenca.ts`, com `// FALSO:` na primeira linha)
- Modify: `src/compartilhado/api/presenca.ts`, `src/compartilhado/recursos.ts`, `src/compartilhado/tipos-banco.ts` (entrada das 4 RPCs, à mão até gerar de novo), telas que chamam `quemEstaNaSede` (`src/membro/InicioMembro.tsx` `CartaoSede`, `src/membro/SedeMembro.tsx`)

**Interfaces:**
- Consumes: RPCs da Task 1.
- Produces: mesmas assinaturas de hoje — `quemEstaNaSede(): Promise<PresencaSede[]>`, `estouNaSede(): Promise<boolean>`, `marcarNaSede(): Promise<void>`, `desmarcarNaSede(): Promise<void>`.

- [ ] **Step 1: `presenca.ts` real** com `if (loginFalso) return falso.x()`, `supabase.rpc(...)`, `erroDoBanco`; `desde` vem de `desde`.
- [ ] **Step 2: Recarga a cada 1 minuto** onde a lista aparece (`setInterval` de 60 000 ms chamando `recarregar` do `useCarregar`, limpo no unmount).
- [ ] **Step 3: `temSede = true`** em `recursos.ts` (manter `temRequerimentos = loginFalso`).
- [ ] **Step 4: Verificar** `npm run lint` sem erro novo, `npm run build` ok, demonstração (porta 5175) com a aba Sede e o botão funcionando.
- [ ] **Step 5: Commit** `feat: presença na sede real no site (G9)`.

### Depois (com o OK do Victor)

- Aplicar no `horas-dev` (`db push --linked`), rodar `teste-presenca.sql`, gerar tipos, atualizar contrato (`arquitetura.md`, "Vira real") e andamento, juntar na `main`.
