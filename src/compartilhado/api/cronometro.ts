import type { Local, Registro } from '../tipos.ts'
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

// O banco grava o fim com a hora do servidor, divide na meia-noite (as outras partes continuam
// como cronômetro) e corta em 10h, mandando para a revisão do RH (B7.1 e B10). O site só manda o
// update, que devolve a primeira parte.
export async function pararCronometro(): Promise<Registro> {
  if (loginFalso) return falso.pararCronometro()
  const ativo = await ativoDoMembro()
  if (!ativo) throw new Error('Nenhum cronômetro ativo')
  const { data, error } = await supabase.from('registros').update({ fim: new Date().toISOString() }).eq('id', ativo.id).select()
  if (error) throw erroDoBanco(error)
  if (data.length === 0) throw new Error('Nenhum cronômetro ativo')
  return paraRegistro(data[0])
}
