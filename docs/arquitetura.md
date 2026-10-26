# Arquitetura — AstroClock

Como o sistema é organizado, como o login funciona, o esboço do banco e o contrato das funções de dados. Regras de negócio estão em [`regras-de-negocio.md`](regras-de-negocio.md).

## 1. Camadas

```text
┌──────────────────────────── No navegador: telas ────────────────────────────┐
│  Tela de login (src/membro)   Painel do membro (src/membro)   Painel do RH (src/rh) │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │ chamam funções, nunca o supabase
┌───────────────────────────────────▼──────────────────────────────────────────┐
│  Funções de dados (src/compartilhado/api) — ÚNICO lugar que importa supabase   │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │ supabase-js
┌───────────────────────────────────▼──────────────────────────────────────────┐
│  Supabase: login Google · tabelas e cálculos (migrações SQL) · RLS             │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Telas:** o que a pessoa vê. Chamam funções de `api/` e mostram carregando, erro, vazio ou conteúdo.
- **Funções de dados:** conversam com o Supabase, traduzem erros para mensagens em português e devolvem tipos de `tipos.ts`. No início devolvem **dados falsos**; depois são trocadas pela consulta real **sem mudar nome, parâmetros ou retorno**.
- **Supabase:** PostgreSQL na nuvem com login Google e RLS. Toda a segurança e as regras de integridade ficam aqui.

## 2. Rotas

| Rota | Tela | Acesso |
| --- | --- | --- |
| `/` | Login (botão "Entrar com Google") | Público |
| `/inicio` | Retorno do login: chama `meuPerfil()` e redireciona | Logado |
| `/membro` | Painel do membro | Perfil `membro` (RH também pode registrar as próprias horas — ver seção 4) |
| `/rh` | Painel do RH | Perfis `rh` e `diretor_rh` |

Rotas protegidas usam um componente `RotaProtegida` que consulta `meuPerfil()`. Isso é experiência; a proteção real é o RLS.

## 3. Login

1. Botão chama `entrarComGoogle()`.
2. A função chama `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: <origem>/inicio } })`.
3. O Supabase leva ao Google; a pessoa escolhe a conta `@ejuvv.com`; o Google confirma e devolve ao Supabase, que cria a sessão.
4. A pessoa volta em `/inicio`, já logada. A tela chama `meuPerfil()`:
   - `null` → `sair()` e mostra "Acesso negado. Procure o RH."
   - `'membro'` → `/membro`
   - `'rh'` ou `'diretor_rh'` → `/rh`

**Quem pode entrar:** o Google diz *quem* é a pessoa; a tabela `membros` diz *se* ela pode entrar e com qual perfil; o RLS garante isso dentro do banco. Uma conta Google não cadastrada consegue sessão, mas não vê nenhum dado.

## 4. Ambientes

| | `horas-dev` | `horas-prod` |
| --- | --- | --- |
| Uso | Desenvolvimento e testes | Sistema real |
| Dados | Falsos (`supabase/seed.sql`) | Reais |
| Acesso | Bernardo e Victor | Só Victor (até o piloto) |
| Organização no Supabase | "EJUVV Dev" | "EJUVV Prod" |

A mesma estrutura (migrações) é aplicada nos dois. O seed nunca vai para produção.

Variáveis de ambiente do front (`.env.local`, nunca commitado):

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## 5. Esboço do banco

Esboço inicial, refinado pelo Bernardo na semana 1. Nomes em snake_case.

| Tabela | Colunas principais | Membro vê | RH vê |
| --- | --- | --- | --- |
| `membros` | `id`, `nome`, `email` (único, @ejuvv.com), `perfil` (`membro`/`rh`/`diretor_rh`), `setor_id`, `ativo`, `data_entrada` | Só a própria linha | Todas |
| `setores` | `id`, `nome`, `ativo` | Todos | Todos (RH edita) |
| `registros` | `id`, `membro_id`, `inicio`, `fim` (null = cronômetro ativo), `local` (`sede`/`online`), `descricao`, `origem` (`manual`/`cronometro`), `cancelado`, `precisa_revisao`, `criado_em`, `atualizado_em` | Só os próprios | Todos |
| `metas` | `id`, `horas_total`, `horas_sede`, `vigente_desde` (segunda-feira), `alterado_por` | Todas | Todas (só `diretor_rh` cria) |
| `dispensas` | `id`, `membro_id`, `semana` (segunda-feira), `motivo`, `registrado_por` | Se a própria semana foi dispensada | Todas |
| `historico_setor` | `id`, `membro_id`, `setor_id`, `desde` | O próprio | Todos |
| `auditoria` | `id`, `tabela`, `registro_id`, `acao`, `quem`, `quando`, `antes`, `depois` | Não | Todas |

Funções auxiliares previstas no banco: `meu_id()`, `eh_rh()`, `meu_perfil()` (todas `security definer`, filtrando pelo e-mail de `auth.jwt()` e `ativo = true`).

Restrições previstas: exclusion constraint em `registros` contra sobreposição por `membro_id` (ignorando cancelados); índice único parcial garantindo um único registro com `fim is null` por membro.

## 6. Contrato das funções de dados

Os tipos compartilhados ficam em `src/compartilhado/tipos.ts`:

```ts
export type Perfil = 'membro' | 'rh' | 'diretor_rh'
export type Local = 'sede' | 'online'
export type Origem = 'manual' | 'cronometro'

export interface Membro {
  id: string
  nome: string
  email: string
  perfil: Perfil
  setor: string
  ativo: boolean
  dataEntrada: string // ISO date
}

export interface Registro {
  id: string
  membroId: string
  inicio: string        // ISO datetime
  fim: string | null    // null = cronômetro ativo
  local: Local
  descricao: string
  origem: Origem
  cancelado: boolean
  precisaRevisao: boolean
}

export interface NovoRegistro {
  inicio: string
  fim: string
  local: Local
  descricao: string
}

export interface ProgressoSemana {
  semana: string        // segunda-feira, ISO date
  horasSede: number
  horasTotal: number
  metaSede: number
  metaTotal: number
  cumpriu: boolean
  dispensada: boolean
}

export interface Metas {
  horasTotal: number
  horasSede: number
  vigenteDesde: string
}

export interface NovoMembro {
  nome: string
  email: string
  setor: string
  dataEntrada: string
}

export interface NovaDispensa {
  membroId: string
  semana: string
  motivo: string
}

export interface ResumoMembroSemana {
  membro: Membro
  horasSede: number
  horasTotal: number
  cumpriu: boolean
  dispensada: boolean
}
```

Funções (todas `async`; em erro, lançam `Error` com mensagem em português pronta para a tela):

| Arquivo | Função | Retorno | Usada por | Vira real |
| --- | --- | --- | --- | --- |
| `auth.ts` | `entrarComGoogle()` | `void` | Guilherme | Semana 1 |
| `auth.ts` | `sair()` | `void` | Todos | Semana 1 |
| `auth.ts` | `meuPerfil()` | `Perfil \| null` | Guilherme, Raíssa | Semana 1 |
| `auth.ts` | `meuNome()` | `string` | Guilherme, Raíssa | Semana 1 |
| `registros.ts` | `buscarMeusRegistros(semana: string)` | `Registro[]` | Guilherme | Meio da semana 2 |
| `registros.ts` | `criarRegistro(dados: NovoRegistro)` | `Registro` | Guilherme | Meio da semana 2 |
| `registros.ts` | `editarRegistro(id: string, dados: NovoRegistro)` | `Registro` | Guilherme | Semana 2 |
| `registros.ts` | `cancelarRegistro(id: string)` | `void` | Guilherme | Semana 2 |
| `cronometro.ts` | `cronometroAtivo()` | `Registro \| null` | Guilherme | Semana 2 |
| `cronometro.ts` | `iniciarCronometro(local: Local, descricao: string)` | `Registro` | Guilherme | Semana 2 |
| `cronometro.ts` | `pararCronometro()` | `Registro` | Guilherme | Semana 2 |
| `progresso.ts` | `progressoDaSemana(semana: string)` | `ProgressoSemana` | Guilherme | Começo da semana 3 |
| `progresso.ts` | `progressoDoMes(mes: string)` | `ProgressoSemana[]` | Guilherme | Semana 3 |
| `membros.ts` | `listarMembros()` | `Membro[]` | Raíssa | Semana 2 |
| `membros.ts` | `cadastrarMembro(dados: NovoMembro)` | `Membro` | Raíssa | Semana 2 |
| `membros.ts` | `desativarMembro(id: string)` | `void` | Raíssa | Semana 2 |
| `membros.ts` | `alterarPerfil(id: string, perfil: Perfil)` | `void` | Raíssa | Semana 2 |
| `rh.ts` | `registrarDispensa(dados: NovaDispensa)` | `void` | Raíssa | Semana 2 |
| `rh.ts` | `metasAtuais()` | `Metas` | Raíssa, Guilherme | Semana 2 |
| `rh.ts` | `alterarMetas(horasTotal: number, horasSede: number)` | `void` | Raíssa | Semana 2 |
| `rh.ts` | `percentualDaSemana(semana: string)` | `number` (0 a 100) | Raíssa | Semana 3 |
| `rh.ts` | `resumoDaSemana(semana: string)` | `ResumoMembroSemana[]` | Raíssa | Semana 3 |
| `rh.ts` | `abaixoDaMeta(semana: string)` | `ResumoMembroSemana[]` | Raíssa | Semana 3 |
| `rh.ts` | `buscarRegistrosDoMembro(membroId: string, semana: string)` | `Registro[]` | Raíssa | A definir |
| `rh.ts` | `editarRegistroDeMembro(id: string, dados: NovoRegistro)` | `Registro` | Raíssa | A definir |
| `rh.ts` | `cancelarRegistroDeMembro(id: string)` | `void` | Raíssa | A definir |

Semanas e meses são passados como strings ISO: semana = data da segunda-feira (`'2026-11-02'`), mês = `'2026-11'`.

**Novas funções:** quem precisar de uma função que não existe pede no grupo. Ela é criada primeiro com dados falsos (marcada `// FALSO`), acrescentada a esta tabela, e depois trocada pela real.
