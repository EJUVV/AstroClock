import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowDownRightIcon, ArrowUpRightIcon } from 'lucide-react'
import { Card, CardAction, CardContent, CardDescription, CardHeader } from '@/compartilhado/ui/shadcn/card'
import { StatusPill } from '@/compartilhado/ui/StatusPill'

export interface LinhaKpi {
  icone: LucideIcon
  texto: ReactNode
}

// Cartão de KPI no estilo FinSet: título, número grande, variação e linhas de apoio.
export function KpiCard({
  titulo,
  valor,
  variacao,
  comparacao,
  linhas,
  acao,
}: {
  titulo: string
  valor: ReactNode
  variacao?: { texto: string; positiva: boolean }
  comparacao?: string
  linhas?: LinhaKpi[]
  acao?: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="font-medium">{titulo}</CardDescription>
        {acao && <CardAction>{acao}</CardAction>}
      </CardHeader>
      <CardContent className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-3xl font-bold tracking-tight">{valor}</span>
            {variacao && (
              <StatusPill tom={variacao.positiva ? 'sucesso' : 'perigo'}>
                {variacao.positiva ? <ArrowUpRightIcon /> : <ArrowDownRightIcon />}
                {variacao.texto}
              </StatusPill>
            )}
          </div>
          {comparacao && <p className="text-xs text-muted-foreground">{comparacao}</p>}
        </div>
        {linhas && linhas.length > 0 && (
          <ul className="flex flex-col gap-2">
            {linhas.map(({ icone: Icone, texto }, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex size-7 items-center justify-center rounded-[12px] bg-secondary text-secondary-foreground">
                  <Icone className="size-3.5" />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
