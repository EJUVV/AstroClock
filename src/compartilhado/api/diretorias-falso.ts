// FALSO: versão de demonstração, usada só com VITE_LOGIN_FALSO=true (ver diretorias.ts)
// Mesmas regras das funções do banco (migração diretorias_acumuladas), sobre os dados falsos.
import type { Diretoria, SituacaoSetor } from '../tipos.ts'
import { atraso, diretoriasFalsas, membroLogado, membros, setorRH, setores } from './dados-falsos.ts'

function dirigeRH(membroId: string): boolean {
  return diretoriasFalsas.some((d) => d.setor === setorRH && d.membroId === membroId)
}

export async function minhasDiretorias(): Promise<Diretoria[]> {
  await atraso()
  const eu = membroLogado()
  return diretoriasFalsas
    .filter((d) => d.membroId === eu.id)
    .map((d) => ({ setor: d.setor, ehRH: d.setor === setorRH, diretorId: eu.id, diretorNome: eu.nome, desde: d.desde }))
    .sort((a, b) => a.setor.localeCompare(b.setor))
}

export async function situacaoDosSetores(): Promise<SituacaoSetor[]> {
  await atraso()
  const eu = membroLogado()
  // Só quem tem painel do RH recebe linhas, como no banco.
  if (eu.perfil === 'membro') return []
  return [...setores]
    .sort((a, b) => a.localeCompare(b))
    .map((setor) => {
      const d = diretoriasFalsas.find((x) => x.setor === setor)
      const diretor = d && membros.find((m) => m.id === d.membroId)
      return { setor, ehRH: setor === setorRH, diretor: d && diretor ? { id: diretor.id, nome: diretor.nome, desde: d.desde } : null }
    })
}

function exigirPoder(): void {
  const eu = membroLogado()
  if (eu.perfil !== 'presidente' && !dirigeRH(eu.id)) {
    throw new Error('Só quem dirige o RH ou o presidente pode mudar as diretorias.')
  }
}

export async function atribuirDiretoria(setor: string, membroId: string): Promise<void> {
  await atraso()
  exigirPoder()
  if (!setores.includes(setor)) throw new Error('Setor não encontrado.')
  const membro = membros.find((m) => m.id === membroId)
  if (!membro || !membro.ativo) throw new Error('Membro não encontrado ou desativado.')
  if (membro.perfil !== 'diretor_setor' && membro.perfil !== 'diretor_rh' && membro.perfil !== 'presidente') {
    throw new Error('Só diretores e o presidente podem dirigir um setor.')
  }
  const i = diretoriasFalsas.findIndex((d) => d.setor === setor)
  if (i >= 0 && diretoriasFalsas[i].membroId === membroId) return
  if (i >= 0) diretoriasFalsas.splice(i, 1)
  diretoriasFalsas.push({ setor, membroId, desde: new Date().toISOString() })
}

export async function removerDiretoria(setor: string): Promise<void> {
  await atraso()
  exigirPoder()
  const i = diretoriasFalsas.findIndex((d) => d.setor === setor)
  if (i < 0) throw new Error('Esse setor já está sem diretor.')
  diretoriasFalsas.splice(i, 1)
}
