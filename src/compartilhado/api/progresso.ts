// FALSO: trocar pela versão real (ver docs/arquitetura.md)
import type { ProgressoSemana } from '../tipos.ts'
import { atraso, membroLogado, progressoDoMembro, segundaDaSemana, somarDias } from './dados-falsos.ts'

export async function progressoDaSemana(semana: string): Promise<ProgressoSemana> {
  await atraso()
  return progressoDoMembro(membroLogado().id, semana)
}

// Semanas cuja segunda-feira cai no mês ('AAAA-MM').
export async function progressoDoMes(mes: string): Promise<ProgressoSemana[]> {
  await atraso()
  const membroId = membroLogado().id
  const primeiroDia = `${mes}-01`
  let segunda = segundaDaSemana(primeiroDia)
  if (segunda < primeiroDia) segunda = somarDias(segunda, 7)
  const semanas: ProgressoSemana[] = []
  for (; segunda.startsWith(mes); segunda = somarDias(segunda, 7)) {
    semanas.push(progressoDoMembro(membroId, segunda))
  }
  return semanas
}
