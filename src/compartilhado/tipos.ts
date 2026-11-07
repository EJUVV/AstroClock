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

// Médias por membro na semana (regras-de-negocio.md, seção 11). A diária divide pelos 5 dias úteis.
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
