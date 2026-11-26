// Diretorias acumuladas: um diretor ou o presidente pode dirigir vários setores, e quem dirige o
// setor RH age como diretor do RH (migração diretorias_acumuladas). A versão de demonstração
// fica em diretorias-falso.ts.
import type { Diretoria, SituacaoSetor } from '../tipos.ts'
import { supabase } from '../supabase.ts'
import { loginFalso } from './auth.ts'
import { erroDoBanco } from './banco.ts'
import * as falso from './diretorias-falso.ts'

// Setores que quem está logado dirige (vazio para quem não dirige nenhum).
export async function minhasDiretorias(): Promise<Diretoria[]> {
  if (loginFalso) return falso.minhasDiretorias()
  const { data, error } = await supabase.rpc('minhas_diretorias')
  if (error) throw erroDoBanco(error)
  return data.map((l) => ({
    setor: l.setor,
    ehRH: l.eh_rh,
    diretorId: l.diretor_id,
    diretorNome: l.diretor_nome,
    desde: l.desde,
  }))
}

// Todos os setores, com o diretor atual ou vago. Só quem tem painel do RH recebe linhas.
export async function situacaoDosSetores(): Promise<SituacaoSetor[]> {
  if (loginFalso) return falso.situacaoDosSetores()
  const { data, error } = await supabase.rpc('situacao_dos_setores')
  if (error) throw erroDoBanco(error)
  return data.map((l) => ({
    setor: l.setor,
    ehRH: l.eh_rh,
    diretor: l.diretor_id && l.diretor_nome && l.desde ? { id: l.diretor_id, nome: l.diretor_nome, desde: l.desde } : null,
  }))
}

// Só quem dirige o RH e o presidente. Se o setor já tem diretor, troca.
export async function atribuirDiretoria(setor: string, membroId: string): Promise<void> {
  if (loginFalso) return falso.atribuirDiretoria(setor, membroId)
  const { error } = await supabase.rpc('atribuir_diretoria', { p_setor: setor, p_membro_id: membroId })
  if (error) throw erroDoBanco(error)
}

// Só quem dirige o RH e o presidente. Deixa o setor vago.
export async function removerDiretoria(setor: string): Promise<void> {
  if (loginFalso) return falso.removerDiretoria(setor)
  const { error } = await supabase.rpc('remover_diretoria', { p_setor: setor })
  if (error) throw erroDoBanco(error)
}
