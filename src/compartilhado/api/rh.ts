// FALSO: trocar pela versão real (ver docs/arquitetura.md)
import type { Metas, NovaDispensa, NovoRegistro, Registro, ResumoMembroSemana } from '../tipos.ts'
import {
  aplicarEdicao,
  atraso,
  copia,
  dataEmBrasilia,
  dispensas,
  estaDispensada,
  membros,
  membrosElegiveis,
  metaDaSemana,
  metas,
  perfilFalso,
  registros,
  resumoDoMembro,
  segundaDaSemana,
  semanaAtual,
  somarDias,
  validarRegistro,
} from './dados-falsos.ts'

function exigirRH(acao: 'ver' | 'alterar'): void {
  const perfil = perfilFalso()
  if (perfil !== 'rh' && perfil !== 'diretor_rh') {
    throw new Error(`Só o RH pode ${acao} registros de outros membros`)
  }
}

function registroDeMembro(id: string): Registro {
  const registro = registros.find((r) => r.id === id)
  if (!registro || registro.cancelado) throw new Error('Registro não encontrado')
  return registro
}

// Para o detalhe por membro no painel do RH. Inclui o cronômetro ativo; não inclui cancelados.
export async function buscarRegistrosDoMembro(membroId: string, semana: string): Promise<Registro[]> {
  await atraso()
  exigirRH('ver')
  return copia(
    registros
      .filter((r) => r.membroId === membroId && !r.cancelado)
      .filter((r) => segundaDaSemana(dataEmBrasilia(r.inicio)) === semana)
      .sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio)),
  )
}

// O RH altera qualquer registro, inclusive os criados há mais de 7 dias.
export async function editarRegistroDeMembro(id: string, dados: NovoRegistro): Promise<Registro> {
  await atraso()
  exigirRH('alterar')
  const registro = registroDeMembro(id)
  validarRegistro(registro.membroId, dados, id, 'deste membro')
  aplicarEdicao(registro, dados)
  return copia(registro)
}

export async function cancelarRegistroDeMembro(id: string): Promise<void> {
  await atraso()
  exigirRH('alterar')
  registroDeMembro(id).cancelado = true
}

export async function registrarDispensa(dados: NovaDispensa): Promise<void> {
  await atraso()
  if (!dados.motivo.trim()) throw new Error('O motivo é obrigatório')
  if (!membros.some((m) => m.id === dados.membroId)) throw new Error('Membro não encontrado')
  if (estaDispensada(dados.membroId, dados.semana)) {
    throw new Error('Esta semana já está dispensada para este membro')
  }
  dispensas.push({ membroId: dados.membroId, semana: dados.semana, motivo: dados.motivo.trim() })
}

export async function metasAtuais(): Promise<Metas> {
  await atraso()
  return copia(metaDaSemana(semanaAtual()))
}

// A nova meta passa a valer na semana seguinte (a atual e as anteriores mantêm a meta delas).
export async function alterarMetas(horasTotal: number, horasSede: number): Promise<void> {
  await atraso()
  if (perfilFalso() !== 'diretor_rh') throw new Error('Só o diretor do RH pode alterar as metas')
  if (!(horasTotal > 0) || !(horasSede > 0)) throw new Error('As metas precisam ser maiores que zero')
  const vigenteDesde = somarDias(semanaAtual(), 7)
  const indice = metas.findIndex((m) => m.vigenteDesde === vigenteDesde)
  if (indice >= 0) metas.splice(indice, 1)
  metas.push({ horasTotal, horasSede, vigenteDesde })
}

// Percentual por membros: cumpriram ÷ (elegíveis − dispensados).
export async function percentualDaSemana(semana: string): Promise<number> {
  await atraso()
  const considerados = membrosElegiveis(semana)
    .map((m) => resumoDoMembro(m, semana))
    .filter((r) => !r.dispensada)
  if (considerados.length === 0) return 0
  const cumpriram = considerados.filter((r) => r.cumpriu).length
  return Math.round((cumpriram / considerados.length) * 1000) / 10
}

export async function resumoDaSemana(semana: string): Promise<ResumoMembroSemana[]> {
  await atraso()
  return membrosElegiveis(semana)
    .map((m) => resumoDoMembro(m, semana))
    .sort((a, b) => a.membro.nome.localeCompare(b.membro.nome))
}

export async function abaixoDaMeta(semana: string): Promise<ResumoMembroSemana[]> {
  await atraso()
  return membrosElegiveis(semana)
    .map((m) => resumoDoMembro(m, semana))
    .filter((r) => !r.cumpriu && !r.dispensada)
    .sort((a, b) => a.membro.nome.localeCompare(b.membro.nome))
}
