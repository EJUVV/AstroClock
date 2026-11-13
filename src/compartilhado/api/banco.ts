import type { PostgrestError } from '@supabase/supabase-js'
import type { Registro } from '../tipos.ts'
import type { Database } from '../tipos-banco.ts'
import { supabase } from '../supabase.ts'

export type LinhaRegistro = Database['public']['Tables']['registros']['Row']

export const ERRO_CONEXAO = 'Não foi possível falar com o servidor. Verifique sua internet e tente de novo.'

export function paraRegistro(l: LinhaRegistro): Registro {
  return {
    id: l.id,
    membroId: l.membro_id,
    inicio: l.inicio,
    fim: l.fim,
    local: l.local,
    descricao: l.descricao,
    origem: l.origem,
    cancelado: l.cancelado,
    precisaRevisao: l.precisa_revisao,
  }
}

// Regras do banco (constraints) que chegam em inglês.
const REGRAS: Record<string, string> = {
  registros_descricao_obrigatoria: 'A descrição é obrigatória',
  registros_descricao_tamanho: 'A descrição pode ter no máximo 1000 caracteres',
  registros_fim_depois_do_inicio: 'O fim precisa ser depois do início',
  registros_manual_tem_fim: 'Informe o início e o fim',
}

// Traduz o erro do banco. As regras feitas à mão (triggers) já vêm em português na mensagem.
export function erroDoBanco(e: PostgrestError): Error {
  if (!e.code) return new Error(ERRO_CONEXAO)
  if (e.code === '23P01') return new Error('Este horário se sobrepõe a outro registro seu')
  if (e.code === '23505') return new Error('Você já tem um cronômetro ligado')
  if (e.code === '23514') {
    const regra = /check constraint "(\w+)"/.exec(e.message)?.[1]
    if (regra) return new Error(REGRAS[regra] ?? 'Dados inválidos')
    return new Error(e.message)
  }
  if (e.code === '42501') {
    return new Error(/row-level security/i.test(e.message) ? 'Você não tem permissão para fazer isso' : e.message)
  }
  return new Error('Não foi possível salvar. Tente de novo.')
}

export async function meuId(): Promise<string> {
  const { data, error } = await supabase.rpc('meu_id')
  if (error) throw erroDoBanco(error)
  if (!data) throw new Error('Você não está logado. Entre novamente.')
  return data
}
