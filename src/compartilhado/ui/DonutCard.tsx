import type { ReactNode } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/compartilhado/ui/shadcn/card'

export interface FatiaDonut {
  nome: string
  valor: number
  cor: string
}

// Donut grosso com segmentos arredondados e espaçados, valor no centro e legenda com bolinhas.
export function DonutCard({
  titulo,
  descricao,
  acao,
  fatias,
  valorCentro,
  rotuloCentro,
}: {
  titulo: string
  descricao?: string
  acao?: ReactNode
  fatias: FatiaDonut[]
  valorCentro: ReactNode
  rotuloCentro: string
}) {
  const comValor = fatias.filter((f) => f.valor > 0)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{titulo}</CardTitle>
        {descricao && <CardDescription>{descricao}</CardDescription>}
        {acao && <CardAction>{acao}</CardAction>}
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-5">
        <div className="relative size-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={comValor}
                dataKey="valor"
                nameKey="nome"
                innerRadius="68%"
                outerRadius="100%"
                paddingAngle={4}
                cornerRadius={10}
                stroke="none"
                startAngle={90}
                endAngle={-270}
                isAnimationActive={false}
              >
                {comValor.map((f) => (
                  <Cell key={f.nome} fill={f.cor} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold tracking-tight">{valorCentro}</span>
            <span className="text-xs text-muted-foreground">{rotuloCentro}</span>
          </div>
        </div>
        <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          {fatias.map((f) => (
            <li key={f.nome} className="flex items-center gap-2 text-sm">
              <span className="size-2.5 rounded-full" style={{ background: f.cor }} />
              <span className="text-muted-foreground">{f.nome}</span>
              <span className="font-semibold">{f.valor}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
