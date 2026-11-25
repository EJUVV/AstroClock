# Ranking com pódio e ranking dos setores (desenho)

Data: 24/11/2026 · Pedido e decisões: Victor (líder do projeto) · Escrito com a IA.

## Por que

Motivar os membros a registrar mais horas, usando a comparação a favor: ver quem está no topo da EJ e do próprio setor, e o setor disputando com os outros.

Hoje (seção 12 do `regras-de-negocio.md`) o membro vê só a própria posição no ranking do mês. O ranking ainda é todo falso: a versão real era a B12 (Bernardo, semana 4), que não começou.

## Objetivos

- O membro vê, no ranking do **mês**:
  - o **pódio da EJ** (5 primeiros) e a própria posição na EJ;
  - o **pódio do setor** (3 primeiros do setor dele) e a própria posição no setor;
  - o **ranking dos setores** pela média de horas, num gráfico de barras e numa lista.
- Tudo com dados reais do banco (Victor escolheu fazer banco e tela agora, e não só um protótipo).

## Fora do escopo

- Ranking por semana (decidido: **mês**, como já está planejado).
- Selos de horas (fase 2).
- Notificações ou e-mails sobre o ranking.

## O que não pode acontecer (mesmo funcionando)

- **Expor quem está no fim.** Ninguém além do RH, da presidência e do diretor do setor vê a lista completa. O membro vê só o topo e a própria posição.
- **Vazar dados dos colegas.** O pódio mostra só nome, setor e horas. Nada de e-mail, perfil, data de entrada ou registros.
- **Penalizar quem foi dispensado** (por exemplo, por saúde): fica fora da média do setor e no fim do ranking das pessoas.
- **Atrasar o P0.** A entrega entra depois do PR #9 (B7.1, B9, B10) e não mexe nos arquivos da fila G10 → J5 → J10 (`rh.ts`).

## Regras (substituem o trecho "Ranking" da seção 12)

Ficam como estão:

- Período: **mês**. A semana conta no mês da segunda-feira (igual ao `progresso_do_mes` da B9).
- Só contam registros encerrados, não cancelados e fora de revisão (igual à B9).
- Entra no ranking quem é elegível (ativo, perfil `membro` ou `rh`, cadastrado antes da semana) em **pelo menos uma semana do mês** que já tenha meta. Diretores e presidência ficam de fora (não têm meta).
- Ordem: **horas totais**; desempate por **horas na sede**; **dispensados no fim**. Dispensado no mês = todas as semanas do mês dispensadas. Enquanto a tabela de requerimentos (B8) não existir, ninguém está dispensado, como na B9.
- O RH (`rh`, `diretor_rh`) e o `presidente` veem o ranking completo; o `diretor_setor` vê o ranking completo do próprio setor.

Mudam (decididas pelo Victor em 24/11/2026):

- **O membro** (e o `rh`, no próprio painel de membro) vê o **pódio da EJ (5 primeiros)** e o **pódio do setor (3 primeiros)**, com **nome, setor e horas**, e a própria posição na EJ e no setor.
- **Ranking dos setores:** todos os setores ativos, ordenados pela **média de horas totais por membro no mês**; desempate pela média de horas na sede. A média conta os membros que entram no ranking do setor, **sem os dispensados**. Setor sem ninguém que conte não aparece.
- **Todo mundo que entra no sistema vê o ranking dos setores** (membros, diretores, RH e presidência).

## Como vai ser feito (escolhido: banco e tela de verdade, agora)

Caminhos considerados:

- **A. Só planejar e repassar** (regra, contrato e B12 atualizados; tela depois). Não pisa em ninguém, mas não adianta nada visível e depende da B12.
- **B. Banco e tela de verdade, agora** (escolhido pelo Victor). Fica pronto de ponta a ponta. Custos: mexe no banco (área do Bernardo) e na pasta do membro (área do Guilherme), depende do PR #9 e concorre com o fim do P0.
- **C. Tela com dados de demonstração agora e banco depois.** Menos risco, mas nada funciona com dados reais até a B12.

### Banco (uma migração nova, depois das do PR #9)

Criada com `npx supabase migration new ranking_e_podio`, por PR, aplicada no `horas-dev` só depois do PR #9 estar lá e com a aprovação do Victor. Reaproveita `segunda_da_semana`, `meta_da_semana` e `horas_da_semana` da B9, e `elegivel_na_semana`.

- `horas_do_mes(p_mes text)` (interna, não chamada pelo site): uma linha por membro que entra no ranking do mês, com `horas_total`, `horas_sede` e `dispensado`. Soma as semanas cujas segundas caem no mês. **Security definer**, sem permissão de execução para o site.
- `ranking_do_mes(p_mes text)`: ranking completo para quem pode ver (RH e presidência: a EJ toda; diretor de setor: só o setor dele). Mesmas colunas do contrato `LinhaRanking`. Security definer, com a regra de quem vê feita dentro da função (membro recebe vazio).
- `podio_do_mes(p_mes text)`: devolve o pódio da EJ (`escopo = 'ej'`, posição ≤ 5) e o pódio do setor de quem chama (`escopo = 'setor'`, posição ≤ 3). Colunas: `escopo`, `posicao`, `membro_id`, `nome`, `setor`, `horas_total`, `horas_sede`. Security definer, com só essas colunas.
- `minha_posicao_no_ranking(p_mes text)`: `posicao_ej`, `total_ej`, `posicao_setor`, `total_setor`, `horas_total`, `faltam_para_podio_ej`, `faltam_para_podio_setor`. Vazio se quem chama não entra no ranking. Security definer.
- `ranking_dos_setores(p_mes text)`: `posicao`, `setor`, `membros_contados`, `media_total`, `media_sede`. Security definer (as médias usam horas de todos, mas só devolvem números por setor).
- Execução só para `authenticated`; nada para `anon`.
- Casos novos na `supabase/testes/teste.sql`: um membro só vê o topo e a própria posição; o membro não consegue ver a lista completa (`ranking_do_mes` vazio); o diretor de setor só vê o setor dele; a média do setor bate com uma conta feita à mão com o seed; quem tem registro em revisão ou cancelado não ganha horas.

### Site

- **Contrato** (`docs/arquitetura.md`, seção 6, e `src/compartilhado/tipos.ts`):
  - `PosicaoRanking` ganha `horasTotal`, `faltamParaPodioEJ` e `faltamParaPodioSetor` (0 quando já está no pódio).
  - Novo `LinhaPodio` { `posicao`, `membroId`, `nome`, `setor`, `horasTotal`, `horasSede` } e `PodioDoMes` { `ej: LinhaPodio[]`, `setor: LinhaPodio[]` }.
  - Novo `LinhaRankingSetor` { `posicao`, `setor`, `membrosContados`, `mediaTotal`, `mediaSede` }.
  - Funções novas em `src/compartilhado/api/ranking.ts`: `podioDoMes(mes)`, `rankingDosSetores(mes)` e a real de `minhaPosicaoNoRanking(mes)` (o `progresso.ts` passa a reexportar esta última, para não mudar quem já importa de lá).
  - Versões falsas em `ranking-falso.ts`, usadas com `VITE_LOGIN_FALSO=true` (mesmo padrão da G6), para o site de protótipo continuar funcionando.
- **Painel do membro** (`src/membro/`):
  - Página nova **Ranking** (`/membro/ranking`, `RankingMembro.tsx`), com três abas: **EJ**, **Meu setor** e **Setores**. Na EJ e no setor: o pódio e, embaixo, "Você: 12º de 40 · faltam 6h para o 5º" (ou "Você está no pódio"). Em Setores: gráfico de barras com a média de cada setor (recharts, carregado só quando a aba abre) e a lista em ordem, com o setor do membro destacado.
  - Item **Ranking** no menu do membro (`ABAS` do `PainelMembro.tsx`, que também é a barra de baixo no celular).
  - O cartão "Sua posição no ranking" do Início ganha o mini pódio (3 primeiros da EJ) e o link "Ver ranking".
- **Painel do RH** (`src/rh/Ranking.tsx`): aba nova **Setores**, com o mesmo gráfico e a mesma lista, para RH, presidência e diretores.
- Três estados em toda tela (carregando, erro com a mensagem da função, conteúdo) e mensagem para lista vazia ("Ainda não há horas registradas neste mês").
- Funciona bem no celular (360 px).

### Ordem de entrega

1. Regra (seção 12) e contrato (`arquitetura.md`) atualizados nesta mesma branch.
2. Migração e testes do banco.
3. Funções do site (reais e falsas) e tipos.
4. Telas do membro e aba Setores do RH.
5. PR para a `main` depois que o PR #9 entrar; aplicar a migração no `horas-dev` depois da aprovação.

A branch parte da branch do PR #9 (commit `632bdcf`), porque a migração usa funções que só existem nela.

## Decisões que a IA tomou (o Victor pode trocar)

- **Pódio só com quem tem horas no mês.** No começo do mês, um pódio com "0h" não motiva; se ninguém tiver horas, aparece a mensagem de lista vazia. A posição do membro continua aparecendo mesmo com 0h.
- **Empate:** quem tem as mesmas horas totais e de sede divide a posição (1º, 2º, 2º, 4º). Se houver empate na última vaga do pódio, todos os empatados aparecem (o pódio pode ter mais de 5 ou de 3 nomes).
- **"Faltam Xh":** diferença para as horas de quem está na última posição do pódio, arredondada para cima em meia hora.
- **Mês:** a página do membro mostra o mês atual, com seletor dos últimos 6 meses, igual ao ranking do RH.
- **`rankingDoMes` do RH:** a função do banco fica pronta agora, mas a troca no `rh.ts` fica para depois que a J10 entrar, para não brigar com a fila G10 → J5 → J10. Até lá, a lista completa do RH continua falsa.
- **B12 do Bernardo:** a parte do ranking sai dela (fica nesta entrega); sobra o `horasPorDia`.
- **Setores inativos** não aparecem no ranking dos setores.

## O que fica para quem constrói

- Nomes internos de CTEs, índices e detalhes de SQL, desde que as colunas e as regras acima sejam respeitadas.
- O visual do pódio (cores, ícones de 1º, 2º e 3º), seguindo o padrão dos cartões que já existem no Início.
- Textos de ajuda e mensagens de erro, em português.

## Avisos para a equipe

- Guilherme: a página nova fica na pasta do membro, e o `progresso.ts` muda uma linha (reexportação). Combinar para não conflitar com a G11.
- Bernardo: a migração nova depende das funções da B9; a B12 encolhe.
- Johannes: a aba Setores entra no `Ranking.tsx` do RH, fora da fila do `rh.ts`.
