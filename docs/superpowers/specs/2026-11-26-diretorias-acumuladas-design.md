# Diretorias acumuladas (vacância) — desenho

Data: 26/11/2026 · Pedido e decisões: Victor (líder do projeto) · Escrito com a IA.

## Por que

Na EJ é comum uma diretoria ficar vaga e outra diretoria ou a presidência assumir a vaga até chegar o titular. Exemplos: um diretor que cuida de Projetos **e** Comercial; o presidente que também responde pela diretoria de RH. Hoje o sistema não representa isso: cada pessoa tem **um perfil e um setor**, e as permissões de diretor olham "o setor que eu dirijo", no singular.

## Objetivos

- Uma pessoa pode **dirigir vários setores** ao mesmo tempo.
- Quem assume uma diretoria **pode tudo o que o titular daquela diretoria poderia** (decidido pelo Victor em 26/11/2026):
  - quem dirige um setor vê, no painel do RH, os membros, as horas e o ranking daquele setor (somando todos os que dirige);
  - quem dirige o **setor RH** (inclusive o presidente) tem os poderes do diretor do RH: cadastrar membros, alterar perfis, alterar metas, cadastrar férias, responder requerimentos e corrigir registros.
- **O diretor do RH e o presidente** registram e tiram as diretorias. Se o RH estiver vago, o presidente registra (inclusive a si mesmo).
- Fica guardado **quem dirigiu cada setor e quando**.
- O cargo aparece completo na tela, por exemplo "Diretor de Projetos e Comercial" ou "Presidente · diretor do RH".

## Fora do escopo

- Membro comum (`membro`) e `rh` dirigirem setor: **só diretores e o presidente acumulam diretorias** (proposta da IA aceita pelo Victor). Quem tem meta continua igual.
- Data de fim programada: a diretoria vale até alguém tirar.
- Mudar a regra de que **cada membro pertence a um setor** (continua valendo, inclusive para diretores).

## O que não pode acontecer

- **Dois diretores no mesmo setor** ao mesmo tempo.
- **O RH ficar sem ninguém que possa registrar** a diretoria vaga: o presidente sempre pode.
- Alguém ganhar poder de diretor do RH sem estar registrado como diretor do setor RH.
- Perder o histórico de quem dirigiu um setor.
- Quebrar o que já funciona: o cálculo da B9, o ranking, as correções do RH e o login.

## Regras (seções 5 e 6 do `regras-de-negocio.md`, a atualizar)

- **Cada setor tem no máximo um diretor**, mas **uma pessoa pode dirigir vários setores**. Quem acumula tem, em cada setor, os mesmos poderes do titular.
- **Diretor do RH = quem dirige o setor RH.** O perfil `diretor_rh` deixa de ser a fonte do poder; os poderes vêm da diretoria registrada.
- Podem dirigir setores: `diretor_setor`, `diretor_rh` e `presidente`. Membro e `rh` não.
- Registram e tiram diretorias: quem dirige o setor RH e o `presidente`.
- Quem é desativado, ou deixa de ter perfil de diretor ou de presidente, perde as diretorias automaticamente (fica no histórico).
- A EJ continua com **um único presidente**.

## Como vai ser feito (escolhido: tabela de diretorias)

Caminhos considerados:

- **A. Tabela de diretorias (escolhido).** Uma linha por setor dirigido ("o setor X é dirigido pela pessoa Y"), com histórico. "Um diretor por setor" vira a chave da própria tabela, e o diretor do RH passa a ser quem dirige o setor RH. Segue o desenho atual (como o `historico_setor`).
- **B. Listas no cadastro do membro** (vários perfis e uma lista de setores dirigidos). Regras difíceis de garantir no banco (impedir dois diretores no mesmo setor) e histórico improvisado.
- Descartado: uma segunda conta para quem acumula (o login é pelo e-mail do Google).

### Banco (migração nova, depois da `ranking_e_podio`)

- **`setores.eh_rh`** (boolean, padrão `false`, no máximo um `true`): marca o setor RH sem depender do nome. A migração marca o setor de nome "RH".
- **`diretorias`**: `setor_id` (chave primária, referência a `setores`), `membro_id` (referência a `membros`), `desde` (timestamptz), `registrado_por` (membro). Uma linha = o setor tem diretor.
- **`historico_diretorias`**: `setor_id`, `membro_id`, `inicio`, `fim` (null enquanto vale), `registrado_por`, `encerrado_por`. Só funções do banco gravam.
- **Carga inicial:** cada `diretor_setor` ativo vira diretor do próprio setor; o `diretor_rh` ativo, do setor RH (com o histórico começando na data da migração).
- **Funções novas:**
  - `setores_que_dirijo()` → conjunto de `setor_id` de quem está logado.
  - `minhas_diretorias()` → `setor`, `eh_rh` (para o site montar o cargo e as permissões).
  - `atribuir_diretoria(p_setor_id uuid, p_membro_id uuid)` e `remover_diretoria(p_setor_id uuid)`: só quem dirige o setor RH ou o presidente; o membro precisa ser `diretor_setor`, `diretor_rh` ou `presidente`, ativo; atribuir a um setor que já tem diretor troca o diretor (encerra o anterior no histórico).
  - Listagem para a tela: `diretorias_atuais()` → setor, diretor (nome), desde (lida por quem tem painel do RH).
- **Funções que mudam de significado (os chamadores continuam iguais):**
  - `eh_diretor_rh()` = dirige o setor RH.
  - `eh_rh()` = perfil `rh` **ou** dirige o setor RH.
  - `ve_tudo()` = perfil `rh` ou `presidente` **ou** dirige o setor RH.
- **`setor_que_dirijo()` (singular) sai**, trocada por `setores_que_dirijo()` nos 4 lugares que a usam: leitura de `membros` (RLS), leitura de `registros` (RLS), `resumo_da_semana` (B9: com `p_setor`, só se for um dos meus; sem, todos os meus) e `ranking_do_mes` (ranking: o diretor vê os setores que dirige, com a posição dentro de cada setor).
- **Políticas que olham o perfil `diretor_rh` direto** passam a usar `eh_diretor_rh()`: criar e alterar `setores` (com o presidente) e as regras de quem mexe em quem é diretor em `membros`.
- **Índices:** `membros_um_diretor_de_setor_ativo` sai (a chave de `diretorias` faz o papel); `membros_um_diretor_rh_e_um_presidente` passa a garantir só um presidente.
- **Gatilho:** desativar alguém, ou mudar o perfil para `membro`/`rh`, encerra as diretorias dele.
- Testes novos na `supabase/testes/teste.sql` (ou num arquivo próprio): presidente que assume o RH cadastra membro e altera meta; diretor que acumula dois setores vê os dois e não vê um terceiro; dois diretores no mesmo setor é recusado; o `rh` não atribui diretoria; desativar encerra a diretoria no histórico; a B9 e o ranking do diretor somam os setores dele.

### Site

- **Sessão** (`RotaProtegida`): além de `perfil` e `eu`, guarda `diretorias` (de `minhas_diretorias()`).
- **Permissões** (`perfis.ts`): um "perfil efetivo" para os botões — quem dirige o setor RH age como `diretor_rh` (os poderes do diretor do RH já incluem os do presidente); os outros, pelo próprio perfil. Os setores visíveis do diretor passam a ser a lista das diretorias, não `eu.setor`.
- **Cargo na tela:** "Diretor de Projetos e Comercial", "Presidente · diretor do RH", etc. (topo do painel, Configurações, lista de membros).
- **Painel do RH:** títulos e filtros que hoje dizem "o setor X" passam a listar os setores dirigidos; o seletor de setor do ranking mostra só os dirigidos (diretor) ou todos.
- **Cadastro das diretorias:** no detalhe do membro (painel do RH), uma seção "Diretorias" para quem dirige o RH e para o presidente: lista os setores que a pessoa dirige, com "Atribuir setor" e "Remover". Na lista de membros, uma visão das diretorias atuais e vagas ajuda a ver o que falta.
- Versões de demonstração (`*-falso.ts`, painel de demonstração) acompanham as regras.

### Ordem de entrega (proposta)

1. Regras (seções 5 e 6) e contrato (`arquitetura.md`).
2. Migração e testes do banco (com a carga inicial).
3. Funções do site e sessão.
4. Telas (cargo, filtros, cadastro das diretorias).
5. PR; aplicar no `horas-dev` com o OK do Victor. No `horas-prod`, entra numa B14 seguinte, se a de 26/11 já tiver passado.

## Decisões que a IA tomou (o Victor pode trocar)

- **Marcar o setor RH com uma coluna** (`setores.eh_rh`) em vez de reconhecer pelo nome: o nome pode mudar.
- **Perfis continuam como estão** (`diretor_rh`, `diretor_setor`, `presidente`), agora como "cargo principal". O poder vem das diretorias registradas. Um `diretor_rh` sem a diretoria do RH registrada (por exemplo, depois de entregar o cargo) não tem os poderes do diretor do RH.
- **Atribuir um setor que já tem diretor troca o diretor**, em vez de dar erro: é o caso comum de "chegou o titular".
- **Desativar ou rebaixar o perfil encerra as diretorias** automaticamente, para não sobrar diretoria de quem saiu.
- **Mudar o perfil de alguém para diretor não registra diretoria sozinho:** a diretoria é sempre atribuída de propósito, na seção "Diretorias". Para não esquecer, a tela avisa quando um diretor está sem nenhum setor e quando um setor está vago.
- Quem dirige vários setores vê, no ranking completo, a **posição dentro de cada setor** (igual ao diretor de um setor hoje).

## O que fica para quem constrói

- Nomes de colunas auxiliares, índices e detalhes de SQL, respeitando as regras acima.
- Visual da seção "Diretorias" e do cargo, no padrão das telas atuais.
- Mensagens de erro em português (`erroDoBanco`).

## Riscos e avisos

- Mexe em funções de quase todas as migrações (permissões, B9, ranking): é a mudança mais sensível do banco desde a B7. Precisa da revisão do Bernardo e de rodar as duas suítes de teste (`teste.sql` e `teste-ranking.sql`).
- O `horas-prod` está recebendo as migrações (B14). Esta entra depois, como migração nova; nada é editado.
- Atualizar o painel de demonstração (troca de perfil) para simular quem acumula diretorias.
