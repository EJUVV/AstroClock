// Registros corrigidos pelo RH, revisão de cronômetros e metas já são reais. O resto deste painel
// (progresso, ranking, requerimentos) ainda é falso e vem de rh-falso.ts.
import type { Metas, Registro, NovoRegistro } from '../tipos.ts'
import { instante, partesPorDia, segundaDaSemana, semanaAtual, somarDias } from '../datas.ts'
import { supabase } from '../supabase.ts'
import { loginFalso } from './auth.ts'
import { erroDoBanco, paraRegistro } from './banco.ts'
import * as falso from './rh-falso.ts'

export {
  abaixoDaMeta,
  listarRequerimentos,
  mediasDaSemana,
  percentualDaSemana,
  progressoDeMembro,
  rankingDoMes,
  responderRequerimento,
  resumoDaSemana,
  semanasSeguidasAbaixo,
} from './rh-falso.ts'

const DE_QUEM = 'deste membro'

function exigirMotivo(motivo: string): void {
  if (!motivo.trim()) throw new Error('O motivo é obrigatório')
}

// Para o detalhe por membro no painel do RH. Inclui o cronômetro ativo; não inclui cancelados.
// Quem pode ver o quê é decidido pelo RLS (o diretor de setor só vê o próprio setor).
export async function buscarRegistrosDoMembro(membroId: string, semana: string): Promise<Registro[]> {
  if (loginFalso) return falso.buscarRegistrosDoMembro(membroId, semana)
  const { data, error } = await supabase
    .from('registros')
    .select('*')
    .eq('membro_id', membroId)
    .eq('cancelado', false)
    .gte('inicio', instante(semana, '00:00'))
    .lt('inicio', instante(somarDias(semana, 7), '00:00'))
    .order('inicio')
  if (error) throw erroDoBanco(error)
  return data.map(paraRegistro)
}

// Desfaz o que já foi criado quando uma parte seguinte falha (cada parte é uma chamada ao banco).
async function cancelarCriados(criados: Registro[], motivo: string): Promise<void> {
  for (const r of criados) {
    await supabase.rpc('cancelar_registro_de_membro', { p_id: r.id, p_motivo: `Desfeito: ${motivo}` })
  }
}

// O RH lança horas para outro membro, inclusive de mais de 7 dias atrás. O motivo vai para a auditoria.
// Se passa da meia-noite, vira um registro por dia. Devolve a primeira parte.
export async function criarRegistroDeMembro(membroId: string, dados: NovoRegistro, motivo: string): Promise<Registro> {
  if (loginFalso) return falso.criarRegistroDeMembro(membroId, dados, motivo)
  exigirMotivo(motivo)
  const criados: Registro[] = []
  for (const parte of partesPorDia(dados.inicio, dados.fim)) {
    const { data, error } = await supabase.rpc('criar_registro_de_membro', {
      p_membro_id: membroId,
      p_inicio: parte.inicio,
      p_fim: parte.fim,
      p_local: dados.local,
      p_descricao: dados.descricao.trim(),
      p_motivo: motivo.trim(),
    })
    if (error) {
      await cancelarCriados(criados, motivo.trim())
      throw erroDoBanco(error, DE_QUEM)
    }
    criados.push(paraRegistro(data))
  }
  return criados[0]
}

// O registro editado fica com a primeira parte; se o novo horário passa da meia-noite, as outras são criadas.
export async function editarRegistroDeMembro(id: string, dados: NovoRegistro, motivo: string): Promise<Registro> {
  if (loginFalso) return falso.editarRegistroDeMembro(id, dados, motivo)
  exigirMotivo(motivo)
  const { data: antes, error: erroLeitura } = await supabase.from('registros').select('*').eq('id', id).maybeSingle()
  if (erroLeitura) throw erroDoBanco(erroLeitura)
  if (!antes || antes.cancelado) throw new Error('Registro não encontrado')
  // Editar o fim de um cronômetro ligado o pararia por fora, sem o membro saber.
  if (antes.fim === null) throw new Error('Este cronômetro ainda está ligado. Peça ao membro para pará-lo antes de corrigir.')

  const [primeira, ...resto] = partesPorDia(dados.inicio, dados.fim)
  const descricao = dados.descricao.trim()
  const { data, error } = await supabase.rpc('editar_registro_de_membro', {
    p_id: id,
    p_motivo: motivo.trim(),
    p_inicio: primeira.inicio,
    p_fim: primeira.fim,
    p_local: dados.local,
    p_descricao: descricao,
  })
  if (error) throw erroDoBanco(error, DE_QUEM)

  const criados: Registro[] = []
  for (const parte of resto) {
    const { data: nova, error: erroParte } = await supabase.rpc('criar_registro_de_membro', {
      p_membro_id: antes.membro_id,
      p_inicio: parte.inicio,
      p_fim: parte.fim,
      p_local: dados.local,
      p_descricao: descricao,
      p_motivo: motivo.trim(),
    })
    if (erroParte) {
      // Não deixa a correção pela metade: cancela as partes novas e devolve o registro ao que era.
      await cancelarCriados(criados, motivo.trim())
      await supabase.rpc('editar_registro_de_membro', {
        p_id: id,
        p_motivo: `Desfeito: ${motivo.trim()}`,
        p_inicio: antes.inicio,
        p_fim: antes.fim,
        p_local: antes.local,
        p_descricao: antes.descricao,
      })
      throw erroDoBanco(erroParte, DE_QUEM)
    }
    criados.push(paraRegistro(nova))
  }
  return paraRegistro(data)
}

export async function cancelarRegistroDeMembro(id: string, motivo: string): Promise<void> {
  if (loginFalso) return falso.cancelarRegistroDeMembro(id, motivo)
  exigirMotivo(motivo)
  const { error } = await supabase.rpc('cancelar_registro_de_membro', { p_id: id, p_motivo: motivo.trim() })
  if (error) throw erroDoBanco(error, DE_QUEM)
}

// Cronômetros que pararam sozinhos após 10h e esperam o RH. O RLS limita ao que cada perfil pode ver.
export async function cronometrosEmRevisao(): Promise<Registro[]> {
  if (loginFalso) return falso.cronometrosEmRevisao()
  const { data, error } = await supabase
    .from('registros')
    .select('*')
    .eq('precisa_revisao', true)
    .eq('cancelado', false)
    .order('inicio')
  if (error) throw erroDoBanco(error)
  return data.map(paraRegistro)
}

// Aprovado: passa a contar na meta. Reprovado: é cancelado.
export async function revisarCronometro(id: string, aprovar: boolean): Promise<void> {
  if (loginFalso) return falso.revisarCronometro(id, aprovar)
  const { error } = await supabase.rpc('revisar_cronometro', { p_id: id, p_aprovar: aprovar })
  if (error) throw erroDoBanco(error, DE_QUEM)
}

// Linha da visão lista_de_metas (as colunas de uma visão vêm como opcionais nos tipos do banco).
interface LinhaMeta {
  horas_total: number | string | null
  horas_sede: number | string | null
  vigente_desde: string | null
}

function paraMetas(linha: LinhaMeta): Metas {
  return {
    horasTotal: Number(linha.horas_total),
    horasSede: Number(linha.horas_sede),
    vigenteDesde: linha.vigente_desde ?? '',
  }
}

// A meta que vale na semana atual: a mais recente que já começou.
export async function metasAtuais(): Promise<Metas> {
  if (loginFalso) return falso.metasAtuais()
  // lista_de_metas: só a versão mais nova de cada semana (a tabela guarda o histórico).
  const { data, error } = await supabase
    .from('lista_de_metas')
    .select('horas_total, horas_sede, vigente_desde')
    .lte('vigente_desde', semanaAtual())
    .order('vigente_desde', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw erroDoBanco(error)
  if (!data) throw new Error('Nenhuma meta cadastrada')
  return paraMetas(data)
}

// Todas as metas, inclusive as programadas para semanas futuras, da mais recente para a mais antiga.
export async function listarMetas(): Promise<Metas[]> {
  if (loginFalso) return falso.listarMetas()
  const { data, error } = await supabase
    .from('lista_de_metas')
    .select('horas_total, horas_sede, vigente_desde')
    .order('vigente_desde', { ascending: false })
  if (error) throw erroDoBanco(error)
  return (data ?? []).map(paraMetas)
}

// O diretor escolhe a segunda-feira em que a meta começa, a partir da semana seguinte.
// O banco só aceita inserir (o histórico fica guardado): se já houver meta programada para essa segunda,
// a nova passa a valer porque a lista_de_metas mostra só a mais recente. Quem pode: só o diretor_rh (RLS).
export async function alterarMetas(horasTotal: number, horasSede: number, vigenteDesde: string): Promise<void> {
  if (loginFalso) return falso.alterarMetas(horasTotal, horasSede, vigenteDesde)
  if (!(horasTotal > 0)) throw new Error('A meta total precisa ser maior que zero')
  if (!(horasSede >= 0)) throw new Error('A meta de sede não pode ser negativa')
  if (segundaDaSemana(vigenteDesde) !== vigenteDesde) throw new Error('Escolha a segunda-feira da semana')
  if (vigenteDesde <= semanaAtual()) throw new Error('A meta só pode mudar a partir da semana seguinte')
  const { error } = await supabase
    .from('metas')
    .insert({ horas_total: horasTotal, horas_sede: horasSede, vigente_desde: vigenteDesde })
  if (error) throw erroDoBanco(error)
}
