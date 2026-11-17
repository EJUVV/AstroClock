// Registros corrigidos pelo RH e revisão de cronômetros já são reais. O resto deste painel
// (progresso, ranking, requerimentos, metas) ainda é falso e vem de rh-falso.ts.
import type { Registro, NovoRegistro } from '../tipos.ts'
import { instante, partesPorDia, somarDias } from '../datas.ts'
import { supabase } from '../supabase.ts'
import { loginFalso } from './auth.ts'
import { erroDoBanco, paraRegistro } from './banco.ts'
import * as falso from './rh-falso.ts'

export {
  abaixoDaMeta,
  alterarMetas,
  listarMetas,
  listarRequerimentos,
  mediasDaSemana,
  metasAtuais,
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
        p_fim: antes.fim ?? undefined,
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
