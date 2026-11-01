// FALSO: trocar pela versão real (ver docs/arquitetura.md)
import type { HorasDoDia, PosicaoRanking, ProgressoSemana } from '../tipos.ts'
import { atraso, calcularRanking, horasDoDia, membroLogado, progressoDoMembro, semanasDoMes, somarDias } from './dados-falsos.ts'

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

// O membro vê só a própria posição, na EJ e no setor.
export async function minhaPosicaoNoRanking(mes: string): Promise<PosicaoRanking> {
  await atraso()
  const eu = membroLogado()
  const ranking = calcularRanking(mes)
  const doSetor = ranking.filter((l) => l.membro.setor === eu.setor)
  return {
    posicaoEJ: ranking.findIndex((l) => l.membro.id === eu.id) + 1,
    totalEJ: ranking.length,
    posicaoSetor: doSetor.findIndex((l) => l.membro.id === eu.id) + 1,
    totalSetor: doSetor.length,
  }
}
