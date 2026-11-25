// Ranking do mês para o painel do membro: pódio da EJ e do setor, posição de quem está logado
// e ranking dos setores. As funções do banco devolvem só nome, setor e horas dos outros
// (migração ranking_e_podio). A versão de demonstração fica em ranking-falso.ts.
import type { LinhaPodio, LinhaRankingSetor, PodioDoMes, PosicaoRanking } from '../tipos.ts'
import { supabase } from '../supabase.ts'
import { loginFalso } from './auth.ts'
import { erroDoBanco } from './banco.ts'
import * as falso from './ranking-falso.ts'

// mes = 'AAAA-MM'. ej: até a 5ª posição; setor: até a 3ª, do setor de quem chama.
export async function podioDoMes(mes: string): Promise<PodioDoMes> {
  if (loginFalso) return falso.podioDoMes(mes)
  const { data, error } = await supabase.rpc('podio_do_mes', { p_mes: mes })
  if (error) throw erroDoBanco(error)
  const linhas = (escopo: string): LinhaPodio[] =>
    data
      .filter((l) => l.escopo === escopo)
      .map((l) => ({
        posicao: Number(l.posicao),
        membroId: l.membro_id,
        nome: l.nome,
        setor: l.setor,
        horasTotal: Number(l.horas_total),
        horasSede: Number(l.horas_sede),
      }))
  return { ej: linhas('ej'), setor: linhas('setor') }
}

// null = quem está logado não entra no ranking do mês (diretor, ou entrou depois).
export async function minhaPosicaoNoRanking(mes: string): Promise<PosicaoRanking | null> {
  if (loginFalso) return falso.minhaPosicaoNoRanking(mes)
  const { data, error } = await supabase.rpc('minha_posicao_no_ranking', { p_mes: mes })
  if (error) throw erroDoBanco(error)
  const eu = data[0]
  if (!eu) return null
  return {
    posicaoEJ: Number(eu.posicao_ej),
    totalEJ: Number(eu.total_ej),
    posicaoSetor: Number(eu.posicao_setor),
    totalSetor: Number(eu.total_setor),
    horasTotal: Number(eu.horas_total),
    faltamParaPodioEJ: Number(eu.faltam_para_podio_ej),
    faltamParaPodioSetor: Number(eu.faltam_para_podio_setor),
  }
}

// Média de horas por membro de cada setor no mês, sem os dispensados.
export async function rankingDosSetores(mes: string): Promise<LinhaRankingSetor[]> {
  if (loginFalso) return falso.rankingDosSetores(mes)
  const { data, error } = await supabase.rpc('ranking_dos_setores', { p_mes: mes })
  if (error) throw erroDoBanco(error)
  return data.map((l) => ({
    posicao: Number(l.posicao),
    setor: l.setor,
    membrosContados: Number(l.membros_contados),
    mediaTotal: Number(l.media_total),
    mediaSede: Number(l.media_sede),
  }))
}
