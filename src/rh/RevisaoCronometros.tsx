import { useState } from 'react'
import { CheckIcon, TimerIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { listarMembros } from '@/compartilhado/api/membros'
import { cronometrosEmRevisao, revisarCronometro } from '@/compartilhado/api/rh'
import { dataEmBrasilia, diaSemanaMes, duracaoEmHoras, horaDe } from '@/compartilhado/datas'
import type { Registro } from '@/compartilhado/tipos'
import { AvatarMembro } from '@/compartilhado/ui/AvatarMembro'
import { ConfirmDialog } from '@/compartilhado/ui/ConfirmDialog'
import { Carregavel, useCarregar } from '@/compartilhado/ui/demo'
import { Horas } from '@/compartilhado/ui/Horas'
import { Button } from '@/compartilhado/ui/shadcn/button'
import { Card, CardContent } from '@/compartilhado/ui/shadcn/card'
import { Skeleton } from '@/compartilhado/ui/shadcn/skeleton'
import { StatusPill } from '@/compartilhado/ui/StatusPill'

function RevisaoCronometros() {
  const [versao, setVersao] = useState(0)
  const carga = useCarregar(() => Promise.all([cronometrosEmRevisao(), listarMembros()]), [versao])
  const [reprovando, setReprovando] = useState<Registro | null>(null)

  async function aprovar(r: Registro) {
    try {
      await revisarCronometro(r.id, true)
      toast.success('Cronômetro aprovado', { description: 'As horas passam a contar na meta.' })
      setVersao((v) => v + 1)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <>
      <p className="text-sm text-muted-foreground">
        <strong className="text-foreground">Aprovar</strong> quando o trabalho foi feito de verdade (passa a
        contar na meta). <strong className="text-foreground">Reprovar</strong> cancela o registro.
      </p>
      <Carregavel
        carga={carga}
        esqueleto={<Skeleton className="h-48 rounded-[24px]" />}
        vazio={{ titulo: 'Nenhum cronômetro para revisar', descricao: 'Quando um cronômetro parar sozinho após 10h, ele aparece aqui.' }}
        ehVazio={([lista]) => lista.length === 0}
      >
        {([lista, membros]) => {
          const porId = new Map(membros.map((m) => [m.id, m]))
          return (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {lista.map((r) => {
                const membro = porId.get(r.membroId)
                return (
                  <Card key={r.id}>
                    <CardContent className="flex flex-col gap-4">
                      <div className="flex items-start gap-3">
                        <AvatarMembro nome={membro?.nome ?? '?'} className="size-11" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{membro?.nome}</p>
                          <p className="text-xs text-muted-foreground">{membro?.setor}</p>
                        </div>
                        <StatusPill tom="alerta">
                          <TimerIcon /> Parou sozinho após 10h
                        </StatusPill>
                      </div>
                      <div className="grid grid-cols-3 gap-3 rounded-[20px] bg-muted p-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Dia</p>
                          <p className="font-semibold">{diaSemanaMes(dataEmBrasilia(r.inicio))}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Início – fim</p>
                          <p className="font-semibold">
                            {horaDe(r.inicio)} – {r.fim ? horaDe(r.fim) : '–'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Duração</p>
                          <Horas valor={duracaoEmHoras(r.inicio, r.fim)} />
                        </div>
                        <div className="col-span-3">
                          <p className="text-xs text-muted-foreground">Descrição</p>
                          <p>{r.descricao}</p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="destructive" onClick={() => setReprovando(r)}>
                          <XIcon data-icon="inline-start" /> Reprovar
                        </Button>
                        <Button onClick={() => void aprovar(r)}>
                          <CheckIcon data-icon="inline-start" /> Aprovar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )
        }}
      </Carregavel>

      <ConfirmDialog
        aberto={reprovando !== null}
        onAbertoChange={(a) => !a && setReprovando(null)}
        titulo="Reprovar este cronômetro?"
        descricao="O registro é cancelado e não conta na meta. Ele não é apagado: fica no histórico."
        confirmar="Reprovar"
        perigoso
        onConfirmar={async () => {
          if (!reprovando) return
          await revisarCronometro(reprovando.id, false)
          toast.success('Cronômetro reprovado')
          setVersao((v) => v + 1)
        }}
      />
    </>
  )
}

export default RevisaoCronometros
