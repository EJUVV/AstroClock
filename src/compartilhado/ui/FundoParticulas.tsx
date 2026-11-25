import { useEffect, useRef } from 'react'
import { useFundoAnimado } from '@/compartilhado/ui/preferencias'

// Fundo de estrelas que descem devagar, riscos de luz que sobem e linhas que
// ligam as estrelas perto do mouse. Fica atrás de todas as páginas.
//
// Ele roda o tempo todo, então precisa ser leve para não travar cliques e animações:
// - redesenha a ~30 quadros por segundo (o movimento é lento, a diferença não aparece);
// - resolução limitada a 1,5x em telas de alta densidade;
// - as linhas entre estrelas saem em poucos traços (agrupadas por transparência), não uma por uma.
interface Estrela { x: number; y: number; vy: number; r: number }
interface Raio { x: number; y: number; comp: number; vel: number; alfa: number }

const INTERVALO_MS = 1000 / 30
const DPR_MAXIMO = 1.5
const DISTANCIA_LINHA = 120
const DISTANCIA_MOUSE = 180
const FAIXAS_DE_ALFA = 4 // linhas entre estrelas agrupadas em 4 níveis de transparência

function desenharEstrela(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.moveTo(x, y - r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.quadraticCurveTo(x, y, x, y + r)
  ctx.quadraticCurveTo(x, y, x - r, y)
  ctx.quadraticCurveTo(x, y, x, y - r)
}

export function FundoParticulas() {
  const ref = useRef<HTMLCanvasElement>(null)
  const ligado = useFundoAnimado()

  useEffect(() => {
    if (!ligado) return
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let w = 0
    let h = 0
    let estrelas: Estrela[] = []
    let raios: Raio[] = []
    const mouse = { x: -1000, y: -1000 }

    function iniciar() {
      estrelas = Array.from({ length: 90 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vy: Math.random() * 0.4 + 0.1,
        r: Math.random() * 2.5 + 2,
      }))
      raios = Array.from({ length: 18 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        comp: Math.random() * 100 + 50,
        vel: Math.random() * 3 + 1.5,
        alfa: Math.random() * 0.4 + 0.2,
      }))
    }

    function redimensionar() {
      w = window.innerWidth
      h = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAXIMO)
      canvas!.width = w * dpr
      canvas!.height = h * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      iniciar()
      if (reduzir) desenhar(0) // movimento reduzido: um quadro parado, redesenhado só quando a tela muda
    }

    const aoMover = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    window.addEventListener('resize', redimensionar)
    window.addEventListener('mousemove', aoMover, { passive: true })
    redimensionar()

    // passo = quantos quadros de 60 fps se passaram, para a velocidade continuar a mesma a 30 fps.
    function desenhar(passo: number) {
      const escuro = document.documentElement.classList.contains('dark')
      // Roxo claro no tema escuro, roxo mais forte no claro para aparecer no fundo lavanda.
      const roxo = escuro ? '192, 132, 252' : '109, 40, 217'
      const neutro = escuro ? '216, 180, 254' : '91, 63, 217'
      ctx!.clearRect(0, 0, w, h)

      ctx!.lineWidth = 1.5
      for (const b of raios) {
        if (!reduzir) b.y -= b.vel * passo
        if (b.y + b.comp < 0) {
          b.y = h + 100
          b.x = Math.random() * w
        }
        const g = ctx!.createLinearGradient(b.x, b.y, b.x, b.y + b.comp)
        g.addColorStop(0, `rgba(${roxo}, ${b.alfa * (escuro ? 1 : 0.6)})`)
        g.addColorStop(1, `rgba(${roxo}, 0)`)
        ctx!.strokeStyle = g
        ctx!.beginPath()
        ctx!.moveTo(b.x, b.y)
        ctx!.lineTo(b.x, b.y + b.comp)
        ctx!.stroke()
      }

      // Linhas entre estrelas próximas: um traço por faixa de transparência.
      const faixas: number[][] = Array.from({ length: FAIXAS_DE_ALFA }, () => [])
      for (let i = 0; i < estrelas.length; i++) {
        const a = estrelas[i]
        for (let j = i + 1; j < estrelas.length; j++) {
          const b = estrelas[j]
          const dx = a.x - b.x
          if (dx > DISTANCIA_LINHA || dx < -DISTANCIA_LINHA) continue
          const dy = a.y - b.y
          if (dy > DISTANCIA_LINHA || dy < -DISTANCIA_LINHA) continue
          const d = Math.hypot(dx, dy)
          if (d >= DISTANCIA_LINHA) continue
          const faixa = Math.min(FAIXAS_DE_ALFA - 1, Math.floor((d / DISTANCIA_LINHA) * FAIXAS_DE_ALFA))
          faixas[faixa].push(a.x, a.y, b.x, b.y)
        }
      }
      ctx!.lineWidth = 0.5
      faixas.forEach((pontos, faixa) => {
        if (pontos.length === 0) return
        const alfa = 0.18 * (1 - (faixa + 0.5) / FAIXAS_DE_ALFA)
        ctx!.strokeStyle = `rgba(${neutro}, ${alfa})`
        ctx!.beginPath()
        for (let k = 0; k < pontos.length; k += 4) {
          ctx!.moveTo(pontos[k], pontos[k + 1])
          ctx!.lineTo(pontos[k + 2], pontos[k + 3])
        }
        ctx!.stroke()
      })

      // Estrelas: as longe do mouse saem todas num só preenchimento; as perto, destacadas.
      ctx!.fillStyle = `rgba(${neutro}, ${escuro ? 0.5 : 0.45})`
      ctx!.beginPath()
      const perto: Estrela[] = []
      for (const e of estrelas) {
        if (!reduzir) e.y += e.vy * passo
        if (e.y > h + 20) {
          e.y = -20
          e.x = Math.random() * w
        }
        const dx = mouse.x - e.x
        const dy = mouse.y - e.y
        if (dx * dx + dy * dy < DISTANCIA_MOUSE * DISTANCIA_MOUSE) perto.push(e)
        else desenharEstrela(ctx!, e.x, e.y, e.r)
      }
      ctx!.fill()

      for (const e of perto) {
        const dist = Math.hypot(mouse.x - e.x, mouse.y - e.y)
        ctx!.strokeStyle = `rgba(${roxo}, ${0.6 * (1 - dist / DISTANCIA_MOUSE)})`
        ctx!.lineWidth = 0.8
        ctx!.beginPath()
        ctx!.moveTo(e.x, e.y)
        ctx!.lineTo(mouse.x, mouse.y)
        ctx!.stroke()
      }
      if (perto.length > 0) {
        ctx!.fillStyle = `rgb(${roxo})`
        ctx!.beginPath()
        for (const e of perto) desenharEstrela(ctx!, e.x, e.y, e.r + 1.5)
        ctx!.fill()
      }
    }

    let quadro = 0
    let ultimo = 0
    let estavaPausado = false
    // Com uma janela aberta (gaveta, diálogo, confirmação) o fundo fica coberto: pausa e deixa a janela fluida.
    const janelaAberta = () => document.querySelector('[data-slot$="-overlay"][data-state="open"]') !== null

    function animar(agora: number) {
      quadro = requestAnimationFrame(animar)
      if (agora - ultimo < INTERVALO_MS) return
      const pausado = janelaAberta()
      const passo = ultimo && !estavaPausado ? Math.min((agora - ultimo) / (1000 / 60), 4) : 1 // ao voltar, sem salto
      ultimo = agora
      estavaPausado = pausado
      if (pausado) return
      desenhar(passo)
    }

    if (!reduzir) quadro = requestAnimationFrame(animar)

    return () => {
      cancelAnimationFrame(quadro)
      window.removeEventListener('resize', redimensionar)
      window.removeEventListener('mousemove', aoMover)
    }
  }, [ligado])

  if (!ligado) return null
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 size-full" />
}
