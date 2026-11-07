// FALSO: trocar pela versão real (ver docs/arquitetura.md)
import type {
  LinhaRanking,
  Membro,
  MediasDaSemana,
  MembroAbaixoSeguido,
  Metas,
  NovaDispensa,
  NovoRegistro,
  ProgressoSemana,
  Registro,
  Requerimento,
  ResumoMembroSemana,
  SituacaoRequerimento,
} from '../tipos.ts'
import { corrigeRegistros, temPainelRH, veRequerimentos } from '../perfis.ts'
import {
  anexos,
  aplicarEdicao,
  atraso,
  calcularRanking,
  copia,
  dataEmBrasilia,
  dispensas,
  estaDispensada,
  membros,
  membroLogado,
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

// Painel do RH: rh, diretor_rh, presidente e diretor de setor (este só vê o próprio setor).
function exigirRH(acao: string): void {
  const perfil = perfilFalso()
  if (!perfil || !temPainelRH(perfil)) throw new Error(`Só o RH pode ${acao}`)
}

// O presidente e o diretor de setor não alteram registros.
function exigirCorrecao(): void {
  const perfil = perfilFalso()
  if (!perfil || !corrigeRegistros(perfil)) throw new Error('Só o RH pode alterar registros de outros membros')
}

// Diretor de setor: só os membros do próprio setor. Os outros perfis do painel veem todos.
function noMeuAlcance(membroId: string): boolean {
  if (perfilFalso() !== 'diretor_setor') return true
  return membros.find((m) => m.id === membroId)?.setor === membroLogado().setor
}

function exigirAlcance(membroId: string): void {
  if (!noMeuAlcance(membroId)) throw new Error('Este membro não é do seu setor')
}

// Sem setor, a EJ toda. O diretor de setor sempre fica no próprio setor.
function elegiveisNoAlcance(semana: string, setor?: string): Membro[] {
  const filtro = perfilFalso() === 'diretor_setor' ? membroLogado().setor : setor
  return membrosElegiveis(semana).filter((m) => !filtro || m.setor === filtro)
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
  exigirAlcance(membroId)
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
  exigirCorrecao()
  exigirMotivo(motivo)
  const registro = registroDeMembro(id)
  validarRegistro(registro.membroId, dados, id, 'deste membro')
  aplicarEdicao(registro, dados)
  return copia(registro)
}

export async function cancelarRegistroDeMembro(id: string, motivo: string): Promise<void> {
  await atraso()
  exigirCorrecao()
  exigirMotivo(motivo)
  registroDeMembro(id).cancelado = true
}

// Protótipo: progresso de uma semana de outro membro, para o detalhe no painel do RH.
export async function progressoDeMembro(membroId: string, semana: string): Promise<ProgressoSemana> {
  await atraso()
  exigirRH('ver o progresso de outros membros')
  exigirAlcance(membroId)
  return progressoDoMembro(membroId, semana)
}

// Protótipo: o RH lança horas para outro membro, inclusive de mais de 7 dias atrás. O motivo é obrigatório.
export async function criarRegistroDeMembro(membroId: string, dados: NovoRegistro, motivo: string): Promise<Registro> {
  await atraso()
  exigirCorrecao()
  exigirMotivo(motivo)
  validarRegistro(membroId, dados, undefined, 'deste membro')
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

export async function cronometrosEmRevisao(): Promise<Registro[]> {
  await atraso()
  exigirRH('revisar cronômetros')
  return copia(registros.filter((r) => r.precisaRevisao && !r.cancelado && noMeuAlcance(r.membroId)))
}

// Aprovado: passa a contar na meta. Reprovado: é cancelado.
export async function revisarCronometro(id: string, aprovar: boolean): Promise<void> {
  await atraso()
  exigirRH('revisar cronômetros')
  const registro = registros.find((r) => r.id === id && r.precisaRevisao && !r.cancelado)
  if (!registro) throw new Error('Cronômetro em revisão não encontrado')
  exigirAlcance(registro.membroId)
  registro.precisaRevisao = false
  if (!aprovar) registro.cancelado = true
}

// Só quem está há 2 semanas ou mais abaixo da meta, contando para trás a partir da semana pedida.
export async function semanasSeguidasAbaixo(semana: string): Promise<MembroAbaixoSeguido[]> {
  await atraso()
  exigirRH('ver quem está abaixo da meta')
  const lista: MembroAbaixoSeguido[] = []
  for (const membro of elegiveisNoAlcance(semana)) {
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

// O diretor de setor vê só o ranking do próprio setor (ainda em aberto com a diretora de RH).
export async function rankingDoMes(mes: string): Promise<LinhaRanking[]> {
  await atraso()
  exigirRH('ver o ranking completo')
  return calcularRanking(mes)
    .filter((linha) => noMeuAlcance(linha.membro.id))
    .map((linha, i) => ({ ...linha, posicao: i + 1 }))
}

// Do mais recente para o mais antigo. Sem situacao, devolve todos.
// Veem: rh, diretor_rh e presidente. O diretor de setor não vê.
export async function listarRequerimentos(situacao?: SituacaoRequerimento): Promise<Requerimento[]> {
  await atraso()
  const perfil = perfilFalso()
  if (!perfil || !veRequerimentos(perfil)) throw new Error('Você não pode ver os requerimentos')
  return copia(
    requerimentos
      .filter((q) => !situacao || q.situacao === situacao)
      .sort((a, b) => Date.parse(b.criadoEm) - Date.parse(a.criadoEm)),
  )
}

// Só o diretor do RH responde. A reprovação exige motivo, que vai no e-mail para o membro.
// Na aprovação, o anexo é apagado (pode ter dado de saúde); na reprovação, continua guardado.
export async function responderRequerimento(id: string, aprovar: boolean, motivo = ''): Promise<void> {
  await atraso()
  if (perfilFalso() !== 'diretor_rh') throw new Error('Só o diretor do RH aprova ou reprova requerimentos')
  if (!aprovar) exigirMotivo(motivo)
  const requerimento = requerimentos.find((q) => q.id === id)
  if (!requerimento) throw new Error('Requerimento não encontrado')
  if (requerimento.situacao !== 'pendente') throw new Error('Este requerimento já foi respondido')
  requerimento.situacao = aprovar ? 'aprovado' : 'reprovado'
  requerimento.motivoResposta = aprovar ? null : motivo.trim()
  if (aprovar) {
    anexos.delete(id)
    requerimento.anexoNome = null
  }
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
export async function percentualDaSemana(semana: string, setor?: string): Promise<number> {
  await atraso()
  const considerados = elegiveisNoAlcance(semana, setor)
    .map((m) => resumoDoMembro(m, semana))
    .filter((r) => !r.dispensada)
  if (considerados.length === 0) return 0
  const cumpriram = considerados.filter((r) => r.cumpriu).length
  return Math.round((cumpriram / considerados.length) * 1000) / 10
}

export async function resumoDaSemana(semana: string, setor?: string): Promise<ResumoMembroSemana[]> {
  await atraso()
  return elegiveisNoAlcance(semana, setor)
    .map((m) => resumoDoMembro(m, semana))
    .sort((a, b) => a.membro.nome.localeCompare(b.membro.nome))
}

export async function abaixoDaMeta(semana: string, setor?: string): Promise<ResumoMembroSemana[]> {
  await atraso()
  return elegiveisNoAlcance(semana, setor)
    .map((m) => resumoDoMembro(m, semana))
    .filter((r) => !r.cumpriu && !r.dispensada)
    .sort((a, b) => a.membro.nome.localeCompare(b.membro.nome))
}

// Protótipo: médias por membro na semana, sem contar quem teve a semana dispensada.
export async function mediasDaSemana(semana: string, setor?: string): Promise<MediasDaSemana> {
  await atraso()
  const considerados = elegiveisNoAlcance(semana, setor)
    .map((m) => resumoDoMembro(m, semana))
    .filter((r) => !r.dispensada)
  if (considerados.length === 0) return { mediaTotal: 0, mediaSede: 0, mediaDiaria: 0 }
  const media = (valores: number[]) => Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 10) / 10
  const mediaTotal = media(considerados.map((r) => r.horasTotal))
  return {
    mediaTotal,
    mediaSede: media(considerados.map((r) => r.horasSede)),
    mediaDiaria: Math.round((mediaTotal / 5) * 10) / 10,
  }
}
