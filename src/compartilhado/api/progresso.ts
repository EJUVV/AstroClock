// FALSO: trocar pela versão real (ver docs/arquitetura.md)
import type { HorasDoDia, ProgressoSemana } from '../tipos.ts'
import { atraso, horasDoDia, membroLogado, progressoDoMembro, semanasDoMes, somarDias } from './dados-falsos.ts'

export async function progressoDaSemana(semana: string): Promise<ProgressoSemana> {
  await atraso()
  return progressoDoMembro(membroLogado().id, semana)
}

// Semanas cuja segunda-feira cai no mês ('AAAA-MM').
export async function progressoDoMes(mes: string): Promise<ProgressoSemana[]> {
  await atraso()
  const membroId = membroLogado().id
  return semanasDoMes(mes).map((semana) => progressoDoMembro(membroId, semana))
}

// Os 7 dias da semana, de segunda a domingo, para o gráfico de barras.
export async function horasPorDia(semana: string): Promise<HorasDoDia[]> {
  await atraso()
  const membroId = membroLogado().id
  return Array.from({ length: 7 }, (_, i) => horasDoDia(membroId, somarDias(semana, i)))
}

// Real desde a entrega do pódio (24/11/2026): fica em ranking.ts.
export { minhaPosicaoNoRanking } from './ranking.ts'
