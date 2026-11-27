# Presença na sede real (B13 + G9) — desenho curto

Data: 27/11/2026 · Pedido e aprovação: Victor (líder do projeto) · Escrito com a IA.

## Por que

A presença na sede faz parte do piloto (seção 14 do `regras-de-negocio.md`), mas hoje o site só tem a versão de demonstração e, desde 27/11, ela fica escondida no login real (`temSede` em `src/compartilhado/recursos.ts`). O Victor quer adiantar essa parte enquanto a equipe cuida da B14, para ligá-la já nos testes que começam em 30/11.

## Regras (seção 13, já decididas)

- Botão para avisar que está na sede; **não registra horas**.
- A pessoa desmarca quando sai; se esquecer, o sistema desmarca sozinho **à meia-noite** (Brasília).
- **Todos** veem quem está na sede agora, só com **nome e setor** (e desde que horas, como a tela já mostra).
- Lembrete de desmarcar depois de lançar horas (já existe no site).

## Objetivos

- Tabela `presenca_sede` com **uma única presença aberta por pessoa**; cada um marca e desmarca **só a própria**.
- Ninguém lê dados de outra pessoa além de nome, setor e "desde".
- Presença esquecida fecha sozinha na virada do dia.
- O site troca as 4 funções do `presenca.ts` pelas reais, sem mudar nome, parâmetros ou retorno, e religa `temSede`.

## Fora do escopo

- Atualização instantânea (Realtime). A lista recarrega ao abrir a tela, depois de marcar/desmarcar e a cada 1 minuto.
- Histórico ou relatório de presença.

## Caminhos considerados

- **Tabela + funções do banco (escolhido).** Leitura dos outros só por uma função `security definer` que devolve nome, setor e desde; marcar e desmarcar por funções que usam `meu_id()`. Segue o padrão do ranking e do cálculo da B9.
- Ler a tabela direto com RLS: exigiria liberar a leitura de `membros` dos outros para mostrar nome e setor (o membro não lê `membros` dos outros). Descartado.
- Realtime do Supabase: mais trabalho e depende de RLS de leitura na tabela; sem ganho real para a EJ. Descartado.

## Como vai ser feito

### Banco (migração nova)

- `presenca_sede (id uuid, membro_id → membros, entrada timestamptz default now(), saida timestamptz null)`; índice único parcial em `membro_id` onde `saida is null`. RLS ligado, sem leitura direta para `authenticated` (tudo pelas funções).
- `quem_esta_na_sede()` → `membro_id, nome, setor, desde`: presenças abertas **de hoje** (Brasília), de membros ativos, ordenadas pelo nome. Qualquer pessoa logada e ativa.
- `estou_na_sede()` → boolean (presença aberta de hoje de quem chama).
- `marcar_na_sede()` e `desmarcar_na_sede()`: só para quem chama; erros em português ("Você já está marcado como na sede", "Você não está marcado como na sede").
- `encerrar_presencas_de_ontem()`: fecha as presenças abertas de dias anteriores com `saida` = meia-noite seguinte à entrada (Brasília). Roda pelo pg_cron **a cada 10 minutos** (mesmo padrão do cronômetro), o que não depende do fuso do servidor. As funções de leitura já ignoram presença de ontem, então ninguém aparece "na sede" depois da meia-noite mesmo antes da tarefa rodar.
- Teste próprio: `supabase/testes/teste-presenca.sql` (dois membros, um vê o outro só com nome/setor/desde; não marca duas vezes; não desmarca sem estar; presença de ontem não aparece e é fechada pela tarefa; ninguém lê a tabela direto).

### Site

- `presenca.ts`: versão real com `supabase.rpc`, a falsa vai para `presenca-falso.ts` (`if (loginFalso) ...`), erros com `erroDoBanco`.
- Lista recarrega a cada 1 minuto nas telas que mostram quem está na sede.
- `temSede = true` em `recursos.ts`.

## Decisões da IA (o Victor pode trocar)

- **Todos os perfis ativos podem marcar** (inclusive diretores e presidente), porque o botão já aparece para eles hoje.
- Fechamento por tarefa a cada 10 minutos em vez de um horário fixo à meia-noite (evita erro de fuso).

## Ordem

1. Migração + teste no banco (ensaio desfeito no `horas-dev`).
2. Site (`presenca.ts`, `presenca-falso.ts`, recarga, `temSede`).
3. Lint, build, demonstração; aplicar no `horas-dev` e juntar na `main` com o OK do Victor. No `horas-prod`, entra na B14.
