// FALSO: trocar pela versão real (ver docs/arquitetura.md)
import type { Membro, NovoMembro, Perfil } from '../tipos.ts'
import { atraso, copia, membroLogado, membros, perfilFalso, setores } from './dados-falsos.ts'

function buscarMembro(id: string): Membro {
  const membro = membros.find((m) => m.id === id)
  if (!membro) throw new Error('Membro não encontrado')
  return membro
}

// O diretor de setor só vê os membros do próprio setor.
export async function listarMembros(): Promise<Membro[]> {
  await atraso()
  const setor = perfilFalso() === 'diretor_setor' ? membroLogado().setor : null
  return copia(membros.filter((m) => !setor || m.setor === setor).sort((a, b) => a.nome.localeCompare(b.nome)))
}

// Só o diretor do RH cadastra membros.
export async function cadastrarMembro(dados: NovoMembro): Promise<Membro> {
  await atraso()
  if (perfilFalso() !== 'diretor_rh') throw new Error('Só o diretor do RH cadastra membros')
  const email = dados.email.trim().toLowerCase()
  if (!dados.nome.trim()) throw new Error('O nome é obrigatório')
  if (!email.endsWith('@ejuvv.com')) throw new Error('O e-mail precisa ser @ejuvv.com')
  if (membros.some((m) => m.email === email)) throw new Error('Já existe um membro com este e-mail')
  if (!setores.includes(dados.setor)) throw new Error('Setor não encontrado')
  const novo: Membro = {
    id: crypto.randomUUID(),
    nome: dados.nome.trim(),
    email,
    perfil: 'membro',
    setor: dados.setor,
    ativo: true,
    dataEntrada: dados.dataEntrada,
  }
  membros.push(novo)
  return copia(novo)
}

export async function desativarMembro(id: string): Promise<void> {
  await atraso()
  const perfil = perfilFalso()
  if (perfil !== 'rh' && perfil !== 'diretor_rh') throw new Error('Só o RH pode desativar membros')
  buscarMembro(id).ativo = false
}

export async function alterarPerfil(id: string, perfil: Perfil): Promise<void> {
  await atraso()
  if (perfilFalso() !== 'diretor_rh') throw new Error('Só o diretor do RH pode alterar perfis')
  const membro = buscarMembro(id)
  // Cada setor tem um único diretor.
  if (perfil === 'diretor_setor' && membros.some((m) => m.id !== id && m.ativo && m.perfil === 'diretor_setor' && m.setor === membro.setor)) {
    throw new Error(`${membro.setor} já tem um diretor de setor`)
  }
  // A EJ tem um único diretor do RH e um único presidente.
  if ((perfil === 'diretor_rh' || perfil === 'presidente') && membros.some((m) => m.id !== id && m.ativo && m.perfil === perfil)) {
    throw new Error(perfil === 'presidente' ? 'A EJ já tem um presidente' : 'A EJ já tem um diretor do RH')
  }
  membro.perfil = perfil
}

export async function listarSetores(): Promise<string[]> {
  await atraso()
  return copia(setores)
}

// A versão real guarda a mudança em historico_setor.
export async function alterarSetor(id: string, setor: string): Promise<void> {
  await atraso()
  const perfil = perfilFalso()
  if (perfil !== 'rh' && perfil !== 'diretor_rh') throw new Error('Só o RH pode alterar o setor')
  if (!setores.includes(setor)) throw new Error('Setor não encontrado')
  buscarMembro(id).setor = setor
}
