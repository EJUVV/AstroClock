// FALSO: trocar pela versão real (ver docs/arquitetura.md)
import type { Metas, NovaDispensa, ResumoMembroSemana } from '../tipos.ts'
import {
  atraso,
  copia,
  dispensas,
  estaDispensada,
  membros,
  membrosElegiveis,
  metaDaSemana,
  metas,
  perfilFalso,
  resumoDoMembro,
  semanaAtual,
} from './dados-falsos.ts'

export async function registrarDispensa(dados: NovaDispensa): Promise<void> {
  await atraso()
  if (!dados.motivo.trim()) throw new Error('O motivo é obrigatório')
  if (!membros.some((m) => m.id === dados.membroId)) throw new Error('Membro não encontrado')
  if (estaDispensada(dados.membroId, dados.semana)) {
    throw new Error('Esta semana já está dispensada para este membro')
  }
  dispensas.push({ membroId: dados.membroId, semana: dados.semana, motivo: dados.motivo.trim() })
}

export async function metasAtuais(): Promise<Metas> {
  await atraso()
  return copia(metaDaSemana(semanaAtual()))
}

// A nova meta passa a valer a partir da semana atual (as anteriores mantêm a meta delas).
export async function alterarMetas(horasTotal: number, horasSede: number): Promise<void> {
  await atraso()
  if (perfilFalso() !== 'diretor_rh') throw new Error('Só o diretor do RH pode alterar as metas')
  if (!(horasTotal > 0) || !(horasSede > 0)) throw new Error('As metas precisam ser maiores que zero')
  const vigenteDesde = semanaAtual()
  const indice = metas.findIndex((m) => m.vigenteDesde === vigenteDesde)
  if (indice >= 0) metas.splice(indice, 1)
  metas.push({ horasTotal, horasSede, vigenteDesde })
}

// Percentual por membros: cumpriram ÷ (elegíveis − dispensados).
export async function percentualDaSemana(semana: string): Promise<number> {
  await atraso()
  const considerados = membrosElegiveis(semana)
    .map((m) => resumoDoMembro(m, semana))
    .filter((r) => !r.dispensada)
  if (considerados.length === 0) return 0
  const cumpriram = considerados.filter((r) => r.cumpriu).length
  return Math.round((cumpriram / considerados.length) * 1000) / 10
}

export async function resumoDaSemana(semana: string): Promise<ResumoMembroSemana[]> {
  await atraso()
  return membrosElegiveis(semana)
    .map((m) => resumoDoMembro(m, semana))
    .sort((a, b) => a.membro.nome.localeCompare(b.membro.nome))
}

export async function abaixoDaMeta(semana: string): Promise<ResumoMembroSemana[]> {
  await atraso()
  return membrosElegiveis(semana)
    .map((m) => resumoDoMembro(m, semana))
    .filter((r) => !r.cumpriu && !r.dispensada)
    .sort((a, b) => a.membro.nome.localeCompare(b.membro.nome))
}
