import type { Local, Registro } from '../tipos.ts'
import { partesPorDia } from '../datas.ts'
import { supabase } from '../supabase.ts'
import { loginFalso } from './auth.ts'
import { erroDoBanco, meuId, paraRegistro } from './banco.ts'
import * as falso from './cronometro-falso.ts'

const LIMITE_MS = 10 * 3_600_000 // acima disso o banco limita a 10h e manda o registro para a revisão do RH

// Cronômetro esquecido ligado: para agora e o banco corta em 10h (precisa_revisao).
async function ativoDoMembro(): Promise<Registro | null> {
  const { data, error } = await supabase
    .from('registros')
    .select('*')
    .eq('membro_id', await meuId())
    .is('fim', null)
    .eq('cancelado', false)
    .maybeSingle()
  if (error) throw erroDoBanco(error)
  if (!data) return null
  if (Date.now() - Date.parse(data.inicio) > LIMITE_MS) {
    const { error: erroParar } = await supabase.from('registros').update({ fim: new Date().toISOString() }).eq('id', data.id)
    if (erroParar) throw erroDoBanco(erroParar)
    return null
  }
  return paraRegistro(data)
}

export async function cronometroAtivo(): Promise<Registro | null> {
  if (loginFalso) return falso.cronometroAtivo()
  return ativoDoMembro()
}

export async function iniciarCronometro(local: Local, descricao: string): Promise<Registro> {
  if (loginFalso) return falso.iniciarCronometro(local, descricao)
  if (!descricao.trim()) throw new Error('A descrição é obrigatória')
  if (await ativoDoMembro()) throw new Error('Você já tem um cronômetro ligado')
  const { data, error } = await supabase
    .from('registros')
    .insert({
      membro_id: await meuId(),
      inicio: new Date().toISOString(),
      local,
      descricao: descricao.trim(),
      origem: 'cronometro',
    })
    .select()
    .single()
  if (error) throw erroDoBanco(error)
  return paraRegistro(data)
}

// Se passou da meia-noite, o cronômetro fica com a primeira parte e o resto vira outro registro. Devolve a primeira parte.
// O banco só aceita registro novo de origem "cronometro" ligado e sem fim, então as outras partes entram como "manual".
export async function pararCronometro(): Promise<Registro> {
  if (loginFalso) return falso.pararCronometro()
  const ativo = await ativoDoMembro()
  if (!ativo) throw new Error('Nenhum cronômetro ativo')
  const agora = new Date().toISOString()
  const [primeira, ...resto] = partesPorDia(ativo.inicio, agora)

  const { data, error } = await supabase.from('registros').update({ fim: primeira.fim }).eq('id', ativo.id).select()
  if (error) throw erroDoBanco(error)
  if (data.length === 0) throw new Error('Nenhum cronômetro ativo')

  if (resto.length > 0) {
    const { error: erroPartes } = await supabase.from('registros').insert(
      resto.map((p) => ({
        membro_id: ativo.membroId,
        inicio: p.inicio,
        fim: p.fim,
        local: ativo.local,
        descricao: ativo.descricao.trim() || 'Cronômetro',
        origem: 'manual' as const,
      })),
    )
    if (erroPartes) {
      // Não perde o tempo: o cronômetro para agora, inteiro, e o RH pode dividir depois.
      await supabase.from('registros').update({ fim: agora }).eq('id', ativo.id)
      throw erroDoBanco(erroPartes)
    }
  }
  return paraRegistro(data[0])
}
