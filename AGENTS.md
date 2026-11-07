# AGENTS.md — Regras do projeto para qualquer IA

Este arquivo vale para qualquer assistente de código (Claude Code, Copilot, Antigravity, etc.). Leia-o inteiro antes de escrever código neste repositório.

## O que é este projeto

**AstroClock** (nome provisório) é o sistema web de controle de horas produtivas dos membros da **EJUVV** (empresa júnior da UVV). Substitui o Clockify. Os membros registram horas; o RH acompanha quem cumpriu a meta semanal.

- Regras de negócio completas: [`docs/regras-de-negocio.md`](docs/regras-de-negocio.md)
- Arquitetura, contrato de dados e funções: [`docs/arquitetura.md`](docs/arquitetura.md)
- Fluxo de trabalho da equipe: [`CONTRIBUTING.md`](CONTRIBUTING.md)

**Nunca invente regra de negócio.** Se algo não está nesses documentos, pergunte a quem está pedindo a tarefa.

## Stack

- React + TypeScript, criado com Vite
- Tailwind CSS (plugin `@tailwindcss/vite`)
- shadcn/ui (componentes em `src/compartilhado/ui/shadcn/`, sobre Radix UI), adotado no protótipo
- Ícones: `lucide-react`. Avisos: `sonner`. Gaveta no celular: `vaul`. Calendário: `react-day-picker` com `date-fns`
- Gráficos: `recharts`, carregado só quando um gráfico aparece (é o pacote mais pesado)
- React Router (`react-router-dom`)
- Supabase: PostgreSQL, login com Google, Row Level Security (RLS)
- Supabase CLI (dependência de desenvolvimento, rodar com `npx supabase ...`)
- PWA básico (instalável) a partir da semana 4
- Hospedagem: Vercel, em princípio; o plano será confirmado com o Rodrigo (Cloudflare Pages é a alternativa)

## Estrutura de pastas

```text
src/
  membro/              tela de login e painel do membro (dono: Guilherme)
    paginas.ts         páginas do painel, baixadas juntas só quando o painel abre (ver src/App.tsx)
  rh/                  painel do RH (responsável: Johannes)
    paginas.ts         idem, para o painel do RH
  compartilhado/
    api/               funções de dados — ÚNICO lugar que importa o supabase (donos: Bernardo e Victor)
    ui/                componentes visuais usados pelos dois painéis (responsável: Johannes)
      shadcn/          componentes do shadcn/ui; ajuste aqui só o visual
    perfis.ts          o que cada perfil pode fazer na tela (a proteção real é o RLS)
    datas.ts           semanas, meses e formatação de horas
    supabase.ts        cliente do Supabase
    tipos.ts           tipos combinados entre front e dados
    tipos-banco.ts     tipos gerados do banco (npx supabase gen types)
supabase/
  migrations/          migrações SQL (dono: Bernardo)
  seed.sql             dados falsos para o banco de dev
docs/                  documentação do projeto
```

## Regras de ouro (não negociáveis)

1. **Telas nunca importam o `supabase`.** Componentes em `src/membro/`, `src/rh/` e `src/compartilhado/ui/` chamam apenas funções de `src/compartilhado/api/`. Se precisar de um dado novo, crie (ou peça) uma função em `api/`.
2. **Segurança fica no banco (RLS), não na tela.** Esconder um botão ou redirecionar é experiência; quem protege os dados é o RLS. Toda tabela nova nasce com `enable row level security`.
3. **Totais nunca são armazenados.** Horas da semana, do mês, percentuais e rankings são sempre calculados a partir dos registros.
4. **Migrações nunca são editadas depois de aplicadas.** Para corrigir, crie uma migração nova. Ninguém cria ou altera tabelas pelo painel web do Supabase.
5. **Funções de dados têm contrato fixo.** Ao trocar uma função de dados falsa pela real, mantenha exatamente o nome, os parâmetros e o formato do retorno definidos em `docs/arquitetura.md`.
6. **Nunca coloque segredos no código.** Nada de chaves, senhas, connection strings ou `.env` em commits. Use placeholders e `.env.example`. A chave `service_role` do Supabase nunca vai para o front.
7. **Nada é apagado de verdade.** Registros são cancelados (`cancelado = true`), membros são desativados (`ativo = false`). A única exceção decidida é o anexo de requerimento, apagado na aprovação porque pode conter dado de saúde.

## Convenções de código

- TypeScript estrito; evite `any`.
- Componentes React em PascalCase, um por arquivo `.tsx`.
- Funções de dados em camelCase, em português (`criarRegistro`, `meuPerfil`).
- Nomes de tabelas e colunas no banco em snake_case, em português (`membros`, `membro_id`).
- Telas que buscam dados mostram sempre três estados: carregando, erro (com a mensagem da função) e conteúdo — e uma mensagem para lista vazia.
- Funções de dados transformam erros do banco em mensagens claras em português (ex.: código `23P01` → "Este horário se sobrepõe a outro registro seu").
- Arquivos de `api/` que ainda devolvem dados falsos começam com o comentário `// FALSO`.
- O painel do membro precisa funcionar bem no celular.

## Comandos

```bash
npm install            # instalar dependências
npm run dev            # rodar localmente em http://localhost:5173
npm run lint           # verificar código
npm run build          # build de produção

npx supabase migration new <nome>   # nova migração
npx supabase db push                # aplicar migrações no projeto vinculado (sempre o dev)
npx supabase gen types typescript --linked > src/compartilhado/tipos-banco.ts
```

## Git

- Uma branch por tarefa, a partir da `main`: `feat/`, `fix/`, `db/`, `ui/`, `chore/` + descrição em minúsculas com hífen.
- Commits: `tipo: descrição` (ex.: `feat: botão entrar com Google`).
- Tudo entra na `main` por Pull Request revisado. Nunca commit direto na `main`.

## Skills (.claude/skills/)

- As regras deste arquivo, do CONTRIBUTING.md e dos docs têm prioridade sobre qualquer skill.
- Fluxo de Git é o do CONTRIBUTING.md (branch + PR revisado); não fazer merge local nem push sem pedido.
- shadcn/ui já está configurado (`components.json`). Para adicionar um componente, use `npx shadcn add <nome>`; não rode `npx shadcn init` de novo.
- TDD é opcional enquanto o projeto não tiver ferramenta de testes.
- Skills novas só entram por PR, com os arquivos revisados. Nunca instalar com `-y`.

## O que uma IA NÃO deve fazer neste repositório

- Criar telas fora da pasta do dono da tarefa sem que isso tenha sido pedido.
- Importar `supabase` fora de `src/compartilhado/api/`.
- Desativar RLS, criar regras que liberam tudo para qualquer usuário logado, ou usar a chave `service_role` no front.
- Inventar regras de negócio, metas, perfis ou prazos.
- Inventar URLs, chaves ou IDs de projetos do Supabase ou do Google Cloud.
- Aplicar qualquer coisa no banco de produção.
