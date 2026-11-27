// FALSO: versão de demonstração, usada só com VITE_LOGIN_FALSO=true (ver ranking.ts)
// Mesmas regras das funções do banco (migrações ranking_e_podio e ranking_sem_empate), calculadas
// sobre os dados falsos.
import type { LinhaPodio, LinhaRanking, LinhaRankingSetor, PodioDoMes, PosicaoRanking } from '../tipos.ts'
import { atraso, calcularRanking, estaDispensada, membroLogado, semanasDoMes, ultimoFimDoMes } from './dados-falsos.ts'

const PODIO_EJ = 5
const PODIO_SETOR = 3

// Posições sem repetir (1º, 2º, 3º...), como o row_number() do banco: horas totais, horas na sede,
// quem chegou primeiro (sem registro fica depois) e, por fim, o nome.
function comPosicoes(linhas: LinhaRanking[], ultimoFim: Map<string, number>): LinhaRanking[] {
  const fim = (l: LinhaRanking) => ultimoFim.get(l.membro.id) ?? Infinity
  const comparar = (a: LinhaRanking, b: LinhaRanking) =>
    Number(a.dispensado) - Number(b.dispensado) ||
    b.horasTotal - a.horasTotal ||
    b.horasSede - a.horasSede ||
    (fim(a) === fim(b) ? 0 : fim(a) < fim(b) ? -1 : 1) ||
    a.membro.nome.localeCompare(b.membro.nome)
  return [...linhas].sort(comparar).map((linha, i) => ({ ...linha, posicao: i + 1 }))
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
  return comPosicoes(linhasDoMes(mes), ultimoFimDoMes(mes))
}

function rankingDoSetor(mes: string, ej: LinhaRanking[], setor: string): LinhaRanking[] {
  return comPosicoes(ej.filter((l) => l.membro.setor === setor), ultimoFimDoMes(mes))
}

export async function podioDoMes(mes: string): Promise<PodioDoMes> {
  await atraso()
  const ej = rankingDaEJ(mes)
  const setor = rankingDoSetor(mes, ej, membroLogado().setor)
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
  const setor = rankingDoSetor(mes, ej, euEJ.membro.setor)
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
  // Sem repetir posição: média total, média na sede e, por fim, o nome do setor.
  linhas.sort((a, b) => b.mediaTotal - a.mediaTotal || b.mediaSede - a.mediaSede || a.setor.localeCompare(b.setor))
  return linhas.map((linha, i) => ({ posicao: i + 1, ...linha }))
}
