// FALSO: trocar pela versão real (ver docs/arquitetura.md)
// Dados em memória usados pelas funções falsas. Somem ao recarregar a página.
import type {
  Local,
  Membro,
  Metas,
  Perfil,
  ProgressoSemana,
  Registro,
  ResumoMembroSemana,
} from '../tipos.ts'

// ---------- Ajudantes ----------

export function atraso(ms = 300): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms))
}

export function copia<T>(valor: T): T {
  return structuredClone(valor)
}

const FUSO = 'America/Sao_Paulo'

// Data ('AAAA-MM-DD') de um instante no horário de Brasília.
export function dataEmBrasilia(instante: Date | string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(instante))
}

export function somarDias(data: string, dias: number): string {
  const d = new Date(`${data}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

export function segundaDaSemana(data: string): string {
  const diaDaSemana = new Date(`${data}T00:00:00Z`).getUTCDay() // 0 = domingo
  return somarDias(data, -((diaDaSemana + 6) % 7))
}

export function semanaAtual(): string {
  return segundaDaSemana(dataEmBrasilia(new Date()))
}

// O Brasil não tem horário de verão desde 2019, então Brasília é sempre -03:00.
function instante(data: string, hora: string): string {
  return `${data}T${hora}:00-03:00`
}

// ---------- Perfil e membro logado ----------

export function perfilFalso(): Perfil | null {
  let valor: string | null = null
  try {
    valor = localStorage.getItem('perfilFalso')
  } catch {
    // Sem acesso ao localStorage: usa o padrão.
  }
  if (valor === 'nenhum') return null
  if (valor === 'rh' || valor === 'diretor_rh') return valor
  return 'membro'
}

// Cada perfil falso "entra" como um membro diferente.
const membroPorPerfil: Record<Perfil, string> = {
  membro: 'm1',
  rh: 'm3',
  diretor_rh: 'm4',
}

export function membroLogado(): Membro {
  const perfil = perfilFalso()
  const membro = perfil && membros.find((m) => m.id === membroPorPerfil[perfil])
  if (!membro) throw new Error('Você não está logado. Entre novamente.')
  return membro
}

// ---------- Dados ----------

export const setores: string[] = ['Projetos', 'Comercial', 'RH', 'Marketing', 'Gestão e Qualidade']

const segundaAtual = semanaAtual()

export const membros: Membro[] = [
  { id: 'm1', nome: 'Ana Souza', email: 'ana.souza@ejuvv.com', perfil: 'membro', setor: 'Projetos', ativo: true, dataEntrada: '2026-02-02' },
  { id: 'm2', nome: 'Bruno Lima', email: 'bruno.lima@ejuvv.com', perfil: 'membro', setor: 'Comercial', ativo: true, dataEntrada: '2026-02-02' },
  { id: 'm3', nome: 'Carla Mendes', email: 'carla.mendes@ejuvv.com', perfil: 'rh', setor: 'RH', ativo: true, dataEntrada: '2026-02-02' },
  { id: 'm4', nome: 'Diego Rocha', email: 'diego.rocha@ejuvv.com', perfil: 'diretor_rh', setor: 'RH', ativo: true, dataEntrada: '2026-02-02' },
  { id: 'm5', nome: 'Eduarda Pires', email: 'eduarda.pires@ejuvv.com', perfil: 'membro', setor: 'Marketing', ativo: true, dataEntrada: '2026-03-02' },
  { id: 'm6', nome: 'Felipe Alves', email: 'felipe.alves@ejuvv.com', perfil: 'membro', setor: 'Gestão e Qualidade', ativo: true, dataEntrada: '2026-03-02' },
  { id: 'm7', nome: 'Gabriela Nunes', email: 'gabriela.nunes@ejuvv.com', perfil: 'membro', setor: 'Projetos', ativo: false, dataEntrada: '2026-02-02' },
  { id: 'm8', nome: 'Henrique Costa', email: 'henrique.costa@ejuvv.com', perfil: 'membro', setor: 'Comercial', ativo: true, dataEntrada: '2026-04-06' },
  // Cadastrado nesta semana: a meta só começa a valer na semana seguinte.
  { id: 'm9', nome: 'Igor Martins', email: 'igor.martins@ejuvv.com', perfil: 'membro', setor: 'Marketing', ativo: true, dataEntrada: segundaAtual },
]

// semanasAtras: 0 = semana atual. dia: 0 = segunda ... 6 = domingo. ate '24:00' = meia-noite do dia seguinte.
function reg(
  id: string,
  membroId: string,
  semanasAtras: number,
  dia: number,
  das: string,
  ate: string,
  local: Local,
  descricao: string,
  extra: Partial<Registro> = {},
): Registro {
  const data = somarDias(segundaAtual, dia - 7 * semanasAtras)
  const fim = ate === '24:00' ? instante(somarDias(data, 1), '00:00') : instante(data, ate)
  return {
    id,
    membroId,
    inicio: instante(data, das),
    fim,
    local,
    descricao,
    origem: 'manual',
    cancelado: false,
    precisaRevisao: false,
    ...extra,
  }
}

export const registros: Registro[] = [
  // Ana (membro logado), semana atual: 10h no total, mas só 3h na sede -> não cumpriu.
  reg('r1', 'm1', 0, 0, '09:00', '11:00', 'sede', 'Desenvolvimento do projeto X'),
  reg('r2', 'm1', 0, 1, '14:00', '15:00', 'sede', 'Revisão da proposta comercial'),
  // Registro que passou da meia-noite, já dividido em dois.
  reg('r3', 'm1', 0, 1, '23:00', '24:00', 'online', 'Relatório do projeto X (parte 1)'),
  reg('r4', 'm1', 0, 2, '00:00', '02:00', 'online', 'Relatório do projeto X (parte 2)'),
  reg('r5', 'm1', 0, 3, '19:00', '23:00', 'online', 'Pesquisa de mercado'),
  // Cancelado: não entra em nenhum total.
  reg('r6', 'm1', 0, 4, '10:00', '14:00', 'sede', 'Lançado por engano', { cancelado: true }),
  // Ana, semanas anteriores: cumpriu, dispensada e abaixo.
  reg('r7', 'm1', 1, 0, '09:00', '13:00', 'sede', 'Planejamento da sprint'),
  reg('r8', 'm1', 1, 2, '14:00', '16:00', 'sede', 'Treinamento interno'),
  reg('r9', 'm1', 1, 4, '18:00', '23:00', 'online', 'Documentação do projeto X'),
  reg('r10', 'm1', 2, 1, '10:00', '12:00', 'sede', 'Organização de arquivos'),
  reg('r11', 'm1', 3, 0, '09:00', '12:00', 'sede', 'Atendimento a cliente'),
  reg('r12', 'm1', 3, 2, '19:00', '22:00', 'online', 'Estudo de ferramentas'),

  // Bruno: cumpriu as duas metas (7h sede, 12h total).
  reg('r13', 'm2', 0, 0, '08:00', '12:00', 'sede', 'Prospecção de clientes'),
  reg('r14', 'm2', 0, 1, '08:00', '11:00', 'sede', 'Visita a cliente'),
  reg('r15', 'm2', 0, 2, '19:00', '24:00', 'online', 'Elaboração de proposta'),

  // Carla (rh): cumpriu exatamente no limite (5h sede, 10h total).
  reg('r16', 'm3', 0, 1, '09:00', '14:00', 'sede', 'Processo seletivo'),
  reg('r17', 'm3', 0, 3, '18:00', '23:00', 'online', 'Planilha de acompanhamento'),

  // Diego (diretor_rh): abaixo (4h sede, 6h total).
  reg('r18', 'm4', 0, 2, '09:00', '13:00', 'sede', 'Análise de indicadores'),
  reg('r19', 'm4', 0, 3, '19:00', '21:00', 'online', 'Revisão de metas'),

  // Eduarda: abaixo nas duas metas (2h sede, 4h total).
  reg('r20', 'm5', 0, 0, '14:00', '16:00', 'sede', 'Criação de posts'),
  reg('r21', 'm5', 0, 1, '20:00', '22:00', 'online', 'Edição de vídeo'),

  // Felipe: semana atual dispensada (continua registrando).
  reg('r22', 'm6', 0, 0, '10:00', '11:00', 'online', 'Auditoria de processos'),

  // Gabriela (desativada): o histórico continua existindo.
  reg('r23', 'm7', 1, 0, '09:00', '12:00', 'sede', 'Apoio ao projeto Y'),

  // Henrique: cronômetro encerrado sozinho após 10h, sinalizado para revisão.
  reg('r24', 'm8', 0, 2, '08:00', '18:00', 'sede', 'Cronômetro esquecido ligado', {
    origem: 'cronometro',
    precisaRevisao: true,
  }),

  // Igor (novo): registra, mas ainda não entra no cálculo da semana.
  reg('r25', 'm9', 0, 1, '09:00', '11:00', 'sede', 'Integração de novos membros'),
]

export const metas: Metas[] = [{ horasTotal: 10, horasSede: 5, vigenteDesde: '2026-02-02' }]

export const dispensas: { membroId: string; semana: string; motivo: string }[] = [
  { membroId: 'm6', semana: segundaAtual, motivo: 'Semana de provas (conversado com o RH)' },
  { membroId: 'm1', semana: somarDias(segundaAtual, -14), motivo: 'Problema de saúde (conversado com o RH)' },
]

// ---------- Cálculos (seguem docs/regras-de-negocio.md, seção 8) ----------

// Meta vigente na semana: a mais recente com vigenteDesde <= semana.
export function metaDaSemana(semana: string): Metas {
  const vigentes = metas.filter((m) => m.vigenteDesde <= semana)
  const lista = vigentes.length > 0 ? vigentes : metas
  return lista.reduce((a, b) => (b.vigenteDesde > a.vigenteDesde ? b : a))
}

function arredondar(horas: number): number {
  return Math.round(horas * 100) / 100
}

// Soma só registros não cancelados e já encerrados; a semana é a da data de início.
export function horasDaSemana(membroId: string, semana: string): { horasSede: number; horasTotal: number } {
  let sede = 0
  let total = 0
  for (const r of registros) {
    if (r.membroId !== membroId || r.cancelado || r.fim === null) continue
    if (segundaDaSemana(dataEmBrasilia(r.inicio)) !== semana) continue
    const horas = (Date.parse(r.fim) - Date.parse(r.inicio)) / 3_600_000
    total += horas
    if (r.local === 'sede') sede += horas
  }
  return { horasSede: arredondar(sede), horasTotal: arredondar(total) }
}

export function estaDispensada(membroId: string, semana: string): boolean {
  return dispensas.some((d) => d.membroId === membroId && d.semana === semana)
}

export function progressoDoMembro(membroId: string, semana: string): ProgressoSemana {
  const { horasSede, horasTotal } = horasDaSemana(membroId, semana)
  const meta = metaDaSemana(semana)
  const dispensada = estaDispensada(membroId, semana)
  return {
    semana,
    horasSede,
    horasTotal,
    metaSede: meta.horasSede,
    metaTotal: meta.horasTotal,
    cumpriu: !dispensada && horasTotal >= meta.horasTotal && horasSede >= meta.horasSede,
    dispensada,
  }
}

// Elegíveis: ativos e cadastrados antes da semana (a meta começa na semana seguinte ao cadastro).
export function membrosElegiveis(semana: string): Membro[] {
  return membros.filter((m) => m.ativo && m.dataEntrada < semana)
}

export function resumoDoMembro(membro: Membro, semana: string): ResumoMembroSemana {
  const p = progressoDoMembro(membro.id, semana)
  return {
    membro: copia(membro),
    horasSede: p.horasSede,
    horasTotal: p.horasTotal,
    cumpriu: p.cumpriu,
    dispensada: p.dispensada,
  }
}
