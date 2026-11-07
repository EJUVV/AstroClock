// FALSO: trocar pela versão real (ver docs/arquitetura.md)
import type { PresencaSede } from '../tipos.ts'
import { atraso, membroLogado, membros, presencas } from './dados-falsos.ts'

function minhaPresenca(membroId: string) {
  return presencas.find((p) => p.membroId === membroId && p.saida === null)
}

// Não registra horas: só informa quem está na sede agora.
export async function quemEstaNaSede(): Promise<PresencaSede[]> {
  await atraso()
  return presencas
    .filter((p) => p.saida === null)
    .map((p) => ({
      membroId: p.membroId,
      nome: membros.find((m) => m.id === p.membroId)?.nome ?? '',
      setor: membros.find((m) => m.id === p.membroId)?.setor ?? '',
      desde: p.entrada,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome))
}

export async function estouNaSede(): Promise<boolean> {
  await atraso()
  return minhaPresenca(membroLogado().id) !== undefined
}

export async function marcarNaSede(): Promise<void> {
  await atraso()
  const membroId = membroLogado().id
  if (minhaPresenca(membroId)) throw new Error('Você já está marcado como na sede')
  presencas.push({ membroId, entrada: new Date().toISOString(), saida: null })
}

export async function desmarcarNaSede(): Promise<void> {
  await atraso()
  const presenca = minhaPresenca(membroLogado().id)
  if (!presenca) throw new Error('Você não está marcado como na sede')
  presenca.saida = new Date().toISOString()
}
