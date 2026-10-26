// FALSO: trocar pela versão real (ver docs/arquitetura.md)
import type { NovoRegistro, Registro } from '../tipos.ts'
import {
  aplicarEdicao,
  atraso,
  copia,
  criadoEm,
  dataEmBrasilia,
  membroLogado,
  perfilFalso,
  registros,
  segundaDaSemana,
  somarDias,
  validarRegistro,
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

const PRAZO_MS = 7 * 24 * 3_600_000

// O membro só lança (ou move um registro para) dias de até 7 dias atrás; antes disso, pede ao RH.
// A confirmar com a diretoria: para mudar o limite, troque DIAS_PARA_LANCAR.
const DIAS_PARA_LANCAR = 7

function exigirDentroDoLimite(dados: NovoRegistro): void {
  if (perfilFalso() !== 'membro') return
  const limite = somarDias(dataEmBrasilia(new Date()), -DIAS_PARA_LANCAR)
  if (dataEmBrasilia(dados.inicio) < limite) {
    throw new Error(`Só é possível lançar horas dos últimos ${DIAS_PARA_LANCAR} dias. Para datas anteriores, procure o RH.`)
  }
}

// O membro edita ou cancela até 7 dias depois de criar o registro; depois disso, só o RH.
function meuRegistroEditavel(id: string): Registro {
  const registro = registros.find((r) => r.id === id && r.membroId === membroLogado().id)
  if (!registro || registro.cancelado) throw new Error('Registro não encontrado')
  const criado = criadoEm.get(id) ?? Date.now()
  if (perfilFalso() === 'membro' && Date.now() - criado > PRAZO_MS) {
    throw new Error('Este registro foi criado há mais de 7 dias. Só o RH pode alterá-lo.')
  }
  return registro
}

export async function criarRegistro(dados: NovoRegistro): Promise<Registro> {
  await atraso()
  const membroId = membroLogado().id
  validarRegistro(membroId, dados)
  exigirDentroDoLimite(dados)
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
  criadoEm.set(novo.id, Date.now())
  return copia(novo)
}

export async function editarRegistro(id: string, dados: NovoRegistro): Promise<Registro> {
  await atraso()
  const registro = meuRegistroEditavel(id)
  validarRegistro(registro.membroId, dados, id)
  exigirDentroDoLimite(dados)
  aplicarEdicao(registro, dados)
  return copia(registro)
}

export async function cancelarRegistro(id: string): Promise<void> {
  await atraso()
  meuRegistroEditavel(id).cancelado = true
}
