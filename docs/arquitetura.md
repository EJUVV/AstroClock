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

**Como está no código (desde 10/11/2026):** `src/compartilhado/api/auth.ts` é real. `meuPerfil()` lê a sessão e chama a função `meu_perfil()` do banco; `meusDados()` e `meuNome()` chamam `meus_dados()`. O login pede só contas `@ejuvv.com` (`hd: 'ejuvv.com'`) e sempre deixa escolher a conta. Enquanto as outras funções de `api/` forem falsas, `meuPerfil()` grava o perfil real em `localStorage.perfilFalso`, para os dados falsos combinarem com o painel em que a pessoa entrou.

**Login de demonstração:** com `VITE_LOGIN_FALSO=true`, o `auth.ts` usa o `auth-falso.ts` (sem Google; perfil escolhido no botão de frasco). Serve só para o site de protótipo na Vercel. **Nunca no site de produção.**

## 4. Ambientes

| | `horas-dev` | `horas-prod` |
| --- | --- | --- |
| Uso | Desenvolvimento e testes | Sistema real |
| Dados | Falsos (`supabase/seed.sql`) | Reais |
| Quem mexe | Bernardo e Victor; Guilherme e Johannes a partir da semana 2 | Só o Victor (regra da equipe) |
| Organização no Supabase | "EJUVV Dev" | "EJUVV Dev" (a mesma) |
| Região | Leste dos EUA (`us-east-1`) | São Paulo (`sa-east-1`), recriado em 11/11/2026 |

**Decisão de 10/11/2026:** os dois projetos ficam na mesma organização, de propósito. Por isso, quem é convidado para a organização também **consegue** abrir a produção: não há bloqueio técnico. Aplicar migrações e mexer no `horas-prod` continua sendo só do Victor, por regra da equipe.

A mesma estrutura (migrações) é aplicada nos dois. O seed nunca vai para produção.

Variáveis de ambiente do front (`.env.local`, nunca commitado):

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_MOSTRAR_DEMO=   # true: botão de frasco num site publicado (no npm run dev ele sempre aparece)
VITE_LOGIN_FALSO=    # true: login de demonstração, sem Google
```

Na Vercel (projeto `astro-clock`, time ejuvv), o site de protótipo usa `VITE_MOSTRAR_DEMO=true` e `VITE_LOGIN_FALSO=true` (criada em 10/11/2026). O site de produção do piloto terá as duas vazias e as chaves do `horas-prod`.

## 5. Esboço do banco

Esboço inicial, refinado pelo Bernardo na semana 1. Nomes em snake_case.

| Tabela | Colunas principais | Membro vê | RH vê |
| --- | --- | --- | --- |
| `membros` | `id`, `nome`, `email` (único, @ejuvv.com), `perfil` (`membro`/`rh`/`diretor_rh`/`diretor_setor`/`presidente`), `setor_id`, `ativo`, `data_entrada` | Só a própria linha | Todas (quem dirige setores sem ver tudo, só as dos setores que dirige) |
| `setores` | `id`, `nome`, `ativo`, `eh_rh` (boolean, padrão `false`, no máximo um `true`: marca o setor RH sem depender do nome) | Todos | Todos (RH edita) |
| `registros` | `id`, `membro_id`, `inicio`, `fim` (null = cronômetro ativo), `local` (`sede`/`online`), `descricao`, `origem` (`manual`/`cronometro`), `cancelado`, `precisa_revisao`, `criado_em`, `atualizado_em` | Só os próprios | Todos (quem dirige setores sem ver tudo, só os dos setores que dirige) |
| `metas` | `id`, `horas_total`, `horas_sede` (pode ser 0), `vigente_desde` (segunda-feira escolhida pelo diretor, sempre futura), `alterado_por` | Todas | Todas (só `diretor_rh` cria) |
| `requerimentos` | `id`, `membro_id`, `tipo` (`so_remoto`/`ausencia_total`), `data_inicio`, `data_fim`, `motivo`, `situacao` (`pendente`/`aprovado`/`reprovado`), `anexo_caminho`, `anexo_nome`, `motivo_resposta`, `criado_em`, `respondido_por`, `respondido_em` | Os próprios (e cria) | `rh`, `diretor_rh` e `presidente` veem todos; só `diretor_rh` responde. O `diretor_setor` não vê |
| `presenca_sede` | `id`, `membro_id`, `entrada`, `saida` (null = está na sede agora) | Quem está na sede agora (só o nome); marca e desmarca só a própria | Todas |
| `historico_setor` | `id`, `membro_id`, `setor_anterior_id`, `setor_novo_id`, `alterado_em`, `alterado_por` (o banco grava sozinho quando `membros.setor_id` muda; o site só lê) | O próprio | `rh`, `diretor_rh` e `presidente` |
| `diretorias` | `setor_id` (chave primária, referência a `setores`: um diretor por setor), `membro_id`, `desde`, `registrado_por`. Uma linha = o setor tem diretor; uma pessoa pode ter várias linhas (só `diretor_setor`, `diretor_rh` e `presidente` ativos) | Não | Quem tem o painel do RH lê: quem vê tudo (`rh`, `presidente`, quem dirige o setor RH) e quem dirige algum setor (inclusive o `diretor_setor`). Só as funções do banco gravam |
| `historico_diretorias` | `id`, `setor_id`, `membro_id`, `inicio`, `fim` (null enquanto vale), `registrado_por`, `encerrado_por` (null = direto no banco; só as funções do banco gravam) | Não | Quem tem o painel do RH lê, como em `diretorias` (inclusive o `diretor_setor`) |
| `auditoria` | `id`, `tabela`, `registro_id`, `acao`, `quem`, `quando`, `motivo`, `antes`, `depois` (só as funções do banco gravam) | Não | `rh`, `diretor_rh` e `presidente` leem. O `diretor_setor` não |

**Requerimento de ausência** (seção 7 do `regras-de-negocio.md`): substitui a antiga tabela `dispensas`. Só requerimento `aprovado` muda a meta: `so_remoto` zera a exigência de sede; `ausencia_total` dispensa a semana. Vale para **todas as semanas que as datas tocam, inteiras**, da segunda de `data_inicio` à segunda de `data_fim`. O e-mail vai para todos os membros ativos com perfil `rh` ou `diretor_rh`. Só o `diretor_rh` responde. A reprovação grava `motivo_resposta` e manda e-mail ao membro. A aprovação **apaga o anexo** do Storage e limpa `anexo_caminho`. Ainda depende da diretora de RH ([`pauta-diretora-rh.md`](pauta-diretora-rh.md)): aviso ao membro na aprovação e dispensa direta pelo RH.

**Anexo do requerimento:** arquivo em um bucket **privado** do Supabase Storage, com regras de acesso só para quem enviou, para `rh`, `diretor_rh` e `presidente`. A tela abre o arquivo por link temporário (`linkDoAnexo`). Limite técnico inicial: PDF, JPG ou PNG, até 5 MB. **O backup diário só copia o banco, não os arquivos**: é preciso incluir o bucket no backup antes de abrir o anexo em produção.

**Presença na sede** (seção 13 do `regras-de-negocio.md`): não registra horas. Índice único parcial: uma única linha com `saida is null` por membro. Como o membro só vê a própria linha de `membros`, a lista de quem está na sede precisa de uma visão ou função que exponha só o nome e o setor. O sistema desmarca sozinho quem esquecer (tarefa agendada no banco); o horário ainda depende da diretora de RH.

**Diretorias acumuladas** (seção 5 do `regras-de-negocio.md`; desenho em `docs/superpowers/specs/2026-11-26-diretorias-acumuladas-design.md`): a migração nova (depois da `ranking_e_podio`) cria `setores.eh_rh`, `diretorias` e `historico_diretorias`, e faz a carga inicial (cada `diretor_setor` ativo vira diretor do próprio setor; o `diretor_rh` ativo, do setor RH). Funções novas: `setores_que_dirijo()` (conjunto de `setor_id`), `minhas_diretorias()`, `situacao_dos_setores()` (os setores ativos, com o diretor atual ou vago; ajuste ao desenho, que previa `diretorias_atuais()`, para a tela mostrar também os setores vagos), `atribuir_diretoria(p_setor, p_membro_id)` e `remover_diretoria(p_setor)` (`p_setor` é o **nome** do setor, texto, sem diferenciar maiúsculas; só quem dirige o setor RH e o `presidente`; atribuir a um setor que já tem diretor troca o diretor). Mudam de significado: `eh_diretor_rh()` = dirige o setor RH; `eh_rh()` = perfil `rh` ou dirige o setor RH; `ve_tudo()` = perfil `rh` ou `presidente` ou dirige o setor RH. `setor_que_dirijo()` sai, trocada por `setores_que_dirijo()` (leitura de `membros` e `registros`, `resumo_da_semana` e `ranking_do_mes`). O índice de um `diretor_setor` ativo por setor sai (a chave de `diretorias` faz o papel); fica só o de um único `presidente`. Desativar alguém, ou mudar o perfil para `membro` ou `rh`, encerra as diretorias dele (gatilho). A migração seguinte, `encerrar_diretoria_setor_inativo` (decidido pelo líder do projeto em 26/11/2026), faz o mesmo com o setor: desativar um setor encerra a diretoria dele (sai de `diretorias`, o histórico fecha com `encerrado_por` = quem desativou, ou null direto no banco), e reativar deixa o setor vago; `setores_que_dirijo()` e `minhas_diretorias()` ignoram setor inativo.

**Banco novo (`horas-prod` e `db reset`):** os setores não nascem nas migrações, então a migração não marca o setor RH nem cria diretorias num banco vazio. Depois de criar os setores, é preciso marcar o setor RH (`eh_rh = true`, só direto no banco) e registrar a diretoria do primeiro diretor do RH (linha em `diretorias` e linha aberta em `historico_diretorias`); sem isso ninguém tem os poderes do RH. O passo está na B14 (`tarefas-semanas-2-a-4.md`) e o `seed.sql` faz o mesmo para o `horas-dev`.

Funções auxiliares que já existem no `horas-dev` (conferido em 10/11/2026; atualizado com as diretorias acumuladas em 26/11/2026), todas filtrando pelo e-mail de `auth.jwt()` e `ativo = true`:

| Função | O que devolve |
| --- | --- |
| `meu_id()` | O `id` do membro logado |
| `meu_perfil()` | O perfil do membro logado (usada pelo `auth.ts`) |
| `meus_dados()` | Nome, e-mail, perfil, setor, ativo e data de entrada (usada pelo `auth.ts`) |
| `eh_rh()` | Se o perfil é `rh` ou se a pessoa dirige o setor RH |
| `eh_diretor_rh()` | Se a pessoa dirige o setor RH (é o diretor do RH, inclusive o `presidente`); o perfil `diretor_rh` sozinho não basta |
| `ve_tudo()` | Se o perfil é `rh` ou `presidente`, ou se a pessoa dirige o setor RH (veem a EJ toda) |
| `setores_que_dirijo()` | Os `setor_id` dos setores ativos que o logado dirige (vazio para quem não dirige nenhum). Trocou a `setor_que_dirijo()`, que saiu |
| `meu_setor_id()` | O setor de quem está logado, qualquer perfil (criada na B7) |
| `perfil_tem_meta(perfil)` | Se o perfil tem meta (`membro` e `rh`) |
| `elegivel_na_semana(...)` | Se o membro conta na meta daquela semana |

Também existe a visão `lista_de_metas`, para ler o histórico de metas. A tabela `dispensas` foi removida na B7 (12/11/2026).

Funções do RH criadas na B7, chamadas pelo site com `supabase.rpc(...)`. Só `rh` e `diretor_rh` (motivo obrigatório; cada chamada grava na `auditoria`): `criar_registro_de_membro`, `editar_registro_de_membro` e `cancelar_registro_de_membro`. A `revisar_cronometro(id, aprovar, motivo?)` vale para `rh`, `diretor_rh` e `presidente` (a liberação do `presidente` é uma correção pedida na revisão de 12/11/2026).

**Perfis no RLS** (seção 5 do `regras-de-negocio.md`):

| Perfil | Vê membros e registros | Altera |
| --- | --- | --- |
| `membro` | Só os próprios | Os próprios registros (prazo de 7 dias) |
| `rh` | Todos | Registros de qualquer um (com motivo), desativar membro, mudar setor |
| `diretor_rh` | Todos | Tudo do `rh` + cadastrar membro, alterar perfil, metas, responder requerimento |
| `diretor_setor` | Só os dos setores que dirige (registrados em `diretorias`) | Nada de outros membros |
| `presidente` | Todos, inclusive requerimentos e anexos | Nada de outros membros |

Só `membro` e `rh` têm registros de horas e requerimentos: os diretores e o presidente não têm meta.

Restrições previstas: exclusion constraint em `registros` contra sobreposição por `membro_id` (ignorando cancelados); índice único parcial garantindo um único registro com `fim is null` por membro; um diretor por setor garantido pela chave primária de `diretorias` (`setor_id`; desde as diretorias acumuladas, o antigo índice de um `diretor_setor` ativo por setor saiu); índice único parcial garantindo um único `presidente` ativo.

**Registro que passa da meia-noite:** vira duas linhas em `registros`, uma para cada dia. `criarRegistro()`, `editarRegistro()` e `pararCronometro()` devolvem a **primeira parte**, e a tela recarrega a lista depois de salvar. As funções falsas fazem a divisão pelo horário de Brasília (`dividirNaMeiaNoite`); cada parte vira um registro independente, editado ou cancelado sozinho.

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

// Posição do membro logado no mês. "Faltam" = 0 no pódio; 0,5 se o pódio ainda tem vaga; senão, horas para
// alcançar o último do pódio, para cima em meia hora (mínimo 0,5). minhaPosicaoNoRanking devolve null se a
// pessoa não entra no ranking do mês.
export interface PosicaoRanking {
  posicaoEJ: number
  totalEJ: number
  posicaoSetor: number
  totalSetor: number
  horasTotal: number
  faltamParaPodioEJ: number
  faltamParaPodioSetor: number
}

// Pódio: só nome, setor e horas (o membro nunca recebe a lista completa).
export interface LinhaPodio {
  posicao: number
  membroId: string
  nome: string
  setor: string
  horasTotal: number
  horasSede: number
}

// ej: até 5 posições; setor: até 3 posições do setor de quem chama. Empate na última vaga mostra todos.
export interface PodioDoMes {
  ej: LinhaPodio[]
  setor: LinhaPodio[]
}

// Média de horas por membro do setor no mês, sem os dispensados.
export interface LinhaRankingSetor {
  posicao: number
  setor: string
  membrosContados: number
  mediaTotal: number
  mediaSede: number
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

// Setor dirigido por quem está logado. ehRH: é o setor RH (quem o dirige tem os poderes do diretor do RH).
export interface Diretoria {
  setor: string
  ehRH: boolean
  diretorId: string
  diretorNome: string
  desde: string         // ISO datetime
}

// Um setor com o diretor atual; diretor = null quando o setor está vago.
export interface SituacaoSetor {
  setor: string
  ehRH: boolean
  diretor: { id: string; nome: string; desde: string } | null
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
| `auth.ts` | `minhaFotoDoGoogle()` | `string \| null` (foto da conta Google, lida da sessão; a foto escolhida nas Configurações fica só no aparelho) | Guilherme | Semana 4 (G12) |
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
| `ranking.ts` | `minhaPosicaoNoRanking(mes: string)` | `PosicaoRanking` ou `null` | Guilherme | Ranking com pódio (24/11); o `progresso.ts` reexporta |
| `ranking.ts` | `podioDoMes(mes: string)` | `PodioDoMes` | Guilherme | Ranking com pódio (24/11) |
| `ranking.ts` | `rankingDosSetores(mes: string)` | `LinhaRankingSetor[]` | Guilherme, Johannes | Ranking com pódio (24/11) |
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
| `rh.ts` | `cancelarMeta(vigenteDesde: string)` | `void` | Johannes | Depois da B15 (decidido em 25/11/2026) |
| `rh.ts` | `percentualDaSemana(semana: string, setor?: string)` | `number` (0 a 100) | Johannes | Semana 3 |
| `rh.ts` | `resumoDaSemana(semana: string, setor?: string)` | `ResumoMembroSemana[]` | Johannes | Semana 3 |
| `rh.ts` | `abaixoDaMeta(semana: string, setor?: string)` | `ResumoMembroSemana[]` | Johannes | Semana 3 |
| `rh.ts` | `mediasDaSemana(semana: string, setor?: string)` | `MediasDaSemana` | Johannes | Semana 3 |
| `rh.ts` | `progressoDeMembro(membroId: string, semana: string)` | `ProgressoSemana` | Johannes | Semana 3 |
| `rh.ts` | `semanasSeguidasAbaixo(semana: string)` | `MembroAbaixoSeguido[]` | Johannes | Semana 3 |
| `rh.ts` | `cronometrosEmRevisao()` | `Registro[]` | Johannes | Semana 3 |
| `rh.ts` | `revisarCronometro(id: string, aprovar: boolean)` | `void` | Johannes | Semana 3 |
| `rh.ts` | `rankingDoMes(mes: string)` | `LinhaRanking[]` | Johannes | Depois da J10 (função do banco `ranking_do_mes` pronta na entrega do pódio) |
| `rh.ts` | `buscarRegistrosDoMembro(membroId: string, semana: string)` | `Registro[]` | Johannes | A definir |
| `rh.ts` | `criarRegistroDeMembro(membroId: string, dados: NovoRegistro, motivo: string)` | `Registro` | Johannes | A definir |
| `rh.ts` | `editarRegistroDeMembro(id: string, dados: NovoRegistro, motivo: string)` | `Registro` | Johannes | A definir |
| `rh.ts` | `cancelarRegistroDeMembro(id: string, motivo: string)` | `void` | Johannes | A definir |
| `requerimentos.ts` | `enviarRequerimento(dados: NovoRequerimento)` | `Requerimento` | Guilherme | Semana 3 |
| `requerimentos.ts` | `meusRequerimentos()` | `Requerimento[]` | Guilherme | Semana 3 |
| `requerimentos.ts` | `linkDoAnexo(id: string)` | `string` | Guilherme, Johannes | Semana 4 |
| `rh.ts` | `listarRequerimentos(situacao?: SituacaoRequerimento)` | `Requerimento[]` | Johannes | Semana 3 |
| `rh.ts` | `responderRequerimento(id: string, aprovar: boolean, motivo?: string)` | `void` | Johannes | Semana 3 |
| `diretorias.ts` | `minhasDiretorias()` | `Diretoria[]` (setores que o logado dirige; vazio para quem não dirige) | Todos (sessão) | Diretorias acumuladas |
| `diretorias.ts` | `situacaoDosSetores()` | `SituacaoSetor[]` (todos os setores, com diretor ou vago; lida por quem tem painel do RH) | Johannes | Diretorias acumuladas |
| `diretorias.ts` | `atribuirDiretoria(setor: string, membroId: string)` | `void` (só quem dirige o RH e o `presidente`; troca o diretor se o setor já tem um) | Johannes | Diretorias acumuladas |
| `diretorias.ts` | `removerDiretoria(setor: string)` | `void` (só quem dirige o RH e o `presidente`) | Johannes | Diretorias acumuladas |
| `presenca.ts` | `quemEstaNaSede()` | `PresencaSede[]` | Guilherme, Johannes | Semana 4 |
| `presenca.ts` | `estouNaSede()` | `boolean` | Guilherme | Semana 4 |
| `presenca.ts` | `marcarNaSede()` | `void` | Guilherme | Semana 4 |
| `presenca.ts` | `desmarcarNaSede()` | `void` | Guilherme | Semana 4 |

Sem `setor`, as funções do painel do RH consideram a EJ toda. Para o `diretor_setor`, elas sempre ficam no setor dele, mesmo que a tela peça outro. `motivo` em `responderRequerimento` é obrigatório na reprovação.

Semanas e meses são passados como strings ISO: semana = data da segunda-feira (`'2026-11-02'`), mês = `'2026-11'`.

**Novas funções:** quem precisar de uma função que não existe pede no grupo. Ela é criada primeiro com dados falsos (marcada `// FALSO`), acrescentada a esta tabela, e depois trocada pela real.
