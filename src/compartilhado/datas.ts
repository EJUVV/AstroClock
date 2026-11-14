// Datas e formatação usadas pelas telas. Tudo no horário de Brasília (docs/regras-de-negocio.md, seção 1).

const FUSO = 'America/Sao_Paulo'

// 'AAAA-MM-DD' de um instante no horário de Brasília.
// Criar o formatador é caro: ele é criado uma vez só.
const formatoData = new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit' })
const formatoHora = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' })

export function dataEmBrasilia(instante: Date | string): string {
  return formatoData.format(new Date(instante))
}

export function hoje(): string {
  return dataEmBrasilia(new Date())
}

export function somarDias(data: string, dias: number): string {
  const d = new Date(`${data}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

export function segundaDaSemana(data: string): string {
  const diaDaSemana = new Date(`${data}T00:00:00Z`).getUTCDay()
  return somarDias(data, -((diaDaSemana + 6) % 7))
}

export function semanaAtual(): string {
  return segundaDaSemana(hoje())
}

export function mesAtual(): string {
  return hoje().slice(0, 7)
}

// O Brasil não tem horário de verão desde 2019: Brasília é sempre -03:00.
export function instante(data: string, hora: string): string {
  return `${data}T${hora}:00-03:00`
}

// Divide um período nas meias-noites de Brasília: 23:00–02:00 vira 23:00–00:00 e 00:00–02:00.
// Fim exatamente à meia-noite não divide. docs/regras-de-negocio.md, seção 2.
export function partesPorDia(inicio: string, fim: string): { inicio: string; fim: string }[] {
  const fimMs = Date.parse(fim)
  if (Number.isNaN(Date.parse(inicio)) || Number.isNaN(fimMs)) throw new Error('Horário inválido')
  const partes: { inicio: string; fim: string }[] = []
  let atual = inicio
  for (;;) {
    const meiaNoite = instante(somarDias(dataEmBrasilia(atual), 1), '00:00')
    if (fimMs <= Date.parse(meiaNoite)) {
      partes.push({ inicio: atual, fim })
      return partes
    }
    partes.push({ inicio: atual, fim: meiaNoite })
    atual = meiaNoite
  }
}

export function horaDe(iso: string): string {
  return formatoHora.format(new Date(iso))
}

const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const mesesLongos = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
export const diasCurtos = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function partes(data: string) {
  const [a, m, d] = data.split('-').map(Number)
  return { ano: a, mes: m, dia: d }
}

// "03 nov"
export function diaMes(data: string): string {
  const { mes, dia } = partes(data)
  return `${String(dia).padStart(2, '0')} ${meses[mes - 1]}`
}

// "Ter, 03 nov"
export function diaSemanaMes(data: string): string {
  const indice = (new Date(`${data}T00:00:00Z`).getUTCDay() + 6) % 7
  return `${diasCurtos[indice]}, ${diaMes(data)}`
}

// "03 – 09 nov" (semana de segunda a domingo)
export function rotuloSemana(semana: string): string {
  const fim = somarDias(semana, 6)
  const a = partes(semana)
  const b = partes(fim)
  if (a.mes === b.mes) return `${String(a.dia).padStart(2, '0')} – ${diaMes(fim)}`
  return `${diaMes(semana)} – ${diaMes(fim)}`
}

// "Novembro de 2026"
export function rotuloMes(mes: string): string {
  const { ano, mes: m } = partes(`${mes}-01`)
  return `${mesesLongos[m - 1]} de ${ano}`
}

export function somarMeses(mes: string, n: number): string {
  const { ano, mes: m } = partes(`${mes}-01`)
  const total = ano * 12 + (m - 1) + n
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`
}

// 7.75 -> { horas: 7, minutos: 45 }
export function partesDeHoras(valor: number): { horas: number; minutos: number } {
  const totalMin = Math.round(valor * 60)
  return { horas: Math.floor(totalMin / 60), minutos: totalMin % 60 }
}

// 7.75 -> "7h45"; 2 -> "2h"
export function formatarHoras(valor: number): string {
  const { horas, minutos } = partesDeHoras(valor)
  return minutos === 0 ? `${horas}h` : `${horas}h${String(minutos).padStart(2, '0')}`
}

export function duracaoEmHoras(inicio: string, fim: string | null): number {
  const ate = fim ? Date.parse(fim) : Date.now()
  return (ate - Date.parse(inicio)) / 3_600_000
}

// Quanto do dia, da semana, do mês e do ano já passou (0 a 100).
export function tempoDecorrido(agora = new Date()) {
  const data = dataEmBrasilia(agora)
  const inicioDoDia = Date.parse(instante(data, '00:00'))
  const dia = (agora.getTime() - inicioDoDia) / 86_400_000
  const semanaInicio = Date.parse(instante(segundaDaSemana(data), '00:00'))
  const semana = (agora.getTime() - semanaInicio) / (7 * 86_400_000)
  const { ano } = partes(data)
  const mesInicio = Date.parse(instante(`${data.slice(0, 7)}-01`, '00:00'))
  const mesFim = Date.parse(instante(`${somarMeses(data.slice(0, 7), 1)}-01`, '00:00'))
  const anoInicio = Date.parse(instante(`${ano}-01-01`, '00:00'))
  const anoFim = Date.parse(instante(`${ano + 1}-01-01`, '00:00'))
  const pct = (v: number) => Math.min(100, Math.max(0, Math.round(v * 100)))
  return {
    dia: pct(dia),
    semana: pct(semana),
    mes: pct((agora.getTime() - mesInicio) / (mesFim - mesInicio)),
    ano: pct((agora.getTime() - anoInicio) / (anoFim - anoInicio)),
  }
}
