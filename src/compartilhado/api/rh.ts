// Painel do RH real: cálculo da semana (B9), ranking do mês, registros corrigidos pelo RH, revisão de
// cronômetros e metas. Só os requerimentos ainda são falsos e vêm de rh-falso.ts.
// Quem vê o quê é decidido no banco: o diretor de setor só recebe os setores que dirige.
import type {
  LinhaRanking,
  MediasDaSemana,
  Membro,
  MembroAbaixoSeguido,
  Metas,
  NovoRegistro,
  ProgressoSemana,
  Registro,
  ResumoMembroSemana,
} from '../tipos.ts'
import type { Database } from '../tipos-banco.ts'
import { instante, partesPorDia, segundaDaSemana, semanaAtual, somarDias } from '../datas.ts'
import { supabase } from '../supabase.ts'
import { loginFalso } from './auth.ts'
import { erroDoBanco, paraRegistro } from './banco.ts'
import * as falso from './rh-falso.ts'

export { listarRequerimentos, responderRequerimento } from './rh-falso.ts'

type Funcoes = Database['public']['Functions']
type LinhaResumo = Funcoes['resumo_da_semana']['Returns'][number]

// Colunas de membro que as funções do banco devolvem junto com as horas.
function membroDaLinha(l: Pick<LinhaResumo, 'membro_id' | 'nome' | 'email' | 'perfil' | 'setor' | 'ativo' | 'data_entrada'>): Membro {
  return {
    id: l.membro_id,
    nome: l.nome,
    email: l.email,
    perfil: l.perfil,
    setor: l.setor,
    ativo: l.ativo,
    dataEntrada: l.data_entrada,
  }
}

function paraResumo(l: LinhaResumo): ResumoMembroSemana {
  return {
    membro: membroDaLinha(l),
    horasSede: l.horas_sede,
    horasTotal: l.horas_total,
    cumpriu: l.cumpriu,
    dispensada: l.dispensada,
  }
}

const porNome = (a: { membro: Membro }, b: { membro: Membro }) => a.membro.nome.localeCompare(b.membro.nome)

// Percentual por membros: cumpriram ÷ (elegíveis − dispensados). Sem setor, tudo o que a pessoa pode ver.
export async function percentualDaSemana(semana: string, setor?: string): Promise<number> {
  if (loginFalso) return falso.percentualDaSemana(semana, setor)
  const { data, error } = await supabase.rpc('percentual_da_semana', { p_semana: semana, p_setor: setor })
  if (error) throw erroDoBanco(error)
  return Number(data)
}

export async function resumoDaSemana(semana: string, setor?: string): Promise<ResumoMembroSemana[]> {
  if (loginFalso) return falso.resumoDaSemana(semana, setor)
  const { data, error } = await supabase.rpc('resumo_da_semana', { p_semana: semana, p_setor: setor })
  if (error) throw erroDoBanco(error)
  return data.map(paraResumo).sort(porNome)
}

export async function abaixoDaMeta(semana: string, setor?: string): Promise<ResumoMembroSemana[]> {
  if (loginFalso) return falso.abaixoDaMeta(semana, setor)
  const { data, error } = await supabase.rpc('abaixo_da_meta', { p_semana: semana, p_setor: setor })
  if (error) throw erroDoBanco(error)
  return data.map(paraResumo).sort(porNome)
}

// Médias por membro na semana, sem quem teve a semana dispensada. A diária divide pelos 5 dias úteis.
export async function mediasDaSemana(semana: string, setor?: string): Promise<MediasDaSemana> {
  if (loginFalso) return falso.mediasDaSemana(semana, setor)
  const { data, error } = await supabase.rpc('medias_da_semana', { p_semana: semana, p_setor: setor })
  if (error) throw erroDoBanco(error)
  const l = data[0]
  if (!l) return { mediaTotal: 0, mediaSede: 0, mediaDiaria: 0 }
  return { mediaTotal: l.media_total, mediaSede: l.media_sede, mediaDiaria: l.media_diaria }
}

// Progresso de uma semana de outro membro, para o detalhe no painel do RH.
export async function progressoDeMembro(membroId: string, semana: string): Promise<ProgressoSemana> {
  if (loginFalso) return falso.progressoDeMembro(membroId, semana)
  const { data, error } = await supabase.rpc('progresso_de_membro', { p_membro_id: membroId, p_semana: semana })
  if (error) throw erroDoBanco(error, DE_QUEM)
  const l = data[0]
  // Sem linha: o membro não existe ou não é de um setor que a pessoa pode ver (RLS).
  if (!l) throw new Error('Membro não encontrado')
  return {
    semana: l.semana,
    horasSede: l.horas_sede,
    horasTotal: l.horas_total,
    metaSede: l.meta_sede ?? 0,
    metaTotal: l.meta_total ?? 0,
    cumpriu: l.cumpriu,
    dispensada: l.dispensada,
    semMeta: !l.elegivel,
  }
}

// Só quem está há 2 semanas ou mais abaixo da meta, contando para trás a partir da semana pedida.
export async function semanasSeguidasAbaixo(semana: string): Promise<MembroAbaixoSeguido[]> {
  if (loginFalso) return falso.semanasSeguidasAbaixo(semana)
  const { data, error } = await supabase.rpc('semanas_seguidas_abaixo', { p_semana: semana })
  if (error) throw erroDoBanco(error)
  return data
    .map((l) => ({ membro: membroDaLinha(l), semanasSeguidas: l.semanas_seguidas }))
    .sort((a, b) => b.semanasSeguidas - a.semanasSeguidas || porNome(a, b))
}

// Ranking completo do mês: rh, presidente e quem dirige o RH veem a EJ; quem dirige setores, só esses
// setores (com a posição dentro de cada setor). O membro não vê.
export async function rankingDoMes(mes: string): Promise<LinhaRanking[]> {
  if (loginFalso) return falso.rankingDoMes(mes)
  const { data, error } = await supabase.rpc('ranking_do_mes', { p_mes: mes })
  if (error) throw erroDoBanco(error)
  return data.map((l) => ({
    posicao: l.posicao,
    membro: membroDaLinha(l),
    horasTotal: l.horas_total,
    horasSede: l.horas_sede,
    dispensado: l.dispensado,
  }))
}

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
