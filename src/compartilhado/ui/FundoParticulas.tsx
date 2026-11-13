import { useEffect, useRef } from 'react'
import { useFundoAnimado } from '@/compartilhado/ui/preferencias'

// Fundo de estrelas que descem devagar, riscos de luz que sobem e linhas que
// ligam as estrelas perto do mouse. Fica atrás de todas as páginas.
interface Estrela { x: number; y: number; vy: number; r: number }
interface Raio { x: number; y: number; comp: number; vel: number; alfa: number }

function desenharEstrela(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x, y - r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.quadraticCurveTo(x, y, x, y + r)
  ctx.quadraticCurveTo(x, y, x - r, y)
  ctx.quadraticCurveTo(x, y, x, y - r)
  ctx.fill()
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
      const dpr = window.devicePixelRatio || 1
      canvas!.width = w * dpr
      canvas!.height = h * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      iniciar()
    }

    const aoMover = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    window.addEventListener('resize', redimensionar)
    window.addEventListener('mousemove', aoMover)
    redimensionar()

    let quadro = 0
    function desenhar() {
      const escuro = document.documentElement.classList.contains('dark')
      // Roxo claro no tema escuro, roxo mais forte no claro para aparecer no fundo lavanda.
      const roxo = escuro ? '192, 132, 252' : '109, 40, 217'
      const neutro = escuro ? '216, 180, 254' : '91, 63, 217'
      ctx!.clearRect(0, 0, w, h)

      for (const b of raios) {
        if (!reduzir) b.y -= b.vel
        if (b.y + b.comp < 0) {
          b.y = h + 100
          b.x = Math.random() * w
        }
        const g = ctx!.createLinearGradient(b.x, b.y, b.x, b.y + b.comp)
        g.addColorStop(0, `rgba(${roxo}, ${b.alfa * (escuro ? 1 : 0.6)})`)
        g.addColorStop(1, `rgba(${roxo}, 0)`)
        ctx!.strokeStyle = g
        ctx!.lineWidth = 1.5
        ctx!.beginPath()
        ctx!.moveTo(b.x, b.y)
        ctx!.lineTo(b.x, b.y + b.comp)
        ctx!.stroke()
      }

      ctx!.lineWidth = 0.5
      for (let i = 0; i < estrelas.length; i++) {
        for (let j = i + 1; j < estrelas.length; j++) {
          const d = Math.hypot(estrelas[i].x - estrelas[j].x, estrelas[i].y - estrelas[j].y)
          if (d < 120) {
            ctx!.strokeStyle = `rgba(${neutro}, ${0.18 * (1 - d / 120)})`
            ctx!.beginPath()
            ctx!.moveTo(estrelas[i].x, estrelas[i].y)
            ctx!.lineTo(estrelas[j].x, estrelas[j].y)
            ctx!.stroke()
          }
        }
      }

      for (const e of estrelas) {
        if (!reduzir) e.y += e.vy
        if (e.y > h + 20) {
          e.y = -20
          e.x = Math.random() * w
        }
        const dist = Math.hypot(mouse.x - e.x, mouse.y - e.y)
        if (dist < 180) {
          ctx!.strokeStyle = `rgba(${roxo}, ${0.6 * (1 - dist / 180)})`
          ctx!.lineWidth = 0.8
          ctx!.beginPath()
          ctx!.moveTo(e.x, e.y)
          ctx!.lineTo(mouse.x, mouse.y)
          ctx!.stroke()
        }
        ctx!.fillStyle = dist < 180 ? `rgb(${roxo})` : `rgba(${neutro}, ${escuro ? 0.5 : 0.45})`
        desenharEstrela(ctx!, e.x, e.y, dist < 180 ? e.r + 1.5 : e.r)
      }
      quadro = requestAnimationFrame(desenhar)
    }
    desenhar()

    return () => {
      cancelAnimationFrame(quadro)
      window.removeEventListener('resize', redimensionar)
      window.removeEventListener('mousemove', aoMover)
    }
  }, [ligado])

  if (!ligado) return null
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 size-full" />
}
