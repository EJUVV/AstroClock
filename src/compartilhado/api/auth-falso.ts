// FALSO: login de demonstração, usado só com VITE_LOGIN_FALSO=true (ver auth.ts).
// Troca de perfil pelo localStorage.perfilFalso ou pelo botão de frasco. Nunca ligar em produção.
import type { Membro, Perfil } from '../tipos.ts'
import { atraso, copia, membroLogado, perfilFalso } from './dados-falsos.ts'

export async function entrarComGoogle(): Promise<void> {
  await atraso()
  window.location.assign('/inicio')
}

export async function sair(): Promise<void> {
  await atraso()
  window.location.assign('/')
}

// Lê localStorage.perfilFalso: 'membro' (padrão), 'rh', 'diretor_rh', 'diretor_setor', 'presidente' ou 'nenhum' (-> null).
export async function meuPerfil(): Promise<Perfil | null> {
  await atraso()
  return perfilFalso()
}

export async function meuNome(): Promise<string> {
  await atraso()
  return membroLogado().nome
}

export async function meusDados(): Promise<Membro> {
  await atraso()
  return copia(membroLogado())
}
