import { formatarHoras } from '@/compartilhado/datas'
import { cn } from '@/compartilhado/ui/utils'

export interface BarraDia {
  rotulo: string
  sede: number
  online: number
  ativo?: boolean
  // Balão de explicação sobre a barra (estilo "Exceeded by 20%").
  balao?: string
  // Fora da meta: a barra ganha hachura diagonal.
  hachura?: boolean
}

// Barras em cápsula, com sede (roxo forte) embaixo e online (lilás) em cima.
export function CapsuleBarChart({ dias, altura = 180 }: { dias: BarraDia[]; altura?: number }) {
  const maior = Math.max(4, ...dias.map((d) => d.sede + d.online))
  const escala = Math.ceil(maior / 2) * 2

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex items-end justify-between gap-2" style={{ height: altura }}>
        {dias.map((d) => {
          const total = d.sede + d.online
          const alturaBarra = total === 0 ? 8 : Math.max(14, (total / escala) * (altura - 36))
          return (
            <div key={d.rotulo} className="relative flex flex-1 flex-col items-center justify-end">
              {d.balao && (
                <span className="absolute z-10 rounded-full bg-foreground px-2 py-1 text-[10px] font-semibold whitespace-nowrap text-background shadow-md" style={{ bottom: alturaBarra + 8 }}>
                  {d.balao}
                </span>
              )}
              <div
                className={cn(
                  'relative flex w-full max-w-10 flex-col-reverse overflow-hidden rounded-full bg-muted',
                  d.ativo && 'ring-2 ring-primary ring-offset-2 ring-offset-card',
                )}
                style={{ height: alturaBarra }}
                title={`${d.rotulo}: ${formatarHoras(d.sede)} na sede, ${formatarHoras(d.online)} online`}
              >
                {total > 0 && (
                  <>
                    <div className="bg-sede" style={{ height: `${(d.sede / total) * 100}%` }} />
                    <div className="bg-online" style={{ height: `${(d.online / total) * 100}%` }} />
                  </>
                )}
                {d.hachura && <div className="hachura absolute inset-0 text-card/70" />}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between gap-2">
        {dias.map((d) => (
          <div key={d.rotulo} className="flex flex-1 flex-col items-center gap-0.5">
            <span className={cn('text-xs text-muted-foreground', d.ativo && 'font-semibold text-primary')}>{d.rotulo}</span>
            <span className="text-[11px] font-semibold tabular-nums">{d.sede + d.online > 0 ? formatarHoras(d.sede + d.online) : '–'}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-sede" /> Sede
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-online" /> Online
        </span>
      </div>
    </div>
  )
}
