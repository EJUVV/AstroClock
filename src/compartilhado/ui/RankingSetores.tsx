import { formatarHoras } from '@/compartilhado/datas'
import type { LinhaRankingSetor } from '@/compartilhado/tipos'
import { corDoSetor } from '@/compartilhado/ui/coresSetor'
import { cn } from '@/compartilhado/ui/utils'

// Ranking dos setores pela média de horas por membro no mês, em barras horizontais ordenadas
// (uma por setor, na cor dele, todas começando do zero): dá para comparar setores com médias próximas.
// Usado no painel do membro e no ranking do RH.
export function RankingSetores({ linhas, meuSetor }: { linhas: LinhaRankingSetor[]; meuSetor?: string }) {
  if (linhas.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Ainda não há horas registradas neste mês.</p>
  }
  const maior = Math.max(...linhas.map((l) => l.mediaTotal), 0.01)
  return (
    <ol className="flex flex-col gap-2" aria-label="Ranking dos setores: média de horas por membro no mês">
      {linhas.map((l) => {
        const cor = corDoSetor(l.setor)
        const meu = l.setor === meuSetor
        const largura = l.mediaTotal > 0 ? Math.max(2, (l.mediaTotal / maior) * 100) : 0
        return (
          <li
            key={l.setor}
            className={cn('flex items-center gap-3 rounded-2xl border bg-card px-3 py-3', meu && 'border-primary bg-secondary')}
            title={`${l.setor}: ${formatarHoras(l.mediaTotal)} por membro, ${formatarHoras(l.mediaSede)} na sede, em média`}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-muted text-sm font-bold">{l.posicao}º</span>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="flex min-w-0 items-center gap-1.5 text-sm font-semibold">
                  <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: cor }} />
                  <span className="truncate">{l.setor}</span>
                </p>
                <span className="shrink-0 text-sm font-bold tabular-nums">{formatarHoras(l.mediaTotal)}</span>
              </div>
              {/* Trilho cinza = 100% do maior setor; a barra começa sempre do zero. */}
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ width: `${largura}%`, backgroundColor: cor }} />
              </div>
              <p className="text-xs text-muted-foreground">
                {meu && <span className="font-semibold text-foreground">Seu setor · </span>}
                {l.membrosContados} {l.membrosContados === 1 ? 'membro' : 'membros'} · {formatarHoras(l.mediaSede)} na sede, em média
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
