import type { Membro, Perfil } from '../tipos.ts'
import { supabase } from '../supabase.ts'
import * as falso from './auth-falso.ts'

// Login de demonstração (troca de perfil sem Google) só no site de protótipo.
export const loginFalso = import.meta.env.VITE_LOGIN_FALSO === 'true'

const ERRO_CONEXAO = 'Não foi possível falar com o servidor. Verifique sua internet e tente de novo.'

// Enquanto as outras funções de api/ ainda são falsas, elas leem localStorage.perfilFalso.
// Guardar o perfil real ali faz os dados falsos combinarem com o painel em que a pessoa entrou.
function sincronizarPerfilFalso(perfil: Perfil | null) {
  try {
    localStorage.setItem('perfilFalso', perfil ?? 'nenhum')
  } catch {
    // Sem localStorage: os dados falsos usam o perfil padrão.
  }
}

export async function entrarComGoogle(): Promise<void> {
  if (loginFalso) return falso.entrarComGoogle()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/inicio`,
      // Mostra só contas @ejuvv.com e deixa escolher a conta, em vez de entrar direto na última usada.
      queryParams: { hd: 'ejuvv.com', prompt: 'select_account' },
    },
  })
  if (error) throw new Error('Não foi possível abrir o login do Google. Tente de novo.')
}

export async function sair(): Promise<void> {
  if (loginFalso) return falso.sair()
  // Mesmo se a rede falhar, a sessão local é apagada e a pessoa volta ao login.
  await supabase.auth.signOut()
  window.location.assign('/')
}

// null = sem sessão, ou conta não cadastrada / desativada em membros.
export async function meuPerfil(): Promise<Perfil | null> {
  if (loginFalso) return falso.meuPerfil()
  const { data: sessao, error: erroSessao } = await supabase.auth.getSession()
  if (erroSessao) throw new Error(ERRO_CONEXAO)
  if (!sessao.session) return null

  const { data, error } = await supabase.rpc('meu_perfil')
  if (error) throw new Error(ERRO_CONEXAO)
  const perfil = data ?? null
  sincronizarPerfilFalso(perfil)
  return perfil
}

export async function meuNome(): Promise<string> {
  if (loginFalso) return falso.meuNome()
  return (await meusDados()).nome
}

export async function meusDados(): Promise<Membro> {
  if (loginFalso) return falso.meusDados()
  const { data, error } = await supabase.rpc('meus_dados').maybeSingle()
  if (error) throw new Error(ERRO_CONEXAO)
  if (!data) throw new Error('Você não está logado. Entre novamente.')
  return {
    id: data.id,
    nome: data.nome,
    email: data.email,
    perfil: data.perfil,
    setor: data.setor,
    ativo: data.ativo,
    dataEntrada: data.data_entrada,
  }
}
