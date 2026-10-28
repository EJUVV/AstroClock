# Tarefas da semana 1

Lista das tarefas da primeira semana depois do kickoff, por pessoa. Também serve para importar no Notion (Importar → Markdown).

Antes de começar qualquer tarefa, leia o [`CONTRIBUTING.md`](../CONTRIBUTING.md) (branch, commit, PR) e o [`AGENTS.md`](../AGENTS.md). Regras de negócio estão em [`regras-de-negocio.md`](regras-de-negocio.md); camadas, banco e funções de dados em [`arquitetura.md`](arquitetura.md). Dúvida de regra: pergunte no grupo, nunca invente.

Lembretes para todos:

- Telas nunca importam o `supabase`: só chamam as funções de `src/compartilhado/api/`. Hoje elas devolvem dados falsos; quando virarem reais, as telas não mudam.
- Para testar os painéis com as funções falsas, mude o perfil no console do navegador: `localStorage.perfilFalso = 'membro'` (ou `'rh'`, `'diretor_rh'`, `'nenhum'`).
- Uma tarefa = uma branch = um PR. O PR da semana fica aberto até 2 dias antes da demo.

---

## Bernardo (banco e login)

### B1. Modelar as tabelas iniciais (com o Victor)

**O que fazer**
- Revisar com o Victor o esboço da seção 5 do `arquitetura.md` (`membros`, `setores`, `metas`, `registros`): colunas, tipos e restrições.
- Revisar também o esboço de `requerimentos` e `presenca_sede` (as migrações delas ficam para a semana 2), já com as respostas da diretora de RH registradas no `regras-de-negocio.md`. Atenção: a lista de quem está na sede precisa mostrar nomes, mas o membro só vê a própria linha de `membros`.
- Lembrar que a meta de sede pode ser **0** (férias durante o piloto, seção 7 do [`planejamento-novembro.md`](planejamento-novembro.md)).
- Anotar no `arquitetura.md` o que mudar no esboço.

**Como saber que terminou**
- O esboço das 4 tabelas está fechado e atualizado no `arquitetura.md`.
- O esboço de `requerimentos` e `presenca_sede` está revisado, com as dúvidas que sobraram anotadas.

**Depende de**
- Nada.

### B2. Migrações de `membros`, `setores`, `metas` e `registros`

**O que fazer**
- Criar as migrações com `npx supabase migration new <nome>`, seguindo o que foi fechado na B1.
- Incluir as restrições previstas em `registros` (seção 5 do `arquitetura.md`): sem sobreposição por membro (ignorando cancelados) e um único cronômetro ativo (`fim is null`) por membro.
- Ativar RLS em todas as tabelas novas.
- Dar `grant` nas tabelas que o site usa: no Supabase, "expose new tables" está desligado; sem o `grant`, o site recebe "permission denied".
- Aplicar no `horas-dev` (dados do ambiente no [`andamento-fase-0.md`](andamento-fase-0.md#ambientes)).

**Como saber que terminou**
- `npx supabase db push` aplica as migrações no `horas-dev` sem erro.
- As 4 tabelas aparecem no painel do `horas-dev` com RLS ativado.
- PR aprovado pelo Victor (PR que toca `supabase/migrations/` precisa da aprovação dele).

**Depende de**
- B1.
- Convite para a organização "EJUVV Dev" no Supabase (Victor).

### B3. RLS de `membros` e funções `meu_id`, `eh_rh` e `meu_perfil`

**O que fazer**
- Criar as funções `meu_id()`, `eh_rh()` e `meu_perfil()`: `security definer`, filtrando pelo e-mail de `auth.jwt()` e `ativo = true` (seção 5 do `arquitetura.md`).
- Regras de RLS de `membros`: o membro vê só a própria linha; o RH vê todas.

**Como saber que terminou**
- Regras testadas pelos dois lados: um membro comum vê só a própria linha; alguém do RH vê todas; uma conta fora da tabela não vê nada.
- PR aprovado pelo Victor.

**Depende de**
- B2.

### B4. Login com Google real

**O que fazer**
- Com o Victor, ligar o provedor Google no `horas-dev` (passo a passo em "Login com Google (M5)" no [`andamento-fase-0.md`](andamento-fase-0.md)). O ID do cliente e a chave secreta estão com o Victor.
- Trocar as versões falsas de `entrarComGoogle()`, `sair()`, `meuPerfil()` e `meuNome()` em `src/compartilhado/api/auth.ts` pelas reais, seguindo a seção 3 do `arquitetura.md`, sem mudar nome, parâmetros ou retorno.
- Tirar o comentário `// FALSO` do arquivo.

**Como saber que terminou**
- Com uma conta `@ejuvv.com` cadastrada em `membros`, "Entrar com Google" leva ao painel certo do perfil dela.
- Com uma conta não cadastrada, aparece "Acesso negado. Procure o RH."
- "Sair" volta para a tela de login.

**Depende de**
- B3.
- Provedor Google ligado no Supabase dev (junto com o Victor).

### B5. Seed inicial e tipos gerados

**O que fazer**
- Preencher `supabase/seed.sql` com dados falsos para o `horas-dev` (setores, membros com os três perfis, metas). O seed nunca vai para produção.
- Gerar os tipos do banco com o Supabase CLI e incluir no PR (local do arquivo: combinar com o Victor).

**Como saber que terminou**
- O seed roda no `horas-dev` sem erro e dá para logar com os perfis de teste.
- Os tipos gerados estão no repositório.

**Depende de**
- B2.

---

## Johannes (visual e painel do RH)

### R1. Protótipo das 4 telas (com o Guilherme)

**O que fazer**
- Desenhar, com o Guilherme, as telas das 4 rotas (seção 2 do `arquitetura.md`): login (`/`), retorno do login (`/inicio`), painel do membro (`/membro`) e painel do RH (`/rh`).
- Usar as regras do `regras-de-negocio.md` para saber o que cada painel mostra.

**Como saber que terminou**
- O protótipo das 4 telas está pronto para o Victor validar com o RH e a diretora (tarefa V2).

**Depende de**
- Nada.

### R2. Base visual em `src/compartilhado/ui/`

**O que fazer**
- Criar a base visual compartilhada (cores, fontes e componentes básicos) em `src/compartilhado/ui/`, a partir do protótipo.
- Decidir com o Victor se o projeto usa shadcn/ui (decisão em aberto).

**Como saber que terminou**
- As outras telas conseguem usar os componentes de `src/compartilhado/ui/`.
- `npm run lint` e `npm run build` passam.

**Depende de**
- R1.

### R3. Painel do RH vazio com navegação

**O que fazer**
- Montar a estrutura do painel em `src/rh/PainelRH.tsx` (rota `/rh`), com a navegação entre as seções definidas no protótipo, ainda sem conteúdo.
- Botão de sair chamando `sair()`.

**Como saber que terminou**
- Com `localStorage.perfilFalso = 'rh'`, o login leva ao painel do RH e a navegação funciona.
- Nenhum arquivo em `src/rh/` importa o `supabase`.

**Depende de**
- R1. Usa a R2 se ela já estiver pronta.

---

## Guilherme (login e painel do membro)

### G1. Tela de login

**O que fazer**
- Refazer `src/membro/TelaLogin.tsx` (rota `/`) seguindo o protótipo: título "AstroClock" e botão "Entrar com Google" chamando `entrarComGoogle()`.

**Como saber que terminou**
- Clicar em "Entrar com Google" leva ao painel (hoje com as funções falsas; depois da B4, com o Google de verdade, sem mudar a tela).

**Depende de**
- R1. Usa a R2 se ela já estiver pronta.

### G2. Página `/inicio` com redirecionamento (em par com o Victor)

**O que fazer**
- Refazer `src/membro/Inicio.tsx` seguindo a seção 3 do `arquitetura.md`: mostrar "Carregando...", chamar `meuPerfil()` e redirecionar.
  - `'membro'` → `/membro`
  - `'rh'` ou `'diretor_rh'` → `/rh`
  - `null` → "Acesso negado. Procure o RH." com botão "Voltar" que chama `sair()`

**Como saber que terminou**
- Os 4 valores de `localStorage.perfilFalso` levam ao lugar certo.

**Depende de**
- Nada.

### G3. `RotaProtegida`

**O que fazer**
- Criar o componente `RotaProtegida`, que consulta `meuPerfil()` e só deixa entrar quem tem o perfil certo (seção 2 do `arquitetura.md`).
  - `/rh`: só `rh` e `diretor_rh`.
  - `/membro`: o RH também tem tudo do membro (`regras-de-negocio.md`), então também pode entrar.
- Usar o componente nas rotas `/membro` e `/rh` em `src/App.tsx`.
- Lembrete: isso é experiência; a proteção real é o RLS (B3).

**Como saber que terminou**
- Com `perfilFalso = 'membro'`, abrir `/rh` direto na barra de endereço não mostra o painel do RH.
- Com `perfilFalso = 'nenhum'`, nenhuma das duas rotas abre.

**Depende de**
- G2.

### G4. Painel do membro vazio com "Olá, nome" e sair

**O que fazer**
- Montar a estrutura de `src/membro/PainelMembro.tsx` (rota `/membro`) seguindo o protótipo, ainda sem registros.
- Mostrar "Olá, <nome>" usando `meuNome()`.
- Botão de sair chamando `sair()`.

**Como saber que terminou**
- Com `perfilFalso = 'membro'`, o painel mostra "Olá, <nome>" e "Sair" volta para o login.
- Nenhum arquivo em `src/membro/` importa o `supabase`.

**Depende de**
- R1. Usa a R2 se ela já estiver pronta.

---

## Victor

### V1. Backup diário funcionando

Feito em 27/10/2026: segredo cadastrado e backup rodado com sucesso.

### V2. Validação do protótipo com o RH e a diretora

**O que fazer**
- Apresentar o protótipo (R1) ao RH e à diretora e anotar os ajustes pedidos.

**Como saber que terminou**
- Protótipo aprovado ou com a lista de ajustes repassada para Johannes e Guilherme.

**Depende de**
- R1.

### Outras participações do Victor na semana 1

- B1 (modelar as tabelas com o Bernardo) e G2 (em par com o Guilherme).
- B4: ligar o provedor Google no Supabase dev com o Bernardo.
- Revisar os PRs em até 2 dias; os de banco precisam da aprovação dele.
