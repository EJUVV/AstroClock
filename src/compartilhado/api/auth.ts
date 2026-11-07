// FALSO: trocar pela versão real (ver docs/arquitetura.md)
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

// Lê localStorage.perfilFalso: 'membro' (padrão), 'rh', 'diretor_rh' ou 'nenhum' (-> null).
export async function meuPerfil(): Promise<Perfil | null> {
  await atraso()
  return perfilFalso()
}

export async function meuNome(): Promise<string> {
  await atraso()
  return membroLogado().nome
}

// Protótipo: dados do membro logado (nome, e-mail, setor), para o topo dos painéis.
export async function meusDados(): Promise<Membro> {
  await atraso()
  return copia(membroLogado())
}
