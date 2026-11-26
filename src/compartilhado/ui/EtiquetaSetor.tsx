import { corDoSetor } from '@/compartilhado/ui/coresSetor'
import { cn } from '@/compartilhado/ui/utils'

// Nome do setor com a bolinha da cor dele. O texto fica na cor normal do texto; quem leva a cor é a bolinha.
export function EtiquetaSetor({ setor, pilula = false, className }: { setor: string; pilula?: boolean; className?: string }) {
  const cor = corDoSetor(setor)
  return (
    <span
      className={cn(
        'inline-flex min-w-0 items-center gap-1.5',
        pilula && 'h-6 shrink-0 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap',
        className,
      )}
      style={pilula ? { backgroundColor: `${cor}1f` } : undefined}
    >
      <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: cor }} />
      <span className="truncate">{setor}</span>
    </span>
  )
}
