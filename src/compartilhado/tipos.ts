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
  semMeta: boolean      // a semana não conta para a pessoa: a meta começa na semana seguinte à entrada (ou ainda não há meta)
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
  motivoResposta: string | null // motivo da reprovação, que o membro vê na tela de Requerimentos
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
// alcançar o último do pódio, para cima em meia hora (mínimo 0,5).
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

// ej: até a 5ª posição; setor: até a 3ª, do setor de quem chama. Empate na última vaga mostra todos.
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

// Médias por membro na semana (regras-de-negocio.md, seção 8). A diária divide pelos 5 dias úteis.
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
