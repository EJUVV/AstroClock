// Requerimentos de ausência (B8 e G7), lado do membro. O anexo vai do navegador direto para o bucket
// privado anexos-requerimentos, no caminho <meu id>/<uuid>.<ext>. Quem vê o quê é decidido no banco
// (RLS da tabela e regras do Storage): o membro só os próprios; rh, presidente e quem dirige o RH, todos.
import type { NovoRequerimento, Requerimento } from '../tipos.ts'
import type { Database } from '../tipos-banco.ts'
import { supabase } from '../supabase.ts'
import { loginFalso } from './auth.ts'
import { ERRO_CONEXAO, erroDoBanco, meuId } from './banco.ts'
import * as falso from './requerimentos-falso.ts'

const BUCKET = 'anexos-requerimentos'
const LINK_VALE_SEGUNDOS = 60 // o link do anexo vale 1 minuto: o suficiente para abrir

// Mesmas regras do bucket (o banco recusa de novo se passar daqui).
const EXTENSOES: Record<string, string> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' }
const TAMANHO_MAXIMO_DO_ANEXO = 5 * 1024 * 1024 // 5 MB
const TAMANHO_MAXIMO_DO_MOTIVO = 1000 // igual à regra requerimentos_motivo do banco

function validarAnexo(anexo: File): void {
  if (!EXTENSOES[anexo.type]) throw new Error('O anexo precisa ser PDF, JPG ou PNG')
  if (anexo.size > TAMANHO_MAXIMO_DO_ANEXO) throw new Error('O anexo pode ter no máximo 5 MB')
}

// Erros do Storage chegam em inglês: mostra uma mensagem pronta para a tela. Sem status = sem conexão.
interface ErroDoStorage {
  message: string
  status?: number
  statusCode?: string // código do Storage; numa recusa da regra pode vir "403" com status 400
}

function erroDoArquivo(e: ErroDoStorage, acao: string): Error {
  if (!e.status) return new Error(ERRO_CONEXAO)
  if (e.status === 403 || e.statusCode === '403' || /row-level security|unauthorized/i.test(e.message)) return new Error('Você não tem permissão para fazer isso')
  if (e.status === 413 || e.statusCode === '413') return new Error('O anexo pode ter no máximo 5 MB')
  return new Error(`Não foi possível ${acao} o anexo. Tente de novo.`)
}

type LinhaRequerimento = Database['public']['Tables']['requerimentos']['Row'] & { membros: { nome: string } | null }

// Duas chaves de requerimentos para membros (membro_id e respondido_por): o embed diz qual usar.
export const COLUNAS_REQUERIMENTO = '*, membros!requerimentos_membro_id_fkey(nome)'

// anexoNome vem null quando o arquivo já foi apagado (anexo_caminho vazio), como na demonstração.
export function paraRequerimento(l: LinhaRequerimento): Requerimento {
  return {
    id: l.id,
    membroId: l.membro_id,
    nomeMembro: l.membros?.nome ?? '',
    tipo: l.tipo,
    inicio: l.data_inicio,
    fim: l.data_fim,
    motivo: l.motivo,
    situacao: l.situacao,
    criadoEm: l.criado_em,
    anexoNome: l.anexo_caminho ? l.anexo_nome : null,
    motivoResposta: l.motivo_resposta,
  }
}

// Apaga o arquivo do bucket. Devolve true só se o Storage confirmou: quando a regra de apagar recusa,
// ele responde sem erro e com a lista vazia.
export async function apagarArquivoDoAnexo(caminho: string): Promise<boolean> {
  const { data, error } = await supabase.storage.from(BUCKET).remove([caminho])
  if (error) throw erroDoArquivo(error, 'apagar')
  return data.some((o) => o.name === caminho)
}

// O arquivo ainda está no bucket? Para quem vê tudo (lê o bucket inteiro): "não achou" = já sumiu.
// Outros erros (conexão, por exemplo) são lançados, para ninguém marcar como apagado sem saber.
export async function arquivoDoAnexoExiste(caminho: string): Promise<boolean> {
  const { data, error } = await supabase.storage.from(BUCKET).exists(caminho)
  if (data) return true
  if (error?.status === 400 || error?.status === 404) return false
  if (error) throw erroDoArquivo(error, 'abrir')
  return false
}

// O pedido não foi gravado: apaga o arquivo enviado, com uma segunda tentativa. Se nada der certo, o
// arquivo fica sem pedido no bucket (limpeza manual, ver docs/arquitetura.md); quem chama lança o erro
// do pedido de qualquer jeito.
async function apagarOrfao(caminho: string): Promise<void> {
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    try {
      if (await apagarArquivoDoAnexo(caminho)) return
    } catch {
      // tenta de novo
    }
  }
}

// Envia o arquivo primeiro; se a gravação do pedido falhar, apaga o arquivo (o dono pode apagar o
// arquivo da própria pasta que não está ligado a nenhum pedido).
export async function enviarRequerimento(dados: NovoRequerimento): Promise<Requerimento> {
  if (loginFalso) return falso.enviarRequerimento(dados)
  const motivo = dados.motivo.trim()
  if (!motivo) throw new Error('O motivo é obrigatório')
  if (motivo.length > TAMANHO_MAXIMO_DO_MOTIVO) throw new Error('O motivo pode ter no máximo 1000 caracteres')
  if (!dados.inicio || !dados.fim) throw new Error('Escolha as datas')
  if (dados.fim < dados.inicio) throw new Error('O fim precisa ser depois do início')
  if (dados.anexo) validarAnexo(dados.anexo)

  const eu = await meuId()
  let caminho: string | null = null
  if (dados.anexo) {
    caminho = `${eu}/${crypto.randomUUID()}.${EXTENSOES[dados.anexo.type]}`
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(caminho, dados.anexo, { contentType: dados.anexo.type, upsert: false })
    if (error) throw erroDoArquivo(error, 'enviar')
  }

  // Só as colunas do pedido: situação, resposta e criado_em ficam com o padrão do banco.
  const { data, error } = await supabase
    .from('requerimentos')
    .insert({
      membro_id: eu,
      tipo: dados.tipo,
      data_inicio: dados.inicio,
      data_fim: dados.fim,
      motivo,
      anexo_caminho: caminho,
      anexo_nome: dados.anexo?.name ?? null,
    })
    .select(COLUNAS_REQUERIMENTO)
    .single()
  if (error) {
    if (caminho) await apagarOrfao(caminho)
    throw erroDoBanco(error) // o erro do pedido, mesmo que a limpeza do arquivo falhe
  }
  return paraRequerimento(data)
}

// Do mais recente para o mais antigo. Só os próprios (o rh também lê os dos outros pelo RLS).
export async function meusRequerimentos(): Promise<Requerimento[]> {
  if (loginFalso) return falso.meusRequerimentos()
  const { data, error } = await supabase
    .from('requerimentos')
    .select(COLUNAS_REQUERIMENTO)
    .eq('membro_id', await meuId())
    .order('criado_em', { ascending: false })
  if (error) throw erroDoBanco(error)
  return data.map(paraRequerimento)
}

// Só quem enviou, o RH e o presidente abrem o anexo (regras do Storage). Devolve um link temporário.
export async function linkDoAnexo(id: string): Promise<string> {
  if (loginFalso) return falso.linkDoAnexo(id)
  const { data, error } = await supabase.from('requerimentos').select('anexo_caminho').eq('id', id).maybeSingle()
  if (error) throw erroDoBanco(error)
  if (!data) throw new Error('Requerimento não encontrado')
  if (!data.anexo_caminho) {
    throw new Error('Este requerimento não tem anexo (ele é apagado na aprovação, ou um mês depois da reprovação)')
  }
  const { data: link, error: erroLink } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(data.anexo_caminho, LINK_VALE_SEGUNDOS)
  if (erroLink) throw erroDoArquivo(erroLink, 'abrir')
  return link.signedUrl
}
