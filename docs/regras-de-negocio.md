# Regras de negócio — AstroClock (EJUVV)

Fonte única das regras do sistema. Código, banco e telas seguem este documento. Se uma regra não está aqui, ela não foi decidida: pergunte antes de implementar.

Itens marcados com **[PENDENTE]** ainda não foram decididos. Itens marcados com **[FASE 2]** são regras decididas, mas que só serão implementadas depois do piloto (ver seção 14).

Última revisão: 01/11/2026, com as decisões do líder do projeto. As respostas da diretora de RH são de 27/10/2026.

## 1. Meta semanal

- A semana vai de **segunda 00:00 a domingo 23:59**, no horário de Brasília (`America/Sao_Paulo`).
- Cada membro precisa, na semana:
  - de pelo menos **10h no total** (sede + online), **E**
  - de pelo menos **5h na sede**.
- As duas condições são obrigatórias. **Horas online não compensam horas faltantes na sede.**
- A presença na sede é **autodeclarada**: o membro escolhe `sede` ou `online` em cada registro.
- As metas (10h e 5h) são editáveis **somente pelo diretor do RH**, com histórico. O diretor **escolhe a semana** em que a nova meta começa: pode ser a semana seguinte ou uma mais adiante, nunca a atual nem uma passada. A meta vale até a próxima alteração programada. **Cada semana usa a meta vigente naquela semana** (a meta não é aplicada retroativamente).
- A meta é igual para todos os setores.
- **Feriados não mudam a meta**: a semana com feriado continua com 10h no total e 5h na sede.

### Férias [FASE 2]

- O RH cadastra no sistema as datas de início e fim de cada período de férias.
- Durante as férias, a meta é de **5h no total**, e **não há exigência de horas na sede** (as horas contam como remotas).
- [PENDENTE] Se as datas de férias são cadastradas por qualquer pessoa do RH ou só pelo diretor do RH (as metas normais só o diretor altera).
- [PENDENTE] Semana parcialmente em férias (ex.: as férias começam numa quarta): qual meta vale nessa semana.

### Férias durante o piloto

Decidido pelo líder do projeto em 28/10/2026 e confirmado em 01/11/2026, enquanto a regra de férias não existe no sistema:

- O **diretor do RH especifica, semana a semana, qual é a meta**: **5h no total e 0h na sede** a partir da semana em que as férias começam e, depois, 10h e 5h a partir da semana da volta. As duas mudanças podem ser programadas de uma vez, com antecedência.
- Como toda alteração de meta, vale **para todos**.
- Por isso, a meta de sede pode ser **0**.
- As datas das férias deste fim de ano ainda serão definidas.

## 2. Registros de horas

- Duas formas de registrar:
  - **Manual:** sempre com **horário de início e de fim** (não existe registro só pela duração).
  - **Cronômetro:** iniciar e parar.
- Cada registro tem: início, fim, local (`sede` ou `online`), **descrição obrigatória**, origem (`manual` ou `cronometro`).
- Não há categorias nem duração mínima.
- O formulário mostra o aviso fixo: **"Não registre reuniões e eventos."** É uma regra por acordo; o sistema não bloqueia.
- **Sobreposição bloqueada:** dois registros do mesmo membro não podem se sobrepor no tempo. Garantido no banco (exclusion constraint).
- **Virada da meia-noite:** um registro que passa da meia-noite é dividido em dois, um para cada dia.
- **Nada é apagado:** registros são cancelados, nunca excluídos.

## 3. Prazos de edição

- O membro pode **editar e cancelar** um registro até **7 dias depois de criá-lo** (a contagem começa no momento em que o registro foi feito).
- O membro só pode **lançar** horas de até **7 dias atrás** (ex.: em 26/10, de 19/10 em diante). Para datas anteriores, procura o RH. Confirmado pela diretoria de RH em 27/10/2026.
- Depois de 7 dias, **só o RH** pode alterar.
- Quando o RH altera ou cancela um registro de outra pessoa, **o motivo é obrigatório**. O membro **não é avisado**.
- Garantido no banco, não só na tela.

## 4. Cronômetro

- O horário de início fica guardado **no servidor** (o cronômetro continua correto se a pessoa fechar a página ou trocar de aparelho).
- Um cronômetro ativo é um registro **sem horário de fim**.
- **Só um cronômetro ativo por membro.**
- Encerra **sozinho após 10h** e o registro fica **sinalizado para revisão**.
- Enquanto está em revisão, o registro **não conta na meta**.
- **Qualquer pessoa do RH** pode revisar:
  - **aprovado** (o trabalho foi realmente feito): o registro passa a contar na meta;
  - **reprovado**: o registro é **cancelado**.
- [PENDENTE] O limite de 10h será reavaliado no piloto.

## 5. Perfis e acesso

| Perfil | Pode |
| --- | --- |
| `membro` | Registrar e ver as próprias horas e o próprio progresso |
| `rh` | Tudo do membro + painel do RH: ver todos os membros, cadastrar membros, responder requerimentos de ausência, revisar cronômetros, alterar registros com mais de 7 dias, cadastrar férias |
| `diretor_rh` | Tudo do RH + alterar as metas + alterar o perfil de qualquer pessoa |

- Só o RH (e o diretor do RH) acessa o painel administrativo. Não existe perfil de líder de setor.
- **Login apenas com Google**, com contas `@ejuvv.com` (Google Workspace). Não há senha própria nem recuperação de senha. O login **fica salvo** no aparelho, para a pessoa não precisar entrar toda vez.
- Só entra quem está **cadastrado e ativo** na tabela `membros`. Quem não está cadastrado vê "Acesso negado, procure o RH".
- **Só o diretor do RH altera o perfil** de alguém.
- **Qualquer pessoa do RH** (não só o diretor) pode cadastrar membros.
- O primeiro diretor do RH é cadastrado diretamente no banco pelo líder do projeto.
- Membros do RH também registram horas e **estão sujeitos à meta**.

## 6. Membros e setores

- Setores iniciais: **Projetos, Comercial, RH, Marketing, Gestão e Qualidade** (tabela editável pelo RH).
- Cada membro pertence a **um setor**. Mudanças de setor ficam em histórico.
- **Membro novo:** a meta começa a valer na **semana seguinte** ao cadastro.
- **Membro desativado** (saiu da EJUVV):
  - não consegue mais entrar no sistema;
  - **não conta** na semana em que foi desativado nem nas seguintes;
  - mantém todo o histórico, que **só o RH** consegue ver.
- [PENDENTE] Se esses dados ficam guardados para sempre ou são arquivados fora do sistema.

## 7. Requerimento de ausência

Substitui a antiga "dispensa de semana inteira registrada pelo RH".

- O membro abre um **requerimento** no sistema: escolhe as datas num calendário e escreve o **motivo** (o que vai ter na semana que o impede de ir à sede ou de trabalhar).
- O requerimento pode ter um **anexo** (atestado ou comprovante). Só quem enviou e o RH conseguem abrir o arquivo. Como pode conter dado de saúde, o arquivo nunca fica público.
- Não há prazo de antecedência.
- **Pode cobrir várias semanas** de uma vez.
- **Vale para a semana inteira**, mesmo se pegar só parte dela (ex.: de quarta a sexta).
- Dois tipos:
  - **Só remoto** (não consegue ir à sede, mas consegue trabalhar): a exigência de sede some e a meta da semana passa a ser **só remota**, com o total normal (10h fora das férias).
  - **Ausência total** (não consegue trabalhar): a meta da semana é **totalmente dispensada**.
- Ao enviar, **todo o RH** recebe uma notificação por e-mail (perfis `rh` e `diretor_rh`).
- O RH **aprova ou reprova** no sistema. Só requerimento aprovado muda a meta.
- O membro continua registrando horas normalmente.
- A semana com ausência total aprovada **fica fora do cálculo do percentual** e **não conta como descumprimento**.
- [PENDENTE] Se o membro é avisado da aprovação ou reprovação, e como.
- [PENDENTE] Se o RH também pode dispensar alguém direto, sem requerimento.
- [PENDENTE] Se o anexo é obrigatório em algum caso, e por quanto tempo o arquivo fica guardado.
- [PENDENTE] Se uma pessoa do RH pode aprovar o próprio requerimento.

## 8. Cálculos

- **Cumpriu a semana** = horas totais ≥ meta total **E** horas na sede ≥ meta sede (metas vigentes na semana, já ajustadas por férias e requerimentos aprovados), e a semana não está totalmente dispensada.
- Só contam registros não cancelados e que não estão em revisão.
- **Percentual de presença** = membros que cumpriram ÷ (membros elegíveis − dispensados). É **por membros, não por horas**.
- Membros elegíveis em uma semana: ativos e cuja meta já começou a valer (cadastrados antes daquela semana).
- Horas acima de 10 valem só para a própria semana (não acumulam para a seguinte), mas **entram nos totais** de mês, trimestre e ano.
- **Semana entre dois meses** conta para o mês da **segunda-feira**. Trimestre e ano seguem o calendário normal.
- Os totais **nunca são armazenados**: sempre calculados a partir dos registros.

## 9. Ano e histórico [FASE 2]

- O ano é o **ano civil** (janeiro a dezembro).
- As métricas do membro (totais, ranking, progresso) são **por ano**: na virada do ano começam do zero, e as horas do ano anterior não interferem no ano atual.
- Nada é apagado na virada do ano: o membro vê o próprio **histórico separado por ano**.
- Os **selos não se perdem** na virada do ano (seção 11).

## 10. Advertência e destaques

- O sistema **só sinaliza** quem ficou abaixo da meta.
- O RH vê em destaque quem ficou **abaixo da meta 2 semanas seguidas ou mais**.
- A decisão sobre advertência é do RH ou da diretoria, **fora do sistema**.

## 11. Painel do membro: indicadores

- A situação da semana fica explícita:
  - semana encerrada **sem a meta**: **vermelho**;
  - semana em andamento ainda sem a meta: um indicador de que **ainda não cumpriu**.
- Barras de **quanto do tempo já passou**: do dia, da semana, do mês e do ano (em %), para o membro comparar com as próprias horas.
- **Gráfico de barras** com as horas feitas por dia. [PENDENTE] Outros gráficos: há proposta em [`pauta-diretora-rh.md`](pauta-diretora-rh.md).

## 12. Ranking e selos

### Ranking

- Período: **mês**.
- Ordem: **horas totais**; desempate por **horas na sede**; dispensados no fim.
- [PENDENTE] Quem conta como "dispensado" no ranking de um mês: quem teve todas as semanas dispensadas ou pelo menos uma.
- **O RH** vê o ranking completo.
- **O membro** vê só a **própria posição**, em relação a toda a EJ e em relação ao seu setor.

### Selos [FASE 2]

- O membro ganha selos ao atingir marcos de horas, por exemplo **50, 100, 200 e 400 horas**.
- As horas contam **desde a entrada na EJUVV** (não zeram na virada do ano). Todas as horas contam; alguns selos podem ser só de horas na sede.
- Os selos aparecem junto da foto de perfil e são **visíveis para todos**.
- A foto é a da conta Google, e **a pessoa pode trocá-la no sistema**.
- [PENDENTE] A lista definitiva de selos (50, 100, 200 e 400h ou só 100, 200 e 400h), quais são só de horas na sede e onde os membros veem os selos dos outros.

## 13. Presença na sede em tempo real

- Botão para o membro **avisar que está na sede** agora. Ele **não** registra horas: só informa a presença.
- O membro **desmarca** quando sai. Se esquecer, **o sistema desmarca sozinho**.
- **Todos os membros** veem quem está na sede no momento.
- Lembrete: se a pessoa lançar horas e ainda estiver marcada como "na sede", o sistema lembra de desmarcar.
- [PENDENTE] A que horas o sistema desmarca sozinho (sugestão: à meia-noite).

## 14. Escopo do piloto

O piloto deve funcionar por **pelo menos 1 mês**, com testes durante o uso (fim de ano, então o aproveitamento será menor).

Escopo decidido pelo líder do projeto em 27/10/2026. Prioridades e cronograma em [`planejamento-novembro.md`](planejamento-novembro.md).

**Entra no piloto:**
- Login, perfis, setores, metas com histórico.
- Registro manual e cronômetro, prazos, sobreposição, revisão de cronômetro.
- Requerimento de ausência (o membro envia, o RH aprova ou reprova), com anexo e e-mail para o RH.
- Cálculo semanal.
- Painel do membro: barras sede x/5h e total x/10h, indicador de meta (vermelho / ainda não cumpriu), barras de tempo (dia, semana, mês, ano), gráfico de horas por dia, resumo, grade de semanas do mês, histórico.
- Painel do RH: visão geral com % de cumprimento, lista de quem ficou abaixo, destaque de quem ficou 2+ semanas seguidas abaixo, detalhe por membro, cadastro, ranking mensal completo.
- Ranking mensal: o membro vê a própria posição na EJ e no setor.
- Presença na sede em tempo real.
- PWA básico instalável, sem publicar em lojas de aplicativos.

**Fase 2 (depois do piloto):** férias com meta própria, histórico e métricas por ano, selos de horas, relatórios CSV mensais e anuais (primeiro item; está no projeto, mas não é prioridade), outros gráficos, comparativo e abas por setor, seletor de trimestre e ano, PDF, PWA offline e notificações, arquivamento de gestões.

**Backlog (sugestões da reunião de 30/10/2026, sem decisão de entrar):** relatório semanal automático com nota; cadastro de períodos de férias, feriado e sede fechada.

## 15. Dados e LGPD

- O **RH** é o responsável pelos dados.
- Na troca de gestão, os dados são **arquivados**.
- Os dados de anos anteriores ficam guardados para análise, sem pesar nas métricas do ano atual. A ideia é poder exportar os dados de cada ano.
- Anexos de requerimento podem conter dados de saúde. Ficam em armazenamento privado, com acesso só de quem enviou e do RH.
- [PENDENTE] Prazo de retenção: a diretora citou 1 ano e 6 meses, mas falta definir a partir de quando conta e o que acontece depois (os dados não devem ser simplesmente apagados).

## Pendências gerais

- [PENDENTE] Nome definitivo: AstroClock por enquanto; AstroTracker em avaliação.
- [PENDENTE] Identidade visual: ainda não há referência definida; será alinhada aos poucos.
