// FALSO: versão de demonstração, usada só com VITE_LOGIN_FALSO=true (ver registros.ts)
import type { Local, Registro } from '../tipos.ts'
import { ehDiretor } from '../perfis.ts'
import { atraso, copia, dividirNaMeiaNoite, membroLogado, registros } from './dados-falsos.ts'

const LIMITE_MS = 10 * 3_600_000 // encerra sozinho após 10h

function ativoDoMembro(membroId: string): Registro | undefined {
  const ativo = registros.find((r) => r.membroId === membroId && r.fim === null && !r.cancelado)
  if (ativo && Date.now() - Date.parse(ativo.inicio) >= LIMITE_MS) {
    ativo.fim = new Date(Date.parse(ativo.inicio) + LIMITE_MS).toISOString()
    ativo.precisaRevisao = true
    dividirNaMeiaNoite(ativo)
    return undefined
  }
  return ativo
}

export async function cronometroAtivo(): Promise<Registro | null> {
  await atraso()
  const ativo = ativoDoMembro(membroLogado().id)
  return ativo ? copia(ativo) : null
}

export async function iniciarCronometro(local: Local, descricao: string): Promise<Registro> {
  await atraso()
  if (ehDiretor(membroLogado().perfil)) throw new Error('Diretores não contabilizam horas')
  const membroId = membroLogado().id
  if (ativoDoMembro(membroId)) throw new Error('Você já tem um cronômetro ativo')
  if (!descricao.trim()) throw new Error('A descrição é obrigatória')
  const novo: Registro = {
    id: crypto.randomUUID(),
    membroId,
    inicio: new Date().toISOString(),
    fim: null,
    local,
    descricao: descricao.trim(),
    origem: 'cronometro',
    cancelado: false,
    precisaRevisao: false,
  }
  registros.push(novo)
  return copia(novo)
}

export async function pararCronometro(): Promise<Registro> {
  await atraso()
  const ativo = ativoDoMembro(membroLogado().id)
  if (!ativo) throw new Error('Nenhum cronômetro ativo')
  ativo.fim = new Date().toISOString()
  dividirNaMeiaNoite(ativo)
  return copia(ativo)
}
