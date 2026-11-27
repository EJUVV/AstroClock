# Requerimento, parte 1 — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** requerimento de ausência real (pedir, responder, anexo privado) e o cálculo da semana/ranking respeitando os pedidos aprovados.

**Architecture:** tabela `requerimentos` com RLS + funções `security definer` para responder e para a limpeza dos anexos; bucket privado no Storage com políticas em `storage.objects`; o cálculo ganha `ajuste_da_semana` e recria 3 funções com a mesma assinatura. Site no padrão `if (loginFalso)`.

**Tech Stack:** Supabase (Postgres, RLS, Storage), CLI v2.122 (`npx --no-install supabase db query --linked -f`), React + TypeScript, `@supabase/supabase-js` storage API.

**Spec:** `docs/superpowers/specs/2026-11-27-requerimento-parte-1-design.md`

## Global Constraints

- Migração nova única: `supabase/migrations/20261127220000_requerimentos.sql` (Tasks 1 e 2 escrevem nela; nada aplicado até o OK do Victor). Nunca editar migração aplicada.
- Erros das regras com `errcode = 'P0002'` e mensagem em português (o `erroDoBanco` só mostra a mensagem com esse código).
- Quem lê tudo: `public.ve_tudo()`. Quem responde: `public.eh_diretor_rh()`. Quem tem meta: `public.perfil_tem_meta(perfil)`. Membro logado: `public.meu_id()`.
- Semanas cobertas: da `segunda_da_semana(data_inicio)` até `segunda_da_semana(data_fim)`, inteiras. `ausencia_total` vence `so_remoto`.
- Bucket `anexos-requerimentos`, privado, `file_size_limit` 5242880, `allowed_mime_types` `{application/pdf,image/jpeg,image/png}`, caminho `<membro_id>/<uuid>.<ext>`.
- "Deve sumir" = `anexo_caminho is not null and (situacao = 'aprovado' or (situacao = 'reprovado' and respondido_em < now() - interval '1 month'))`.
- Link temporário do anexo: 60 segundos.
- Telas não importam `supabase`; versões falsas em arquivos `// FALSO:`.

## Review Focus

- Duplo clique em "Aprovar" (duas chamadas) → a segunda recebe erro "Este requerimento já foi respondido", nada muda.
- Upload deu certo e a gravação do pedido falhou → o arquivo é apagado pelo próprio membro (política permite apagar arquivo da própria pasta sem pedido ligado).
- Pedido aprovado de `ausencia_total` e outro de `so_remoto` na mesma semana → semana dispensada.
- `diretor_setor` olhando o painel → vê a semana de um membro como dispensada, sem conseguir ler `requerimentos`.
- Arquivo de outro membro: caminho adivinhado → `createSignedUrl` recusado para quem não é dono nem `ve_tudo()`.

---

### Task 1: Banco — tabela, regras, resposta, anexo e Storage

**Files:**
- Create: `supabase/migrations/20261127220000_requerimentos.sql`
- Create: `supabase/testes/teste-requerimentos.sql` (parte A)

**Interfaces:**
- Produces: tabela `public.requerimentos` (colunas do spec; enums `public.tipo_requerimento`, `public.situacao_requerimento`); RPCs `responder_requerimento(p_id uuid, p_aprovar boolean, p_motivo text default null) → void`, `anexo_apagado(p_id uuid) → void`, `anexos_para_apagar() → table(id uuid, anexo_caminho text)`; bucket `anexos-requerimentos` com políticas de insert/select/delete.

- [ ] **Step 1: Escrever a parte A do `teste-requerimentos.sql`** (padrão zz do `teste-presenca.sql`, desfeito com `ZZ999`; pessoas: membro Ana, membro Beto, `rh` Carla sem diretoria, diretor do RH Dani com diretoria no setor RH zz marcado `eh_rh`... use um setor zz e registre `diretorias` para Dani no setor `eh_rh` existente só se não houver; preferir criar setor zz com `eh_rh` só se o índice permitir — senão usar o setor RH existente), diretor de setor Edu com diretoria no setor de Ana. Asserts:
  - Ana insere pedido próprio `pendente` → ok; Ana insere com `membro_id` de Beto → falha; Ana insere já `aprovado` → falha.
  - Ana lê só os próprios; Beto não vê o de Ana; Carla vê todos; Edu vê 0.
  - Carla responde → erro P0002; Dani aprova o de Ana → `situacao = 'aprovado'`, `respondido_por = Dani`; aprovar de novo → `'P0002:%já foi respondido%'`; Dani reprova outro sem motivo → `'P0002:%motivo%'`; pedido de Dani (se Dani tiver meta — senão um pedido de Carla respondido por Carla) → "não responde o próprio".
  - `anexos_para_apagar()` como Carla: traz o aprovado com anexo e um reprovado com `respondido_em` de 40 dias atrás; não traz reprovado de 10 dias nem pendente. `anexo_apagado` no de 10 dias → erro; no aprovado → `anexo_caminho` null e `anexo_nome` mantido.
- [ ] **Step 2: Ensaio** (`begin; teste; rollback;`) → falha (tabela não existe).
- [ ] **Step 3: Escrever a parte de tabela/RLS/funções/Storage da migração.** Políticas de `storage.objects` para `bucket_id = 'anexos-requerimentos'`: insert com `(storage.foldername(name))[1] = public.meu_id()::text` e perfil com meta; select dono da pasta ou `ve_tudo()`; delete por `ve_tudo()` quando existe pedido com `anexo_caminho = name` que deve sumir, ou pelo dono quando nenhum pedido tem `anexo_caminho = name`.
- [ ] **Step 4: Ensaio migração + parte A** → "OK: requerimentos passou"; junto com `teste.sql` → OK.
- [ ] **Step 5: Commit** `feat: requerimentos no banco (B8) com anexo privado (J6)`.

### Task 2: Banco — cálculo respeita os pedidos aprovados

**Files:**
- Modify: `supabase/migrations/20261127220000_requerimentos.sql` (acrescentar)
- Modify: `supabase/testes/teste-requerimentos.sql` (parte B)

**Interfaces:**
- Consumes: `public.requerimentos` (Task 1).
- Produces: `ajuste_da_semana(p_membro_id uuid, p_semana date) → table(dispensada boolean, so_remoto boolean)` (`security definer`, interna, sem execute para `authenticated`); `progresso_de_membro`, `resumo_da_semana(p_semana date, p_setor text default null)` e `horas_do_mes(p_mes text)` recriadas com a mesma assinatura e colunas, partindo das versões mais novas (`20261119111100`, `20261126182603`, `20261125005432`).

- [ ] **Step 1: Parte B do teste** (num mês antigo com meta própria, como o `teste-ranking.sql`, ex.: março de 2021, meta 10/5 desde 2021-02-22). Asserts:
  - Ana com `so_remoto` aprovado de 2021-03-03 (qua) a 2021-03-08 (seg) → `progresso_de_membro` nas semanas de 01/03 e 08/03: `meta_sede = 0`; com 10h online em 01/03 → `cumpriu`.
  - Beto com `ausencia_total` aprovado em 2021-03-10 → semana de 08/03 `dispensada`, `cumpriu` false, fora de `percentual_da_semana`, de `medias_da_semana` e de `abaixo_da_meta`.
  - Pedido `pendente` e `reprovado` não mudam nada.
  - `so_remoto` e `ausencia_total` aprovados na mesma semana → `dispensada`.
  - Como Edu (diretor de setor): `resumo_da_semana` mostra Beto `dispensada` na semana de 08/03.
  - `horas_do_mes('2021-03')`: Beto `dispensado = false` (só uma semana); outro membro com `ausencia_total` de 01/03 a 29/03 → `dispensado = true` e no fim do `ranking_do_mes`.
- [ ] **Step 2: Ensaio** → falha nos asserts do cálculo.
- [ ] **Step 3: Acrescentar `ajuste_da_semana` e recriar as 3 funções** (`cumpriu = elegível e não dispensada e horas ≥ metas`; `meta_sede` 0 quando só remoto).
- [ ] **Step 4: Ensaio migração + as 5 suítes** (`teste-requerimentos`, `teste`, `teste-ranking`, `teste-diretorias`, `teste-presenca`) → todas OK.
- [ ] **Step 5: Commit** `feat: cálculo da semana e ranking respeitam os requerimentos aprovados`.

### Task 3: Site

**Files:**
- Create: `src/compartilhado/api/requerimentos-falso.ts` (conteúdo atual de `requerimentos.ts`, cabeçalho `// FALSO:`)
- Modify: `src/compartilhado/api/requerimentos.ts`, `src/compartilhado/api/rh.ts`, `src/compartilhado/tipos-banco.ts` (à mão até gerar de novo), `src/compartilhado/recursos.ts` (`temRequerimentos = true`), `src/rh/RequerimentosRH.tsx`, `src/membro/FormRequerimento.tsx`, `src/membro/RequerimentosMembro.tsx` (textos de e-mail), `docs/arquitetura.md` (seção 6 "Vira real" e nota do backup dos anexos)

**Interfaces:**
- Consumes: tabela e RPCs das Tasks 1 e 2.
- Produces (assinaturas de hoje): `enviarRequerimento(dados: NovoRequerimento): Promise<Requerimento>`, `meusRequerimentos(): Promise<Requerimento[]>`, `linkDoAnexo(id: string): Promise<string>`, `listarRequerimentos(situacao?: SituacaoRequerimento): Promise<Requerimento[]>`, `responderRequerimento(id: string, aprovar: boolean, motivo?: string): Promise<void>`.

- [ ] **Step 1: `requerimentos.ts` real.** Validar tipo/tamanho no site (mesmas mensagens da versão falsa); upload em `<meu id>/<crypto.randomUUID()>.<ext>`; insert com `anexo_caminho`/`anexo_nome`; se o insert falhar, `remove` do arquivo e lança o erro. `meusRequerimentos` ordena por `criado_em` desc. Mapeamento: `anexoNome = anexo_caminho ? anexo_nome : null`; `nomeMembro` pelo embed `membros(nome)`. `linkDoAnexo`: `createSignedUrl(caminho, 60)`; sem caminho → mesma mensagem da versão falsa.
- [ ] **Step 2: `rh.ts`.** `listarRequerimentos` (filtro opcional por situação, desc) chama antes `anexos_para_apagar` → `remove` → `anexo_apagado` para cada um, dentro de `try/catch` que não derruba a lista. `responderRequerimento`: `rpc('responder_requerimento')`; se aprovou e havia caminho, `remove` + `anexo_apagado` (falha aqui não desfaz a aprovação: a limpeza da lista pega depois).
- [ ] **Step 3: Textos sem e-mail.** Trocar as 7 frases que prometem e-mail (`RequerimentosRH.tsx` 124, 209, 210, 217, 229, 235; `FormRequerimento.tsx` 110; `RequerimentosMembro.tsx` 77, 86) por versões que dizem que a resposta aparece na tela de Requerimentos e que o RH vê o pedido no menu.
- [ ] **Step 4: `temRequerimentos = true`; tipos do banco à mão; `arquitetura.md`.**
- [ ] **Step 5: Verificar** `npm run lint` sem erro novo, `npm run build` ok, demonstração (5175): membro envia pedido com anexo, diretor do RH (perfil falso `diretor_rh`) aprova.
- [ ] **Step 6: Commit** `feat: requerimento real no site (G7 e J7)`.

### Depois (com o OK do Victor)

- Aplicar no `horas-dev`, rodar as 5 suítes, gerar tipos, testar com login real (membro envia e abre o anexo; RH abre; diretor do RH aprova e o arquivo some), andamento, juntar na `main`. No `horas-prod`, entra na B14.
