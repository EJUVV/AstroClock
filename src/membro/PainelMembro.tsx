import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { meuNome, sair } from '../compartilhado/api/auth.ts'

// EXEMPLO: dados fixos só para o protótipo. Na semana 3 vêm de progressoDaSemana(), etc.
const SEMANA = { rotulo: '2 a 8 nov', horasSede: 3, metaSede: 5, horasTotal: 7, metaTotal: 10 }
const TEMPO = [
  { nome: 'Dia', pct: 58 },
  { nome: 'Semana', pct: 36 },
  { nome: 'Mês', pct: 10 },
  { nome: 'Ano', pct: 84 },
]
const HORAS_DIA = [
  { dia: 'S', h: 4 },
  { dia: 'T', h: 3 },
  { dia: 'Q', h: 0 },
  { dia: 'Q', h: 0 },
  { dia: 'S', h: 0 },
  { dia: 'S', h: 0 },
  { dia: 'D', h: 0 },
]
const REGISTROS = [
  { id: 1, quando: 'Sede, 09:00 às 12:00', texto: 'Revisão do projeto' },
  { id: 2, quando: 'Online, 14:00 às 18:00', texto: 'Estudo e documentação' },
]
const SEMANAS = [
  { id: 1, rotulo: '2 a 8 nov', estado: 'andamento' },
  { id: 2, rotulo: '9 a 15 nov', estado: 'futura' },
  { id: 3, rotulo: '16 a 22 nov', estado: 'futura' },
  { id: 4, rotulo: '23 a 29 nov', estado: 'futura' },
  { id: 5, rotulo: '30 nov a 6 dez', estado: 'futura' },
]
const HISTORICO = [
  { id: 1, rotulo: '26 out a 1 nov', detalhe: 'Sede 6h · Total 11h', estado: 'cumpriu' },
  { id: 2, rotulo: '19 a 25 out', detalhe: 'Sede 2h · Total 8h', estado: 'abaixo' },
  { id: 3, rotulo: '12 a 18 out', detalhe: 'Ausência total aprovada', estado: 'dispensada' },
  { id: 4, rotulo: '5 a 11 out', detalhe: 'Sede 5h · Total 10h', estado: 'cumpriu' },
] as const

const ETIQUETA: Record<string, { texto: string; classe: string }> = {
  andamento: { texto: 'Em andamento', classe: 'bg-amber-300/15 text-amber-200' },
  futura: { texto: 'Futura', classe: 'bg-white/10 text-white/70' },
  cumpriu: { texto: 'Cumpriu', classe: 'bg-emerald-400/15 text-emerald-200' },
  abaixo: { texto: 'Abaixo da meta', classe: 'bg-rose-400/15 text-rose-200' },
  dispensada: { texto: 'Dispensada', classe: 'bg-white/10 text-white/70' },
}

const ESTRELAS = Array.from({ length: 60 }, (_, i) => ({
  x: (i * 37 + 11) % 100,
  y: (i * 53 + 7) % 100,
  r: 1 + (i % 3) * 0.7,
  d: 2.5 + (i % 5),
  t: (i * 0.37) % 4,
}))

const botaoBase =
  'min-h-12 rounded-xl border px-4 font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c084fc]'
const botao = `${botaoBase} border-white/25 text-white hover:bg-white/10`
const botaoMarcado = `${botaoBase} border-[#f3e8ff] bg-[#f3e8ff] text-[#1a1033]`
const botaoVerde = `${botaoBase} border-emerald-300 bg-emerald-400/15 text-white`
const botaoPrincipal =
  'min-h-12 rounded-xl bg-[#6d28d9] px-4 font-semibold text-white transition hover:bg-[#7c3aed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c084fc]'

function formatar(segundos: number) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(Math.floor(segundos / 3600))}:${p(Math.floor((segundos % 3600) / 60))}:${p(segundos % 60)}`
}

function Etiqueta({ tipo }: { tipo: string }) {
  const e = ETIQUETA[tipo]
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${e.classe}`}>{e.texto}</span>
}

function Barra({ rotulo, valor, meta }: { rotulo: string; valor: number; meta: number }) {
  const pct = meta === 0 ? 100 : Math.min(100, Math.round((valor / meta) * 100))
  return (
    <div>
      <div className="mb-2 flex justify-between">
        <b className="font-semibold">{rotulo}</b>
        <span className="font-mono text-sm text-white/70">
          {valor}h / {meta}h
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#d8b4fe] shadow-[0_0_14px_rgba(168,85,247,0.8)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

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
    <section
      className={`flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/[0.04] p-4 backdrop-blur-sm ${className}`}
    >
      <h2 className="text-base font-semibold">{titulo}</h2>
      {children}
    </section>
  )
}

function Planeta({ tamanho, className = '' }: { tamanho: number; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none relative shrink-0 ${className}`}
      style={{ width: tamanho, height: tamanho }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle at 30% 28%, #f3e8ff, #8b5cf6 38%, #2e1065 78%, #0b0420)',
          boxShadow: '0 0 40px rgba(168,85,247,0.55)',
        }}
      />
      <div
        className="absolute rounded-[50%] border-2 border-[#d8b4fe]/60"
        style={{ left: '-45%', right: '-45%', top: '38%', height: '26%', transform: 'rotate(-16deg)' }}
      />
    </div>
  )
}

function PainelMembro() {
  const [nome, setNome] = useState('')
  const [local, setLocal] = useState<'sede' | 'online'>('sede')
  const [ativo, setAtivo] = useState(false)
  const [segundos, setSegundos] = useState(0)
  const [naSede, setNaSede] = useState(false)

  useEffect(() => {
    meuNome()
      .then(setNome)
      .catch(() => setNome(''))
  }, [])

  useEffect(() => {
    if (!ativo) return
    const id = setInterval(() => setSegundos((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [ativo])

  function alternarCronometro() {
    if (ativo) setSegundos(0)
    setAtivo(!ativo)
  }

  const faltaSede = Math.max(0, SEMANA.metaSede - SEMANA.horasSede)
  const faltaTotal = Math.max(0, SEMANA.metaTotal - SEMANA.horasTotal)
  const cumpriu = faltaSede === 0 && faltaTotal === 0

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05040a] text-white">
      <style>{`
        @keyframes pisca { 0%, 100% { opacity: .15 } 50% { opacity: .95 } }
        @keyframes pulsa { from { opacity: .55 } to { opacity: 1 } }
        .estrela { animation: pisca var(--d) ease-in-out infinite; }
        .arco { animation: pulsa 4s ease-in-out infinite alternate; }
        @media (prefers-reduced-motion: reduce) { .estrela, .arco { animation: none; } }
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
          className="arco absolute left-1/2 top-32 h-[420px] w-[170%] max-w-[1500px] -translate-x-1/2"
          style={{
            borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
            boxShadow:
              'inset 0 4px 14px 1px rgba(243,232,255,0.95), inset 0 26px 70px 8px rgba(168,85,247,0.8), 0 -8px 90px 8px rgba(124,58,237,0.55)',
            WebkitMaskImage: 'linear-gradient(#000 35%, transparent 92%)',
            maskImage: 'linear-gradient(#000 35%, transparent 92%)',
          }}
        />
      </div>

      <main className="relative mx-auto flex max-w-5xl flex-col gap-4 px-5 pb-16 pt-6">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-purple-300">
              AstroClock · EJUVV
            </p>
            <p className="mt-6 text-sm text-white/70">Bem-vindo</p>
            <h1 className="text-3xl font-light tracking-tight sm:text-4xl">
              Olá, <span className="italic text-[#c084fc]">{nome || 'membro'}</span>
            </h1>
          </div>
          <div className="flex items-start gap-10">
            <Planeta tamanho={80} className="hidden md:block" />
            <button type="button" onClick={() => void sair()} className={`${botao} min-h-11`}>
              Sair
            </button>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <Cartao titulo={`Semana de ${SEMANA.rotulo}`} className="md:col-span-2">
            <span
              className={`self-start rounded-full px-2.5 py-1 text-xs font-semibold ${cumpriu ? ETIQUETA.cumpriu.classe : ETIQUETA.andamento.classe}`}
            >
              {cumpriu ? 'Meta cumprida' : 'Ainda não cumpriu'}
            </span>
            <div className="grid gap-4 md:grid-cols-2">
              <Barra rotulo="Horas na sede" valor={SEMANA.horasSede} meta={SEMANA.metaSede} />
              <Barra rotulo="Horas totais" valor={SEMANA.horasTotal} meta={SEMANA.metaTotal} />
            </div>
            <p className="text-sm text-white/70">
              Horas online não compensam as da sede.
              {!cumpriu && ` Faltam ${faltaSede}h na sede e ${faltaTotal}h no total.`}
            </p>
          </Cartao>

          <section className="flex flex-col gap-3 rounded-2xl border border-[#c084fc]/50 bg-gradient-to-br from-[#5b21b6] to-[#2e0f8f] p-4 shadow-[0_0_40px_rgba(124,58,237,0.35)]">
            <h2 className="text-base font-semibold">Cronômetro</h2>
            <p
              className={`text-center font-mono text-5xl font-light tabular-nums ${ativo ? 'text-white' : 'text-white/80'}`}
              role="timer"
              aria-live="off"
            >
              {formatar(segundos)}
            </p>
            <div className="flex gap-2">
              {(['sede', 'online'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={local === l}
                  onClick={() => setLocal(l)}
                  className={`${local === l ? botaoMarcado : botao} flex-1 capitalize`}
                >
                  {l}
                </button>
              ))}
            </div>
            <input
              aria-label="Descrição"
              placeholder="O que você vai fazer?"
              className="min-h-12 rounded-xl border border-white/25 bg-black/25 px-3 text-white placeholder:text-white/60 focus-visible:outline-2 focus-visible:outline-[#c084fc]"
            />
            <button
              type="button"
              onClick={alternarCronometro}
              className={`min-h-12 rounded-xl font-semibold ${ativo ? 'bg-rose-500 text-white' : 'bg-[#f3e8ff] text-[#1a1033]'}`}
            >
              {ativo ? 'Parar' : 'Iniciar'}
            </button>
            <p className="text-sm text-white/75">Não registre reuniões e eventos.</p>
          </section>

          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <button type="button" className={`${botaoPrincipal} flex-1`}>
                + Registrar horas
              </button>
              <button
                type="button"
                aria-pressed={naSede}
                onClick={() => setNaSede(!naSede)}
                className={`${naSede ? botaoVerde : botao} flex-1`}
              >
                {naSede ? 'Saí da sede' : 'Estou na sede'}
              </button>
            </div>
            <p className="-mt-2 text-sm text-white/70">Na sede agora: Ana, Bruno, Carla (exemplo)</p>

            <Cartao titulo="Tempo que já passou">
              {TEMPO.map((t) => (
                <div key={t.nome} className="flex items-center gap-3">
                  <span className="w-16 text-sm">{t.nome}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-[#a78bfa]" style={{ width: `${t.pct}%` }} />
                  </div>
                  <span className="w-10 text-right font-mono text-xs text-white/70">{t.pct}%</span>
                </div>
              ))}
            </Cartao>
          </div>

          <Cartao titulo="Horas por dia">
            <div className="flex h-28 items-end gap-2">
              {HORAS_DIA.map((d, i) => (
                <div
                  key={i}
                  title={`${d.h}h`}
                  className={`flex-1 rounded-t-md ${d.h ? 'bg-gradient-to-t from-[#6d28d9] to-[#d8b4fe]' : 'bg-white/15'}`}
                  style={{ height: `${Math.max(4, d.h * 22)}%` }}
                />
              ))}
            </div>
            <div className="flex gap-2 text-xs text-white/70">
              {HORAS_DIA.map((d, i) => (
                <span key={i} className="flex-1 text-center">
                  {d.dia}
                </span>
              ))}
            </div>
          </Cartao>

          <Cartao titulo="Registros da semana">
            {REGISTROS.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2">
                <div>
                  <b className="font-semibold">{r.quando}</b>
                  <p className="text-sm text-white/70">{r.texto}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className={`${botao} min-h-11`}>
                    Editar
                  </button>
                  <button type="button" className={`${botao} min-h-11`}>
                    Cancelar
                  </button>
                </div>
              </div>
            ))}
          </Cartao>

          <Cartao titulo="Resumo de novembro (exemplo)">
            <div className="flex gap-2.5">
              {[
                ['7h', 'Total no mês'],
                ['3h', 'Na sede'],
                ['0 de 1', 'Semanas cumpridas'],
              ].map(([v, l]) => (
                <div key={l} className="flex-1">
                  <p className="text-3xl font-light">{v}</p>
                  <p className="text-xs text-white/70">{l}</p>
                </div>
              ))}
            </div>
          </Cartao>

          <Cartao titulo="Ranking de novembro">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-lg">
                  <span className="font-semibold text-[#d8b4fe]">12º</span> de 40 na EJ
                </p>
                <p className="text-lg">
                  <span className="font-semibold text-[#d8b4fe]">3º</span> de 6 no seu setor
                </p>
                <p className="mt-1 text-sm text-white/70">Você vê só a sua posição.</p>
              </div>
              <Planeta tamanho={64} />
            </div>
          </Cartao>

          <Cartao
            titulo="Semanas de novembro"
            className="border-[#8b5cf6]/40 bg-[#2a0f78]/60 md:col-span-2"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {SEMANAS.map((s) => (
                <div
                  key={s.id}
                  className={`flex flex-col gap-2 rounded-xl border p-3 ${s.estado === 'andamento' ? 'border-2 border-amber-300' : 'border-white/25'}`}
                >
                  <span className="font-mono text-xl text-white/60">{String(s.id).padStart(2, '0')}</span>
                  <b className="font-semibold">{s.rotulo}</b>
                  <span className="self-start">
                    <Etiqueta tipo={s.estado} />
                  </span>
                </div>
              ))}
            </div>
          </Cartao>

          <Cartao titulo="Histórico (exemplo)" className="md:col-span-2">
            {HISTORICO.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between gap-2 border-t border-white/10 pt-3 first:border-t-0 first:pt-0"
              >
                <div>
                  <b className="font-semibold">{h.rotulo}</b>
                  <p className="text-sm text-white/70">{h.detalhe}</p>
                </div>
                <Etiqueta tipo={h.estado} />
              </div>
            ))}
          </Cartao>

          <button type="button" className={`${botao} md:col-span-2`}>
            Pedir ausência (requerimento)
          </button>
        </div>
      </main>
    </div>
  )
}

export default PainelMembro