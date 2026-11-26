# Diretorias acumuladas: plano de implementação

> **Para quem executa (IA):** use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans, tarefa por tarefa. Os passos usam caixas (`- [ ]`).

**Objetivo:** uma pessoa (diretor ou presidente) pode dirigir vários setores, com os poderes do titular em cada um; quem dirige o setor RH é o diretor do RH.

**Arquitetura:** tabela `diretorias` (uma linha por setor dirigido) + `historico_diretorias`; as funções de permissão (`eh_diretor_rh`, `eh_rh`, `ve_tudo`) passam a ler as diretorias, e `setor_que_dirijo()` vira `setores_que_dirijo()`. No site, a sessão ganha as diretorias e um "perfil efetivo" (quem dirige o RH age como `diretor_rh`).

**Tecnologia:** PostgreSQL/Supabase (SQL), React + TypeScript + Tailwind + shadcn/ui, Supabase CLI.

**Desenho:** [`docs/superpowers/specs/2026-11-26-diretorias-acumuladas-design.md`](../specs/2026-11-26-diretorias-acumuladas-design.md) (aprovado em 26/11/2026). Leia antes.

## Regras gerais

- Branch `feat/diretorias-acumuladas` a partir da `main` (confira com `git branch --show-current` antes de criar). Commits `tipo: descrição`, em português.
- Migração nova, nunca editar as antigas. Funções com `set search_path = ''`, nomes com `public.`, `security definer` quando ler dados de outros; `revoke ... from public, anon` e `grant execute ... to authenticated` só nas que o site chama; as internas revogadas também de `authenticated`.
- **Nada no `horas-dev` sem o OK do Victor na hora. Nada no `horas-prod`.**
- Telas não importam o `supabase`; versão falsa com `if (loginFalso) return falso.x(...)`.
- No site, setores são identificados pelo **nome** (como em `Membro.setor` e `listarSetores`). Por isso as funções que o site chama recebem o nome do setor (os nomes já são únicos: índice `setores_nome_unico`). **Ajuste ao desenho**, que falava em `p_setor_id`. Outro ajuste: a listagem `diretorias_atuais()` do desenho virou `situacao_dos_setores()`, que traz também os setores vagos (é o que a tela precisa para os avisos).
- Verificação do site: `npm run lint`, `npm run build` e navegador no modo de demonstração (`astroclock-demo`). Do banco: os três arquivos de teste.

## Pontos de atenção na revisão

1. **Presidente que assume o RH e depois entrega o cargo:** perde na hora os poderes de diretor do RH (cadastrar, metas), mas continua presidente (vê tudo, revisa cronômetro).
2. **Diretor de dois setores:** vê os membros, os registros, a B9 (`resumo_da_semana` sem setor = os dois; com um setor que não dirige = só os dele, nunca o pedido) e o ranking só desses setores.
3. **Passar o RH de uma pessoa para outra pelo site** (o diretor do RH atual atribui o setor RH a outro): funciona numa operação só; quem passou perde o poder logo depois, sem erro no meio.
4. **Desativar um diretor ou rebaixar o perfil para `membro`/`rh`:** as diretorias dele acabam e ficam no histórico; o setor aparece como vago.
5. **Setor renomeado ou desativado:** a diretoria continua presa ao `setor_id`; setor desativado não aparece para atribuir.

---

### Task 1: Regras e contrato

**Arquivos:** `docs/regras-de-negocio.md` (seções 5 e 6), `docs/arquitetura.md` (tabelas, tipos e funções)

**Interfaces — produz o contrato:**
- Tipo `Diretoria { setor: string; ehRH: boolean; diretorId: string; diretorNome: string; desde: string }`.
- Tipo `SituacaoSetor { setor: string; ehRH: boolean; diretor: { id: string; nome: string; desde: string } | null }`.
- `diretorias.ts`: `minhasDiretorias(): Promise<Diretoria[]>`, `situacaoDosSetores(): Promise<SituacaoSetor[]>`, `atribuirDiretoria(setor: string, membroId: string): Promise<void>`, `removerDiretoria(setor: string): Promise<void>`.

- [ ] **Passo 1:** seção 5 do `regras-de-negocio.md` com as regras da seção "Regras" do desenho, "Decidido pelo líder do projeto em 26/11/2026"; trocar a frase "Cada setor tem no máximo um diretor: um `diretor_setor` por setor e um único `diretor_rh`" pela nova; na seção 6, uma linha dizendo que diretores e presidente podem dirigir vários setores, mas pertencem a um.
- [ ] **Passo 2:** `arquitetura.md`: tabelas `diretorias` e `historico_diretorias`, coluna `setores.eh_rh`, os tipos e as 4 funções acima na tabela de funções.
- [ ] **Passo 3: Commit** — `docs: regra e contrato das diretorias acumuladas`

---

### Task 2: Migração e testes do banco

**Arquivos:** criar `supabase/migrations/<timestamp>_diretorias_acumuladas.sql` (com `npx supabase migration new diretorias_acumuladas`) e `supabase/testes/teste-diretorias.sql`; modificar nada além disso.

**Interfaces — produz:**
- `setores.eh_rh boolean not null default false` + índice único parcial `where eh_rh` (no máximo um). A migração marca `eh_rh = true` no setor cujo `lower(nome) = 'rh'`.
- `diretorias(setor_id uuid primary key references setores, membro_id uuid not null references membros, desde timestamptz not null default now(), registrado_por uuid references membros)` com RLS: leitura para quem tem painel do RH (`ve_tudo()` ou dirige algum setor); escrita só pelas funções.
- `historico_diretorias(id uuid pk, setor_id uuid not null, membro_id uuid not null, inicio timestamptz not null, fim timestamptz, registrado_por uuid, encerrado_por uuid)`, RLS de leitura igual, escrita só pelas funções.
- Internas (sem execução para o site): `dirige_rh(p_membro_id uuid) returns boolean`.
- Públicas:
  - `setores_que_dirijo() returns setof uuid`
  - `minhas_diretorias() returns table(setor text, eh_rh boolean, diretor_id uuid, diretor_nome text, desde timestamptz)`
  - `situacao_dos_setores() returns table(setor text, eh_rh boolean, diretor_id uuid, diretor_nome text, desde timestamptz)` — setores ativos, diretor null quando vago; só quem tem painel do RH recebe linhas.
  - `atribuir_diretoria(p_setor text, p_membro_id uuid) returns void`
  - `remover_diretoria(p_setor text) returns void`
- Redefinidas (mesma assinatura): `eh_diretor_rh()` = `dirige_rh(meu_id())`; `eh_rh()` = perfil `rh` ativo ou `eh_diretor_rh()`; `ve_tudo()` = perfil `rh`/`presidente` ativo ou `eh_diretor_rh()`.
- Recriadas para trocar `setor_que_dirijo()` por `setores_que_dirijo()`: as políticas de leitura de `membros` e de `registros`, `resumo_da_semana(p_semana, p_setor)` (com `p_setor` de um setor que dirijo → só ele; sem `p_setor` → todos os meus; quem vê tudo → como hoje) e `ranking_do_mes(p_mes)` (diretor: setores que dirige, posição no setor). Depois, `drop function public.setor_que_dirijo()`.
- Políticas de `setores` (criar/alterar): `eh_diretor_rh() or meu_perfil() = 'presidente'`. Políticas de `membros` que comparam `meu_perfil() = 'diretor_rh'`: trocar por `eh_diretor_rh()`.
- Índices: `drop index membros_um_diretor_de_setor_ativo`; recriar `membros_um_diretor_rh_e_um_presidente` como `membros_um_presidente` (`where ativo and perfil = 'presidente'`).
- Gatilho `after update on membros`: se `ativo` virou `false` ou o perfil virou `membro`/`rh`, encerra as diretorias da pessoa (apaga de `diretorias`, fecha `fim` no histórico com `encerrado_por = meu_id()`).
- Carga inicial: para cada `diretor_setor` ativo, diretoria do próprio setor; para o `diretor_rh` ativo, diretoria do setor `eh_rh`; uma linha aberta no histórico para cada.

Regras de `atribuir_diretoria`: só `eh_diretor_rh()` ou presidente ativo (senão `42501` "Só o diretor do RH e o presidente registram diretorias."); setor ativo existente (senão `P0002` "Setor não encontrado."); membro ativo com perfil `diretor_setor`, `diretor_rh` ou `presidente` (senão `23514` "Só diretores e o presidente dirigem setores."); se o setor já tem diretor, fecha o histórico dele e troca; abre linha nova no histórico. `remover_diretoria`: mesmas permissões; setor sem diretor → `P0002` "Este setor já está vago.".

- [ ] **Passo 1: Escrever `teste-diretorias.sql`** no formato da `teste-ranking.sql` (bloco `do $$`, dados `zz`, `set_config` para trocar de pessoa, `raise exception 'fim do teste' using errcode = 'ZZ999'` e `select 'OK: diretorias passaram'`). No começo, desativar temporariamente o presidente e o diretor do RH ativos do seed (como a `teste.sql`). Cenário: setores `zz A`, `zz B`, `zz C` e um `zz RH` com `eh_rh` (desmarcar o RH real dentro do teste); pessoas: `zz Pres` (presidente), `zz DirA` (`diretor_setor`, setor A), `zz Mem` (membro, setor B, com 1 registro), `zz MemC` (membro, setor C), `zz Rh` (rh, setor A). Asserções:
  - como `zz Mem`: `atribuir_diretoria` falha com `42501`;
  - como `zz Pres`: atribui A e B ao `zz DirA` e o RH a si mesmo; `situacao_dos_setores` mostra A e B com `zz DirA`, RH com `zz Pres`, C vago;
  - como `zz Pres`: `eh_diretor_rh()` é true e consegue inserir uma meta para a semana que vem e cadastrar um membro;
  - como `zz DirA`: vê `zz Mem` (setor B) em `membros` e o registro dele; não vê `zz MemC` (setor C); `resumo_da_semana(seg)` traz setores A e B e nenhum de C; `resumo_da_semana(seg, 'zz C')` não traz C;
  - como `zz Pres`: atribuir `zz Mem` (membro) a C falha com `23514`;
  - como `zz Pres`: atribui A a um segundo diretor `zz DirA2` → `zz DirA` fica só com B; o histórico de A tem a linha de `zz DirA` fechada;
  - como `zz Pres`: `remover_diretoria('zz RH')` → `eh_diretor_rh()` false, `ve_tudo()` continua true (presidente);
  - como dono do banco: desativar `zz DirA` → B fica vago e o histórico fecha.
- [ ] **Passo 2: Escrever a migração** com tudo da lista acima e um comentário no topo no estilo das anteriores.
- [ ] **Passo 3: Ensaio no `horas-dev` com desfazer (OK do Victor antes):** numa transação, a migração + `teste-diretorias.sql` + `teste.sql` + `teste-ranking.sql`, terminando em `rollback`. Esperado: as três mensagens de OK e nada novo no banco depois. Se a `teste.sql` precisar de ajuste por causa do índice novo (ela cria diretor de setor e presidente), ajustar a própria `teste.sql` na mesma tarefa, sem mudar o que ela testa.
- [ ] **Passo 4: Commit** — `db: diretorias acumuladas (vacância)`.

---

### Task 3: Dados do site e sessão

**Arquivos:** `src/compartilhado/tipos.ts`, `src/compartilhado/tipos-banco.ts` (à mão, até gerar de novo na Task 5), criar `src/compartilhado/api/diretorias.ts` e `diretorias-falso.ts`, `src/compartilhado/api/dados-falsos.ts` (diretorias de demonstração: o diretor de setor falso dirige o próprio setor e mais um), `src/compartilhado/perfis.ts`, `src/compartilhado/ui/RotaProtegida.tsx`.

**Interfaces:**
- Consome: as 4 funções públicas da Task 2 (exceto `setores_que_dirijo`).
- Produz:
  - as funções da Task 1 em `diretorias.ts`;
  - `perfis.ts`: `perfilEfetivo(perfil: Perfil, diretorias: Diretoria[]): Perfil` (dirige RH → `'diretor_rh'`, senão o próprio) e `nomeDoCargo(perfil: Perfil, diretorias: Diretoria[]): string` ("Diretor de Projetos e Comercial", "Presidente · diretor do RH", "Diretor do RH", "Diretor de setor (sem setor)" quando diretor sem diretoria, `NOME_PERFIL` para membro e rh);
  - `Sessao { perfil: Perfil /* efetivo */; cargo: Perfil /* do cadastro */; diretorias: Diretoria[]; setoresQueDirijo: string[]; eu: Membro }`. `RotaProtegida` continua conferindo `perfis` pelo perfil do cadastro.

- [ ] **Passo 1:** tipos e `diretorias-falso.ts`.
- [ ] **Passo 2:** `diretorias.ts` real (rpc, camelCase, `erroDoBanco`).
- [ ] **Passo 3:** `perfis.ts` e `RotaProtegida` (carrega `minhasDiretorias()` junto com `meusDados()`).
- [ ] **Passo 4:** `npm run lint` e `npm run build` sem erros.
- [ ] **Passo 5: Commit** — `feat: diretorias na sessão e nas permissões do site`.

---

### Task 4: Telas

**Arquivos:** `src/rh/PainelRH.tsx`, `src/rh/Ranking.tsx`, `src/rh/VisaoGeral.tsx`, `src/rh/Membros.tsx`, `src/rh/DetalheMembro.tsx`, criar `src/rh/SecaoDiretorias.tsx`, o topo/Configurações onde o cargo aparece (`src/compartilhado/ui/LayoutPainel.tsx` e a página de Configurações), e as versões falsas que filtram por `eu.setor` para diretor (`membros-falso.ts`, `rh-falso.ts`).

**Interfaces:** consome `Sessao` e `nomeDoCargo`/`perfilEfetivo` (Task 3) e `diretorias.ts`.

- [ ] **Passo 1: Cargo:** onde hoje aparece `NOME_PERFIL[perfil]` para quem está logado, usar `nomeDoCargo(cargo, diretorias)`.
- [ ] **Passo 2: Diretor de vários setores:** trocar `eu.setor` por `setoresQueDirijo` nos textos e filtros do painel (`PainelRH` "Os membros de X e Y", seletor do `Ranking` só com os setores dirigidos, `meuSetor` da `VisaoGeral`/`RankingSetores` = primeiro dirigido); versões falsas filtram por `setoresQueDirijo`.
- [ ] **Passo 3: `SecaoDiretorias`** no detalhe do membro, visível só para `perfil === 'diretor_rh'` (efetivo) ou `cargo === 'presidente'`, e só quando o membro é diretor ou presidente: lista os setores que ele dirige ("Remover" com `ConfirmDialog`) e um seletor "Atribuir setor" com os setores ativos (os ocupados mostram o diretor atual e avisam que ele será trocado).
- [ ] **Passo 4: Avisos na lista de Membros** (para diretor do RH e presidente): "Setores vagos: C" e "Diretores sem setor: Fulano", a partir de `situacaoDosSetores()` e da lista de membros.
- [ ] **Passo 5: Navegador (`astroclock-demo`):** como diretor do RH, atribuir e remover uma diretoria de um diretor; como diretor de setor (que na demonstração dirige dois setores), o painel mostra os dois; 360 px sem rolagem lateral; console sem erros.
- [ ] **Passo 6:** `npm run lint` e `npm run build`.
- [ ] **Passo 7: Commit** — `feat: telas das diretorias acumuladas`.

---

### Task 5: Integração

- [ ] **Passo 1: Com o OK do Victor**, `npx supabase db push --linked` no `horas-dev`; rodar `teste-diretorias.sql`, `teste.sql` e `teste-ranking.sql` (pelo SQL Editor ou pela IA). Esperado: os três OK.
- [ ] **Passo 2:** conferir a carga inicial (`situacao_dos_setores()` como dono do banco): cada diretor atual no próprio setor; anotar os setores vagos para o Victor.
- [ ] **Passo 3:** `npx supabase gen types typescript --linked` (sem BOM, com o cabeçalho de 2 linhas de comentário), `npm run lint`, `npm run build`.
- [ ] **Passo 4: Login real** (Victor): perfil e cargo aparecem certos; atribuir e remover uma diretoria de teste; desfazer.
- [ ] **Passo 5:** andamento atualizado, PR `feat/diretorias-acumuladas` → `main`.
- [ ] **Passo 6: Commit** — `chore: tipos do banco gerados de novo com as diretorias`.
