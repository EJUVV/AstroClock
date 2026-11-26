import { useEffect, useId, useState, type ReactNode } from 'react'
import { ArrowDownRightIcon, ArrowUpRightIcon } from 'lucide-react'
import type { LinhaKpi } from '@/compartilhado/ui/KpiCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/compartilhado/ui/shadcn/card'
import { StatusPill } from '@/compartilhado/ui/StatusPill'
import { cn } from '@/compartilhado/ui/utils'

export interface PontoPico {
  rotulo: string
  valor: number
}

// Movimento reduzido no celular: tudo parado (sem desenhar a linha, sem contar o número, sem pulsar).
function movimentoReduzido(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// O número principal sobe contando uma vez, ao aparecer.
function useContagem(alvo: number, duracaoMs = 900): number {
  const reduzir = movimentoReduzido()
  const [valor, setValor] = useState(0)
  useEffect(() => {
    if (reduzir) return
    let quadro = 0
    const inicio = performance.now()
    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / duracaoMs)
      setValor(alvo * (1 - (1 - t) ** 3)) // desacelera no fim
      if (t < 1) quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [alvo, duracaoMs, reduzir])
  return reduzir ? alvo : valor
}

// Curva suave passando por todos os pontos (Catmull-Rom convertido em curvas de Bézier).
function caminho(xy: [number, number][]): string {
  if (xy.length === 0) return '' // série ainda carregando
  if (xy.length === 1) return `M${xy[0][0]},${xy[0][1]}`
  let d = `M${xy[0][0]},${xy[0][1]}`
  for (let i = 0; i < xy.length - 1; i++) {
    const [x0, y0] = xy[Math.max(0, i - 1)]
    const [x1, y1] = xy[i]
    const [x2, y2] = xy[i + 1]
    const [x3, y3] = xy[Math.min(xy.length - 1, i + 2)]
    const c1 = [x1 + (x2 - x0) / 6, y1 + (y2 - y0) / 6]
    const c2 = [x2 - (x3 - x1) / 6, y2 - (y3 - y1) / 6]
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${x2},${y2}`
  }
  return d
}

const LARGURA = 300
const ALTURA = 110
const FOLGA = 12 // espaço em cima para o ponto do pico não encostar na borda

// Cartão no estilo do "Peak Chart" (21st.dev, Louis Studios): número grande embaixo e, em cima, a linha
// com o ponto pulsante no pico. Feito à mão, sem biblioteca de gráfico: o brilho é um degradê fixo
// (nada de desfoque, que ficava refazendo a cada quadro por cima do fundo animado).
export function CartaoPico({
  titulo,
  descricao,
  valor,
  formatar,
  legenda,
  pontos,
  formatarPonto,
  dominioMaximo,
  variacao,
  linhas,
}: {
  titulo: string
  descricao?: string
  valor: number
  formatar: (v: number) => string
  legenda: ReactNode
  pontos: PontoPico[]
  formatarPonto: (v: number) => string
  // Topo fixo da escala (ex.: 100 para porcentagem). Sem ele, o topo é o maior ponto.
  dominioMaximo?: number
  // Mesmos extras do KpiCard: pílula de variação e linhas de apoio.
  variacao?: { texto: string; positiva: boolean }
  linhas?: LinhaKpi[]
}) {
  const contado = useContagem(valor)
  const [ativo, setAtivo] = useState<number | null>(null)
  const reduzir = movimentoReduzido()
  const idArea = `pico-area-${useId().replace(/:/g, '')}`

  const maior = Math.max(dominioMaximo ?? 0, ...pontos.map((p) => p.valor), 0.0001)
  const xy: [number, number][] = pontos.map((p, i) => [
    pontos.length === 1 ? LARGURA / 2 : (i / (pontos.length - 1)) * LARGURA,
    FOLGA + (1 - p.valor / maior) * (ALTURA - FOLGA),
  ])
  const iPico = pontos.reduce((melhor, p, i) => (p.valor > pontos[melhor].valor ? i : melhor), 0)
  const linha = caminho(xy)
  const area = xy.length > 1 ? `${linha} L${LARGURA},${ALTURA} L0,${ALTURA} Z` : ''
  const pct = (x: number, total: number) => `${(x / total) * 100}%`
  const destaque = ativo ?? iPico

  return (
    <Card
      className="relative overflow-hidden"
      style={{
        backgroundImage:
          'radial-gradient(120% 70% at 50% 115%, color-mix(in oklab, var(--primary) 38%, transparent), transparent 70%)',
      }}
    >
      <CardHeader>
        <CardTitle className="text-base font-medium text-muted-foreground">{titulo}</CardTitle>
        {descricao && <CardDescription>{descricao}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {pontos.length > 0 && (
          <div className="relative" style={{ height: ALTURA }} onMouseLeave={() => setAtivo(null)}>
            {/* A linha aparece da esquerda para a direita uma vez (revelação por recorte: o traço com
                pathLength não funciona junto com a espessura fixa no Chrome). */}
            <svg
              viewBox={`0 0 ${LARGURA} ${ALTURA}`}
              preserveAspectRatio="none"
              className={cn('absolute inset-0 size-full overflow-visible', !reduzir && 'animate-[pico-revela_1.2s_ease-out_both]')}
              aria-hidden="true"
            >
              <defs>
                <linearGradient id={idArea} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="var(--primary)" stopOpacity="0.28" />
                  <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {area && <path d={area} fill={`url(#${idArea})`} />}
              <path
                d={linha}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* Linha-guia e balão do ponto em destaque (o pico, ou o ponto sob o mouse) */}
            <div className="pointer-events-none absolute inset-y-0 w-px bg-primary/25" style={{ left: pct(xy[destaque][0], LARGURA) }} />
            {/* Nas pontas, o balão encosta para dentro em vez de ficar cortado pela borda do cartão. */}
            <span
              className={cn(
                'pointer-events-none absolute z-10 -translate-y-full rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-background shadow-md',
                xy[destaque][0] < LARGURA * 0.2 ? 'translate-x-0' : xy[destaque][0] > LARGURA * 0.8 ? '-translate-x-full' : '-translate-x-1/2',
              )}
              style={{ left: pct(xy[destaque][0], LARGURA), top: `calc(${pct(xy[destaque][1], ALTURA)} - 10px)` }}
            >
              {pontos[destaque].rotulo} · {formatarPonto(pontos[destaque].valor)}
            </span>

            {/* Ponto do pico, pulsando */}
            <span
              className="pointer-events-none absolute size-3 -translate-1/2 rounded-full bg-primary shadow-[0_0_12px_var(--primary)] ring-2 ring-card"
              style={{ left: pct(xy[iPico][0], LARGURA), top: pct(xy[iPico][1], ALTURA) }}
            >
              {!reduzir && <span className="absolute inset-0 animate-ping rounded-full bg-primary/60" />}
            </span>
            {ativo !== null && ativo !== iPico && (
              <span
                className="pointer-events-none absolute size-2.5 -translate-1/2 rounded-full bg-primary ring-2 ring-card"
                style={{ left: pct(xy[ativo][0], LARGURA), top: pct(xy[ativo][1], ALTURA) }}
              />
            )}

            {/* Áreas de toque, uma por ponto (maiores que o ponto) */}
            <div className="absolute inset-0 flex">
              {pontos.map((p, i) => (
                <button
                  key={p.rotulo}
                  type="button"
                  className="h-full flex-1 cursor-default outline-none focus-visible:bg-primary/10"
                  aria-label={`${p.rotulo}: ${formatarPonto(p.valor)}`}
                  onMouseEnter={() => setAtivo(i)}
                  onFocus={() => setAtivo(i)}
                  onBlur={() => setAtivo(null)}
                />
              ))}
            </div>
          </div>
        )}

        {pontos.length > 1 && (
          <div className="-mt-2 flex justify-between text-[10px] text-muted-foreground" aria-hidden="true">
            <span>{pontos[0].rotulo}</span>
            <span>{pontos[pontos.length - 1].rotulo}</span>
          </div>
        )}

        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-[44px] leading-none font-bold tracking-tight tabular-nums">{formatar(contado)}</p>
          {variacao && (
            <StatusPill tom={variacao.positiva ? 'sucesso' : 'perigo'} className="mt-1">
              {variacao.positiva ? <ArrowUpRightIcon /> : <ArrowDownRightIcon />}
              {variacao.texto}
            </StatusPill>
          )}
          <div className="text-sm text-muted-foreground">{legenda}</div>
        </div>

        {linhas && linhas.length > 0 && (
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 border-t pt-4">
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
