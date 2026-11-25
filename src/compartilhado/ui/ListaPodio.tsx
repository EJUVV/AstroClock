import { formatarHoras } from '@/compartilhado/datas'
import type { LinhaPodio } from '@/compartilhado/tipos'
import { AvatarMembro } from '@/compartilhado/ui/AvatarMembro'
import { cn } from '@/compartilhado/ui/utils'

// Ouro, prata e bronze (as mesmas cores do pódio do ranking do RH).
const CORES_POSICAO = ['bg-[#FDE68A] text-[#92400E]', 'bg-[#E5E7EB] text-[#374151]', 'bg-[#FED7AA] text-[#9A3412]']

// Pódio do mês: só nome, setor e horas. Com empate, as posições se repetem (1º, 2º, 2º, 4º).
export function ListaPodio({ linhas, destaqueId }: { linhas: LinhaPodio[]; destaqueId?: string }) {
  if (linhas.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Ainda não há horas registradas neste mês.</p>
  }
  return (
    <ol className="flex flex-col gap-2">
      {linhas.map((l) => (
        <li
          key={l.membroId}
          className={cn(
            'flex items-center gap-3 rounded-2xl border bg-card px-3 py-2.5',
            l.membroId === destaqueId && 'border-primary bg-secondary',
          )}
        >
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-[10px] text-sm font-bold',
              CORES_POSICAO[l.posicao - 1] ?? 'bg-muted text-muted-foreground',
            )}
          >
            {l.posicao}º
          </span>
          <AvatarMembro nome={l.nome} className="size-8" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {l.nome}
              {l.membroId === destaqueId && <span className="font-normal text-muted-foreground"> (você)</span>}
            </p>
            <p className="truncate text-xs text-muted-foreground">{l.setor}</p>
          </div>
          <span className="shrink-0 text-sm font-bold tabular-nums">{formatarHoras(l.horasTotal)}</span>
        </li>
      ))}
    </ol>
  )
}
