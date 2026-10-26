// FALSO: trocar pela versão real (ver docs/arquitetura.md)
import type { NovoRegistro, Registro } from '../tipos.ts'
import {
  atraso,
  copia,
  dataEmBrasilia,
  membroLogado,
  registros,
  segundaDaSemana,
} from './dados-falsos.ts'

// Inclui o cronômetro ativo (fim = null); não inclui registros cancelados.
export async function buscarMeusRegistros(semana: string): Promise<Registro[]> {
  await atraso()
  const membroId = membroLogado().id
  return copia(
    registros
      .filter((r) => r.membroId === membroId && !r.cancelado)
      .filter((r) => segundaDaSemana(dataEmBrasilia(r.inicio)) === semana)
      .sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio)),
  )
}

function validar(membroId: string, dados: NovoRegistro, ignorarId?: string): void {
  if (!dados.descricao.trim()) throw new Error('A descrição é obrigatória')
  const inicio = Date.parse(dados.inicio)
  const fim = Date.parse(dados.fim)
  if (Number.isNaN(inicio) || Number.isNaN(fim)) throw new Error('Horário inválido')
  if (fim <= inicio) throw new Error('O fim precisa ser depois do início')
  const sobrepoe = registros.some((r) => {
    if (r.membroId !== membroId || r.cancelado || r.id === ignorarId) return false
    const outroFim = r.fim === null ? Infinity : Date.parse(r.fim) // cronômetro ativo ainda não acabou
    return inicio < outroFim && Date.parse(r.inicio) < fim
  })
  if (sobrepoe) throw new Error('Este horário se sobrepõe a outro registro seu')
}

function meuRegistro(id: string): Registro {
  const registro = registros.find((r) => r.id === id && r.membroId === membroLogado().id)
  if (!registro || registro.cancelado) throw new Error('Registro não encontrado')
  return registro
}

export async function criarRegistro(dados: NovoRegistro): Promise<Registro> {
  await atraso()
  const membroId = membroLogado().id
  validar(membroId, dados)
  const novo: Registro = {
    id: crypto.randomUUID(),
    membroId,
    inicio: dados.inicio,
    fim: dados.fim,
    local: dados.local,
    descricao: dados.descricao.trim(),
    origem: 'manual',
    cancelado: false,
    precisaRevisao: false,
  }
  registros.push(novo)
  return copia(novo)
}

export async function editarRegistro(id: string, dados: NovoRegistro): Promise<Registro> {
  await atraso()
  const registro = meuRegistro(id)
  validar(registro.membroId, dados, id)
  registro.inicio = dados.inicio
  registro.fim = dados.fim
  registro.local = dados.local
  registro.descricao = dados.descricao.trim()
  return copia(registro)
}

export async function cancelarRegistro(id: string): Promise<void> {
  await atraso()
  meuRegistro(id).cancelado = true
}
