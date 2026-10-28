# AstroClock

Sistema de controle de horas produtivas dos membros da **EJUVV**. Os membros registram as horas trabalhadas (na sede ou online) e o RH acompanha quem cumpriu a meta semanal: **10h no total e 5h na sede**.

> Nome provisório. Substitui o Clockify.

## Stack

React + TypeScript (Vite) · Tailwind CSS · React Router · Supabase (PostgreSQL, login Google, RLS)

## Como rodar localmente

Pré-requisitos: Node.js 22 ou superior e Git.

1. Clone o repositório e entre na pasta:
   ```bash
   git clone <url-do-repositorio>
   cd AstroClock
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie o arquivo de ambiente a partir do exemplo:
   ```bash
   cp .env.example .env.local
   ```
   Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com os valores do projeto **horas-dev** (peça ao Victor). Enquanto as funções de dados forem falsas, o site roda mesmo sem esses valores.
4. Rode o projeto:
   ```bash
   npm run dev
   ```
5. Abra [http://localhost:5173](http://localhost:5173).

## Estrutura

```text
src/
  membro/          login e painel do membro
  rh/              painel do RH
  compartilhado/
    api/           funções de dados (único lugar que fala com o Supabase)
    ui/            componentes visuais compartilhados
supabase/
  migrations/      migrações SQL
  seed.sql         dados falsos para o ambiente de dev
docs/              documentação
```

## Documentação

- [Regras de negócio](docs/regras-de-negocio.md)
- [Arquitetura e contrato das funções de dados](docs/arquitetura.md)
- [Como trabalhamos](CONTRIBUTING.md)
- [Regras para assistentes de IA](AGENTS.md)

## Equipe

| Pessoa | Papel |
| --- | --- |
| Victor Gomes | Líder do projeto |
| Bernardo | Banco de dados e camada de dados |
| Johannes | Painel do RH e identidade visual |
| Guilherme | Login e painel do membro |
