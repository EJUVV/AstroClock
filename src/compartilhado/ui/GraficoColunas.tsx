import { formatarHoras } from '@/compartilhado/datas'
import { cn } from '@/compartilhado/ui/utils'

export interface BarraDia {
  rotulo: string
  sede: number
  online: number
  ativo?: boolean
  // Balão curto sobre a coluna (ex.: "Hoje", "−2h sede").
  balao?: string
  // Fora da meta: a coluna ganha hachura diagonal.
  hachura?: boolean
}

// Escala "redonda" a partir do zero, com 2 a 4 linhas de grade (0h, 2h, 4h...): sem ela, colunas de 8h e 10h
// pareciam iguais. O topo sempre tem pelo menos 1h.
function escala(maior: number): { topo: number; marcas: number[] } {
  const alvo = Math.max(maior, 1)
  const passo = [1, 2, 4, 5, 10, 20, 25, 50, 100].find((p) => alvo / p <= 4) ?? 100
  const topo = Math.ceil(alvo / passo) * passo
  return { topo, marcas: Array.from({ length: topo / passo + 1 }, (_, i) => i * passo) }
}

// Colunas finas, sede (roxo forte) embaixo e online (lilás) em cima, crescendo de uma linha de base no zero.
// Só HTML e CSS: nada de biblioteca de gráfico no painel do membro, que roda no celular.
export function GraficoColunas({ dias, altura = 180 }: { dias: BarraDia[]; altura?: number }) {
  const { topo, marcas } = escala(Math.max(0, ...dias.map((d) => d.sede + d.online)))
  const pct = (h: number) => (h / topo) * 100

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {/* Escala em horas */}
        <div className="relative w-7 shrink-0" style={{ height: altura }} aria-hidden="true">
          {marcas.map((m) => (
            <span
              key={m}
              className="absolute right-0 translate-y-1/2 text-[10px] leading-none text-muted-foreground tabular-nums"
              style={{ bottom: `${pct(m)}%` }}
            >
              {m}h
            </span>
          ))}
        </div>

        <div className="relative flex-1" style={{ height: altura }}>
          {/* Linhas de grade: a do zero é a linha de base */}
          {marcas.map((m) => (
            <div
              key={m}
              aria-hidden="true"
              className={cn('absolute inset-x-0 border-t', m === 0 ? 'border-border' : 'border-dashed border-border/60')}
              style={{ bottom: `${pct(m)}%` }}
            />
          ))}

          <div className="absolute inset-0 flex items-end gap-1">
            {dias.map((d) => {
              const total = d.sede + d.online
              const titulo = `${d.rotulo}: ${formatarHoras(total)} (${formatarHoras(d.sede)} na sede, ${formatarHoras(d.online)} online)`
              return (
                <div key={d.rotulo} className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-end" title={titulo}>
                  <span className="sr-only">{titulo}</span>
                  {d.balao && (
                    <span
                      className="absolute z-10 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-background shadow-md"
                      style={{ bottom: `calc(${pct(total)}% + 6px)` }}
                    >
                      {d.balao}
                    </span>
                  )}
                  {total > 0 && (
                    // 2px entre sede e online; ponta arredondada em cima, reta na base.
                    <div
                      className="relative flex w-full max-w-6 flex-col-reverse gap-0.5 overflow-hidden rounded-t-[4px]"
                      style={{ height: `max(${pct(total)}%, 3px)` }}
                    >
                      {d.sede > 0 && <div className="bg-sede" style={{ flex: `${d.sede} 1 0` }} />}
                      {d.online > 0 && <div className="bg-online" style={{ flex: `${d.online} 1 0` }} />}
                      {d.hachura && <div className="hachura absolute inset-0 text-card/70" />}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Rótulos embaixo, alinhados com as colunas (o espaço à esquerda é o da escala) */}
      <div className="flex gap-2" aria-hidden="true">
        <div className="w-7 shrink-0" />
        <div className="flex flex-1 gap-1">
          {dias.map((d) => (
            <div key={d.rotulo} className="flex min-w-0 flex-1 flex-col items-center gap-0.5 text-center">
              <span className={cn('text-[10px] leading-tight text-muted-foreground sm:text-xs', d.ativo && 'font-semibold text-primary')}>
                {d.rotulo}
              </span>
              <span className="text-[10px] font-semibold tabular-nums sm:text-[11px]">
                {d.sede + d.online > 0 ? formatarHoras(d.sede + d.online) : '–'}
              </span>
            </div>
          ))}
        </div>
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
