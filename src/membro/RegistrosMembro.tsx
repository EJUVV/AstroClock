import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { desmarcarNaSede, estouNaSede } from '@/compartilhado/api/presenca'
import { progressoDaSemana } from '@/compartilhado/api/progresso'
import { buscarMeusRegistros, cancelarRegistro, criarRegistro, editarRegistro } from '@/compartilhado/api/registros'
import { dataEmBrasilia, rotuloSemana, segundaDaSemana, semanaAtual, somarDias } from '@/compartilhado/datas'
import type { NovoRegistro, Registro } from '@/compartilhado/tipos'
import { ConfirmDialog } from '@/compartilhado/ui/ConfirmDialog'
import { Carregavel, useCarregar } from '@/compartilhado/ui/demo'
import { Horas } from '@/compartilhado/ui/Horas'
import { Button } from '@/compartilhado/ui/shadcn/button'
import { Skeleton } from '@/compartilhado/ui/shadcn/skeleton'
import { FormRegistro } from '@/compartilhado/ui/FormRegistro'
import { ItemRegistro } from '@/compartilhado/ui/ItemRegistro'

const PRAZO_MS = 7 * 24 * 3_600_000

// O tipo Registro ainda não tem a data de criação: o protótipo usa o início como aproximação.
function passouDoPrazo(r: Registro): boolean {
  return Date.now() - Date.parse(r.inicio) > PRAZO_MS
}

function RegistrosMembro() {
  const [semana, setSemana] = useState(semanaAtual())
  const [versao, setVersao] = useState(0)
  const carga = useCarregar(() => buscarMeusRegistros(semana), [semana, versao])
  const progresso = useCarregar(() => progressoDaSemana(semana), [semana, versao])
  const [formAberto, setFormAberto] = useState(false)
  const [editando, setEditando] = useState<Registro | null>(null)
  const [cancelando, setCancelando] = useState<Registro | null>(null)
  // A lista não traz cancelados: os desta visita ficam riscados até recarregar.
  const [canceladosAgora, setCanceladosAgora] = useState<Registro[]>([])

  async function salvar(dados: NovoRegistro) {
    if (editando) await editarRegistro(editando.id, dados)
    else await criarRegistro(dados)
    toast.success('Registro salvo')
    setVersao((v) => v + 1)
    // Lembrete: lançou horas e ainda está marcado como na sede.
    if (await estouNaSede()) {
      toast('Você ainda está marcado como na sede', {
        description: 'Se já saiu, desmarque para os outros saberem.',
        action: {
          label: 'Saí da sede',
          onClick: () => void desmarcarNaSede().then(() => toast.success('Você saiu da sede')),
        },
        duration: 10_000,
      })
    }
  }

  const ehAtual = semana === semanaAtual()

  return (
    <>
      {/* No computador, o título já aparece no topo do painel. */}
      <div className="flex items-end justify-between gap-3 lg:justify-end">
        <div className="lg:hidden">
          <h1 className="text-2xl font-bold tracking-tight">Registros</h1>
          <p className="text-sm text-muted-foreground">Suas horas, semana a semana.</p>
        </div>
        <Button
          onClick={() => {
            setEditando(null)
            setFormAberto(true)
          }}
        >
          <PlusIcon data-icon="inline-start" /> Lançar horas
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-full border bg-card p-1.5">
        <Button variant="ghost" size="icon" aria-label="Semana anterior" onClick={() => setSemana(somarDias(semana, -7))}>
          <ChevronLeftIcon />
        </Button>
        <div className="text-center">
          <p className="text-sm font-semibold">{ehAtual ? 'Esta semana' : rotuloSemana(semana)}</p>
          {progresso.status === 'conteudo' && (
            <p className="text-xs text-muted-foreground">
              <Horas valor={progresso.dados.horasTotal} className="font-semibold text-foreground" /> no total ·{' '}
              <Horas valor={progresso.dados.horasSede} className="font-semibold text-foreground" /> na sede
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Próxima semana"
          disabled={ehAtual}
          onClick={() => setSemana(somarDias(semana, 7))}
        >
          <ChevronRightIcon />
        </Button>
      </div>

      <Carregavel
        carga={carga}
        esqueleto={
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24 rounded-[20px]" />
            ))}
          </div>
        }
        vazio={{
          titulo: 'Nenhum registro nesta semana',
          descricao: 'Use o cronômetro na aba Início ou lance as horas manualmente.',
          acao: (
            <Button onClick={() => setFormAberto(true)}>
              <PlusIcon data-icon="inline-start" /> Lançar horas
            </Button>
          ),
        }}
        ehVazio={(d) => d.length === 0 && !canceladosAgora.some((c) => segundaDaSemana(dataEmBrasilia(c.inicio)) === semana)}
      >
        {(lista) => {
          const cancelados = canceladosAgora.filter(
            (c) => segundaDaSemana(dataEmBrasilia(c.inicio)) === semana && !lista.some((r) => r.id === c.id),
          )
          const todos = [...lista.map((r) => ({ r, cancelado: false })), ...cancelados.map((r) => ({ r, cancelado: true }))].sort(
            (a, b) => Date.parse(b.r.inicio) - Date.parse(a.r.inicio),
          )
          return (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {todos.map(({ r, cancelado }) => (
                <ItemRegistro
                  key={r.id}
                  registro={r}
                  cancelado={cancelado}
                  bloqueado={passouDoPrazo(r)}
                  onEditar={() => {
                    setEditando(r)
                    setFormAberto(true)
                  }}
                  onCancelar={() => setCancelando(r)}
                />
              ))}
            </ul>
          )
        }}
      </Carregavel>

      <p className="text-center text-xs text-muted-foreground">
        Você pode editar ou cancelar um registro até 7 dias depois de criá-lo. Depois disso, só o RH.
      </p>

      <FormRegistro aberto={formAberto} onAbertoChange={setFormAberto} editando={editando} onSalvar={salvar} />

      <ConfirmDialog
        aberto={cancelando !== null}
        onAbertoChange={(a) => !a && setCancelando(null)}
        titulo="Cancelar este registro?"
        descricao="Ele deixa de contar na meta. O registro não é apagado: fica no histórico como cancelado."
        confirmar="Cancelar registro"
        perigoso
        onConfirmar={async () => {
          if (!cancelando) return
          try {
            await cancelarRegistro(cancelando.id)
            setCanceladosAgora((c) => [...c, cancelando])
            toast.success('Registro cancelado')
            setVersao((v) => v + 1)
          } catch (e) {
            toast.error((e as Error).message)
          }
        }}
      />
    </>
  )
}

export default RegistrosMembro
