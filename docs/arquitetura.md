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
| `/membro` | Painel do membro | Perfis com meta: `membro` e `rh` |
| `/rh` | Painel do RH | `rh`, `diretor_rh`, `diretor_setor` e `presidente` |

Rotas protegidas usam um componente `RotaProtegida` que consulta `meuPerfil()`. Isso é experiência; a proteção real é o RLS.

## 3. Login

1. Botão chama `entrarComGoogle()`.
2. A função chama `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: <origem>/inicio } })`.
3. O Supabase leva ao Google; a pessoa escolhe a conta `@ejuvv.com`; o Google confirma e devolve ao Supabase, que cria a sessão.
4. A pessoa volta em `/inicio`, já logada. A tela chama `meuPerfil()`:
   - `null` → `sair()` e mostra "Acesso negado. Procure o RH."
   - `'membro'` → `/membro`
   - qualquer outro perfil (`rh`, `diretor_rh`, `diretor_setor`, `presidente`) → `/rh`

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
| `membros` | `id`, `nome`, `email` (único, @ejuvv.com), `perfil` (`membro`/`rh`/`diretor_rh`/`diretor_setor`/`presidente`), `setor_id`, `ativo`, `data_entrada` | Só a própria linha | Todas (o `diretor_setor`, só as do próprio setor) |
| `setores` | `id`, `nome`, `ativo` | Todos | Todos (RH edita) |
| `registros` | `id`, `membro_id`, `inicio`, `fim` (null = cronômetro ativo), `local` (`sede`/`online`), `descricao`, `origem` (`manual`/`cronometro`), `cancelado`, `precisa_revisao`, `criado_em`, `atualizado_em` | Só os próprios | Todos (o `diretor_setor`, só os do próprio setor) |
| `metas` | `id`, `horas_total`, `horas_sede` (pode ser 0), `vigente_desde` (segunda-feira escolhida pelo diretor, sempre futura), `alterado_por` | Todas | Todas (só `diretor_rh` cria) |
| `requerimentos` | `id`, `membro_id`, `tipo` (`so_remoto`/`ausencia_total`), `data_inicio`, `data_fim`, `motivo`, `situacao` (`pendente`/`aprovado`/`reprovado`), `anexo_caminho`, `anexo_nome`, `motivo_resposta`, `criado_em`, `respondido_por`, `respondido_em` | Os próprios (e cria) | `rh`, `diretor_rh` e `presidente` veem todos; só `diretor_rh` responde. O `diretor_setor` não vê |
| `presenca_sede` | `id`, `membro_id`, `entrada`, `saida` (null = está na sede agora) | Quem está na sede agora (só o nome); marca e desmarca só a própria | Todas |
| `historico_setor` | `id`, `membro_id`, `setor_id`, `desde` | O próprio | Todos |
| `auditoria` | `id`, `tabela`, `registro_id`, `acao`, `quem`, `quando`, `antes`, `depois` | Não | Todas |

**Requerimento de ausência** (seção 7 do `regras-de-negocio.md`): substitui a antiga tabela `dispensas`. Só requerimento `aprovado` muda a meta: `so_remoto` zera a exigência de sede; `ausencia_total` dispensa a semana. Vale para **todas as semanas que as datas tocam, inteiras**, da segunda de `data_inicio` à segunda de `data_fim`. O e-mail vai para todos os membros ativos com perfil `rh` ou `diretor_rh`. Só o `diretor_rh` responde. A reprovação grava `motivo_resposta` e manda e-mail ao membro. A aprovação **apaga o anexo** do Storage e limpa `anexo_caminho`. Ainda depende da diretora de RH ([`pauta-diretora-rh.md`](pauta-diretora-rh.md)): aviso ao membro na aprovação e dispensa direta pelo RH.

**Anexo do requerimento:** arquivo em um bucket **privado** do Supabase Storage, com regras de acesso só para quem enviou, para `rh`, `diretor_rh` e `presidente`. A tela abre o arquivo por link temporário (`linkDoAnexo`). Limite técnico inicial: PDF, JPG ou PNG, até 5 MB. **O backup diário só copia o banco, não os arquivos**: é preciso incluir o bucket no backup antes de abrir o anexo em produção.

**Presença na sede** (seção 13 do `regras-de-negocio.md`): não registra horas. Índice único parcial: uma única linha com `saida is null` por membro. Como o membro só vê a própria linha de `membros`, a lista de quem está na sede precisa de uma visão ou função que exponha só o nome e o setor. O sistema desmarca sozinho quem esquecer (tarefa agendada no banco); o horário ainda depende da diretora de RH.

Funções auxiliares previstas no banco: `meu_id()`, `meu_perfil()`, `meu_setor_id()` e `eh_rh()` (`rh` ou `diretor_rh`), todas `security definer`, filtrando pelo e-mail de `auth.jwt()` e `ativo = true`.

**Perfis no RLS** (seção 5 do `regras-de-negocio.md`):

| Perfil | Vê membros e registros | Altera |
| --- | --- | --- |
| `membro` | Só os próprios | Os próprios registros (prazo de 7 dias) |
| `rh` | Todos | Registros de qualquer um (com motivo), desativar membro, mudar setor |
| `diretor_rh` | Todos | Tudo do `rh` + cadastrar membro, alterar perfil, metas, responder requerimento |
| `diretor_setor` | Só os do próprio setor | Nada de outros membros |
| `presidente` | Todos, inclusive requerimentos e anexos | Nada de outros membros |

Só `membro` e `rh` têm registros de horas e requerimentos: os diretores e o presidente não têm meta.

Restrições previstas: exclusion constraint em `registros` contra sobreposição por `membro_id` (ignorando cancelados); índice único parcial garantindo um único registro com `fim is null` por membro; índice único parcial garantindo no máximo um `diretor_setor` ativo por `setor_id`.

**Registro que passa da meia-noite:** vira duas linhas em `registros`, uma para cada dia. `criarRegistro()`, `editarRegistro()` e `pararCronometro()` devolvem a **primeira parte**, e a tela recarrega a lista depois de salvar. As funções falsas ainda não fazem a divisão.

## 6. Contrato das funções de dados

Os tipos compartilhados ficam em `src/compartilhado/tipos.ts`:

```ts
export type Perfil = 'membro' | 'rh' | 'diretor_rh' | 'diretor_setor' | 'presidente'
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

export interface ResumoMembroSemana {
  membro: Membro
  horasSede: number
  horasTotal: number
  cumpriu: boolean
  dispensada: boolean
}

export type TipoRequerimento = 'so_remoto' | 'ausencia_total'
export type SituacaoRequerimento = 'pendente' | 'aprovado' | 'reprovado'

export interface Requerimento {
  id: string
  membroId: string
  nomeMembro: string
  tipo: TipoRequerimento
  inicio: string        // ISO date
  fim: string           // ISO date
  motivo: string
  situacao: SituacaoRequerimento
  criadoEm: string      // ISO datetime
  anexoNome: string | null
  motivoResposta: string | null // motivo da reprovação, que vai no e-mail para o membro
}

export interface NovoRequerimento {
  tipo: TipoRequerimento
  inicio: string
  fim: string
  motivo: string
  anexo?: File
}

export interface PresencaSede {
  membroId: string
  nome: string
  setor: string
  desde: string         // ISO datetime
}

export interface MembroAbaixoSeguido {
  membro: Membro
  semanasSeguidas: number
}

export interface LinhaRanking {
  posicao: number
  membro: Membro
  horasTotal: number
  horasSede: number
  dispensado: boolean
}

export interface PosicaoRanking {
  posicaoEJ: number
  totalEJ: number
  posicaoSetor: number
  totalSetor: number
}

// Médias por membro na semana. A diária divide pelos 5 dias úteis.
export interface MediasDaSemana {
  mediaTotal: number
  mediaSede: number
  mediaDiaria: number
}

export interface HorasDoDia {
  dia: string           // ISO date
  horasSede: number
  horasTotal: number
}
```

Semana com requerimento `so_remoto` aprovado: `metaSede` vem como 0 em `ProgressoSemana`. Semana com `ausencia_total` aprovado: `dispensada` vem como `true`.

Funções (todas `async`; em erro, lançam `Error` com mensagem em português pronta para a tela). Quem troca a versão falsa pela real, a partir de 09/11/2026: Guilherme em `registros.ts`, `cronometro.ts`, `requerimentos.ts` (lado do membro) e `presenca.ts`; Johannes em `membros.ts` e `rh.ts`; Bernardo em `auth.ts` e nos cálculos de `progresso.ts` e `rh.ts` que dependem de SQL. Tabelas e RLS continuam só com o Bernardo:

| Arquivo | Função | Retorno | Usada por | Vira real |
| --- | --- | --- | --- | --- |
| `auth.ts` | `entrarComGoogle()` | `void` | Guilherme | Semana 1 |
| `auth.ts` | `sair()` | `void` | Todos | Semana 1 |
| `auth.ts` | `meuPerfil()` | `Perfil \| null` | Guilherme, Johannes | Semana 1 |
| `auth.ts` | `meuNome()` | `string` | Guilherme, Johannes | Semana 1 |
| `auth.ts` | `meusDados()` | `Membro` | Guilherme, Johannes | Semana 1 |
| `registros.ts` | `buscarMeusRegistros(semana: string)` | `Registro[]` | Guilherme | Meio da semana 2 |
| `registros.ts` | `criarRegistro(dados: NovoRegistro)` | `Registro` | Guilherme | Meio da semana 2 |
| `registros.ts` | `editarRegistro(id: string, dados: NovoRegistro)` | `Registro` | Guilherme | Semana 2 |
| `registros.ts` | `cancelarRegistro(id: string)` | `void` | Guilherme | Semana 2 |
| `cronometro.ts` | `cronometroAtivo()` | `Registro \| null` | Guilherme | Semana 2 |
| `cronometro.ts` | `iniciarCronometro(local: Local, descricao: string)` | `Registro` | Guilherme | Semana 2 |
| `cronometro.ts` | `pararCronometro()` | `Registro` | Guilherme | Semana 2 |
| `progresso.ts` | `progressoDaSemana(semana: string)` | `ProgressoSemana` | Guilherme | Começo da semana 3 |
| `progresso.ts` | `progressoDoMes(mes: string)` | `ProgressoSemana[]` | Guilherme | Semana 3 |
| `progresso.ts` | `horasPorDia(semana: string)` | `HorasDoDia[]` | Guilherme | Semana 4 |
| `progresso.ts` | `minhaPosicaoNoRanking(mes: string)` | `PosicaoRanking` | Guilherme | Semana 4 |
| `membros.ts` | `listarMembros()` | `Membro[]` | Johannes | Semana 2 |
| `membros.ts` | `cadastrarMembro(dados: NovoMembro)` | `Membro` | Johannes | Semana 2 |
| `membros.ts` | `desativarMembro(id: string)` | `void` | Johannes | Semana 2 |
| `membros.ts` | `alterarPerfil(id: string, perfil: Perfil)` | `void` | Johannes | Semana 2 |
| `membros.ts` | `listarSetores()` | `string[]` | Johannes | Semana 2 |
| `membros.ts` | `alterarSetor(id: string, setor: string)` | `void` | Johannes | Semana 2 |
| `rh.ts` | `registrarDispensa(dados: NovaDispensa)` | `void` | — | **Sai do contrato** (09/11/2026): o RH não dispensa direto, o caminho é o requerimento. A tabela `dispensas` do `horas-dev` também sai |
| `rh.ts` | `metasAtuais()` | `Metas` | Johannes, Guilherme | Semana 2 |
| `rh.ts` | `listarMetas()` | `Metas[]` | Johannes | Semana 2 |
| `rh.ts` | `alterarMetas(horasTotal: number, horasSede: number, vigenteDesde: string)` | `void` | Johannes | Semana 2 |
| `rh.ts` | `percentualDaSemana(semana: string, setor?: string)` | `number` (0 a 100) | Johannes | Semana 3 |
| `rh.ts` | `resumoDaSemana(semana: string, setor?: string)` | `ResumoMembroSemana[]` | Johannes | Semana 3 |
| `rh.ts` | `abaixoDaMeta(semana: string, setor?: string)` | `ResumoMembroSemana[]` | Johannes | Semana 3 |
| `rh.ts` | `mediasDaSemana(semana: string, setor?: string)` | `MediasDaSemana` | Johannes | Semana 3 |
| `rh.ts` | `progressoDeMembro(membroId: string, semana: string)` | `ProgressoSemana` | Johannes | Semana 3 |
| `rh.ts` | `semanasSeguidasAbaixo(semana: string)` | `MembroAbaixoSeguido[]` | Johannes | Semana 3 |
| `rh.ts` | `cronometrosEmRevisao()` | `Registro[]` | Johannes | Semana 3 |
| `rh.ts` | `revisarCronometro(id: string, aprovar: boolean)` | `void` | Johannes | Semana 3 |
| `rh.ts` | `rankingDoMes(mes: string)` | `LinhaRanking[]` | Johannes | Semana 4 |
| `rh.ts` | `buscarRegistrosDoMembro(membroId: string, semana: string)` | `Registro[]` | Johannes | A definir |
| `rh.ts` | `criarRegistroDeMembro(membroId: string, dados: NovoRegistro, motivo: string)` | `Registro` | Johannes | A definir |
| `rh.ts` | `editarRegistroDeMembro(id: string, dados: NovoRegistro, motivo: string)` | `Registro` | Johannes | A definir |
| `rh.ts` | `cancelarRegistroDeMembro(id: string, motivo: string)` | `void` | Johannes | A definir |
| `requerimentos.ts` | `enviarRequerimento(dados: NovoRequerimento)` | `Requerimento` | Guilherme | Semana 3 |
| `requerimentos.ts` | `meusRequerimentos()` | `Requerimento[]` | Guilherme | Semana 3 |
| `requerimentos.ts` | `linkDoAnexo(id: string)` | `string` | Guilherme, Johannes | Semana 4 |
| `rh.ts` | `listarRequerimentos(situacao?: SituacaoRequerimento)` | `Requerimento[]` | Johannes | Semana 3 |
| `rh.ts` | `responderRequerimento(id: string, aprovar: boolean, motivo?: string)` | `void` | Johannes | Semana 3 |
| `presenca.ts` | `quemEstaNaSede()` | `PresencaSede[]` | Guilherme, Johannes | Semana 4 |
| `presenca.ts` | `estouNaSede()` | `boolean` | Guilherme | Semana 4 |
| `presenca.ts` | `marcarNaSede()` | `void` | Guilherme | Semana 4 |
| `presenca.ts` | `desmarcarNaSede()` | `void` | Guilherme | Semana 4 |

Sem `setor`, as funções do painel do RH consideram a EJ toda. Para o `diretor_setor`, elas sempre ficam no setor dele, mesmo que a tela peça outro. `motivo` em `responderRequerimento` é obrigatório na reprovação.

Semanas e meses são passados como strings ISO: semana = data da segunda-feira (`'2026-11-02'`), mês = `'2026-11'`.

**Novas funções:** quem precisar de uma função que não existe pede no grupo. Ela é criada primeiro com dados falsos (marcada `// FALSO`), acrescentada a esta tabela, e depois trocada pela real.
