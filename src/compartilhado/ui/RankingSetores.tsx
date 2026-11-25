import { formatarHoras } from '@/compartilhado/datas'
import type { LinhaRankingSetor } from '@/compartilhado/tipos'
import { CapsuleBarChart } from '@/compartilhado/ui/CapsuleBarChart'
import { cn } from '@/compartilhado/ui/utils'

// Ranking dos setores pela média de horas por membro no mês: gráfico e lista.
// Usado no painel do membro e no ranking do RH.
export function RankingSetores({ linhas, meuSetor }: { linhas: LinhaRankingSetor[]; meuSetor?: string }) {
  if (linhas.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Ainda não há horas registradas neste mês.</p>
  }
  return (
    <div className="flex flex-col gap-6">
      <CapsuleBarChart
        dias={linhas.map((l) => ({
          rotulo: l.setor,
          sede: l.mediaSede,
          online: Math.max(0, l.mediaTotal - l.mediaSede),
          ativo: l.setor === meuSetor,
        }))}
      />
      <ol className="flex flex-col gap-2">
        {linhas.map((l) => (
          <li
            key={l.setor}
            className={cn(
              'flex items-center gap-3 rounded-2xl border bg-card px-3 py-2.5',
              l.setor === meuSetor && 'border-primary bg-secondary',
            )}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-muted text-sm font-bold">{l.posicao}º</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {l.setor}
                {l.setor === meuSetor && <span className="font-normal text-muted-foreground"> (seu setor)</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                {l.membrosContados} {l.membrosContados === 1 ? 'membro' : 'membros'} · {formatarHoras(l.mediaSede)} na sede, em média
              </p>
            </div>
            <span className="shrink-0 text-right">
              <span className="block text-sm font-bold tabular-nums">{formatarHoras(l.mediaTotal)}</span>
              <span className="block text-[10px] text-muted-foreground">por membro</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
