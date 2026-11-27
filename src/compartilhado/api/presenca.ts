// Presença na sede (B13): não registra horas, só avisa quem está na sede agora.
// Quem vê o quê é decidido no banco: os outros aparecem só com nome, setor e desde.
import type { PresencaSede } from '../tipos.ts'
import { supabase } from '../supabase.ts'
import { loginFalso } from './auth.ts'
import { erroDoBanco } from './banco.ts'
import * as falso from './presenca-falso.ts'

export async function quemEstaNaSede(): Promise<PresencaSede[]> {
  if (loginFalso) return falso.quemEstaNaSede()
  const { data, error } = await supabase.rpc('quem_esta_na_sede')
  if (error) throw erroDoBanco(error)
  return data.map((l) => ({ membroId: l.membro_id, nome: l.nome, setor: l.setor, desde: l.desde }))
}

export async function estouNaSede(): Promise<boolean> {
  if (loginFalso) return falso.estouNaSede()
  const { data, error } = await supabase.rpc('estou_na_sede')
  if (error) throw erroDoBanco(error)
  return data
}

export async function marcarNaSede(): Promise<void> {
  if (loginFalso) return falso.marcarNaSede()
  const { error } = await supabase.rpc('marcar_na_sede')
  if (error) throw erroDoBanco(error)
}

export async function desmarcarNaSede(): Promise<void> {
  if (loginFalso) return falso.desmarcarNaSede()
  const { error } = await supabase.rpc('desmarcar_na_sede')
  if (error) throw erroDoBanco(error)
}
