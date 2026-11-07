import { formatarHoras } from '@/compartilhado/datas'
import { Horas } from '@/compartilhado/ui/Horas'
import { cn } from '@/compartilhado/ui/utils'

// Barra "Sede x/5h" ou "Total x/10h". Com meta 0, a exigência não vale na semana.
export function MetaBar({
  rotulo,
  valor,
  meta,
  cor,
  textoSemMeta = 'Não exigida nesta semana',
}: {
  rotulo: string
  valor: number
  meta: number
  cor: 'sede' | 'total'
  textoSemMeta?: string
}) {
  const semMeta = meta === 0
  const pct = semMeta ? 0 : Math.min(100, (valor / meta) * 100)
  const bateu = !semMeta && valor >= meta
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span className={cn('size-2.5 rounded-full', cor === 'sede' ? 'bg-sede' : 'bg-roxo-escuro')} />
          {rotulo}
        </span>
        <span className="text-sm text-muted-foreground">
          <Horas valor={valor} className="text-lg text-foreground" />
          {!semMeta && <span> / {formatarHoras(meta)}</span>}
        </span>
      </div>
      <div
        className="relative h-3 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={rotulo}
        aria-valuemin={0}
        aria-valuemax={meta}
        aria-valuenow={valor}
      >
        {semMeta ? (
          <div className="hachura absolute inset-0 text-muted-foreground/40" />
        ) : (
          <div
            className={cn(
              'h-full rounded-full transition-[width]',
              cor === 'sede' ? 'bg-sede' : 'bg-roxo-escuro',
              bateu && 'bg-sucesso',
            )}
            style={{ width: `${Math.max(pct, valor > 0 ? 4 : 0)}%` }}
          />
        )}
      </div>
      {semMeta && <span className="text-xs text-muted-foreground">{textoSemMeta}</span>}
    </div>
  )
}
