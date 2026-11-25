# Ranking com pódio e ranking dos setores: plano de implementação

> **Para quem executa (IA):** use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans, tarefa por tarefa. Os passos usam caixas (`- [ ]`) para acompanhar.

**Objetivo:** o membro vê o pódio da EJ (5), o pódio do setor (3), a própria posição e o ranking dos setores pela média de horas do mês, com dados reais do banco.

**Arquitetura:** uma migração nova com funções `security definer` que devolvem só nome, setor e horas (o membro nunca recebe a lista completa), apoiadas nas funções de cálculo da B9 (PR #9). No site, um arquivo de dados novo (`ranking.ts`, com a versão falsa em `ranking-falso.ts`), uma página nova no painel do membro e uma aba nova no ranking do RH.

**Tecnologia:** PostgreSQL/Supabase (SQL), React + TypeScript + Tailwind + shadcn/ui, Supabase CLI.

**Desenho:** [`docs/superpowers/specs/2026-11-24-ranking-podio-design.md`](../specs/2026-11-24-ranking-podio-design.md) (aprovado pelo Victor em 24/11/2026). Leia antes de começar.

## Regras gerais (valem para todas as tarefas)

- Branch `feat/ranking-podio`, criada a partir do commit `632bdcf` (branch do PR #9, `origin/B7.1,-B10-e-cálculo-da-semanaD`). Commits `tipo: descrição`, em português.
- Telas nunca importam o `supabase`: só funções de `src/compartilhado/api/`.
- Nenhum total guardado em tabela; migração nunca editada depois de aplicada; toda função nova sem execução para `anon` e com `grant execute ... to authenticated`.
- Funções com `set search_path = ''` e nomes qualificados com `public.`, como na B9.
- **Nada é aplicado no `horas-dev` sem o OK do Victor no momento**, e só depois que o PR #9 estiver lá. Nada vai para o `horas-prod`.
- Arquivos de `api/` com versão falsa: `if (loginFalso) return falso.x(...)` no começo de cada função real (padrão do `registros.ts`).
- Telas: três estados (carregando, erro com a mensagem da função, conteúdo) e mensagem para lista vazia; funcionando em 360 px.
- Erros do banco traduzidos com `erroDoBanco` (`src/compartilhado/api/banco.ts`).
- Não mexer em `src/compartilhado/api/rh.ts` (fila G10 → J5 → J10).
- Não há ferramenta de teste no front (TDD opcional, ver `AGENTS.md`): a verificação do site é `npm run lint`, `npm run build` e conferência no navegador.

## Pontos de atenção na revisão

1. **Pouca gente:** setor com 1 ou 2 membros que contam, ou EJ com menos de 5 pessoas com horas: o pódio mostra só quem existe, sem buracos nem erro.
2. **Quem não entra no ranking do mês** (entrou nesta semana, diretor, presidente): a posição vem vazia e a tela diz "Você ainda não entra no ranking deste mês", sem "0º de 40".
3. **Empate na última vaga do pódio:** todos os empatados aparecem (pódio com mais de 5 ou de 3 nomes) e a tela não quebra o layout.
4. **Mês sem meta cadastrada ou sem nenhuma hora:** listas vazias e a mensagem "Ainda não há horas registradas neste mês".
5. **Membro tentando ver a lista completa** chamando `ranking_do_mes` direto: recebe vazio.

Cada ponto tem teste ou conferência na tarefa dona (2, 4 e 5).

---

### Tarefa 1: Regra e contrato atualizados

**Arquivos:**
- Modificar: `docs/regras-de-negocio.md` (seção 12, trecho "Ranking")
- Modificar: `docs/arquitetura.md` (tipos da seção 6 e tabela de funções)
- Modificar: `docs/tarefas-semanas-2-a-4.md` (B12)

**Interfaces:**
- Produz: o contrato que as tarefas 3 a 5 seguem (tipos e funções abaixo).

- [ ] **Passo 1: Seção 12.** Trocar o trecho "Ranking" pelas regras da seção "Regras" do desenho (as que ficam e as que mudam), com "Decidido pelo líder do projeto em 24/11/2026." nas que mudam.
- [ ] **Passo 2: Contrato no `arquitetura.md`.** Tipos (TypeScript):
  - `PosicaoRanking` passa a ter: `posicaoEJ`, `totalEJ`, `posicaoSetor`, `totalSetor`, `horasTotal: number`, `faltamParaPodioEJ: number`, `faltamParaPodioSetor: number` (0 quando já está no pódio).
  - `LinhaPodio { posicao: number; membroId: string; nome: string; setor: string; horasTotal: number; horasSede: number }`
  - `PodioDoMes { ej: LinhaPodio[]; setor: LinhaPodio[] }`
  - `LinhaRankingSetor { posicao: number; setor: string; membrosContados: number; mediaTotal: number; mediaSede: number }`
  - Funções (tabela): `ranking.ts` → `podioDoMes(mes: string): PodioDoMes`, `rankingDosSetores(mes: string): LinhaRankingSetor[]`, `minhaPosicaoNoRanking(mes: string): PosicaoRanking | null` (sai do `progresso.ts`, que passa a reexportar; `null` = não entra no ranking do mês).
- [ ] **Passo 3: B12.** Tirar dela `rankingDoMes` e `minhaPosicaoNoRanking`; anotar "a parte do ranking passou para a entrega do pódio (24/11/2026); a troca do `rankingDoMes` no `rh.ts` entra depois da J10, usando `ranking_do_mes`".
- [ ] **Passo 4: Commit** — `docs: regra e contrato do ranking com pódio`

---

### Tarefa 2: Migração do banco e testes

**Arquivos:**
- Criar: `supabase/migrations/<timestamp>_ranking_e_podio.sql` (com `npx supabase migration new ranking_e_podio`; o timestamp tem de ser maior que `20261119111100`)
- Criar: `supabase/testes/teste-ranking.sql` (arquivo separado, para não conflitar com a `teste.sql` do Bernardo)

**Interfaces:**
- Consome (da B9, PR #9): `public.segunda_da_semana(date)`, `public.meta_da_semana(date)`, `public.horas_da_semana(date, uuid)`; e `public.elegivel_na_semana(perfil, boolean, date, date)`, `public.meu_id()`, `public.ve_tudo()`, `public.setor_que_dirijo()`, `public.meu_setor_id()`.
- Produz (chamadas pelo site com `supabase.rpc`):
  - `ranking_do_mes(p_mes text)` → `table(posicao int, membro_id uuid, nome text, email text, perfil public.perfil, setor text, ativo boolean, data_entrada date, horas_total numeric, horas_sede numeric, dispensado boolean)`
  - `podio_do_mes(p_mes text)` → `table(escopo text, posicao int, membro_id uuid, nome text, setor text, horas_total numeric, horas_sede numeric)`; `escopo` é `'ej'` ou `'setor'`
  - `minha_posicao_no_ranking(p_mes text)` → `table(posicao_ej int, total_ej int, posicao_setor int, total_setor int, horas_total numeric, faltam_para_podio_ej numeric, faltam_para_podio_setor numeric)`; zero linhas = não entra no ranking
  - `ranking_dos_setores(p_mes text)` → `table(posicao int, setor text, membros_contados int, media_total numeric, media_sede numeric)`

Regras de cálculo (todas `p_mes = 'AAAA-MM'`):
- **Base interna** `horas_do_mes(p_mes text)` → `table(membro_id uuid, setor_id uuid, horas_total numeric, horas_sede numeric, dispensado boolean)`: membros elegíveis em pelo menos uma segunda-feira do mês que tenha meta (`meta_da_semana(seg).horas_total is not null`), somando `horas_da_semana(seg)` dessas segundas; `dispensado = false` por enquanto (sem B8). `security definer`, **sem** execução para `authenticated`.
- **Posição:** `rank() over (order by dispensado, horas_total desc, horas_sede desc)` (empate divide a posição), na EJ e por setor (`partition by setor_id`).
- **Pódio:** posição ≤ 5 (EJ) ou ≤ 3 (setor de `meu_setor_id()`), só com `horas_total > 0` e `not dispensado`, ordenado por posição e nome.
- **Faltam:** `greatest(0, ceil((horas_do_ultimo_do_podio - minhas_horas) * 2) / 2)`, onde o último do pódio é a menor `horas_total` entre as linhas do pódio daquele escopo; 0 se estou no pódio ou se o pódio está vazio.
- **Setores:** setores ativos com pelo menos 1 membro não dispensado; `media_total = round(avg(horas_total), 2)`, `media_sede = round(avg(horas_sede), 2)`, posição por `rank() over (order by media_total desc, media_sede desc)`.
- **Quem vê `ranking_do_mes`:** `ve_tudo()` (rh, diretor_rh, presidente) → a EJ toda; `setor_que_dirijo()` não nulo → só esse setor; os outros → nada. As outras três funções: qualquer `authenticated` com `meu_id()` não nulo.
- Arredondar horas devolvidas em 2 casas, como a B9.

- [ ] **Passo 1: Escrever `teste-ranking.sql`**, no formato da `teste.sql` (bloco `do $$ ... $$`, dados com prefixo `zz`, `set_config('request.jwt.claims', ...)` para trocar de pessoa, `assert` com mensagem, e no fim `raise exception 'OK: ranking passou'` para desfazer tudo). Cenário: setor A com 4 membros (Ana 10h com 4h de sede, Beto 8h, Caio 8h, Duda 0h), setor B com 1 membro (Eva 6h), um diretor de setor de A, um membro novo cadastrado nesta semana, e um registro em revisão e um cancelado para a Duda (não podem contar). Asserções:
  - como Duda: `podio_do_mes` escopo `ej` não contém a Duda (0h); se contiver a Ana e o Beto, a posição da Ana é menor (o seed do `horas-dev` tem outros membros com horas, então não dá para fixar a posição exata na EJ); escopo `setor` tem exatamente Ana (1), Beto (2) e Caio (2) — empate dividindo a posição;
  - como Duda: `minha_posicao_no_ranking` tem `horas_total = 0`, `posicao_setor = 4` e `faltam_para_podio_setor = 8`;
  - como Beto: `faltam_para_podio_setor = 0` (está no pódio);
  - como o membro novo: `minha_posicao_no_ranking` sem linhas;
  - como Duda: `ranking_do_mes` sem linhas; nenhuma coluna de `podio_do_mes` traz e-mail;
  - como o diretor de setor: `ranking_do_mes` só com membros do setor A;
  - como Duda: `ranking_dos_setores` tem A com `membros_contados = 4` e `media_total = 6.5` ((10+8+8+0)/4), B com `media_total = 6`, A na posição 1;
  - mês sem meta (`'2020-01'`): as quatro funções voltam vazias.
  
  Os registros ficam na semana atual (que já tem meta no seed), inseridos antes de trocar de pessoa, e o mês testado é o da **segunda-feira da semana atual** (`to_char(seg, 'YYYY-MM')`), porque a semana conta no mês da segunda: no começo de um mês, a semana atual pode pertencer ao mês anterior. As médias e o pódio do setor só envolvem os setores `zz`, por isso podem ser exatos.
- [ ] **Passo 2: Escrever a migração** com as cinco funções acima, `revoke ... from public, anon`, `grant execute` das quatro públicas `to authenticated` e um comentário no topo no estilo da B9 (regras e quem chama).
- [ ] **Passo 3: Ensaio no `horas-dev` com desfazer (pedir o OK do Victor antes).** Se o PR #9 ainda não estiver aplicado lá, rodar numa transação só: as 3 migrações do PR #9, esta migração e o `teste-ranking.sql`, terminando em `rollback`. Esperado: a mensagem `OK: ranking passou` e nada novo no banco depois (conferir que `ranking_do_mes` não existe). Se o PR #9 já estiver aplicado, a transação leva só esta migração e o teste.
- [ ] **Passo 4: Commit** — `db: ranking do mês, pódio e ranking dos setores` (migração e teste juntos).

---

### Tarefa 3: Tipos e funções de dados do site

**Arquivos:**
- Modificar: `src/compartilhado/tipos.ts` (tipos da Tarefa 1)
- Modificar: `src/compartilhado/tipos-banco.ts` (as 4 funções da Tarefa 2, à mão, no formato do `supabase gen types`, com um comentário `// gerar de novo depois de aplicar ranking_e_podio no horas-dev`)
- Criar: `src/compartilhado/api/ranking.ts`
- Criar: `src/compartilhado/api/ranking-falso.ts` (começa com `// FALSO: versão de demonstração, usada só com VITE_LOGIN_FALSO=true (ver ranking.ts)`)
- Modificar: `src/compartilhado/api/progresso.ts` (tirar a `minhaPosicaoNoRanking` falsa e reexportar: `export { minhaPosicaoNoRanking } from './ranking.ts'`)
- Modificar: `src/compartilhado/api/dados-falsos.ts` (só se precisar de um ajudante para empates; `calcularRanking` continua igual)

**Interfaces:**
- Consome: as 3 funções públicas do banco da Tarefa 2 (menos `ranking_do_mes`).
- Produz:
  - `podioDoMes(mes: string): Promise<PodioDoMes>`
  - `rankingDosSetores(mes: string): Promise<LinhaRankingSetor[]>`
  - `minhaPosicaoNoRanking(mes: string): Promise<PosicaoRanking | null>`
  - As três com a mesma assinatura em `ranking-falso.ts`, calculadas a partir de `calcularRanking(mes)` e `membroLogado()`, com as mesmas regras (empate com `rank`, pódio só com horas > 0 e sem dispensados, "faltam" arredondado para cima em 0,5, setores sem dispensados).

- [ ] **Passo 1: Tipos** em `tipos.ts` e `tipos-banco.ts`.
- [ ] **Passo 2: `ranking-falso.ts`.**
- [ ] **Passo 3: `ranking.ts`**: `supabase.rpc(...)`, conversão de snake_case para camelCase, `Number(...)` nos `numeric`, `erroDoBanco` nos erros; `podioDoMes` separa as linhas por `escopo`; `minhaPosicaoNoRanking` devolve `null` sem linha.
- [ ] **Passo 4: `progresso.ts`** com a reexportação. Ajustar quem usa `minhaPosicaoNoRanking` para aceitar `null` (o `InicioMembro.tsx` mostra "Você ainda não entra no ranking deste mês").
- [ ] **Passo 5: Verificar.** Rodar `npm run lint` e `npm run build`. Esperado: sem erros (os avisos `only-export-components` que já existem continuam).
- [ ] **Passo 6: Commit** — `feat: funções de dados do pódio e do ranking dos setores`

---

### Tarefa 4: Página Ranking e cartão do Início (painel do membro)

**Arquivos:**
- Criar: `src/membro/RankingMembro.tsx`
- Criar: `src/compartilhado/ui/ListaPodio.tsx` (lista do pódio, usada no Início e na página)
- Criar: `src/compartilhado/ui/RankingSetores.tsx` (gráfico + lista dos setores, usado aqui e no RH)
- Modificar: `src/membro/paginas.ts`, `src/App.tsx` (rota `ranking` dentro de `/membro`), `src/membro/PainelMembro.tsx` (item `{ para: '/membro/ranking', rotulo: 'Ranking', icone: TrophyIcon }` em `ABAS` e título "Ranking" / "Quem mais registrou horas no mês." em `titulos`)
- Modificar: `src/membro/InicioMembro.tsx` (`CartaoRanking`)
- Modificar: `.claude/launch.json` (configuração `astroclock-demo`: `npm run dev -- --port 5175 --strictPort` com `VITE_LOGIN_FALSO=true` no ambiente)

**Interfaces:**
- Consome: `podioDoMes`, `rankingDosSetores`, `minhaPosicaoNoRanking` (Tarefa 3); `mesAtual`, `rotuloMes`, `somarMeses` de `datas.ts`; `CapsuleBarChart` (`src/compartilhado/ui/CapsuleBarChart.tsx`); `Tabs` do shadcn; `useCarregar` e `Carregavel` de `ui/demo.tsx`.
- Produz: `ListaPodio({ linhas: LinhaPodio[]; destaqueId?: string })` e `RankingSetores({ linhas: LinhaRankingSetor[]; meuSetor?: string })`, usados também na Tarefa 5.

- [ ] **Passo 1: `ListaPodio`**: posição, nome, setor e horas (`Horas`/`formatarHoras`); medalhas visuais para 1º, 2º e 3º; vazio = "Ainda não há horas registradas neste mês".
- [ ] **Passo 2: `RankingSetores`**: `CapsuleBarChart` com uma barra por setor (`sede = mediaSede`, `online = mediaTotal - mediaSede`, `ativo` no setor do membro) e a lista em ordem com média total e número de membros; vazio com a mesma mensagem. (O `CapsuleBarChart` já existe e não usa o recharts: decisão de quem constrói, dentro do que o desenho deixou livre.)
- [ ] **Passo 3: `RankingMembro`**: seletor de mês (6 meses, igual ao `src/rh/Ranking.tsx`), abas **EJ**, **Meu setor** e **Setores**. Em EJ e Meu setor, abaixo do pódio: "Você: {posicao}º de {total} · faltam {x} para o {5º|3º}", ou "Você está no pódio", ou "Você ainda não entra no ranking deste mês".
- [ ] **Passo 4: Rota, menu, título e cartão do Início** (mini pódio com as 3 primeiras linhas de `ej` e link "Ver ranking" para `/membro/ranking`).
- [ ] **Passo 5: Verificar no navegador** com `astroclock-demo` (login falso), perfil membro: página abre nas três abas sem erro no console; trocar de mês; em 360 px nada corta e a barra de baixo mostra os 5 itens; o Início mostra o mini pódio. Conferir os pontos de atenção 1, 3 e 4 trocando o estado no painel de demonstração (lista vazia) ou o mês.
- [ ] **Passo 6: Verificar** `npm run lint` e `npm run build`.
- [ ] **Passo 7: Commit** — `feat: página Ranking com pódio e ranking dos setores no painel do membro`

---

### Tarefa 5: Aba Setores no ranking do RH

**Arquivos:**
- Modificar: `src/rh/Ranking.tsx`

**Interfaces:**
- Consome: `rankingDosSetores` (Tarefa 3) e `RankingSetores` (Tarefa 4).

- [ ] **Passo 1:** Abas **Membros** (o conteúdo atual, sem mudança) e **Setores** (`RankingSetores` com o mês do seletor que já existe). O diretor de setor vê a aba Setores com todos os setores; `meuSetor` destaca o setor dele.
- [ ] **Passo 2: Verificar no navegador** (`astroclock-demo`) como diretor do RH e como diretor de setor: as duas abas abrem, o mês muda as duas, 360 px sem cortes, console sem erros.
- [ ] **Passo 3: Verificar** `npm run lint` e `npm run build`.
- [ ] **Passo 4: Commit** — `feat: aba Setores no ranking do RH`

---

### Tarefa 6: Integração (depois do PR #9)

**Arquivos:**
- Modificar: `src/compartilhado/tipos-banco.ts` (gerado de novo)
- Modificar: `docs/andamento-fase-0.md`

- [ ] **Passo 1:** Quando o PR #9 estiver na `main` e aplicado no `horas-dev` (com a G13), trazer a `main` para a branch e resolver conflitos.
- [ ] **Passo 2: Com o OK do Victor**, `npx supabase db push --linked` (no `horas-dev`) e rodar o `teste-ranking.sql` no SQL Editor. Esperado: `OK: ranking passou`.
- [ ] **Passo 3:** `npx supabase gen types typescript --linked > src/compartilhado/tipos-banco.ts`; `npm run lint` e `npm run build` sem erros.
- [ ] **Passo 4: Login real no `horas-dev`** (`npm run dev`, conta do Victor, perfil `rh`): página Ranking do membro e aba Setores do RH com números iguais aos do SQL.
- [ ] **Passo 5:** Anotar no andamento e abrir o PR pelo site do GitHub (`feat/ranking-podio` → `main`), com o resumo e o resultado dos testes.
- [ ] **Passo 6: Commit** — `chore: tipos do banco gerados de novo com o ranking`
