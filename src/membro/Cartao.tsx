// Ajudantes de data usados pelas telas (horário de Brasília). Não buscam dados.
const FUSO = 'America/Sao_Paulo'

export function dataEmBrasilia(instante: Date | string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(instante),
  )
}

export function somarDias(data: string, dias: number): string {
  const d = new Date(`${data}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

// Segunda-feira da semana de uma data ('AAAA-MM-DD').
export function segundaDaSemana(data: string): string {
  const diaDaSemana = new Date(`${data}T00:00:00Z`).getUTCDay() // 0 = domingo
  return somarDias(data, -((diaDaSemana + 6) % 7))
}

export function semanaAtual(): string {
  return segundaDaSemana(dataEmBrasilia(new Date()))
}

// 'AAAA-MM' da data (o mês de uma semana é o da segunda-feira).
export function mesDe(data: string): string {
  return data.slice(0, 7)
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

function partes(data: string) {
  const [, m, d] = data.split('-').map(Number)
  return { dia: d, mes: m - 1 }
}

// '2 a 8 nov', '30 nov a 6 dez'
export function rotuloSemana(segunda: string): string {
  const a = partes(segunda)
  const b = partes(somarDias(segunda, 6))
  return a.mes === b.mes ? `${a.dia} a ${b.dia} ${MESES[b.mes]}` : `${a.dia} ${MESES[a.mes]} a ${b.dia} ${MESES[b.mes]}`
}

export function nomeDoMes(mes: string): string {
  return MESES_LONGOS[Number(mes.slice(5, 7)) - 1]
}

// '9 nov'
export function rotuloDia(data: string): string {
  const p = partes(data)
  return `${p.dia} ${MESES[p.mes]}`
}

export function hora(instante: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' }).format(new Date(instante))
}

// Horas com no máximo 1 casa: 3, 3,5
export function horas(valor: number): string {
  return `${Math.round(valor * 10) / 10}`.replace('.', ',')
}

// Quanto do dia, da semana, do mês e do ano já passou (0 a 100).
export function tempoQueJaPassou(): { nome: string; pct: number }[] {
  const agora = new Date()
  const hoje = dataEmBrasilia(agora)
  const [ano, mes, dia] = hoje.split('-').map(Number)
  const partesHora = new Intl.DateTimeFormat('en-GB', { timeZone: FUSO, hour: '2-digit', minute: '2-digit', hour12: false })
    .format(agora)
    .split(':')
    .map(Number)
  const minutosDoDia = partesHora[0] * 60 + partesHora[1]
  const diaDaSemana = (new Date(`${hoje}T00:00:00Z`).getUTCDay() + 6) % 7 // 0 = segunda
  const diasNoMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate()
  const diasNoAno = (Date.UTC(ano + 1, 0, 1) - Date.UTC(ano, 0, 1)) / 86_400_000
  const diaDoAno = (Date.UTC(ano, mes - 1, dia) - Date.UTC(ano, 0, 1)) / 86_400_000
  const pct = (parte: number, total: number) => Math.min(100, Math.round((parte / total) * 100))
  return [
    { nome: 'Dia', pct: pct(minutosDoDia, 1440) },
    { nome: 'Semana', pct: pct(diaDaSemana * 1440 + minutosDoDia, 7 * 1440) },
    { nome: 'Mês', pct: pct((dia - 1) * 1440 + minutosDoDia, diasNoMes * 1440) },
    { nome: 'Ano', pct: pct(diaDoAno * 1440 + minutosDoDia, diasNoAno * 1440) },
  ]
}
