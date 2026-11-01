// FALSO: trocar pela versão real (ver docs/arquitetura.md)
import type {
  LinhaRanking,
  MembroAbaixoSeguido,
  Metas,
  NovaDispensa,
  NovoRegistro,
  Registro,
  Requerimento,
  ResumoMembroSemana,
  SituacaoRequerimento,
} from '../tipos.ts'
import {
  aplicarEdicao,
  atraso,
  calcularRanking,
  copia,
  dataEmBrasilia,
  dispensas,
  estaDispensada,
  membros,
  membrosElegiveis,
  metaDaSemana,
  metas,
  perfilFalso,
  progressoDoMembro,
  registros,
  requerimentos,
  resumoDoMembro,
  segundaDaSemana,
  semanaAtual,
  somarDias,
  validarRegistro,
} from './dados-falsos.ts'

function exigirRH(acao: string): void {
  const perfil = perfilFalso()
  if (perfil !== 'rh' && perfil !== 'diretor_rh') {
    throw new Error(`Só o RH pode ${acao}`)
  }
}

function exigirMotivo(motivo: string): void {
  if (!motivo.trim()) throw new Error('O motivo é obrigatório')
}

function registroDeMembro(id: string): Registro {
  const registro = registros.find((r) => r.id === id)
  if (!registro || registro.cancelado) throw new Error('Registro não encontrado')
  return registro
}

// Para o detalhe por membro no painel do RH. Inclui o cronômetro ativo; não inclui cancelados.
export async function buscarRegistrosDoMembro(membroId: string, semana: string): Promise<Registro[]> {
  await atraso()
  exigirRH('ver registros de outros membros')
  return copia(
    registros
      .filter((r) => r.membroId === membroId && !r.cancelado)
      .filter((r) => segundaDaSemana(dataEmBrasilia(r.inicio)) === semana)
      .sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio)),
  )
}

// O RH altera qualquer registro, inclusive os criados há mais de 7 dias. A versão real guarda o motivo na auditoria.
export async function editarRegistroDeMembro(id: string, dados: NovoRegistro, motivo: string): Promise<Registro> {
  await atraso()
  exigirRH('alterar registros de outros membros')
  exigirMotivo(motivo)
  const registro = registroDeMembro(id)
  validarRegistro(registro.membroId, dados, id, 'deste membro')
  aplicarEdicao(registro, dados)
  return copia(registro)
}

export async function cancelarRegistroDeMembro(id: string, motivo: string): Promise<void> {
  await atraso()
  exigirRH('alterar registros de outros membros')
  exigirMotivo(motivo)
  registroDeMembro(id).cancelado = true
}

export async function cronometrosEmRevisao(): Promise<Registro[]> {
  await atraso()
  exigirRH('revisar cronômetros')
  return copia(registros.filter((r) => r.precisaRevisao && !r.cancelado))
}

// Aprovado: passa a contar na meta. Reprovado: é cancelado.
export async function revisarCronometro(id: string, aprovar: boolean): Promise<void> {
  await atraso()
  exigirRH('revisar cronômetros')
  const registro = registros.find((r) => r.id === id && r.precisaRevisao && !r.cancelado)
  if (!registro) throw new Error('Cronômetro em revisão não encontrado')
  registro.precisaRevisao = false
  if (!aprovar) registro.cancelado = true
}

// Só quem está há 2 semanas ou mais abaixo da meta, contando para trás a partir da semana pedida.
export async function semanasSeguidasAbaixo(semana: string): Promise<MembroAbaixoSeguido[]> {
  await atraso()
  exigirRH('ver quem está abaixo da meta')
  const lista: MembroAbaixoSeguido[] = []
  for (const membro of membrosElegiveis(semana)) {
    let semanasSeguidas = 0
    let atual = semana
    while (membro.dataEntrada < atual) {
      const progresso = progressoDoMembro(membro.id, atual)
      if (progresso.cumpriu || progresso.dispensada) break
      semanasSeguidas++
      atual = somarDias(atual, -7)
    }
    if (semanasSeguidas >= 2) lista.push({ membro: copia(membro), semanasSeguidas })
  }
  return lista.sort((a, b) => b.semanasSeguidas - a.semanasSeguidas || a.membro.nome.localeCompare(b.membro.nome))
}

export async function rankingDoMes(mes: string): Promise<LinhaRanking[]> {
  await atraso()
  exigirRH('ver o ranking completo')
  return calcularRanking(mes)
}

// Do mais recente para o mais antigo. Sem situacao, devolve todos.
export async function listarRequerimentos(situacao?: SituacaoRequerimento): Promise<Requerimento[]> {
  await atraso()
  exigirRH('ver os requerimentos')
  return copia(
    requerimentos
      .filter((q) => !situacao || q.situacao === situacao)
      .sort((a, b) => Date.parse(b.criadoEm) - Date.parse(a.criadoEm)),
  )
}

export async function responderRequerimento(id: string, aprovar: boolean): Promise<void> {
  await atraso()
  exigirRH('responder requerimentos')
  const requerimento = requerimentos.find((q) => q.id === id)
  if (!requerimento) throw new Error('Requerimento não encontrado')
  if (requerimento.situacao !== 'pendente') throw new Error('Este requerimento já foi respondido')
  requerimento.situacao = aprovar ? 'aprovado' : 'reprovado'
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

// Todas as metas, inclusive as programadas para semanas futuras, da mais recente para a mais antiga.
export async function listarMetas(): Promise<Metas[]> {
  await atraso()
  return copia([...metas].sort((a, b) => b.vigenteDesde.localeCompare(a.vigenteDesde)))
}

// O diretor escolhe a segunda-feira em que a meta começa, a partir da semana seguinte
// (a atual e as anteriores mantêm a meta delas). Ela vale até a próxima meta programada.
// A meta de sede pode ser 0 (férias durante o piloto).
export async function alterarMetas(horasTotal: number, horasSede: number, vigenteDesde: string): Promise<void> {
  await atraso()
  if (perfilFalso() !== 'diretor_rh') throw new Error('Só o diretor do RH pode alterar as metas')
  if (!(horasTotal > 0)) throw new Error('A meta total precisa ser maior que zero')
  if (!(horasSede >= 0)) throw new Error('A meta de sede não pode ser negativa')
  if (segundaDaSemana(vigenteDesde) !== vigenteDesde) throw new Error('Escolha a segunda-feira da semana')
  if (vigenteDesde <= semanaAtual()) throw new Error('A meta só pode mudar a partir da semana seguinte')
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
