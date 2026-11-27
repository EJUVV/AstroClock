# Requerimento de ausência, parte 1 (B8 + G7 + J7 + J6) — desenho

Data: 27/11/2026 · Pedido e decisões: Victor (líder do projeto) · Escrito com a IA.

## Por que

O requerimento é o primeiro item do P1 do piloto (seção 14 do `regras-de-negocio.md`) e a última parte do piloto que ainda é só demonstração. Desde 27/11 ele fica escondido no login real (`temRequerimentos` em `src/compartilhado/recursos.ts`). Estava adiado para dezembro (nota da J6 de 23/11); o Victor decidiu adiantar agora, com ele mesmo e a IA, para os testes que começam em 30/11. Sem ele, o RH resolve ausências fora do sistema e a meta não reflete quem tinha motivo para não cumprir.

## Regras (seção 7, já decididas; nada novo aqui)

- O membro abre o requerimento: **datas** (calendário) e **motivo**. Só quem tem meta (`membro` e `rh`).
- Dois tipos: **só remoto** (a exigência de sede some; o total continua) e **ausência total** (a semana é dispensada).
- **Vale para a semana inteira**, mesmo pegando só parte dela, e **pode cobrir várias semanas**: da segunda de `data_inicio` à segunda de `data_fim`.
- Sem prazo de antecedência. O membro continua registrando horas normalmente.
- **Só o diretor do RH aprova ou reprova** (desde as diretorias acumuladas: quem dirige o setor RH, inclusive o presidente quando dirige o RH). **Ninguém responde o próprio.** **Reprovar exige motivo.** Só aprovado muda a meta.
- Anexo opcional, **obrigatório em casos de saúde** (o formulário avisa; o diretor do RH confere antes de aprovar). PDF, JPG ou PNG, até 5 MB. Só quem enviou, o RH (`rh` e quem dirige o RH) e o presidente abrem. O `diretor_setor` não vê requerimentos nem anexos.
- **Na aprovação, o anexo é apagado.** Na reprovação, fica **um mês** e depois é apagado.
- Semana com ausência total aprovada fica **fora do percentual** e **não conta como descumprimento**; não entra nas médias. No ranking do mês, "dispensado" é quem teve **todas** as semanas do mês dispensadas (seção 12).

## Objetivos

- Pedir, ver os próprios pedidos e abrir o próprio anexo (membro e `rh`).
- Ver todos os pedidos e anexos (`rh`, presidente, quem dirige o RH) e responder (só quem dirige o RH).
- O cálculo da semana, os painéis e o ranking passam a respeitar os pedidos aprovados.
- Ligar `temRequerimentos` no login real.

## Fora do escopo (parte 2 ou depois)

- **E-mails** (aviso ao RH no envio; aviso ao membro na resposta): G8, depende da conta de envio (V5). Enquanto isso, o RH vê o contador no menu "Requerimentos".
- Cancelar ou editar um pedido depois de enviado (a regra não prevê; quem errou abre outro e o RH reprova o errado).
- Copiar os anexos no backup diário: **decisão da IA aceita no desenho** — os anexos são temporários (apagados na aprovação) e copiá-los para os artefatos do GitHub espalharia dado de saúde. Se o armazenamento perder um arquivo, o membro reenvia. Fica registrado no `arquitetura.md` (hoje ele diz que é preciso incluir o bucket no backup).
- A tabela antiga `dispensas` (09/11) não é usada nem mexida.

## O que não pode acontecer (anti-objetivos)

- Alguém ver requerimento ou anexo de outra pessoa sem ser `rh`, presidente ou quem dirige o RH; o `diretor_setor` ver qualquer um.
- Quem pediu aprovar o próprio; o `rh` sem diretoria do RH responder.
- Um arquivo de saúde ficar público, ou ficar guardado depois da aprovação sem estar marcado para apagar.
- Quebrar o que funciona: cálculo da B9, painéis (J10, G11), ranking sem empate e as 5 suítes de teste.

## Caminhos considerados

- **A. Tudo pelo site (escolhido pelo Victor).** O arquivo vai do navegador direto para um bucket privado do Supabase Storage, com regras de acesso. Na aprovação, o site de quem aprovou apaga o arquivo. Os anexos de reprovados há mais de um mês (e qualquer aprovado que tenha sobrado) são apagados quando alguém do RH abre a tela de Requerimentos — o mesmo padrão da demonstração (`apagarAnexosVencidos`). Simples, sem peça nova no servidor; um anexo vencido pode durar alguns dias a mais se ninguém do RH abrir a tela.
- **B. Função no servidor (Edge Function).** Recebe o arquivo, apaga na aprovação e limpa os vencidos todo dia; seria a mesma peça dos e-mails. Prazo exato, mas bem mais trabalho agora (publicar, chave secreta, testes). Fica para quando a G8 chegar.
- Apagar pelo próprio banco (pg_cron): o Supabase não deixa apagar arquivos do Storage por SQL direto. Descartado.

## Como vai ser feito

### Banco (uma migração nova)

- **Tipos:** `tipo_requerimento` (`so_remoto`, `ausencia_total`) e `situacao_requerimento` (`pendente`, `aprovado`, `reprovado`).
- **Tabela `requerimentos`** (colunas do `arquitetura.md`): `id`, `membro_id`, `tipo`, `data_inicio`, `data_fim` (`>= data_inicio`), `motivo` (obrigatório, até 1000), `situacao` (padrão `pendente`), `anexo_caminho`, `anexo_nome`, `motivo_resposta`, `criado_em`, `respondido_por`, `respondido_em`.
  - RLS: **ler** os próprios, ou todos se `ve_tudo()` (rh, presidente, quem dirige o RH). **Criar** só os próprios, com perfil que tem meta, ativo, e sempre `pendente`, sem campos de resposta. Ninguém altera nem apaga direto.
- **`responder_requerimento(p_id uuid, p_aprovar boolean, p_motivo text default null)`** (security definer): só `eh_diretor_rh()`; não o próprio; só `pendente`; reprovar exige motivo. Grava situação, `respondido_por`, `respondido_em`, `motivo_resposta`. Erros em português com `errcode P0002` (o `erroDoBanco` só mostra a mensagem com esse código).
- **`anexo_apagado(p_id uuid)`** (security definer): limpa `anexo_caminho` (mantém `anexo_nome` para o histórico mostrar que houve anexo) depois que o site apagou o arquivo. Só `ve_tudo()`, e só se o pedido está aprovado ou reprovado há mais de um mês.
- **`anexos_para_apagar()`**: lista `id, anexo_caminho` dos pedidos com anexo que já devem sumir (aprovados, ou reprovados há mais de um mês). Só `ve_tudo()`.
- **Storage:** bucket **privado** `anexos-requerimentos`, limite 5 MB, só `application/pdf`, `image/jpeg`, `image/png`. Caminho `<membro_id>/<uuid>.<ext>`. Regras em `storage.objects`:
  - enviar: só na própria pasta, perfil com meta, ativo;
  - abrir: a própria pasta, ou `ve_tudo()`;
  - apagar: `ve_tudo()`, e só arquivo de um pedido aprovado ou reprovado há mais de um mês; o próprio membro pode apagar o arquivo da própria pasta que **não** está ligado a nenhum pedido (limpeza quando o envio do pedido falha depois do upload).
- **Cálculo (o ponto sensível):** função interna `ajuste_da_semana(p_membro_id uuid, p_semana date)` → `dispensada boolean, so_remoto boolean`, olhando os pedidos **aprovados** que cobrem a semana (se houver os dois tipos, `ausencia_total` vence). Recriar com a **mesma assinatura e as mesmas colunas**:
  - `progresso_de_membro`: `meta_sede = 0` quando só remoto; `dispensada` vem do ajuste; `cumpriu = elegível e não dispensada e horas ≥ metas`.
  - `resumo_da_semana` (versão das diretorias): o mesmo, por membro.
  - `horas_do_mes` (ranking): `dispensado` = todas as semanas do mês em que a pessoa entra estão dispensadas.
  - Os demais (`percentual_da_semana`, `abaixo_da_meta`, `medias_da_semana`, `semanas_seguidas_abaixo`, `progresso_da_semana`, `progresso_do_mes`, ranking) já leem `dispensada`/`cumpriu`/`meta_sede` dessas e passam a refletir os pedidos sem mudança.
- **Testes:** `supabase/testes/teste-requerimentos.sql` (padrão zz, desfeito no fim): os dois lados de quem lê; membro cria só o próprio e só pendente; `diretor_setor` não vê; `rh` sem diretoria não responde; quem dirige o RH aprova e reprova (motivo obrigatório); não responde o próprio nem um já respondido; só remoto zera a meta de sede da semana; ausência total dispensa, sai do percentual, das médias e de "abaixo da meta"; pedido de quarta a segunda da semana seguinte cobre as duas semanas inteiras; reprovado e pendente não mudam nada; ranking marca dispensado só com o mês todo dispensado; `anexos_para_apagar` e `anexo_apagado` respeitam o prazo de um mês. Rodar também `teste.sql`, `teste-ranking.sql`, `teste-diretorias.sql` e `teste-presenca.sql`.

### Site

- `requerimentos.ts`: `enviarRequerimento` (valida tipo e tamanho do arquivo no site também; envia o arquivo primeiro; se a gravação do pedido falhar, apaga o arquivo), `meusRequerimentos`, `linkDoAnexo` (link temporário de 1 minuto). Versão falsa para `requerimentos-falso.ts`.
- `rh.ts`: `listarRequerimentos(situacao?)` (com o nome do membro) e `responderRequerimento(id, aprovar, motivo?)` (na aprovação, apaga o arquivo e chama `anexo_apagado`); a limpeza dos vencidos roda dentro de `listarRequerimentos`, sem travar a lista se falhar.
- Tipos e contrato iguais aos de hoje (`Requerimento`, `NovoRequerimento`); a seção 6 do `arquitetura.md` marca as funções como reais e registra a decisão do backup.
- `temRequerimentos = true`.

## Decisões da IA (o Victor pode trocar)

- Anexos **fora do backup diário** (motivo acima).
- Quando `so_remoto` e `ausencia_total` aprovados cobrem a mesma semana, **vale a ausência total**.
- **Sem cancelar/editar** pedido enviado na parte 1.
- Link do anexo vale **1 minuto** (o suficiente para abrir; não fica circulando).
- Quem pode apagar anexo vencido: `rh`, presidente e quem dirige o RH (qualquer um que abra a tela), só dos pedidos que já devem sumir.
- `ajuste_da_semana` é **security definer**: o `diretor_setor` não lê `requerimentos`, mas o painel dele precisa mostrar a semana dispensada dos membros que ele vê.
- No site, `anexoNome` vem **null quando o arquivo já foi apagado** (`anexo_caminho` vazio), como a demonstração já faz; o tipo `Requerimento` não muda.
- Os avisos da tela do RH que dizem "o membro vai receber um e-mail" mudam enquanto não houver e-mail (parte 2).

## O que fica para quem constrói

- Nomes de políticas, índices e detalhes de SQL e de Storage, respeitando as regras acima.
- Ordem dos passos no site para não deixar arquivo órfão, além do que já está aqui.
- Mensagens de erro em português.

## Riscos

- Mexe nas funções do cálculo (B9) e do ranking: as 5 suítes precisam passar, como nas diretorias.
- Regras do Storage são novas no projeto: testar no `horas-dev` com login real (membro envia e abre; RH abre; diretor de setor não).
- No `horas-prod`, entra na B14 (ou numa seguinte, se a de 29/11 já tiver passado).
