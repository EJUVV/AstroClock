# Andamento da Fase 0

Retrato de onde a Fase 0 parou (atualizado em 26/11/2026). Ao retomar com uma IA, peça para ela ler este arquivo e o [`fase-0.md`](fase-0.md). Quando a Fase 0 terminar, este arquivo pode ser apagado (antes, passe a seção "Ambientes" para o `arquitetura.md` ou o `README.md`).

## Próxima sessão: comece por aqui

Onde paramos (26/11/2026, semana 4): **o cálculo semanal (B9), o cronômetro que para sozinho (B10), as correções da B7 (B7.1), a G10, a J5, a G13, a G12, o ranking com pódio e as diretorias acumuladas estão na `main` e no `horas-dev`.** O site de teste `https://astro-clock-xi.vercel.app` usa login real e o `horas-dev` (sem a demonstração) desde 26/11. Falta trocar os painéis pelo cálculo real (G11 do membro e J10 do RH), a tela de mudar setor (J4) e levar tudo para o `horas-prod` (B14). O acompanhamento das tarefas está no Notion (Quadro de Sprints, projeto AstroClock). As regras estão fechadas no [`regras-de-negocio.md`](regras-de-negocio.md).

### Feito em 26/11/2026

- **Diretorias acumuladas** (regra decidida pelo líder do projeto em 26/11; seção 5 do [`regras-de-negocio.md`](regras-de-negocio.md); desenho em `docs/superpowers/specs/2026-11-26-diretorias-acumuladas-design.md`): feitas com 4 tarefas revisadas uma a uma e uma revisão final (banco, site e documentação) e **juntadas na `main`** em 26/11. A migração `20261126182603_diretorias_acumuladas` foi **aplicada no `horas-dev`** e as 3 suítes passaram no SQL Editor (`teste.sql`, `teste-ranking.sql` e `teste-diretorias.sql`); tipos do banco gerados de novo.
- **Setor desativado encerra a diretoria** (decidido pelo líder do projeto em 26/11, na revisão final): migração nova `20261126210425_encerrar_diretoria_setor_inativo` e caso novo na `teste-diretorias.sql`. **Aplicada no `horas-dev`** em 26/11; as 3 suítes passaram de novo.
- **Como ficou o `horas-dev`:** os setores **RH e Gestão e Qualidade estão vagos** (sem diretor). Para testar, o **perfil do Victor virou `presidente`** no `horas-dev`, e o presidente do seed (Rafael Souza) foi desativado (só pode haver um presidente ativo).
- **B14 (atenção):** tem que levar **as duas migrações** (`diretorias_acumuladas` e `encerrar_diretoria_setor_inativo`) **antes** de publicar o site de produção (sem elas o login novo falha), e depois os **passos manuais do RH** no SQL Editor: marcar o setor RH (`eh_rh = true`) e registrar a diretoria do primeiro diretor do RH (linha em `diretorias` e linha aberta em `historico_diretorias`). Sem isso ninguém tem os poderes do RH. Passo a passo na B14 ([`tarefas-semanas-2-a-4.md`](tarefas-semanas-2-a-4.md)); o `seed.sql` faz o mesmo para um banco novo.
- **Site de teste com login real:** no projeto `astro-clock` da Vercel, o login falso e o painel de demonstração foram desligados e as variáveis apontam para o `horas-dev` (26/11). O endereço aberto é `https://astro-clock-xi.vercel.app` (o `astro-clock-ejuvv.vercel.app` pede login da Vercel). **Falta o Victor:** adicionar `https://astro-clock-xi.vercel.app/inicio` nas Redirect URLs do `horas-dev` (Supabase → Authentication → URL Configuration). A demonstração continua só local (`npm run dev` com `VITE_LOGIN_FALSO=true`).

### Revisão de 23/11 e conferência de 24/11/2026 (início da semana 4)

As revisões de 23/11 foram feitas pelo Victor e registradas no Notion; em 24/11 a IA passou o resumo para cá e conferiu o GitHub, o `horas-dev` (só leitura) e o DNS.

- **Bernardo (B7.1, B9 e B10):** entregues em 19/11 numa branch enviada pelo upload do site (`B7.1,-B10-e-cálculo-da-semanaD`, commit `632bdcf`): 3 migrações novas (`20261117214000_correcoes_da_revisao_b7`, `20261119111000_cronometro_encerra_sozinho`, `20261119111100_calculo_da_semana`) e a `teste.sql` atualizada. Revisadas e aprovadas no conteúdo em 23/11; o Victor abriu o **PR #9** a partir da branch, com a CI passando. Ainda não está na `main` nem aplicado no `horas-dev` (a última migração lá continua a `20261112170000`).
  - A B10 faz o banco dividir o cronômetro na meia-noite, cortar em 10h e gravar o fim com a hora do servidor (isso resolve a regra que estava pendente sobre a parte do dia seguinte). Como o site também dividia, **a B10 só vai para o `horas-dev` junto com a G13** (Guilherme), para as duas divisões não brigarem.
  - Funções da B9 para o site: `progresso_da_semana(p_semana)` e `progresso_do_mes(p_mes)` (membro, G11) e `percentual_da_semana`, `resumo_da_semana`, `abaixo_da_meta`, `medias_da_semana`, `progresso_de_membro` e `semanas_seguidas_abaixo` (RH, J10).
- **Johannes (J5):** entregue em 18/11 na branch `johannes/membros-real`, sem PR. O `membros.ts` está bom; faltam 3 ajustes: (1) `alterarMetas` usa `upsert` e o banco só aceita `insert` (ler pela visão `lista_de_metas`); (2) as 3 funções de metas não têm o `if (loginFalso)`, o que quebra o site de protótipo; (3) depois que a G10 entrar, trazer a `main` e resolver o conflito no `rh.ts`. Novo prazo: 24/11.
  - **O e-mail do Johannes no `horas-dev` ainda é o provisório** (conferido em 24/11): sem a troca, ele não consegue testar a J5 com o login real.
- **Guilherme (G10):** as 3 correções da revisão de 17/11 ainda não foram feitas, e não há PR. Novo prazo: 24/11. É a primeira a entrar na `main`.
- **Ordem do `rh.ts`:** G10 → J5 → J10. A J10 passa para o Guilherme se não andar até 25/11.
- **Tarefas novas no Notion (23/11):** G13 (parar o cronômetro do jeito da B10, até 25/11), J10 (painel do RH com o cálculo real, até 26/11), B14 (migrações no `horas-prod` com o Victor, até 26/11, depois do PR #9 na `main` e testado no dev) e G12 (a tela de Configurações da `atualDev`, como extra, até 27/11). A troca das funções do site saiu da B9: a do membro ficou na G11 (até 25/11) e a do RH na J10.
- **Perfis da equipe no `horas-dev`:** Victor, Johannes e Guilherme como `rh`; Bernardo como `membro`. O Guilherme volta para `membro` antes do teste da G11.
- **E-mail da EJ (relatório do Victor, 24/11):** o DNS do `ejuvv.com` foi migrado do UOL Host para a Hostinger em 24/11, às 15h16. A Hostinger criou sozinha os registros do e-mail dela, e o recebimento ficou intermitente até cerca de 19h30. Corrigido no mesmo dia (MX `smtp.google.com`, SPF do Google e DMARC) e validado às 20h14. Quem cuida de cada coisa agora: **registro do domínio no UOL Host**, **DNS e site institucional na Hostinger** (hPanel → Domínios → ejuvv.com → DNS), **e-mail no Google Workspace**. Nunca usar "Redefinir registros DNS" nem ativar o e-mail da Hostinger: isso derruba o e-mail da EJ. **DKIM ativo desde 25/11** (ver "Feito em 25/11"). A falha de DNS vista em 19/11 provavelmente tem a ver com os MX do Google estarem desativados na zona antiga do UOL (ponto em aberto no relatório).

### Feito em 25/11/2026

- **Google Workspace (com a conta de administradora da presidente):** verificação em duas etapas liberada para a organização ("Permitir que os usuários ativem", sem obrigar). **DKIM gerado e ativo:** registro TXT `google._domainkey` (chave de 2048 bits) publicado na zona da Hostinger e "Iniciar autenticação" no Admin. Teste com um e-mail de `@ejuvv.com` para um Gmail de fora: **SPF, DKIM e DMARC com PASS**. Próximo passo possível (sem pressa): trocar o DMARC de `p=none` para `p=quarantine` depois de algumas semanas sem problemas.
- **E-mails do sistema (decidido em 25/11):** saem pela **conta da diretoria de RH** (endereço a confirmar), e não por uma conta nova `astroclock@ejuvv.com` — sem licença nova, e as respostas caem na caixa do RH. Quem tem a conta liga a verificação em duas etapas nela e cria a senha de app "AstroClock" (vai só para os segredos do Supabase). Cuidado na passagem de gestão: trocar a senha da conta ou desligar a verificação revoga a senha de app e para os e-mails.
- **G10 na `main`** (PR #10, aceito pelo Victor em 24/11 às 22:28). Falta testar a revisão de cronômetros no `horas-dev` (auditoria vazia; em 25/11 havia 3 cronômetros esperando revisão, 2 deles encerrados sozinhos pela B10).
- **J5 na `main`:** o Johannes trouxe a `main` e pôs a versão de demonstração nas metas; a IA fez o ajuste que faltava (`alterarMetas` com `insert` e leitura pela `lista_de_metas`, commit `687d974`). Testada pelo Victor com o login real (membros e metas sem erro). **Entrou na `main` sem PR, por erro da IA:** a branch `docs/cancelar-meta` foi criada a partir da `johannes/membros-real` (aberta no GitHub Desktop para o teste) e levou a J5 junto no merge. Ficou na `main`. O Johannes segue a J4 e a J10 a partir da `main`; a `johannes/membros-real` pode ser apagada. A tela de mudar o setor ainda não existe (é a J4).
- **Perfil do Victor no `horas-dev`:** foi `diretor_rh` para testar as metas e voltou para `rh` (o próprio Victor trocou) para testar o cronômetro. Hoje não há diretor do RH ativo no dev.
- **Dados de teste desfeitos:** a meta de 13h para 30/11 foi substituída por 10h/5h (vale a mais nova) e o membro "teste01 da silva" foi desativado.
- **Cancelar meta programada (decidido em 25/11):** opção de marcar como cancelada, sem apagar. Regra na seção 1 do `regras-de-negocio.md`; tarefas novas **B15** (banco) e **J11** (botão), em `tarefas-semanas-2-a-4.md`. Enquanto não existir, desfazer uma meta programada = lançar de novo a meta certa para a mesma segunda.
- **PR #9 e G13 na `main` e no `horas-dev`:** a G13 (o `pararCronometro` só manda o update; o banco divide na meia-noite e corta em 10h) foi feita pelo Victor com a IA, para destravar o PR #9 (commit `f1c7922`). PR #9 e G13 juntados na `main`; as 3 migrações aplicadas com `npx supabase db push --linked`. A `teste.sql` do Bernardo passou no SQL Editor, a tarefa agendada `encerrar-cronometros-esquecidos` está ativa e o Victor testou parar o cronômetro com o login real. **B7.1, B9, B10 e G13 marcadas como concluídas no Notion.**
- **Ranking na `main` e no `horas-dev`:** migração `ranking_e_podio` aplicada, `teste-ranking.sql` passando ("OK: ranking passou"), tipos do banco gerados de novo, testado pelo Victor com o login real e juntado na `main` (commit `7c1b03f`).
- **G12 (Configurações) na `main`** (PR #12 do Guilherme, juntado à noite, commit `89b2e6e`; concluída no Notion). Na revisão, a IA fez na própria branch, a pedido do Victor: tema claro sem o desfoque nos cartões (`backdrop-filter` refeito a cada quadro pelo fundo animado, a mesma causa da lentidão de 14/11); erro na tela quando o navegador não deixa salvar a foto; botão "Escolher foto". **Foto do Google por padrão** (decisão do Victor, de acordo com a regra dos selos): função nova `minhaFotoDoGoogle()` no `auth.ts`; a foto escolhida nas Configurações tem prioridade e fica só no aparelho. Falta conferir a foto do Google com o login real. O seletor de tema saiu do menu e do topo e agora fica só nas Configurações.
- **Google Cloud acertado (destrava o login na produção):** verificação em duas etapas ativada na `victor.gomes@ejuvv.com` e, no cliente OAuth "AstroClock Supabase" (projeto `astroclock-512918`), adicionado `https://gzjmavrrkqfqtqjycdnq.supabase.co/auth/v1/callback`. Ficam o do dev (`cwvnzzqpqohvqjzigalu`) e o do prod; o do prod antigo (`zetjgqdagnlkodbexnoe`) era para ser removido na mesma tela (confirmar). **Teste às 23h07:** o Google aceitou e voltou para `astroclock.ejuvv.com/inicio`; o site mostrou "Não foi possível falar com o servidor" porque o `horas-prod` ainda não tem as migrações (a função `meu_perfil()` não existe lá). Isso se resolve com a B14.
- **Identidade visual na `main`** (PR #13, juntado à noite, commit `5e7ee97`; V11 no Notion, concluída). Ideias do Victor, feitas com a IA:
  - **Cor de cada setor:** Projetos azul (`#2563eb`), Comercial vermelho (`#e03131`), RH verde (`#2f9e44`), Gestão e Qualidade laranja (`#f08c00`), Marketing roxo (`#a855f7`); RH e Gestão e Qualidade trocados pelo Victor em 26/11 (eram rosa e verde-água). Contraste conferido nos dois temas; para quem tem daltonismo, azul e roxo ficam parecidos, e vermelho, verde e laranja também, por isso a cor sempre aparece com o nome do setor. Aparecem como bolinha ao lado do nome do setor (`EtiquetaSetor`) no pódio, na sede, em membros, no ranking, na visão geral, na revisão de cronômetros e nas Configurações. Setor criado depois fica cinza. **Ainda podem mudar** depois da conversa do Victor com o time (uma linha em `src/compartilhado/ui/coresSetor.ts`). O vermelho do Comercial é quase o de "abaixo da meta": dá para conviver porque só aparece na bolinha.
  - **Gráficos:** "Horas por dia" e "Últimas 8 semanas" viraram colunas finas com escala em horas e linhas de grade, a partir do zero (`GraficoColunas`, no lugar do `CapsuleBarChart`, que foi apagado). O ranking dos setores virou uma lista com barras horizontais na cor de cada setor.
  - **Ranking do mês no topo do Início do membro:** primeiro cartão no celular; no computador, no lugar do número "Posição no ranking", agora com o mini pódio.
  - **Cartão no estilo "pico"** (`CartaoPico`, inspirado no "Peak Chart" do 21st.dev, feito à mão em SVG e CSS): "Cumpriram a meta" na Visão geral do RH, com as últimas 8 semanas (o celular passa a ver a tendência), e o cartão novo "Horas no mês" no Início do membro. **Em 26/11 (PR #14, commit `e504741`):** o gráfico de área das 8 semanas do RH no computador saiu, por decisão do Victor (repetia o cartão do pico); no lugar entrou o "Ranking dos setores" do mês, ao lado da rosca "Situação da semana". A série do "Cumpriram a meta" passou a buscar só as 8 semanas que mostra (metade das consultas), e o `AreaChartCard.tsx` foi apagado.
  - Sem biblioteca nova e sem desfoque; com "reduzir movimento", as animações ficam paradas. Testado no navegador (celular e computador, temas claro e escuro).

### Ranking com pódio (feito em 24/11, na `main` e no `horas-dev` desde 25/11/2026)

Funcionalidade nova pedida pelo Victor para motivar os membros a registrar mais horas.

- **Regra nova (seção 12):** o membro vê o pódio da EJ (5 primeiros) e o do setor (3 primeiros), com nome, setor e horas, a própria posição e quanto falta para o pódio; todos veem o ranking dos setores pela média de horas por membro no mês (sem dispensados). Período continua o mês.
- **O que entrou:** desenho e plano em `docs/superpowers/`; migração `20261125005432_ranking_e_podio.sql` (`ranking_do_mes`, `podio_do_mes`, `minha_posicao_no_ranking`, `ranking_dos_setores`) e `supabase/testes/teste-ranking.sql`; `src/compartilhado/api/ranking.ts` (e `ranking-falso.ts`); página **Ranking** do membro (abas EJ, Meu setor e Setores), item no menu, mini pódio no Início e aba **Setores** no ranking do RH.
- **Verificado:** lint e build; navegador no modo de demonstração (computador e 360 px); revisão final por um revisor separado (nada crítico; as 2 correções importantes entraram); `teste-ranking.sql` no `horas-dev`; login real pelo Victor.
- A lista completa do RH continua falsa até a J10 (a função `ranking_do_mes` já está no banco); a B12 encolheu (sobrou o `horasPorDia`).
- **Decisão pendente do Victor:** em setor com 1 ou 2 membros, a média revela as horas de alguém. Opções: mostrar só setores com 3 ou mais membros (sugestão da IA), aceitar e registrar na regra, ou esconder o número de membros.
- **Pequenos, para depois:** aba Setores com todos em 0h mostra "1º" para todos; a aba da página do membro volta para "EJ" ao trocar de mês; a demonstração não filtra quem entrou na semana.
- **Avisar:** Guilherme (página nova na pasta do membro; `progresso.ts` reexporta `minhaPosicaoNoRanking` de `ranking.ts`, atenção na G11), Bernardo (B12 menor; a migração depende da B9) e Johannes (aba Setores no `Ranking.tsx`).

### Produção (V7), montada em 24/11/2026

- **Vercel:** projeto novo **`astroclock-prod`** (time EJUVV), ligado ao repositório, com deploy automático da `main`. Variáveis só de produção: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (chave publishable) do `horas-prod`, **sem** `VITE_LOGIN_FALSO` e **sem** `VITE_MOSTRAR_DEMO`. O protótipo `astro-clock` continua como estava.
- **Domínio:** **`https://astroclock.ejuvv.com`**, com o CNAME `astroclock` → `6fa0201913852cd0.vercel-dns-017.com` na zona da Hostinger. A Vercel reconheceu e emitiu o certificado. Os registros do e-mail não foram tocados.
- **Primeiro deploy:** commit `0cc32c4`. A tela de login abre sem erros e o site fala com o `horas-prod`.
- **Supabase `horas-prod`:** provedor Google ligado; Site URL `https://astroclock.ejuvv.com`; Redirect URL `https://astroclock.ejuvv.com/inicio`.
- **Teste de login (24/11):** **falhou com `redirect_uri_mismatch`** (Google). **Resolvido em 25/11** (ver "Feito em 25/11"). O endereço `https://gzjmavrrkqfqtqjycdnq.supabase.co/auth/v1/callback` **não está** no cliente OAuth "AstroClock Supabase". Para cadastrar, é preciso entrar no console do Google Cloud, que desde 20/10/2026 exige verificação em duas etapas; a organização `ejuvv.com` ainda não permite ativar, e a `victor.gomes@ejuvv.com` não é administradora do Workspace.
- **Atenção:** a partir de agora, **todo envio para a `main` vai para a produção**. Enquanto o banco do prod estiver vazio não tem efeito, mas depois do piloto a `main` precisa estar sempre estável.
- **Falta para a produção:** (1) ~~o cadastro do endereço no Google Cloud~~ (feito em 25/11); (2) a B14 (migrações e primeiro diretor do RH no `horas-prod`); (3) testar de novo o login, que deve entrar no painel certo.

### Conferência de 17/11/2026

Conferido no GitHub, no código e no `horas-dev` (só leitura):

- **GitHub:** nada novo desde 16/11. Ainda não há branch da B7.1 (Bernardo) nem da J5 (Johannes), as duas com prazo em 17/11. A `atualDev` continua parada em 13/11.
- **Código:** `npm run lint` sem erros (6 avisos `only-export-components`) e `npm run build` OK (aviso de um pedaço de 656 kB, acima do limite de 500 kB do Vite).
- **`horas-dev`:** as 6 migrações da pasta `supabase/migrations/` aparecem como aplicadas; 6 tabelas, todas com RLS (117 registros, auditoria vazia). O e-mail do Guilherme já foi trocado; falta só o `troque.johannes`.
- **Correção da revisão de 16/11:** o conector do Supabase voltou a funcionar (enxerga o `horas-dev` e o `horas-prod`), e o CLI deste computador está logado e ligado ao `horas-dev`.
- **Atenção:** o conector do Supabase tem permissão de escrita nos dois bancos, inclusive no `horas-prod`. Quem impede uma IA de mexer na produção é a regra do `AGENTS.md`, não a permissão do conector.
- **Ferramentas deste computador:** sem GitHub CLI (`gh`), sem Python e sem Docker. Sem o `gh`, a IA não abre nem revisa PRs. Python e Docker não fazem falta hoje.
- **Arquivo solto no repositório:** `Claude outputs/AstroClock-visual-roxo.zip` (34 kB, do commit `11756ac`). Decidir se sai do repositório.

### Revisão da G10 (17/11/2026)

O Guilherme subiu a G10 na branch `feat/Revisão-de-cronômetros-e-correções-do-RH-reais` (commit `30f31d0`, 17/11 às 12:28). Revisada pelo Victor com a IA; **ainda não juntada na `main`**.

- **Bom:** as 6 funções de `rh.ts` (`cronometrosEmRevisao`, `revisarCronometro`, `buscarRegistrosDoMembro`, `criarRegistroDeMembro`, `editarRegistroDeMembro`, `cancelarRegistroDeMembro`) seguem o contrato do `arquitetura.md` e usam as funções do banco da B7. Motivo obrigatório no site e no banco. A versão falsa foi para `rh-falso.ts` (com `VITE_LOGIN_FALSO=true`), no mesmo padrão da G6. Correção que passa da meia-noite usa o `partesPorDia` e desfaz as partes criadas se uma falhar. `erroDoBanco` diz "deste membro" quando é o RH. Lint e build OK; as assinaturas das 4 funções batem com o `horas-dev`; sem conflito com a `main`.
- **Trava o teste:** a tela do membro no RH (`DetalheMembro.tsx`) e a revisão de cronômetros pegam os membros da lista falsa (`membros.ts`, ids `m1`, `m2`...). Com login real, o id falso vai para o banco, que recusa: o RH veria "Não foi possível salvar. Tente de novo." ao abrir um membro, e a revisão fica sem os nomes. **A G10 só pode ser testada por inteiro depois da J5** (membros reais, do Johannes).
- **Correções pedidas ao Guilherme:**
  1. Gerar de novo o `tipos-banco.ts` com `npx supabase gen types typescript --linked > src/compartilhado/tipos-banco.ts`. Foi editado à mão e ainda tem a `dispensas` (já apagada) e não tem a `auditoria`.
  2. Branch sem acento e em minúsculas (ex.: `feat/g10-revisao-e-correcoes-rh`), commit no formato `feat: ...` (o atual é "atualizacion") e PR para a `main`.
  3. `editarRegistroDeMembro`: se o registro era um cronômetro ainda ligado e uma parte falha, o desfazer não volta ele para "ligado". Avisar no erro ou bloquear a edição de cronômetro ligado pelo RH (o Guilherme escolhe e conta ao Victor).
- **Perfil do Guilherme no `horas-dev`:** trocado de `membro` para `rh` em 17/11, a pedido do Victor, para ele testar a G10 (o banco só deixa o RH revisar e corrigir). **Voltar para `membro` antes do teste da G11.** O Victor também está como `rh` no `horas-dev` (o seed dizia `diretor_rh`).
- **No `horas-dev`:** 1 registro esperando revisão e `auditoria` vazia; ninguém testou essas funções no banco ainda.

### Revisão de 16/11/2026 (início da semana 3)

Conferido no GitHub, no Notion, no código e no `horas-dev` (só leitura):

- **Guilherme:** G5 e G6 na `main` e testadas. A branch `atualDev` (13/11) tem uma tela de Configurações (foto de perfil guardada no aparelho e botão para desligar o fundo animado). Está fora do plano, partiu de uma `main` antiga e tem cópias de rascunho (`LayoutPainel-1.tsx`, `PainelMembro-1.tsx`); a decisão do que fazer com ela fica com o Victor e o Guilherme.
- **Johannes:** J4, J5 e J6 vencidas em 15/11, sem branch no GitHub. `membros.ts` e as metas do `rh.ts` não fazem nenhuma chamada ao banco, e nenhuma tela chama o `alterarSetor`.
- **Bernardo:** as 5 correções da B7 não começaram (sem branch).
- **`horas-dev`:** sem login, nenhuma tabela é lida (protegido). `requerimentos` e `presenca_sede` ainda não existem; `dispensas` já saiu. O conector do Supabase pede nova autorização e o CLI deste computador está desligado do projeto, então o histórico de migrações não foi conferido.
- **Replanejamento:** a semana 3 ficou só com o P0 (cálculo semanal, cronômetro que para sozinho, revisão e correções do RH, membros e metas reais). O requerimento inteiro (B8, G7, G8, J6, J7) passou para a semana 4. A J8 passou do Johannes para o Guilherme, como G10, e o Guilherme ganhou a G11 (painel do membro com o cálculo real). Tarefas novas no Notion: B7.1, B9, B10, G10 e G11; J4, J5 e J6 marcadas como atrasadas, com prazo novo.

### Feito em 13 e 14/11/2026

- **G5 e G6 do Guilherme na `main`** (commit `8b80bf4`, juntado em 14/11): `registros.ts` e `cronometro.ts` reais, com as versões falsas em `registros-falso.ts` e `cronometro-falso.ts` (ligadas por `VITE_LOGIN_FALSO=true`). Novo `banco.ts` com o que as funções reais compartilham: tradução dos erros do banco para português e `meuId()`. Registro que passa da meia-noite vira um por dia (`partesPorDia` em `datas.ts`), com as marcas "Continua no dia seguinte" e "Continuação do dia anterior" na lista. Testado pelo Victor no `horas-dev`.
- **Data e fluidez** (branch `feat/form-data-e-fundo-leve`, juntada em 14/11, pedido do Victor depois de testar a G6):
  - Formulário de registro: botões Hoje, Ontem e "Outro dia", que abre um calendário com só os dias permitidos (7 dias para o membro, sem limite para o RH). A duração aparece embaixo dos horários.
  - Fundo animado mais leve: ~30 quadros por segundo, linhas desenhadas em grupo, resolução limitada a 1,5x e pausa enquanto uma janela está aberta.
  - Janelas (gaveta, diálogo, confirmação) sem desfoque atrás: o desfoque era refeito a cada quadro por cima do fundo animado e travava a abertura. No lugar, uma camada escura um pouco mais forte.
  - `meuId()` guardado durante a sessão, sem uma consulta extra a cada busca.
- As branches de 14/11 entraram na `main` direto pelo Git, a pedido do Victor (sem a tela de PR, porque o GitHub CLI não está instalado neste computador).
- **Limpeza:** apagadas 9 branches já juntadas na `main`. Sobrou só a `atualDev`, do Guilherme, que tem commits fora da `main`.
- **Responsividade** (branch `ui/responsividade`, juntada em 14/11): revisão automática em 44 combinações de tela (360, 390, celular deitado e 1024 px) nos perfis membro, diretor do RH e diretor de setor, mais conferência visual tela por tela.
  - Login no celular: o logo alargava o cartão e empurrava tudo para a direita, cortando o botão do Google. Agora fica centralizado.
  - Painel do RH, diretores e presidência: abaixo de 1024 px, barra embaixo com Visão geral, Membros e Requerimentos (o diretor de setor fica com Ranking) e um botão "Mais" com o resto, no lugar do menu ☰ (decisão do Victor). A barra é a mesma do membro (`BarraInferior.tsx`), com fundo opaco.
  - Tabela de membros sem a coluna Status cortada; cartões com selo usando a largura toda quando estreitos; gráfico das 8 semanas, revisão de cronômetros e ranking cabendo no celular.
- **Notion:** B6, B7, G5 e G6 marcadas como concluídas. O trabalho de 14/11 entrou como V8 (calendário e fluidez) e V9 (responsividade), já concluídas.

### Feito em 11 e 12/11/2026

- **E-mail pelo Gmail da EJ, sem Resend** (PR #4, 11/11): V5 e G8 reescritas em [`tarefas-semanas-2-a-4.md`](tarefas-semanas-2-a-4.md).
- **`horas-prod` recriado em São Paulo** (PR #5, 11/11, juntado em 12/11): ref `gzjmavrrkqfqtqjycdnq`, ainda vazio. Ver a seção "Ambientes".
- **Bernardo subiu B6 e B7** (commit `6d90a69`, 12/11 às 17:55): 6 arquivos em `supabase/migrations/`, `supabase/seed.sql` e `supabase/testes/teste.sql`. A B7 (`20261112170000_regras_de_registros.sql`) cria as regras de `registros`, a tabela `auditoria`, `meu_setor_id()`, libera o insert em `metas` e `setores` e apaga `dispensas`.
  - **Atenção:** o commit foi direto na `main` por engano: no "Add files via upload" do GitHub, o destino padrão é a `main`, e a branch `db/migracoes` (criada por ele, ainda vazia) não foi escolhida. O [`CONTRIBUTING.md`](../CONTRIBUTING.md) proíbe commit direto na `main` e pede aprovação do Victor para tudo que mexe em `supabase/migrations/` ou RLS.
  - Depois do commit, ele rodou a B7 à mão (SQL Editor) no `horas-dev`.
- **Revisão da B6 e da B7 pelo Victor** (12/11): estrutura boa, prazos de 7 dias e regras do cronômetro batendo com o `regras-de-negocio.md`. Decisões novas de regra, já passadas para o `regras-de-negocio.md`: o `presidente` revisa cronômetro e lê a auditoria; o `diretor_setor` não revisa; o fim do cronômetro é sempre a hora em que a pessoa clica em parar; o registro manual não termina no futuro.
- **Correções pedidas ao Bernardo** (migração nova na `db/migracoes`, com PR):
  1. `revisar_cronometro`: liberar também para o `presidente` (hoje só `rh` e `diretor_rh`).
  2. Parar o cronômetro pelo site: o banco grava `fim = now()`, ignorando o horário mandado.
  3. Registro manual: o fim não pode ser no futuro (no lançamento e na edição pelo site).
  4. `setores`: voltar o grant de insert e update só para `nome` e `ativo`.
  5. Atualizar a `supabase/testes/teste.sql` com esses casos.
  - A auditoria lida pelo `presidente` fica como está (já é o que a B7 faz).

### Feito em 10/11/2026 (Claude Code com o Victor)

- Conexões conferidas: Supabase (`horas-dev` e `horas-prod`), Notion (Central Ejuvv) e Vercel (time ejuvv, projeto `astro-clock`, com acesso liberado ao time).
- **Login real (B4)**, branch `feat/login-google`: `auth.ts` real, login falso movido para `auth-falso.ts` e ligado só com `VITE_LOGIN_FALSO=true`. A tela de login destrava o botão "Entrando..." quando a pessoa volta do Google pelo botão "voltar" do navegador.
- Provedor Google ligado no `horas-dev` (M5) e e-mail provisório `troque.victor@ejuvv.com` trocado pelo do Victor no seed do banco.
- Variável `VITE_LOGIN_FALSO=true` criada na Vercel (preview e production), para o site de protótipo continuar com a troca de perfil depois do merge.
- Tarefas das semanas 2 a 4 escritas em [`tarefas-semanas-2-a-4.md`](tarefas-semanas-2-a-4.md). A semana 2 já estava no Notion; as semanas 3 e 4 ainda serão ajustadas pelo Victor antes de ir para o Notion.

### Como está o `horas-dev` (conferido em 12/11/2026, depois da B7)

- Tabelas: `membros`, `setores`, `metas`, `registros`, `historico_setor` e `auditoria` (a `dispensas` saiu). Todas com RLS; `registros` com leitura por perfil e escrita só nos próprios. Seed com 20 membros (5 perfis) e 115 registros.
- Funções do RH para corrigir registros e revisar cronômetros já existem (ver `arquitetura.md`, seção 5).
- **Histórico de migrações em dia** (13/11/2026): o Victor rodou o `migration repair` no `horas-dev`, e as 6 migrações aparecem como aplicadas no `npx supabase migration list`. A próxima migração já pode ir pelo `npx supabase db push`.
- **CLI:** use `--linked` nos comandos `migration list`, `migration repair` e `db push`. O CLI avisa que, na próxima versão grande (v3), esses comandos passam a mirar o banco local se o `--linked` não for passado. Este computador está na v2.122.0, ligado ao `horas-dev`. A v3.2.0 já saiu (aviso de 17/11); a recomendação é ficar na v2 até o fim da semana 3 e, ao atualizar, sempre passar o `--linked`.

### Próximos passos

Semana 4 (23 a 27/11). Meta: o piloto completo, em produção. O teste com membros começa em 07/12. Tarefas e prazos no Notion (Quadro de Sprints).

1. **Guilherme:** G11 (painel do membro com o cálculo real), que venceu em 25/11 e ainda não tem branch. Antes, `git pull` na `main`: o PR #12 entrou com 2 commits da revisão por cima, e o PR #13 mudou bastante o `InicioMembro.tsx` (ranking no topo, cartão "Horas no mês" e `GraficoColunas` no lugar do `CapsuleBarChart`). A G12 já está na `main`. Pode herdar a J10 se ela não andar.
2. **Johannes:** J4 (tela de mudar o setor) e J10 (painel do RH com o cálculo real), a partir da `main` atual, depois de um `git pull`: o PR #13 mudou a `VisaoGeral.tsx` ("Cumpriram a meta" virou o `CartaoPico`) e trocou o setor pela `EtiquetaSetor` em várias telas do RH. A J5 já está na `main`.
3. **Bernardo:** B14 com o Victor (26/11): aplicar no `horas-prod` todas as migrações da `main` (sem o seed) e cadastrar o primeiro diretor do RH. Depois, B15 (cancelar meta).
4. **Victor:**
   - Testar a revisão de cronômetros (G10) com o perfil `rh`: aprovar um e reprovar outro; depois marcar a G10 como concluída.
   - V7: a produção está montada e o login com Google passa (Google Cloud feito em 25/11). Falta a B14 com o Bernardo (26/11) e testar o login de novo.
   - V6 (validação com o RH) assim que a B9 estiver no `horas-dev` e a J10 na `main`.
   - Ranking com pódio: decidir o caso dos setores pequenos (mostrar só setores com 3 ou mais membros, ou deixar como está).

### Tarefas do Victor fora da IA

- **E-mail do Johannes no `horas-dev` (urgente para a J5):** trocar `troque.johannes@ejuvv.com` (tabela `membros`) pelo `@ejuvv.com` real. Ainda provisório em 24/11. Sem isso, ele passa pelo Google, mas o site responde "Acesso negado. Procure o RH."
- **Decidir a G8 antecipada:** se quiser que o Guilherme comece a G8 nesta semana, fazer a V5 agora e passar a senha de app a ele só por canal privado.
- **Perfil do Guilherme:** pedir para voltar para `membro` no `horas-dev` quando ele for testar a G11.
- **GitHub CLI:** instalado e logado (`victordiniz-dev`) nos dois notebooks do Victor. A IA abre, revisa e junta PRs pelo `gh`.
- **V6:** validação com o RH depois que a B9 estiver no `horas-dev` e a J10 na `main` (a reunião de 19/11 não ficou registrada aqui; o plano da semana 4 seguiu o Notion de 23/11).
- **Regra do cronômetro na meia-noite:** resolvida pela B10 e pela G13 (o banco divide na meia-noite e corta em 10h; o site só manda parar).
- **Resend:** revogar a chave criada antes da decisão de usar o Gmail da EJ.
- **Google Cloud:** feito em 25/11 (ver "Feito em 25/11"). Só confirmar se o endereço do prod antigo (`zetjgqdagnlkodbexnoe`) saiu do cliente "AstroClock Supabase".
- **Ranking, setores pequenos:** decidir até a lista de membros do RH chegar (26 ou 27/11). Se algum setor tiver menos de 3 membros, a sugestão é mostrar só setores com 3 ou mais.
- **Lista de membros do RH** (nome, e-mail `@ejuvv.com`, setor e perfil): o Victor pega em 26 ou 27/11, para o cadastro na estabilização.
- **V5 (conta de envio):** usar a conta da diretoria de RH (decidido em 25/11; confirmar o endereço). Quem tem a conta ativa a verificação em duas etapas e cria a senha de app "AstroClock"; depois, gravar `EMAIL_REMETENTE` e `EMAIL_SENHA_APP` nos segredos do Supabase com a IA. Só é usada na G8, que depende do requerimento (B8).
- **Domínio e DNS:** o `ejuvv.com` vale até 21/02/2027 (registro no UOL Host, pela Tucows). DNS na Hostinger desde 24/11, com MX, SPF e DMARC do Google e o CNAME `astroclock` da produção. DKIM ativo desde 25/11. Falta: ligar a renovação automática no UOL Host; trocar o e-mail de contato da conta do UOL para um que não seja `@ejuvv.com`. Detalhes no relatório do Victor de 24/11 ("Relatório técnico: migração de DNS e restabelecimento do e-mail").
- **Hospedagem:** decidido em 10/11/2026 que a produção fica na **Vercel**. Montada em 24/11 no projeto `astroclock-prod`. A Hostinger hospeda só o site institucional da EJ.
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

### Vercel

- Time EJUVV. **`astro-clock`**: site de protótipo (`astro-clock-ejuvv.vercel.app`), com login falso e painel de demonstração. **`astroclock-prod`**: produção, em `https://astroclock.ejuvv.com`, apontando para o `horas-prod`. Os dois fazem deploy da `main`.

### Google Cloud

- Projeto `astroclock-512918` (nome AstroClock), na organização ejuvv.com, conta `victor.gomes@ejuvv.com`.
- **Acesso ao console:** desde 20/10/2026 o Google Cloud exige verificação em duas etapas. Quem libera para a organização é o administrador do Workspace (a `victor.gomes` não é).
- Tela de consentimento (Google Auth Platform): app "AstroClock", público **Interno** (só contas `@ejuvv.com` entram).
- Cliente OAuth "AstroClock Supabase" (Aplicativo da Web), com os URIs de redirecionamento:
  - `https://cwvnzzqpqohvqjzigalu.supabase.co/auth/v1/callback`
  - O do prod (`https://gzjmavrrkqfqtqjycdnq.supabase.co/auth/v1/callback`) **ainda não está cadastrado** (teste de 24/11 deu `redirect_uri_mismatch`). Ver "Produção (V7)".
- O ID do cliente e a chave secreta estão no gerenciador de senhas.

### Login com Google (M5)

No `horas-dev` (feito em 10/11) e no `horas-prod` (feito em 24/11, com Site URL `https://astroclock.ejuvv.com` e Redirect URL `https://astroclock.ejuvv.com/inicio`):

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

1. ~~Registro que passa da meia-noite: qual dos dois registros `criarRegistro()` / `pararCronometro()` devolvem no sistema real.~~ Resolvido na G6 (14/11): as duas devolvem a primeira parte. No cronômetro, as partes depois da meia-noite entram como origem "manual", porque o banco só aceita registro novo de origem "cronometro" ligado e sem fim.
2. Férias durante o piloto: decidido em 28/10 (o RH muda a meta na mão). Falta a diretora concordar e informar as datas.
3. Prazo ("Vira real") das 3 funções novas do RH em `arquitetura.md`.
4. shadcn/ui na stack: decidir junto com Johannes.
5. As 5 skills do projeto: achar no pacote original ou escrever a partir dos docs.
6. Pendentes de `regras-de-negocio.md`: ver [`pauta-diretora-rh.md`](pauta-diretora-rh.md).
