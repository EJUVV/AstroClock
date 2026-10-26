# Como trabalhamos

Cada semana entrega uma fatia que atravessa o sistema inteiro: tela, função de dados e banco. Nada conta como pronto até estar na `main` e funcionando na demo presencial da sede.

## Do começo ao fim de uma tarefa

1. **Pegue uma issue** atribuída a você no GitHub Projects e mova para "Em andamento".
2. **Atualize a `main` e crie sua branch:**
   ```bash
   git checkout main
   git pull
   git checkout -b feat/tela-login
   ```
3. **Trabalhe e faça commits pequenos**, um por passo que funciona:
   ```bash
   git add .
   git commit -m "feat: botão entrar com Google"
   git push -u origin feat/tela-login
   ```
4. **Abra o Pull Request** para a `main`, preenchendo o modelo: o que foi feito, como testar, print ou vídeo curto, e `Fecha #<número da issue>`.
5. **O Victor revisa em até 2 dias.** Se pedir ajuste, corrija na mesma branch e faça push; o PR atualiza sozinho.
6. **Aprovado, entra na `main`** e a issue vai para "Pronto".

## Nomes de branch

| Prefixo | Uso | Exemplo |
| --- | --- | --- |
| `feat/` | Funcionalidade nova | `feat/formulario-registro` |
| `fix/` | Correção | `fix/cronometro-nao-para` |
| `db/` | Banco (migrações, RLS) | `db/tabela-membros` |
| `ui/` | Visual e componentes | `ui/barra-progresso` |
| `chore/` | Configuração, docs, ajustes | `chore/atualizar-readme` |

Sempre minúsculas, com hífen.

## Mensagens de commit

`tipo: o que mudou` — por exemplo `fix: cronômetro não para ao sair da página`. Tipos: `feat`, `fix`, `db`, `ui`, `docs`, `chore`.

## Nunca

- Commit direto na `main` (é regra da equipe, mesmo que o GitHub não bloqueie).
- Branch que dura mais de 3 dias (divida a tarefa).
- PR misturando tarefas diferentes.
- Chaves, senhas, `.env` ou dados reais em commits.
- Criar ou alterar tabelas pelo painel do Supabase (use migrações).

## Banco de dados

- Toda mudança é uma migração em `supabase/migrations/`, criada com `npx supabase migration new <nome>`.
- Migração já aplicada nunca é editada; para corrigir, crie outra.
- Toda tabela nova tem RLS ativado e regras testadas pelos dois lados (quem deve ver vê; quem não deve não vê).
- Aplicar sempre primeiro no `horas-dev`. Produção só com o Victor.
- PR que toca `supabase/migrations/` ou RLS precisa da aprovação do Victor.
- Depois de mudar tabelas, regenere os tipos e inclua no mesmo PR.

## Uso de IA

- Revise tudo o que a IA escreveu. Você precisa conseguir explicar cada linha do seu PR.
- Peça para a ferramenta ler o [`AGENTS.md`](AGENTS.md) antes de começar.
- Nunca cole na IA chaves, senhas, conteúdo do `.env` ou dados reais de membros.
- Regra de negócio com dúvida: consulte [`docs/regras-de-negocio.md`](docs/regras-de-negocio.md) ou pergunte no grupo. Nunca deixe a IA inventar.
- Se a IA sugerir `supabase.from(...)` dentro de uma tela, recuse e use a função de dados correspondente.

## Demo semanal na sede

No fim de cada semana, cada pessoa mostra presencialmente, no site rodando a partir da `main`, o que entregou (5 a 10 min por pessoa). Não vale mostrar o que está só na sua máquina.

## Prazos e atrasos

- O PR da semana precisa estar aberto **até 2 dias antes da demo**.
- **Travou?** Fale no grupo no mesmo dia.
- **Não vai entregar?** Avise no grupo assim que perceber, no máximo na véspera do prazo do PR.
- Discussão técnica fica nas issues e PRs, não no WhatsApp.
