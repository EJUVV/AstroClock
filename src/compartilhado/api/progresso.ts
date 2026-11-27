// O cálculo da semana e do mês é real (funções do banco). O gráfico de horas por dia ainda é falso
// e vem de progresso-falso.ts; a posição no ranking é real e fica em ranking.ts.
import type { ProgressoSemana } from '../tipos.ts'
import type { Database } from '../tipos-banco.ts'
import { supabase } from '../supabase.ts'
import { loginFalso } from './auth.ts'
import { erroDoBanco } from './banco.ts'
import * as falso from './progresso-falso.ts'

export { horasPorDia } from './progresso-falso.ts'
export { minhaPosicaoNoRanking } from './ranking.ts'

type LinhaProgresso = Database['public']['Functions']['progresso_da_semana']['Returns'][number]

// Antes da primeira meta cadastrada o banco pode devolver meta nula: na tela, vira 0.
function paraProgresso(l: LinhaProgresso): ProgressoSemana {
  return {
    semana: l.semana,
    horasSede: l.horas_sede,
    horasTotal: l.horas_total,
    metaSede: l.meta_sede ?? 0,
    metaTotal: l.meta_total ?? 0,
    cumpriu: l.cumpriu,
    dispensada: l.dispensada,
  }
}

// semana: qualquer dia da semana; o banco usa a segunda-feira dela.
export async function progressoDaSemana(semana: string): Promise<ProgressoSemana> {
  if (loginFalso) return falso.progressoDaSemana(semana)
  const { data, error } = await supabase.rpc('progresso_da_semana', { p_semana: semana })
  if (error) throw erroDoBanco(error)
  if (data.length === 0) throw new Error('Não foi possível calcular o progresso. Entre novamente.')
  return paraProgresso(data[0])
}

// Semanas cuja segunda-feira cai no mês ('AAAA-MM').
export async function progressoDoMes(mes: string): Promise<ProgressoSemana[]> {
  if (loginFalso) return falso.progressoDoMes(mes)
  const { data, error } = await supabase.rpc('progresso_do_mes', { p_mes: mes })
  if (error) throw erroDoBanco(error)
  return data.map(paraProgresso)
}
