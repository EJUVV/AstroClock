// FALSO: trocar pela versão real (ver docs/arquitetura.md)
import type { NovoRequerimento, Requerimento } from '../tipos.ts'
import { ehDiretor, veRequerimentos } from '../perfis.ts'
import { anexos, apagarAnexosVencidos, atraso, copia, membroLogado, perfilFalso, requerimentos } from './dados-falsos.ts'

const TIPOS_DE_ANEXO = ['application/pdf', 'image/jpeg', 'image/png']
const TAMANHO_MAXIMO_DO_ANEXO = 5 * 1024 * 1024 // 5 MB

function validarAnexo(anexo: File): void {
  if (!TIPOS_DE_ANEXO.includes(anexo.type)) throw new Error('O anexo precisa ser PDF, JPG ou PNG')
  if (anexo.size > TAMANHO_MAXIMO_DO_ANEXO) throw new Error('O anexo pode ter no máximo 5 MB')
}

export async function enviarRequerimento(dados: NovoRequerimento): Promise<Requerimento> {
  await atraso()
  const eu = membroLogado()
  if (ehDiretor(eu.perfil)) throw new Error('Diretores não abrem requerimento, porque não têm meta')
  if (!dados.motivo.trim()) throw new Error('O motivo é obrigatório')
  if (!dados.inicio || !dados.fim) throw new Error('Escolha as datas')
  if (dados.fim < dados.inicio) throw new Error('O fim precisa ser depois do início')
  if (dados.anexo) validarAnexo(dados.anexo)
  const novo: Requerimento = {
    id: crypto.randomUUID(),
    membroId: eu.id,
    nomeMembro: eu.nome,
    tipo: dados.tipo,
    inicio: dados.inicio,
    fim: dados.fim,
    motivo: dados.motivo.trim(),
    situacao: 'pendente',
    criadoEm: new Date().toISOString(),
    anexoNome: dados.anexo?.name ?? null,
    motivoResposta: null,
  }
  requerimentos.push(novo)
  if (dados.anexo) anexos.set(novo.id, dados.anexo)
  return copia(novo)
}

// Do mais recente para o mais antigo.
export async function meusRequerimentos(): Promise<Requerimento[]> {
  await atraso()
  const membroId = membroLogado().id
  apagarAnexosVencidos()
  return copia(
    requerimentos
      .filter((q) => q.membroId === membroId)
      .sort((a, b) => Date.parse(b.criadoEm) - Date.parse(a.criadoEm)),
  )
}

// Só quem enviou, o RH e o presidente abrem o anexo. A versão real devolve um link temporário.
export async function linkDoAnexo(id: string): Promise<string> {
  await atraso()
  const requerimento = requerimentos.find((q) => q.id === id)
  if (!requerimento) throw new Error('Requerimento não encontrado')
  const perfil = perfilFalso()
  if (requerimento.membroId !== membroLogado().id && !(perfil && veRequerimentos(perfil))) {
    throw new Error('Você não pode abrir este anexo')
  }
  apagarAnexosVencidos()
  const anexo = anexos.get(id)
  if (!anexo) throw new Error('Este requerimento não tem anexo (ele é apagado na aprovação, ou um mês depois da reprovação)')
  return URL.createObjectURL(anexo)
}
