# Tarefas das semanas 2, 3 e 4

Continuação do [`tarefas-semana-1.md`](tarefas-semana-1.md), no mesmo formato. Também serve para importar no Notion (Importar → Markdown). Plano e prioridades: [`planejamento-novembro.md`](planejamento-novembro.md).

Escrito em 10/11/2026, depois da conversa com a diretora de RH e das respostas de 09/11. A divisão segue a de 09/11: **Guilherme e Johannes trocam as funções falsas pelas reais das próprias telas**; o Bernardo fica com tabelas, RLS, cálculos em SQL, tarefas automáticas e produção.

Lembretes para todos:

- Leia o [`CONTRIBUTING.md`](../CONTRIBUTING.md) e o [`AGENTS.md`](../AGENTS.md) antes de cada tarefa. Regra que não está no [`regras-de-negocio.md`](regras-de-negocio.md) não existe: pergunte no grupo.
- Ao trocar uma função falsa pela real, mantenha **nome, parâmetros e retorno** da seção 6 do [`arquitetura.md`](arquitetura.md), traduza os erros do banco para português e tire o `// FALSO` do arquivo quando ele não tiver mais nada falso.
- Quem troca funções **não cria nem altera tabelas ou RLS**: se faltar algo no banco, peça ao Bernardo.
- Toda mudança no banco é **por migração**, nunca pelo painel do Supabase. PR que toca `supabase/migrations/` precisa da aprovação do Victor.
- Teste sempre pelos dois lados (membro e RH) e, quando a regra depender do perfil, com os 5 perfis do seed.
- Uma tarefa = uma branch = um PR.

### Login de verdade e modo de demonstração

Desde 10/11 o `auth.ts` é real (login com Google no `horas-dev`). As outras funções de `api/` que ainda são falsas usam o perfil de quem entrou. Para testar outro perfil, entre com outra conta do seed ou use o site de protótipo, que roda com `VITE_LOGIN_FALSO=true` (troca de perfil pelo botão de frasco). **`VITE_LOGIN_FALSO` nunca é ligado em produção.**

---

## Semana 2 (09/11 a 13/11) — Registrar horas

**Meta até 13/11:** registrar horas manualmente e pelo cronômetro, com dados reais no `horas-dev`.

As tarefas desta semana já estão no Notion (Quadro de Sprints, projeto AstroClock), com o texto completo. Resumo:

| Tarefa | Pessoa | Prazo | Situação em 10/11 |
| --- | --- | --- | --- |
| B4. Login com Google real | Feito pela IA com o Victor; Bernardo revisa o PR | 11/11 | Feito e testado; falta o PR |
| B6. Banco do `horas-dev` em migração e no GitHub (`supabase db pull`, seed) | Bernardo | 11/11 | A fazer |
| B7. Destravar `registros` e `metas` para o site (RLS de `registros`, `grant insert` em `metas`, remover `dispensas`, revogar `rls_auto_enable`) | Bernardo | 11/11 | A fazer |
| G5. Registro que passa da meia-noite | Guilherme | 15/11 | A fazer |
| G6. Funções reais de `registros.ts` e `cronometro.ts` | Guilherme | 15/11 | A fazer |
| J4. Tela de mudar o setor de um membro | Johannes | 15/11 | Feito |
| J5. Funções reais de `membros.ts` e das metas em `rh.ts` | Johannes | 15/11 | A fazer |
| J6. Bucket privado do anexo (Storage) | Johannes | 15/11 | A fazer |
| V2. Validar o protótipo com o RH e a diretora | Victor | — | Feito |
| V3. PWA instalável | Victor | — | Feito |
| V4. Convidar Guilherme e Johannes para o Supabase dev | Victor | 11/11 | A fazer |

Observações:

- **B4:** o banco já tinha `meu_perfil()` e `meus_dados()`. Faltava ligar o provedor Google no `horas-dev` (passo M5 do [`andamento-fase-0.md`](andamento-fase-0.md)) e trocar o `auth.ts`.
- **B6 vem antes de tudo no banco.** Enquanto a migração inicial não estiver no GitHub, ninguém mexe no `horas-dev`, para o `db pull` não pegar mudanças pela metade.
- O planejamento previa as migrações de `requerimentos` e `presenca_sede` nesta semana. Elas foram para a B8 (semana 3) e a B13 (semana 4), junto das funções que as usam, para a B6 e a B7 caberem até 11/11.

---

## Semana 3 (16/11 a 19/11) — Painéis e requerimento

Semana curta: 20/11 (sexta) é feriado. Reunião em 18/11 e validação com o RH até 19/11.

**Meta até 19/11, validada com o RH:** uma semana inteira de horas aparecendo no painel do membro e no do RH.

**Ponto de decisão (18/11):** se o P0 não estiver todo de pé, a semana 4 vira semana de completar o P0, e o P1 (requerimento, presença, ranking, gráfico) passa para dezembro.

### Bernardo (banco)

#### B8. Tabela `requerimentos` com RLS

**O que fazer**
- Migração da tabela `requerimentos` seguindo o esboço da seção 5 do `arquitetura.md` (`tipo`, `data_inicio`, `data_fim`, `motivo`, `situacao`, `anexo_caminho`, `anexo_nome`, `motivo_resposta`, `respondido_por`, `respondido_em`).
- RLS (seção 7 do `regras-de-negocio.md`):
  - só `membro` e `rh` criam, e só para si mesmos;
  - cada um vê os próprios; `rh`, `diretor_rh` e `presidente` veem todos; o `diretor_setor` não vê;
  - só o `diretor_rh` responde, e **nunca o próprio** requerimento;
  - reprovar exige `motivo_resposta`.
- `grant` para o site usar a tabela.

**Como saber que terminou**
- Testado com os 5 perfis: cada um só vê e faz o que a tabela acima permite.
- Um `rh` não consegue aprovar o próprio requerimento, nem pelo site nem por uma chamada direta.
- PR aprovado pelo Victor.

**Depende de**
- B6.

#### B9. Cálculo semanal no banco

**O que fazer**
- Funções SQL para o cálculo da seção 8 do `regras-de-negocio.md`: horas da semana (sede e total), meta vigente na semana, requerimentos aprovados (`so_remoto` zera a sede; `ausencia_total` dispensa a semana, e o requerimento vale para todas as semanas que toca, inteiras), quem é elegível (ativo, `membro` ou `rh`, cadastrado antes da semana).
- Só contam registros não cancelados e fora de revisão. Nada de total guardado em tabela.
- Trocar pelas reais: `progressoDaSemana` e `progressoDoMes` (`progresso.ts`); `percentualDaSemana`, `resumoDaSemana`, `abaixoDaMeta`, `mediasDaSemana`, `progressoDeMembro` e `semanasSeguidasAbaixo` (`rh.ts`).
- O `diretor_setor` vê sempre só o próprio setor, mesmo que a tela peça outro.

**Como saber que terminou**
- Com o seed, os números batem com uma conta feita à mão para 2 ou 3 membros (incluindo um com `so_remoto` e um com `ausencia_total` aprovados).
- O percentual é por membros, não por horas, e tira os dispensados da conta.
- PR aprovado pelo Victor.

**Depende de**
- B7 e B8.

#### B10. Cronômetro que encerra sozinho após 10h

**O que fazer**
- Decidir e implementar o mecanismo: tarefa agendada no banco (`pg_cron`) ou cálculo na leitura (risco anotado na seção 9 do `planejamento-novembro.md`).
- O registro encerrado sozinho fica com `precisa_revisao = true` e não conta na meta até ser revisado (seção 4 do `regras-de-negocio.md`).
- RLS da revisão: `rh`, `diretor_rh` e `presidente` revisam qualquer um; o `diretor_setor`, só os do próprio setor. Reprovado = cancelado.

**Como saber que terminou**
- Um cronômetro iniciado há mais de 10h aparece encerrado e em revisão, mesmo sem ninguém abrir o site.
- PR aprovado pelo Victor.

**Depende de**
- B7.

#### B11. Correções do RH com motivo

**O que fazer**
- Permitir que `rh` e `diretor_rh` lancem, alterem e cancelem registros de outro membro, inclusive com mais de 7 dias, sempre com **motivo obrigatório** (seção 3 do `regras-de-negocio.md`). O membro não é avisado.
- Guardar o motivo e o antes e depois em `auditoria` (esboço na seção 5 do `arquitetura.md`). Só o RH lê a auditoria.
- O `presidente` e o `diretor_setor` não corrigem registros.

**Como saber que terminou**
- Alterar um registro de outro membro sem motivo falha no banco.
- Cada correção aparece na auditoria com quem, quando, antes, depois e motivo.
- PR aprovado pelo Victor.

**Depende de**
- B7.

### Guilherme (painel do membro)

#### G7. Requerimento do membro real

**O que fazer**
- Trocar `enviarRequerimento` e `meusRequerimentos` (`requerimentos.ts`) pelas reais.
- Enviar o anexo para o bucket privado da J6 e gravar `anexo_caminho` e `anexo_nome`. PDF, JPG ou PNG, até 5 MB.
- O formulário avisa que, em casos de saúde, o anexo é obrigatório (o sistema não sabe o tipo do motivo; o diretor do RH confere).

**Como saber que terminou**
- Um membro envia um requerimento com e sem anexo e o vê na própria lista; outro membro não vê.
- PR aprovado pelo Victor.

**Depende de**
- B8 e J6.

#### G8. E-mails do requerimento (função no Supabase)

**O que fazer**
- Edge Function do Supabase que manda os e-mails da seção 7 do `regras-de-negocio.md`:
  - ao enviar: para todos os membros ativos com perfil `rh` ou `diretor_rh`;
  - ao reprovar: para o membro, com o motivo;
  - ao aprovar: para o membro.
- **Envio pelo Gmail da EJ** (decidido em 11/11/2026): a função entra em `smtp.gmail.com`, **porta 465** (SSL; o Supabase bloqueia as portas 25 e 587), com a conta da V5 e a senha de app. Não usa Resend nem outro serviço.
- A conta e a senha ficam só nos segredos do Supabase (`EMAIL_REMETENTE` e `EMAIL_SENHA_APP`, com `npx supabase secrets set`), **nunca no código** nem no `.env`. O e-mail não leva o anexo.
- A função é chamada quando o requerimento é salvo ou respondido (combinar com o Bernardo se é pelo site ou por um gatilho no banco). Ela busca os destinatários no banco, não confia em e-mails mandados pelo site.
- Se o envio falhar, o requerimento continua salvo; a falha aparece no log da função.

**Como saber que terminou**
- No `horas-dev`, enviar, aprovar e reprovar um requerimento gera os e-mails certos, para as pessoas certas, saindo do endereço da V5.
- Nenhuma senha aparece no código, no PR ou no log.
- PR aprovado pelo Victor.

**Depende de**
- B8 e V5 (conta de envio). Pode começar mandando só para o próprio e-mail.

### Johannes (painel do RH)

#### J7. Requerimentos do RH reais

**O que fazer**
- Trocar `listarRequerimentos`, `responderRequerimento` (`rh.ts`) e `linkDoAnexo` (`requerimentos.ts`) pelas reais. O link do anexo é temporário (link assinado do Storage).
- Na **aprovação**, apagar o anexo do Storage e limpar `anexo_caminho` (regra 7 do `AGENTS.md`).
- Reprovar exige motivo.

**Como saber que terminou**
- O diretor do RH aprova e reprova; os outros perfis do RH só veem. O `diretor_setor` não vê a lista.
- Depois da aprovação, o arquivo não existe mais no Storage.
- PR aprovado pelo Victor.

**Depende de**
- B8 e J6.

#### J8. Revisão de cronômetros e correções do RH reais

**O que fazer**
- Trocar `cronometrosEmRevisao` e `revisarCronometro` pelas reais.
- Trocar `buscarRegistrosDoMembro`, `criarRegistroDeMembro`, `editarRegistroDeMembro` e `cancelarRegistroDeMembro` pelas reais (motivo obrigatório).

**Como saber que terminou**
- Aprovar um cronômetro faz ele contar na meta; reprovar cancela.
- O RH corrige o registro de um membro, e a correção aparece na auditoria.
- PR aprovado pelo Victor.

**Depende de**
- B10 e B11.

### Victor

#### V5. Conta que envia os e-mails (Gmail da EJ)

Decidido em 11/11/2026: os e-mails saem por uma conta `@ejuvv.com` do Google Workspace, sem Resend. Não depende de domínio novo nem do DNS (que ainda está na HostGator). Todos os destinatários são `@ejuvv.com`, então o e-mail não sai do Google e não cai no spam.

**O que fazer**
- Criar no Google Workspace uma conta só para o sistema (ex.: `astroclock@ejuvv.com`), em vez de usar a conta pessoal de alguém.
- Ligar a verificação em duas etapas nela (myaccount.google.com → Segurança). Se a opção não aparecer, o administrador do Workspace precisa permitir.
- Criar uma senha de app em myaccount.google.com/apppasswords (nome "AstroClock"). O Google mostra a senha uma única vez.
- Gravar no Supabase do `horas-dev`, ou passar ao Guilherme por um canal privado (nunca no grupo): `npx supabase secrets set EMAIL_REMETENTE=astroclock@ejuvv.com EMAIL_SENHA_APP=<senha>`.
- Guardar a senha junto com os outros segredos da EJ e anotar para a próxima gestão: se a senha de app for revogada ou a conta trocar de senha, os e-mails param até gerar outra.

**Como saber que terminou**
- A senha de app existe e está nos segredos do Supabase do `horas-dev`.
- Um e-mail de teste mandado pela G8 chega na caixa de um `@ejuvv.com`.

**Depende de**
- Nada.

**Fica para depois (não trava o piloto):** descobrir com o Rodrigo quem ainda acessa o DNS do `ejuvv.com` na HostGator. O domínio vale até 21/02/2027 (registrado pela Tucows), e o e-mail da EJ inteira depende desse DNS. Se a conta da HostGator for encerrada, o DNS precisa ir para outro lugar antes.

#### V6. Validação com o RH (até 19/11)

**O que fazer**
- Com o RH, usar o `horas-dev` por uma semana inteira de horas e conferir os dois painéis.
- Conduzir o ponto de decisão de 18/11.

**Como saber que terminou**
- Lista de ajustes repassada para a equipe, ou validação aprovada.

**Depende de**
- B9.

---

## Semana 4 (23/11 a 27/11) — Complementos e produção

**Meta até 27/11:** o piloto completo, já em produção.

### Bernardo (banco)

#### B12. Ranking mensal e horas por dia no banco

**O que fazer**
- Trocar `rankingDoMes` (`rh.ts`), `minhaPosicaoNoRanking` e `horasPorDia` (`progresso.ts`) pelas reais (seção 12 do `regras-de-negocio.md`).
- Ordem: horas totais; desempate por horas na sede; dispensados (todas as semanas do mês dispensadas) no fim. A semana conta para o mês da segunda-feira.
- O `diretor_setor` vê o ranking do próprio setor; o membro, só a própria posição na EJ e no setor.

**Como saber que terminou**
- Com o seed, o ranking bate com a conta feita à mão.
- Um membro não consegue ler a lista inteira do ranking.
- PR aprovado pelo Victor.

**Depende de**
- B9.

#### B13. Presença na sede

**O que fazer**
- Migração de `presenca_sede` (seção 5 do `arquitetura.md`): uma única presença aberta por membro.
- Visão ou função que mostra a **todos** só o nome e o setor de quem está na sede agora (o membro não lê a tabela `membros` dos outros).
- Tarefa agendada que desmarca todo mundo **à meia-noite** (horário de Brasília).

**Como saber que terminou**
- Dois membros marcam presença e um vê o nome e o setor do outro, sem ver mais nenhum dado.
- À meia-noite, as presenças abertas são fechadas sozinhas.
- PR aprovado pelo Victor.

**Depende de**
- B6.

#### B14. Migrações no `horas-prod`

**O que fazer**
- Com o Victor, aplicar todas as migrações no `horas-prod`. **Sem o seed.**
- Cadastrar o primeiro diretor do RH direto no banco (seção 5 do `regras-de-negocio.md`), junto com o Victor.

**Como saber que terminou**
- `npx supabase migration list` mostra as mesmas migrações no dev e no prod.
- O prod não tem nenhum dado de teste.

**Depende de**
- Todas as migrações anteriores aprovadas.

### Guilherme (painel do membro)

#### G9. Presença na sede real

**O que fazer**
- Trocar `quemEstaNaSede`, `estouNaSede`, `marcarNaSede` e `desmarcarNaSede` (`presenca.ts`) pelas reais.
- Manter o lembrete de desmarcar quando a pessoa lança horas e ainda está marcada (seção 13 do `regras-de-negocio.md`).

**Como saber que terminou**
- Marcar e desmarcar funciona em dois aparelhos ao mesmo tempo, e a lista atualiza.
- PR aprovado pelo Victor.

**Depende de**
- B13.

### Johannes (painel do RH)

#### J9. Anexos no backup e apagados após um mês

**O que fazer**
- Incluir o bucket dos anexos no backup diário (`backup.yml`), sem deixar os arquivos públicos no artefato.
- Anexo de requerimento **reprovado** é apagado **um mês** depois da reprovação (regra de 09/11). Combinar com o Bernardo a tarefa agendada que faz isso.

**Como saber que terminou**
- O backup do dia tem os arquivos do bucket.
- Um anexo reprovado há mais de um mês some do Storage, e o requerimento fica com `anexo_caminho` vazio.
- PR aprovado pelo Victor e revisado pelo Bernardo.

**Depende de**
- J6 e J7.

### Victor

#### V7. Produção no ar

**O que fazer**
- Hospedagem: **Vercel** (decidido em 10/11/2026). Configurar o projeto de produção e o domínio com o Rodrigo.
- Login com Google no `horas-prod`: passo M5 do `andamento-fase-0.md` no prod, com a URL do site em produção nas Redirect URLs.
- Variáveis do site em produção apontando para o `horas-prod`, **sem** `VITE_MOSTRAR_DEMO` e **sem** `VITE_LOGIN_FALSO`. Hoje o projeto `astro-clock` da Vercel tem as duas ligadas (é o site de protótipo): a produção precisa de um projeto separado, ou de tirar as duas no dia da virada.
- Restaurar um backup no `horas-dev` com o Bernardo, para provar que o backup funciona.

**Como saber que terminou**
- Uma conta `@ejuvv.com` cadastrada no prod entra pelo site de produção e cai no painel certo.
- O backup restaurado abre no `horas-dev` com os dados certos.

**Depende de**
- B14.

---

## Estabilização (30/11 a 04/12)

Sem tarefas novas: corrigir o que aparecer, cadastrar os membros reais no `horas-prod` (pelo próprio sistema), testar com 2 ou 3 membros e apresentar o sistema para a EJ (seção 5 do [`planejamento-novembro.md`](planejamento-novembro.md)). O teste começa em **07/12**.
