// FALSO: versão de demonstração, usada só com VITE_LOGIN_FALSO=true (ver ranking.ts)
// Mesmas regras das funções do banco (migração ranking_e_podio), calculadas sobre os dados falsos.
import type { LinhaPodio, LinhaRanking, LinhaRankingSetor, PodioDoMes, PosicaoRanking } from '../tipos.ts'
import { atraso, calcularRanking, estaDispensada, membroLogado, semanasDoMes } from './dados-falsos.ts'

const PODIO_EJ = 5
const PODIO_SETOR = 3

function comparar(a: LinhaRanking, b: LinhaRanking): number {
  return Number(a.dispensado) - Number(b.dispensado) || b.horasTotal - a.horasTotal || b.horasSede - a.horasSede
}

// Posição com empate dividido (1º, 2º, 2º, 4º), como o rank() do banco.
function comPosicoes(linhas: LinhaRanking[]): LinhaRanking[] {
  const ordem = [...linhas].sort(comparar)
  let posicao = 0
  return ordem.map((linha, i) => {
    if (i === 0 || comparar(ordem[i - 1], linha) !== 0) posicao = i + 1
    return { ...linha, posicao }
  })
}

function noPodio(linha: LinhaRanking, limite: number): boolean {
  return linha.horasTotal > 0 && !linha.dispensado && linha.posicao <= limite
}

function paraPodio(linha: LinhaRanking): LinhaPodio {
  return {
    posicao: linha.posicao,
    membroId: linha.membro.id,
    nome: linha.membro.nome,
    setor: linha.membro.setor,
    horasTotal: linha.horasTotal,
    horasSede: linha.horasSede,
  }
}

// 0 no pódio; meia hora se ainda há vaga; senão, horas para alcançar o último do pódio,
// para cima em meia hora (mínimo de meia hora).
function faltam(podio: LinhaRanking[], eu: LinhaRanking, limite: number): number {
  if (noPodio(eu, limite)) return 0
  if (podio.length < limite) return 0.5
  const corte = Math.min(...podio.map((l) => l.horasTotal))
  return Math.max(0.5, Math.ceil((corte - eu.horasTotal) * 2) / 2)
}

// Dispensado no mês = TODAS as semanas dispensadas (seção 12). O calcularRanking marca quem teve
// alguma semana dispensada; aqui vale a regra do mês, como no banco.
function linhasDoMes(mes: string): LinhaRanking[] {
  const semanas = semanasDoMes(mes)
  return calcularRanking(mes).map((l) => ({
    ...l,
    dispensado: semanas.length > 0 && semanas.every((s) => estaDispensada(l.membro.id, s)),
  }))
}

function rankingDaEJ(mes: string): LinhaRanking[] {
  return comPosicoes(linhasDoMes(mes))
}

function rankingDoSetor(ej: LinhaRanking[], setor: string): LinhaRanking[] {
  return comPosicoes(ej.filter((l) => l.membro.setor === setor))
}

export async function podioDoMes(mes: string): Promise<PodioDoMes> {
  await atraso()
  const ej = rankingDaEJ(mes)
  const setor = rankingDoSetor(ej, membroLogado().setor)
  const ordenar = (a: LinhaPodio, b: LinhaPodio) => a.posicao - b.posicao || a.nome.localeCompare(b.nome)
  return {
    ej: ej.filter((l) => noPodio(l, PODIO_EJ)).map(paraPodio).sort(ordenar),
    setor: setor.filter((l) => noPodio(l, PODIO_SETOR)).map(paraPodio).sort(ordenar),
  }
}

export async function minhaPosicaoNoRanking(mes: string): Promise<PosicaoRanking | null> {
  await atraso()
  const id = membroLogado().id
  const ej = rankingDaEJ(mes)
  const euEJ = ej.find((l) => l.membro.id === id)
  if (!euEJ) return null
  const setor = rankingDoSetor(ej, euEJ.membro.setor)
  const euSetor = setor.find((l) => l.membro.id === id) ?? euEJ
  return {
    posicaoEJ: euEJ.posicao,
    totalEJ: ej.length,
    posicaoSetor: euSetor.posicao,
    totalSetor: setor.length,
    horasTotal: euEJ.horasTotal,
    faltamParaPodioEJ: faltam(ej.filter((l) => noPodio(l, PODIO_EJ)), euEJ, PODIO_EJ),
    faltamParaPodioSetor: faltam(setor.filter((l) => noPodio(l, PODIO_SETOR)), euSetor, PODIO_SETOR),
  }
}

export async function rankingDosSetores(mes: string): Promise<LinhaRankingSetor[]> {
  await atraso()
  const porSetor = new Map<string, LinhaRanking[]>()
  for (const linha of linhasDoMes(mes)) {
    if (linha.dispensado) continue
    porSetor.set(linha.membro.setor, [...(porSetor.get(linha.membro.setor) ?? []), linha])
  }
  const media = (valores: number[]) => Math.round((valores.reduce((s, v) => s + v, 0) / valores.length) * 100) / 100
  const linhas = [...porSetor].map(([setor, membros]) => ({
    setor,
    membrosContados: membros.length,
    mediaTotal: media(membros.map((m) => m.horasTotal)),
    mediaSede: media(membros.map((m) => m.horasSede)),
  }))
  const comparar = (a: (typeof linhas)[number], b: (typeof linhas)[number]) =>
    b.mediaTotal - a.mediaTotal || b.mediaSede - a.mediaSede
  linhas.sort((a, b) => comparar(a, b) || a.setor.localeCompare(b.setor))
  let posicao = 0
  return linhas.map((linha, i) => {
    if (i === 0 || comparar(linhas[i - 1], linha) !== 0) posicao = i + 1
    return { posicao, ...linha }
  })
}
