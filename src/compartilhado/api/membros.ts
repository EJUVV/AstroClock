import type { PostgrestError } from '@supabase/supabase-js'
import type { Membro, NovoMembro, Perfil } from '../tipos.ts'
import type { Database } from '../tipos-banco.ts'
import { supabase } from '../supabase.ts'
import { loginFalso } from './auth.ts'
import { erroDoBanco } from './banco.ts'
import * as falso from './membros-falso.ts'

type LinhaMembro = Database['public']['Tables']['membros']['Row'] & { setores: { nome: string } | null }

// Traz o nome do setor junto (a tabela guarda só o setor_id).
const COLUNAS = '*, setores(nome)'

function paraMembro(l: LinhaMembro): Membro {
  return {
    id: l.id,
    nome: l.nome,
    email: l.email,
    perfil: l.perfil,
    setor: l.setores?.nome ?? '',
    ativo: l.ativo,
    dataEntrada: l.data_entrada,
  }
}

// Regras de "valor repetido" (23505) de membros. As outras vão para o erroDoBanco.
function erroDeMembro(e: PostgrestError): Error {
  if (e.code === '23505') {
    if (e.message.includes('membros_um_diretor_de_setor_ativo')) return new Error('Este setor já tem um diretor de setor')
    if (e.message.includes('email')) return new Error('Já existe um membro com este e-mail')
    return new Error('Já existe um cadastro com estes dados')
  }
  return erroDoBanco(e)
}

async function idDoSetor(nome: string): Promise<string> {
  const { data, error } = await supabase.from('setores').select('id').eq('nome', nome).eq('ativo', true).maybeSingle()
  if (error) throw erroDoBanco(error)
  if (!data) throw new Error('Setor não encontrado')
  return data.id
}

// Update que o RLS bloqueia não dá erro: só não altera nenhuma linha.
function exigirAlterado(linhas: unknown[], acao: string): void {
  if (linhas.length === 0) throw new Error(`Membro não encontrado ou você não pode ${acao}`)
}

// O RLS já filtra: o diretor de setor só recebe os membros do próprio setor.
export async function listarMembros(): Promise<Membro[]> {
  if (loginFalso) return falso.listarMembros()
  const { data, error } = await supabase.from('membros').select(COLUNAS).order('nome')
  if (error) throw erroDoBanco(error)
  return (data as LinhaMembro[]).map(paraMembro)
}

export async function cadastrarMembro(dados: NovoMembro): Promise<Membro> {
  if (loginFalso) return falso.cadastrarMembro(dados)
  const nome = dados.nome.trim()
  const email = dados.email.trim().toLowerCase()
  if (!nome) throw new Error('O nome é obrigatório')
  if (!email.endsWith('@ejuvv.com')) throw new Error('O e-mail precisa ser @ejuvv.com')
  const { data, error } = await supabase
    .from('membros')
    .insert({ nome, email, perfil: 'membro', setor_id: await idDoSetor(dados.setor), data_entrada: dados.dataEntrada })
    .select(COLUNAS)
    .single()
  if (error) throw erroDeMembro(error)
  return paraMembro(data as LinhaMembro)
}

export async function desativarMembro(id: string): Promise<void> {
  if (loginFalso) return falso.desativarMembro(id)
  const { data, error } = await supabase.from('membros').update({ ativo: false }).eq('id', id).select('id')
  if (error) throw erroDeMembro(error)
  exigirAlterado(data, 'desativá-lo')
}

export async function alterarPerfil(id: string, perfil: Perfil): Promise<void> {
  if (loginFalso) return falso.alterarPerfil(id, perfil)
  // A EJ tem um único diretor do RH e um único presidente (o banco não confere isso).
  if (perfil === 'diretor_rh' || perfil === 'presidente') {
    const { count, error } = await supabase
      .from('membros')
      .select('id', { count: 'exact', head: true })
      .eq('perfil', perfil)
      .eq('ativo', true)
      .neq('id', id)
    if (error) throw erroDoBanco(error)
    if (count) throw new Error(perfil === 'presidente' ? 'A EJ já tem um presidente' : 'A EJ já tem um diretor do RH')
  }
  const { data, error } = await supabase.from('membros').update({ perfil }).eq('id', id).select('id')
  if (error) throw erroDeMembro(error)
  exigirAlterado(data, 'alterar o perfil')
}

export async function listarSetores(): Promise<string[]> {
  if (loginFalso) return falso.listarSetores()
  const { data, error } = await supabase.from('setores').select('nome').eq('ativo', true).order('nome')
  if (error) throw erroDoBanco(error)
  return data.map((s) => s.nome)
}

// O banco grava a mudança em historico_setor sozinho.
export async function alterarSetor(id: string, setor: string): Promise<void> {
  if (loginFalso) return falso.alterarSetor(id, setor)
  const { data, error } = await supabase
    .from('membros')
    .update({ setor_id: await idDoSetor(setor) })
    .eq('id', id)
    .select('id')
  if (error) throw erroDeMembro(error)
  exigirAlterado(data, 'alterar o setor')
}
