// FALSO: trocar pela versão real (ver docs/arquitetura.md)
import type { Perfil } from '../tipos.ts'
import { atraso, membroLogado, perfilFalso } from './dados-falsos.ts'

export async function entrarComGoogle(): Promise<void> {
  await atraso()
  window.location.assign('/inicio')
}

export async function sair(): Promise<void> {
  await atraso()
  window.location.assign('/')
}

// Lê localStorage.perfilFalso: 'membro' (padrão), 'rh', 'diretor_rh' ou 'nenhum' (-> null).
export async function meuPerfil(): Promise<Perfil | null> {
  await atraso()
  return perfilFalso()
}

export async function meuNome(): Promise<string> {
  await atraso()
  return membroLogado().nome
}
