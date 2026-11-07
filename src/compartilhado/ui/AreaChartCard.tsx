import { useId, type ReactNode } from 'react'
import { Area, AreaChart, CartesianGrid, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/compartilhado/ui/shadcn/card'

export interface PontoArea {
  rotulo: string
  valor: number
  comparacao?: number
}

// Rótulo em pílula roxa sobre o ponto destacado (como o "+ 7h45" das referências).
function PilulaDestaque({ viewBox, texto }: { viewBox?: { x?: number; y?: number }; texto: string }) {
  const x = viewBox?.x ?? 0
  const y = viewBox?.y ?? 0
  const largura = texto.length * 7.2 + 20
  return (
    <g>
      <rect x={x - largura / 2} y={y - 40} width={largura} height={26} rx={13} fill="var(--primary)" />
      <text x={x} y={y - 23} textAnchor="middle" fill="var(--primary-foreground)" fontSize={12} fontWeight={700}>
        {texto}
      </text>
    </g>
  )
}

// Linha de área com curva suave, degradê roxo e série tracejada de comparação.
export function AreaChartCard({
  titulo,
  descricao,
  acao,
  dados,
  formatar,
  rotuloSerie,
  rotuloComparacao,
  destaque,
  dominio,
  altura = 240,
}: {
  titulo: string
  descricao?: string
  acao?: ReactNode
  dados: PontoArea[]
  formatar: (v: number) => string
  rotuloSerie: string
  rotuloComparacao?: string
  destaque?: number
  dominio?: [number, number]
  altura?: number
}) {
  const idGradiente = useId().replace(/:/g, '')
  const temComparacao = dados.some((d) => d.comparacao !== undefined)
  const pontoDestaque = destaque !== undefined ? dados[destaque] : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{titulo}</CardTitle>
        {descricao && <CardDescription>{descricao}</CardDescription>}
        {acao && <CardAction>{acao}</CardAction>}
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-primary" />
            {rotuloSerie}
          </span>
          {temComparacao && rotuloComparacao && (
            <span className="flex items-center gap-1.5">
              <span className="h-0 w-4 border-t-2 border-dashed border-muted-foreground" />
              {rotuloComparacao}
            </span>
          )}
        </div>
        <div style={{ height: altura }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dados} margin={{ top: 44, right: 12, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id={idGradiente} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 6" />
              <XAxis
                dataKey="rotulo"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                dy={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                tickFormatter={formatar}
                domain={dominio ?? ['auto', 'auto']}
                width={52}
              />
              <Tooltip
                cursor={{ stroke: 'var(--primary)', strokeDasharray: '4 4' }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="rounded-2xl border bg-popover px-3 py-2 text-xs shadow-lg">
                      <p className="mb-1 font-semibold">{label}</p>
                      {payload.map((p) => (
                        <p key={String(p.dataKey)} className="text-muted-foreground">
                          {p.dataKey === 'valor' ? rotuloSerie : rotuloComparacao}:{' '}
                          <span className="font-semibold text-foreground">{formatar(Number(p.value))}</span>
                        </p>
                      ))}
                    </div>
                  ) : null
                }
              />
              {temComparacao && (
                <Area
                  type="monotone"
                  dataKey="comparacao"
                  stroke="var(--muted-foreground)"
                  strokeWidth={2}
                  strokeDasharray="6 6"
                  fill="none"
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
              )}
              <Area
                type="monotone"
                dataKey="valor"
                stroke="var(--primary)"
                strokeWidth={3}
                fill={`url(#${idGradiente})`}
                isAnimationActive={false}
                dot={false}
                activeDot={{ r: 6, fill: 'var(--card)', stroke: 'var(--primary)', strokeWidth: 3 }}
              />
              {pontoDestaque && (
                <ReferenceDot
                  x={pontoDestaque.rotulo}
                  y={pontoDestaque.valor}
                  r={6}
                  fill="var(--card)"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  label={(props: { viewBox?: { x?: number; y?: number } }) => (
                    <PilulaDestaque viewBox={props.viewBox} texto={formatar(pontoDestaque.valor)} />
                  )}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
