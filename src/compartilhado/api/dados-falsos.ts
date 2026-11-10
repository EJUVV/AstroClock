// FALSO: trocar pela versão real (ver docs/arquitetura.md)
// Dados em memória usados pelas funções falsas. Somem ao recarregar a página.
import type {
  HorasDoDia,
  LinhaRanking,
  Local,
  Membro,
  Metas,
  NovoRegistro,
  Perfil,
  ProgressoSemana,
  Registro,
  Requerimento,
  ResumoMembroSemana,
  TipoRequerimento,
} from '../tipos.ts'
import { ehDiretor } from '../perfis.ts'

// ---------- Ajudantes ----------

export function atraso(ms = 300): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms))
}

export function copia<T>(valor: T): T {
  return structuredClone(valor)
}

const FUSO = 'America/Sao_Paulo'

// Data ('AAAA-MM-DD') de um instante no horário de Brasília.
// Criar o formatador é caro: ele é criado uma vez só.
const formatoData = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function dataEmBrasilia(instante: Date | string): string {
  return formatoData.format(new Date(instante))
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
  if (valor === 'rh' || valor === 'diretor_rh' || valor === 'diretor_setor' || valor === 'presidente') return valor
  return 'membro'
}

// Cada perfil falso "entra" como um membro diferente.
const membroPorPerfil: Record<Perfil, string> = {
  membro: 'm1',
  rh: 'm3',
  diretor_rh: 'm4',
  diretor_setor: 'm47',
  presidente: 'm46',
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
  // Diretores não contabilizam horas: ficam fora da meta, do ranking e das métricas.
  { id: 'm46', nome: 'Paula Teixeira', email: 'paula.teixeira@ejuvv.com', perfil: 'presidente', setor: 'Gestão e Qualidade', ativo: true, dataEntrada: '2026-02-02' },
  { id: 'm47', nome: 'Rafael Dias', email: 'rafael.dias@ejuvv.com', perfil: 'diretor_setor', setor: 'Projetos', ativo: true, dataEntrada: '2026-02-02' },
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

// Momento em que cada registro foi criado (o tipo Registro não expõe esse campo).
// Nos dados iniciais, cada registro foi criado no horário em que começou.
export const criadoEm = new Map<string, number>(registros.map((r) => [r.id, Date.parse(r.inicio)]))

export const metas: Metas[] =[{ horasTotal: 10, horasSede: 5, vigenteDesde: '2026-02-02' }]

function requerimentoFalso(
  id: string,
  membroId: string,
  tipo: TipoRequerimento,
  inicio: string,
  fim: string,
  motivo: string,
  situacao: Requerimento['situacao'],
  anexoNome: string | null = null,
  motivoResposta: string | null = null,
): Requerimento {
  const nomeMembro = membros.find((m) => m.id === membroId)?.nome ?? ''
  return { id, membroId, nomeMembro, tipo, inicio, fim, motivo, situacao, criadoEm: instante(segundaAtual, '08:00'), anexoNome, motivoResposta }
}

export const requerimentos: Requerimento[] = [
  // Bruno: só remoto aprovado na semana atual (meta de sede 0). Pega só parte da semana, mas vale para ela inteira.
  requerimentoFalso('q1', 'm2', 'so_remoto', somarDias(segundaAtual, 2), somarDias(segundaAtual, 4), 'Viagem a trabalho', 'aprovado'),
  // Ana: pendente para a semana seguinte.
  requerimentoFalso('q2', 'm1', 'so_remoto', somarDias(segundaAtual, 7), somarDias(segundaAtual, 11), 'Obra perto de casa', 'pendente'),
  // Eduarda: pendente, cobre duas semanas, com anexo.
  requerimentoFalso('q3', 'm5', 'ausencia_total', somarDias(segundaAtual, 7), somarDias(segundaAtual, 18), 'Compromisso da faculdade', 'pendente', 'comprovante-falso.txt'),
  // Henrique: reprovado (não muda a meta). A reprovação sempre tem motivo.
  requerimentoFalso('q4', 'm8', 'ausencia_total', somarDias(segundaAtual, -7), somarDias(segundaAtual, -3), 'Sem motivo claro', 'reprovado', 'comprovante-q4.txt', 'Faltou explicar o que impede você de trabalhar nessa semana.'),
  // Ausência total aprovada: a semana fica dispensada. O RH não dispensa direto, só por requerimento.
  requerimentoFalso('q5', 'm6', 'ausencia_total', segundaAtual, somarDias(segundaAtual, 4), 'Semana de provas', 'aprovado'),
  requerimentoFalso('q6', 'm1', 'ausencia_total', somarDias(segundaAtual, -14), somarDias(segundaAtual, -10), 'Problema de saúde', 'aprovado'),
]

// Quando cada requerimento foi respondido (o tipo Requerimento não expõe esse campo).
export const respondidoEm = new Map<string, number>([
  ['q1', Date.parse(instante(segundaAtual, '09:00'))],
  ['q4', Date.parse(instante(somarDias(segundaAtual, -8), '18:00'))],
  ['q5', Date.parse(instante(somarDias(segundaAtual, -2), '10:00'))],
  ['q6', Date.parse(instante(somarDias(segundaAtual, -15), '10:00'))],
])

const UM_MES_MS = 30 * 24 * 3_600_000

// O anexo de um requerimento reprovado fica guardado por um mês; depois, é apagado.
export function apagarAnexosVencidos(): void {
  for (const q of requerimentos) {
    const respondido = respondidoEm.get(q.id)
    if (q.situacao === 'reprovado' && q.anexoNome && respondido !== undefined && Date.now() - respondido > UM_MES_MS) {
      anexos.delete(q.id)
      q.anexoNome = null
    }
  }
}

// Os arquivos ficam fora de Requerimento: a tela só recebe o nome e pede o link com linkDoAnexo().
export const anexos = new Map<string, File>([
  ['q3', new File(['Anexo de exemplo (dados falsos)'], 'comprovante-falso.txt', { type: 'text/plain' })],
  ['q4', new File(['Anexo de exemplo (dados falsos)'], 'comprovante-q4.txt', { type: 'text/plain' })],
])

// Quem está na sede agora: saida = null.
export const presencas: { membroId: string; entrada: string; saida: string | null }[] = [
  { membroId: 'm2', entrada: new Date(Date.now() - 2 * 3_600_000).toISOString(), saida: null },
  { membroId: 'm3', entrada: new Date(Date.now() - 3_600_000).toISOString(), saida: null },
]

// ---------- Mais membros para o protótipo (gerados sempre iguais) ----------

// Gerador pseudoaleatório com semente fixa: os dados não mudam ao recarregar.
function gerador(semente: number): () => number {
  let s = semente
  return () => {
    s = (s * 1_103_515_245 + 12_345) % 2_147_483_648
    return s / 2_147_483_648
  }
}

const NOMES_GERADOS = [
  'João Pedro Carvalho', 'Mariana Ribeiro', 'Lucas Ferreira', 'Beatriz Gomes', 'Rafael Oliveira',
  'Larissa Barbosa', 'Gustavo Teixeira', 'Camila Duarte', 'Thiago Moreira', 'Juliana Cardoso',
  'Matheus Araújo', 'Letícia Castro', 'Vinícius Freitas', 'Isabela Correia', 'Pedro Henrique Dias',
  'Amanda Monteiro', 'Caio Batista', 'Fernanda Lopes', 'Leonardo Vieira', 'Natália Rezende',
  'André Fonseca', 'Bianca Moura', 'Daniel Azevedo', 'Gabriel Santana', 'Helena Campos',
  'Rodrigo Xavier', 'Sofia Brandão', 'Otávio Cunha', 'Yasmin Peixoto', 'Arthur Machado',
  'Lívia Tavares', 'Samuel Pacheco', 'Clara Siqueira', 'Enzo Antunes', 'Valentina Prado', 'Murilo Bastos',
]

const DESCRICOES = [
  'Proposta comercial para a Padaria Dona Lúcia', 'Ajuste no site da EJ', 'Reunião de alinhamento com cliente (preparação)',
  'Pesquisa de mercado para a Clínica Bem-Estar', 'Planilha de custos do projeto Horta Urbana', 'Roteiro de vídeo institucional',
  'Diagnóstico financeiro da Loja Vila Verde', 'Mapeamento de processos internos', 'Criação de posts para o Instagram',
  'Prospecção de clientes no LinkedIn', 'Relatório mensal de indicadores', 'Organização do processo seletivo',
  'Plano de marketing para a Cafeteria Grão', 'Revisão do contrato padrão', 'Treinamento de novos membros',
  'Protótipo do app do cliente', 'Benchmarking de empresas juniores', 'Atualização do manual de cultura',
]

// Perfil de cada membro gerado: quanto costuma fazer por semana.
type Ritmo = 'bom' | 'irregular' | 'fraco'

const sorteio = gerador(42)
const setoresGerados = ['Projetos', 'Comercial', 'Marketing', 'Gestão e Qualidade', 'Projetos', 'Comercial', 'RH']

NOMES_GERADOS.forEach((nome, i) => {
  const [primeiro, ...resto] = nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(' ')
  membros.push({
    id: `m${i + 10}`,
    nome,
    email: `${primeiro}.${resto[resto.length - 1]}@ejuvv.com`,
    perfil: 'membro',
    setor: setoresGerados[i % setoresGerados.length],
    ativo: true,
    // Entraram há cerca de 4 meses (o histórico gerado cobre esse período); os últimos 6, mais recentemente.
    dataEntrada: somarDias(segundaAtual, i < 30 ? -7 * 17 : -7 * 9),
  })
})

// Hoje, de 0 (segunda) a 6 (domingo): na semana atual só há registros de dias que já passaram.
const hojeNaSemana = (new Date(`${dataEmBrasilia(new Date())}T00:00:00Z`).getUTCDay() + 6) % 7

NOMES_GERADOS.forEach((_, i) => {
  const membroId = `m${i + 10}`
  const ritmo: Ritmo = i === 5 || i === 23 ? 'fraco' : i % 3 === 1 ? 'irregular' : 'bom'
  for (let semanasAtras = 0; semanasAtras <= 16; semanasAtras++) {
    // Os membros "fracos" cumpriam e passaram a ficar abaixo nas últimas 5 semanas.
    const cumpre = ritmo === 'bom' ? sorteio() < 0.9 : ritmo === 'irregular' ? sorteio() < 0.55 : semanasAtras > 4
    const blocos = cumpre ? [3, 3, 2.5, 2] : [2, 1.5, 1]
    const sedeAte = cumpre ? 2 : sorteio() < 0.5 ? 1 : 0 // os primeiros blocos são na sede
    blocos.forEach((horas, b) => {
      const dia = (b * 2 + (i % 2)) % 6
      if (semanasAtras === 0 && dia >= hojeNaSemana) return
      const inicioMin = (cumpre && b < 2 ? 9 * 60 : 14 * 60) + ((i * 7) % 4) * 15
      const fimMin = inicioMin + horas * 60
      const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
      registros.push(
        reg(
          `g${i}-${semanasAtras}-${b}`,
          membroId,
          semanasAtras,
          dia,
          hhmm(inicioMin),
          hhmm(fimMin),
          b < sedeAte ? 'sede' : 'online',
          DESCRICOES[(i + b + semanasAtras) % DESCRICOES.length],
          b === 3 && i % 4 === 0 ? { origem: 'cronometro' } : {},
        ),
      )
    })
  }
})

// Ana, Bruno e os outros membros fixos também têm histórico nas semanas mais antigas.
for (const membroId of ['m2', 'm3', 'm6', 'm8']) {
  for (let semanasAtras = 1; semanasAtras <= 16; semanasAtras++) {
    registros.push(
      reg(`h-${membroId}-${semanasAtras}-a`, membroId, semanasAtras, 1, '09:00', '14:00', 'sede', 'Atendimento na sede'),
      reg(`h-${membroId}-${semanasAtras}-b`, membroId, semanasAtras, 3, '18:00', '23:30', 'online', 'Entregas da semana'),
    )
  }
}
// Eduarda: abaixo da meta há várias semanas seguidas (destaque no painel do RH).
for (let semanasAtras = 1; semanasAtras <= 3; semanasAtras++) {
  registros.push(reg(`h-m5-${semanasAtras}`, 'm5', semanasAtras, 2, '14:00', '17:00', 'online', 'Edição de vídeo'))
}
for (let semanasAtras = 4; semanasAtras <= 16; semanasAtras++) {
  registros.push(
    reg(`h-m5-${semanasAtras}-a`, 'm5', semanasAtras, 1, '09:00', '14:30', 'sede', 'Criação de posts'),
    reg(`h-m5-${semanasAtras}-b`, 'm5', semanasAtras, 3, '18:00', '23:00', 'online', 'Edição de vídeo'),
  )
}
for (const r of registros) if (!criadoEm.has(r.id)) criadoEm.set(r.id, Date.parse(r.inicio))

requerimentos.push(
  requerimentoFalso('q5', 'm14', 'so_remoto', somarDias(segundaAtual, -14), somarDias(segundaAtual, -10), 'Cirurgia de um familiar, preciso ficar em casa', 'aprovado'),
  requerimentoFalso('q6', 'm21', 'ausencia_total', somarDias(segundaAtual, -21), somarDias(segundaAtual, -17), 'Intercâmbio de curta duração', 'aprovado'),
  // Ana: só remoto aprovado há 4 semanas (o cartão da semana mostra "sede não exigida").
  // Carla (rh): pendente. Só o diretor do RH responde.
  requerimentoFalso('q8', 'm3', 'so_remoto', somarDias(segundaAtual, 14), somarDias(segundaAtual, 16), 'Congresso da faculdade em outra cidade', 'pendente'),
  requerimentoFalso('q7', 'm1', 'so_remoto', somarDias(segundaAtual, -28), somarDias(segundaAtual, -25), 'Perna imobilizada, sem conseguir ir à sede', 'aprovado'),
)

// Exemplo de férias programadas pelo diretor (datas relativas à semana atual, para a demonstração).
metas.push(
  { horasTotal: 5, horasSede: 0, vigenteDesde: somarDias(segundaAtual, 7 * 7) },
  { horasTotal: 10, horasSede: 5, vigenteDesde: somarDias(segundaAtual, 7 * 10) },
)

presencas.push(
  ...['m10', 'm12', 'm16', 'm19', 'm23', 'm27'].map((membroId, i) => ({
    membroId,
    entrada: new Date(Date.now() - (i + 1) * 40 * 60_000).toISOString(),
    saida: null,
  })),
)

// Quem esqueceu de desmarcar sai sozinho à meia-noite (horário de Brasília) do dia em que entrou.
export function desmarcarQuemFicouDeOntem(): void {
  const hoje = dataEmBrasilia(new Date())
  for (const p of presencas) {
    const dia = dataEmBrasilia(p.entrada)
    if (p.saida === null && dia < hoje) p.saida = instante(somarDias(dia, 1), '00:00')
  }
}

// ---------- Validação de registros (usada pelo membro e pelo RH) ----------

// deQuem completa a mensagem de sobreposição: "seu" (membro) ou "deste membro" (RH).
export function validarRegistro(
  membroId: string,
  dados: NovoRegistro,
  ignorarId?: string,
  deQuem = 'seu',
): void {
  if (!dados.descricao.trim()) throw new Error('A descrição é obrigatória')
  const inicio = Date.parse(dados.inicio)
  const fim = Date.parse(dados.fim)
  if (Number.isNaN(inicio) || Number.isNaN(fim)) throw new Error('Horário inválido')
  if (fim <= inicio) throw new Error('O fim precisa ser depois do início')
  const sobrepoe = registros.some((r) => {
    if (r.membroId !== membroId || r.cancelado || r.id === ignorarId) return false
    const outroFim = r.fim === null ? Infinity : Date.parse(r.fim) // cronômetro ativo ainda não acabou
    return inicio < outroFim && Date.parse(r.inicio) < fim
  })
  if (sobrepoe) throw new Error(`Este horário se sobrepõe a outro registro ${deQuem}`)
}

export function aplicarEdicao(registro: Registro, dados: NovoRegistro): void {
  registro.inicio = dados.inicio
  registro.fim = dados.fim
  registro.local = dados.local
  registro.descricao = dados.descricao.trim()
}

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

// Soma só registros não cancelados, já encerrados e fora de revisão.
function somarHoras(lista: Registro[]): { horasSede: number; horasTotal: number } {
  let sede = 0
  let total = 0
  for (const r of lista) {
    if (r.cancelado || r.precisaRevisao || r.fim === null) continue
    const horas = (Date.parse(r.fim) - Date.parse(r.inicio)) / 3_600_000
    total += horas
    if (r.local === 'sede') sede += horas
  }
  return { horasSede: arredondar(sede), horasTotal: arredondar(total) }
}

// A semana é a da data de início.
export function horasDaSemana(membroId: string, semana: string): { horasSede: number; horasTotal: number } {
  return somarHoras(
    registros.filter((r) => r.membroId === membroId && segundaDaSemana(dataEmBrasilia(r.inicio)) === semana),
  )
}

export function horasDoDia(membroId: string, dia: string): HorasDoDia {
  return { dia, ...somarHoras(registros.filter((r) => r.membroId === membroId && dataEmBrasilia(r.inicio) === dia)) }
}

// O requerimento vale para todas as semanas que ele toca, inteiras, mesmo pegando só parte delas.
function temRequerimentoAprovado(membroId: string, semana: string, tipo: TipoRequerimento): boolean {
  return requerimentos.some(
    (q) =>
      q.membroId === membroId &&
      q.tipo === tipo &&
      q.situacao === 'aprovado' &&
      segundaDaSemana(q.inicio) <= semana &&
      semana <= segundaDaSemana(q.fim),
  )
}

// A semana só fica dispensada por requerimento de ausência total aprovado.
export function estaDispensada(membroId: string, semana: string): boolean {
  return temRequerimentoAprovado(membroId, semana, 'ausencia_total')
}

export function progressoDoMembro(membroId: string, semana: string): ProgressoSemana {
  const { horasSede, horasTotal } = horasDaSemana(membroId, semana)
  const meta = metaDaSemana(semana)
  const dispensada = estaDispensada(membroId, semana)
  const metaSede = temRequerimentoAprovado(membroId, semana, 'so_remoto') ? 0 : meta.horasSede
  return {
    semana,
    horasSede,
    horasTotal,
    metaSede,
    metaTotal: meta.horasTotal,
    cumpriu: !dispensada && horasTotal >= meta.horasTotal && horasSede >= metaSede,
    dispensada,
  }
}

// Semanas cuja segunda-feira cai no mês ('AAAA-MM').
export function semanasDoMes(mes: string): string[] {
  const primeiroDia = `${mes}-01`
  let segunda = segundaDaSemana(primeiroDia)
  if (segunda < primeiroDia) segunda = somarDias(segunda, 7)
  const semanas: string[] = []
  for (; segunda.startsWith(mes); segunda = somarDias(segunda, 7)) semanas.push(segunda)
  return semanas
}

// Ordem: horas totais, desempate por horas na sede. Quem teve semana dispensada aparece normalmente,
// com as horas que fez; dispensado só sinaliza que houve ao menos uma semana dispensada no mês.
export function calcularRanking(mes: string): LinhaRanking[] {
  const semanas = semanasDoMes(mes)
  const linhas = membros
    .filter((m) => m.ativo && !ehDiretor(m.perfil))
    .map((m) => {
      const horas = semanas.map((s) => horasDaSemana(m.id, s))
      return {
        membro: copia(m),
        horasTotal: arredondar(horas.reduce((soma, h) => soma + h.horasTotal, 0)),
        horasSede: arredondar(horas.reduce((soma, h) => soma + h.horasSede, 0)),
        dispensado: semanas.some((s) => estaDispensada(m.id, s)),
      }
    })
    .sort((a, b) => b.horasTotal - a.horasTotal || b.horasSede - a.horasSede)
  return linhas.map((linha, i) => ({ posicao: i + 1, ...linha }))
}

// Elegíveis: ativos, que não são diretores e cadastrados antes da semana (a meta começa na semana seguinte ao cadastro).
export function membrosElegiveis(semana: string): Membro[] {
  return membros.filter((m) => m.ativo && !ehDiretor(m.perfil) && m.dataEntrada < semana)
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
