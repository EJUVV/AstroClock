// FALSO: trocar pela versão real (ver docs/arquitetura.md)
import type { Membro, NovoMembro, Perfil } from '../tipos.ts'
import { atraso, copia, membros, perfilFalso, setores } from './dados-falsos.ts'

function buscarMembro(id: string): Membro {
  const membro = membros.find((m) => m.id === id)
  if (!membro) throw new Error('Membro não encontrado')
  return membro
}

export async function listarMembros(): Promise<Membro[]> {
  await atraso()
  return copia([...membros].sort((a, b) => a.nome.localeCompare(b.nome)))
}

export async function cadastrarMembro(dados: NovoMembro): Promise<Membro> {
  await atraso()
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
  buscarMembro(id).ativo = false
}

export async function alterarPerfil(id: string, perfil: Perfil): Promise<void> {
  await atraso()
  if (perfilFalso() !== 'diretor_rh') throw new Error('Só o diretor do RH pode alterar perfis')
  buscarMembro(id).perfil = perfil
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
