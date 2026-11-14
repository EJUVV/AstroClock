import type { NovoRegistro, Registro } from '../tipos.ts'
import { instante, partesPorDia, somarDias } from '../datas.ts'
import { supabase } from '../supabase.ts'
import { loginFalso } from './auth.ts'
import { erroDoBanco, meuId, paraRegistro } from './banco.ts'
import * as falso from './registros-falso.ts'

// Inclui o cronômetro ativo (fim = null); não inclui registros cancelados.
export async function buscarMeusRegistros(semana: string): Promise<Registro[]> {
  if (loginFalso) return falso.buscarMeusRegistros(semana)
  const { data, error } = await supabase
    .from('registros')
    .select('*')
    .eq('membro_id', await meuId())
    .eq('cancelado', false)
    .gte('inicio', instante(semana, '00:00'))
    .lt('inicio', instante(somarDias(semana, 7), '00:00'))
    .order('inicio')
  if (error) throw erroDoBanco(error)
  return data.map(paraRegistro)
}

// Registro que passa da meia-noite vira um por dia (todos no mesmo insert). Devolve a primeira parte.
export async function criarRegistro(dados: NovoRegistro): Promise<Registro> {
  if (loginFalso) return falso.criarRegistro(dados)
  const membroId = await meuId()
  const { data, error } = await supabase
    .from('registros')
    .insert(
      partesPorDia(dados.inicio, dados.fim).map((p) => ({
        membro_id: membroId,
        inicio: p.inicio,
        fim: p.fim,
        local: dados.local,
        descricao: dados.descricao.trim(),
        origem: 'manual' as const,
      })),
    )
    .select()
    .order('inicio')
  if (error) throw erroDoBanco(error)
  return paraRegistro(data[0])
}

// O registro editado fica com a primeira parte; se o novo horário passa da meia-noite, as outras partes são criadas.
export async function editarRegistro(id: string, dados: NovoRegistro): Promise<Registro> {
  if (loginFalso) return falso.editarRegistro(id, dados)
  const { data: antes, error: erroLeitura } = await supabase.from('registros').select('*').eq('id', id).maybeSingle()
  if (erroLeitura) throw erroDoBanco(erroLeitura)
  if (!antes || antes.cancelado) throw new Error('Registro não encontrado')

  const [primeira, ...resto] = partesPorDia(dados.inicio, dados.fim)
  const descricao = dados.descricao.trim()
  const { data, error } = await supabase
    .from('registros')
    .update({ inicio: primeira.inicio, fim: primeira.fim, local: dados.local, descricao })
    .eq('id', id)
    .select()
  if (error) throw erroDoBanco(error)
  if (data.length === 0) throw new Error('Registro não encontrado')

  if (resto.length > 0) {
    const { error: erroPartes } = await supabase.from('registros').insert(
      resto.map((p) => ({
        membro_id: antes.membro_id,
        inicio: p.inicio,
        fim: p.fim,
        local: dados.local,
        descricao,
        origem: 'manual' as const,
      })),
    )
    if (erroPartes) {
      // Não deixa a edição pela metade: volta o registro ao que era.
      await supabase
        .from('registros')
        .update({ inicio: antes.inicio, fim: antes.fim, local: antes.local, descricao: antes.descricao })
        .eq('id', id)
      throw erroDoBanco(erroPartes)
    }
  }
  return paraRegistro(data[0])
}

export async function cancelarRegistro(id: string): Promise<void> {
  if (loginFalso) return falso.cancelarRegistro(id)
  const { data, error } = await supabase.from('registros').update({ cancelado: true }).eq('id', id).select()
  if (error) throw erroDoBanco(error)
  if (data.length === 0) throw new Error('Registro não encontrado')
}
