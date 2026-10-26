# Regras de negócio — AstroClock (EJUVV)

Fonte única das regras do sistema. Código, banco e telas seguem este documento. Se uma regra não está aqui, ela não foi decidida: pergunte antes de implementar.

Itens marcados com **[PENDENTE]** ainda não foram decididos.

## 1. Meta semanal

- A semana vai de **segunda 00:00 a domingo 23:59**, no horário de Brasília (`America/Sao_Paulo`).
- Cada membro precisa, na semana:
  - de pelo menos **10h no total** (sede + online), **E**
  - de pelo menos **5h na sede**.
- As duas condições são obrigatórias. **Horas online não compensam horas faltantes na sede.**
- A presença na sede é **autodeclarada**: o membro escolhe `sede` ou `online` em cada registro.
- As metas (10h e 5h) são editáveis **somente pelo diretor do RH**, com histórico. Uma alteração **passa a valer na semana seguinte**. **Cada semana usa a meta vigente naquela semana** (a meta não é aplicada retroativamente).
- A meta é igual para todos os setores.
- [PENDENTE] Se as metas valem normalmente em período de férias.

## 2. Registros de horas

- Duas formas de registrar:
  - **Manual:** informando a duração, ou o horário de início e de fim.
  - **Cronômetro:** iniciar e parar.
- Cada registro tem: início, fim, local (`sede` ou `online`), **descrição obrigatória**, origem (`manual` ou `cronometro`).
- Não há categorias nem duração mínima.
- O formulário mostra o aviso fixo: **"Não registre reuniões e eventos."** É uma regra por acordo; o sistema não bloqueia.
- **Sobreposição bloqueada:** dois registros do mesmo membro não podem se sobrepor no tempo. Garantido no banco (exclusion constraint).
- **Virada da meia-noite:** um registro que passa da meia-noite é dividido em dois, um para cada dia.
- **Nada é apagado:** registros são cancelados, nunca excluídos.

## 3. Prazos de edição

- O membro pode **editar e cancelar** um registro até **7 dias depois de criá-lo** (a contagem começa no momento em que o registro foi feito).
- O membro só pode **lançar** horas de até **7 dias atrás** (ex.: em 26/10, de 19/10 em diante). Para datas anteriores, procura o RH. [PENDENTE: confirmar com a diretoria; pode mudar]
- Depois de 7 dias, **só o RH** pode alterar.
- Garantido no banco, não só na tela.

## 4. Cronômetro

- O horário de início fica guardado **no servidor** (o cronômetro continua correto se a pessoa fechar a página ou trocar de aparelho).
- Um cronômetro ativo é um registro **sem horário de fim**.
- **Só um cronômetro ativo por membro.**
- Encerra **sozinho após 10h** e o registro fica **sinalizado para revisão**.
- [PENDENTE] O limite de 10h será reavaliado no piloto.

## 5. Perfis e acesso

| Perfil | Pode |
| --- | --- |
| `membro` | Registrar e ver as próprias horas e o próprio progresso |
| `rh` | Tudo do membro + painel do RH: ver todos os membros, registrar dispensas, alterar registros com mais de 7 dias |
| `diretor_rh` | Tudo do RH + alterar as metas + alterar o perfil de qualquer pessoa |

- Só o RH (e o diretor do RH) acessa o painel administrativo. Não existe perfil de líder de setor.
- **Login apenas com Google**, com contas `@ejuvv.com` (Google Workspace). Não há senha própria nem recuperação de senha.
- Só entra quem está **cadastrado e ativo** na tabela `membros`. Quem não está cadastrado vê "Acesso negado, procure o RH".
- **Só o diretor do RH altera o perfil** de alguém.
- [PENDENTE] Se o RH comum também pode cadastrar membros, ou só o diretor do RH.
- O primeiro diretor do RH é cadastrado diretamente no banco pelo líder do projeto.
- Membros do RH também registram horas e estão sujeitos à meta. [PENDENTE: confirmar com a diretoria]

## 6. Membros e setores

- Setores iniciais: **Projetos, Comercial, RH, Marketing, Gestão e Qualidade** (tabela editável pelo RH).
- Cada membro pertence a **um setor**. Mudanças de setor ficam em histórico.
- **Membro novo:** a meta começa a valer na **semana seguinte** ao cadastro.
- **Conta desativada** mantém todo o histórico.

## 7. Dispensa

- O RH registra a dispensa de **uma semana inteira** para um membro, **com motivo**, depois de conversa pessoal.
- O membro continua registrando horas normalmente.
- A semana dispensada **fica fora do cálculo do percentual** e **não conta como descumprimento**.

## 8. Cálculos

- **Cumpriu a semana** = horas totais ≥ meta total **E** horas na sede ≥ meta sede (metas vigentes na semana), e a semana não está dispensada.
- **Percentual de presença** = membros que cumpriram ÷ (membros elegíveis − dispensados). É **por membros, não por horas**.
- Membros elegíveis em uma semana: ativos e cuja meta já começou a valer (cadastrados antes daquela semana).
- Horas acima de 10 valem só para a própria semana (não acumulam para a seguinte), mas **entram nos totais** de mês, trimestre e ano.
- **Semana entre dois meses** conta para o mês da **segunda-feira**. Trimestre e ano seguem o calendário normal.
- **Ranking:** ordenado por horas reais; desempate por horas na sede; dispensados no fim.
- Os totais **nunca são armazenados**: sempre calculados a partir dos registros não cancelados.

## 9. Advertência

- O sistema **só sinaliza** quem ficou abaixo da meta.
- A decisão sobre advertência é do RH ou da diretoria, **fora do sistema**.

## 10. Escopo do piloto

**Entra no piloto:** login, perfis, registro manual e cronômetro, prazos, sobreposição, dispensa, metas com histórico, setores, cálculo semanal, painel do membro (barras sede x/5h e total x/10h, resumo, grade de semanas do mês, histórico), painel do RH (visão geral com % de cumprimento, lista de quem ficou abaixo, detalhe por membro, cadastro), PWA básico instalável.

**Se houver tempo no piloto:** ranking, comparativo e abas por setor, seletor de trimestre e ano.

**Fase 2:** exportação CSV (primeiro item), gráficos, PDF, PWA offline e notificações, arquivamento de gestões.

## Pendências gerais

- [PENDENTE] Responsável pelos dados e prazo de retenção (LGPD).
- [PENDENTE] Arquivamento na troca de gestão.
- [PENDENTE] Nome definitivo e identidade visual.
