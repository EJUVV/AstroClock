import { useState, type CSSProperties, type ReactNode } from 'react'
import { sair } from '../compartilhado/api/auth.ts'

// EXEMPLO: dados fixos só para o protótipo. Na semana 3 vêm de percentualDaSemana(), abaixoDaMeta(), etc.
const INDICADORES = [
  { rotulo: 'Cumpriram a meta', valor: '78%', alerta: false, barra: 78 },
  { rotulo: 'Abaixo da meta', valor: '14', alerta: false, barra: 0 },
  { rotulo: 'Abaixo 2+ semanas seguidas', valor: '3', alerta: true, barra: 0 },
  { rotulo: 'Cronômetros em revisão', valor: '2', alerta: false, barra: 0 },
  { rotulo: 'Requerimentos pendentes', valor: '4', alerta: false, barra: 0 },
]
const ABAIXO = [
  { id: 1, nome: 'Nome Sobrenome A', detalhe: 'Sede 2h/5h · Total 6h/10h', etiqueta: '3 semanas seguidas', grave: true },
  { id: 2, nome: 'Nome Sobrenome B', detalhe: 'Sede 5h/5h · Total 8h/10h', etiqueta: 'Falta total', grave: false },
  { id: 3, nome: 'Nome Sobrenome C', detalhe: 'Sede 1h/5h · Total 10h/10h', etiqueta: '2 semanas seguidas', grave: true },
  { id: 4, nome: 'Nome Sobrenome D', detalhe: 'Sede 0h/5h · Total 4h/10h', etiqueta: 'Ainda não cumpriu', grave: false },
]
const REQUERIMENTOS = [
  { id: 1, nome: 'Nome E', detalhe: 'Só remoto · 9 a 13 nov' },
  { id: 2, nome: 'Nome F', detalhe: 'Ausência total · 16 a 27 nov' },
]
const RANKING = [
  { nome: 'Nome G', horas: 42 },
  { nome: 'Nome H', horas: 39 },
  { nome: 'Nome I', horas: 37 },
]

const ESTRELAS = Array.from({ length: 40 }, (_, i) => ({
  x: (i * 37 + 11) % 100,
  y: (i * 53 + 7) % 100,
  r: 1 + (i % 3) * 0.6,
  d: 3 + (i % 5),
  t: (i * 0.37) % 4,
}))

const botaoBase =
  'min-h-12 rounded-xl border px-4 font-semibold text-white transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c084fc]'
const botao = `${botaoBase} border-white/25 hover:bg-white/10`
const botaoPrincipal = `${botaoBase} border-[#6d28d9] bg-[#6d28d9] hover:bg-[#7c3aed]`

function Cartao({
  titulo,
  children,
  className = '',
}: {
  titulo: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-2xl border border-white/15 bg-white/[0.04] p-5 backdrop-blur-sm ${className}`}>
      <h2 className="mb-3 text-base font-semibold">{titulo}</h2>
      {children}
    </section>
  )
}

function PainelRH() {
  // Só visual por enquanto: marca o requerimento como respondido na tela.
  const [respostas, setRespostas] = useState<Record<number, 'aprovado' | 'reprovado'>>({})

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05040a] text-white">
      <style>{`
        @keyframes pisca { 0%, 100% { opacity: .15 } 50% { opacity: .9 } }
        .estrela { animation: pisca var(--d) ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .estrela { animation: none; } }
      `}</style>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {ESTRELAS.map((e, i) => (
          <span
            key={i}
            className="estrela absolute rounded-full bg-[#f5f3ff]"
            style={
              {
                left: `${e.x}%`,
                top: `${e.y}%`,
                width: e.r,
                height: e.r,
                animationDelay: `-${e.t}s`,
                '--d': `${e.d}s`,
              } as CSSProperties
            }
          />
        ))}
        <div
          className="absolute -right-40 -top-56 size-[620px] rounded-full"
          style={{ background: 'radial-gradient(closest-side, rgba(124,58,237,0.45), transparent)' }}
        />
      </div>

      <main className="relative mx-auto flex max-w-6xl flex-col gap-5 px-5 py-8 sm:px-7">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-purple-300">
              Painel do RH · AstroClock
            </p>
            <h1 className="mt-2 text-3xl font-light tracking-tight sm:text-4xl">
              Semana de <span className="italic text-[#c084fc]">2 a 8 nov</span>
            </h1>
          </div>
          <div className="flex gap-2">
            <button type="button" className={botaoPrincipal}>
              + Cadastrar membro
            </button>
            <button type="button" onClick={() => void sair()} className={botao}>
              Sair
            </button>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {INDICADORES.map((i) => (
            <div
              key={i.rotulo}
              className={`flex flex-col justify-between gap-2 rounded-2xl border p-4 backdrop-blur-sm ${i.alerta ? 'border-rose-400/70 bg-rose-400/10' : 'border-white/15 bg-white/[0.04]'}`}
            >
              <p className="text-sm text-white/75">{i.rotulo}</p>
              <p className={`text-4xl font-light ${i.alerta ? 'text-rose-300' : ''}`}>{i.valor}</p>
              {i.barra > 0 && (
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#d8b4fe]"
                    style={{ width: `${i.barra}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </section>

        <div className="grid gap-4 lg:grid-cols-3">
          <Cartao titulo="Quem ficou abaixo da meta (dados de exemplo)" className="lg:col-span-2">
            {ABAIXO.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 border-t border-white/10 py-3"
              >
                <div>
                  <b className="font-semibold">{m.nome}</b>
                  <p className="text-sm text-white/70">{m.detalhe}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${m.grave ? 'bg-rose-400/15 text-rose-200' : 'bg-amber-300/15 text-amber-200'}`}
                >
                  {m.etiqueta}
                </span>
              </div>
            ))}
          </Cartao>

          <div className="flex flex-col gap-4">
            <Cartao titulo="Requerimentos">
              {REQUERIMENTOS.map((r) => {
                const resposta = respostas[r.id]
                return (
                  <div key={r.id} className="border-t border-white/10 py-3">
                    <b className="font-semibold">{r.nome}</b>
                    <p className="mb-2 text-sm text-white/70">{r.detalhe}</p>
                    {resposta ? (
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${resposta === 'aprovado' ? 'bg-emerald-400/15 text-emerald-200' : 'bg-rose-400/15 text-rose-200'}`}
                      >
                        {resposta === 'aprovado' ? 'Aprovado' : 'Reprovado'}
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setRespostas({ ...respostas, [r.id]: 'aprovado' })}
                          className={`${botaoPrincipal} min-h-11 flex-1`}
                        >
                          Aprovar
                        </button>
                        <button
                          type="button"
                          onClick={() => setRespostas({ ...respostas, [r.id]: 'reprovado' })}
                          className={`${botao} min-h-11 flex-1`}
                        >
                          Reprovar
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </Cartao>

            <Cartao titulo="Ranking do mês">
              {RANKING.map((r, i) => (
                <div key={r.nome} className="flex items-center gap-3 py-1.5">
                  <span className="w-5 font-mono text-[#d8b4fe]">{i + 1}</span>
                  <span className="flex-1">{r.nome}</span>
                  <span className="font-mono text-sm text-white/75">{r.horas}h</span>
                </div>
              ))}
            </Cartao>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PainelRH