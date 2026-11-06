import { useState } from 'react'
import { entrarComGoogle } from '../compartilhado/api/auth.ts'
import EtchedAccretion from './EtchedAccretion.tsx'
import LogoInfinito from './LogoInfinito.tsx'

const CORES = {
  glowColor: '#a855f7',
  diskColor: '#7c3aed',
  streakColor: '#e9d5ff',
  crimson: 0.3,
}
const SEGURAR_MS = 2000
const SAIDA_MS = 1000

type Fase = 'intro' | 'saindo' | 'login'

function TelaLogin() {
  const [fase, setFase] = useState<Fase>('intro')
  const [segurando, setSegurando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function terminarIntro() {
    if (fase !== 'intro') return
    setFase('saindo')
    setTimeout(() => setFase('login'), SAIDA_MS)
  }

  function entrar() {
    setErro(null)
    entrarComGoogle().catch((e: Error) => setErro(e.message))
  }

  if (fase !== 'login') {
    const saindo = fase === 'saindo'
    return (
      <div className="relative w-full overflow-hidden bg-black">
        <div
          style={{
            transform: saindo ? 'scale(1.12)' : 'scale(1)',
            transition: 'transform 1.2s ease-in',
          }}
        >
          <EtchedAccretion params={CORES}>
            <div
              className="flex h-full touch-none select-none flex-col items-center justify-end p-6 pb-14 text-center text-white sm:p-10 sm:pb-16"
              style={{ opacity: saindo ? 0 : 1, transition: 'opacity 0.5s ease' }}
              onPointerDown={() => setSegurando(true)}
              onPointerUp={() => setSegurando(false)}
              onPointerLeave={() => setSegurando(false)}
              onPointerCancel={() => setSegurando(false)}
            >
              <h1 className="text-4xl font-light leading-[1.05] tracking-tight sm:text-6xl">
                Astro<span className="italic text-[#a855f7]">Clock</span>
              </h1>
              <p className="mt-3 text-white/65">o ponto digital da EJUVV</p>
              <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.3em] text-white/60">
                segure para entrar
              </p>
              <div className="mt-3 h-0.5 w-48 bg-white/15">
                <div
                  className="h-0.5 bg-[#a855f7]"
                  style={{
                    width: segurando ? '100%' : '0%',
                    transition: segurando ? `width ${SEGURAR_MS}ms linear` : 'width 0.4s ease-out',
                  }}
                  onTransitionEnd={(e) => {
                    if (segurando && e.propertyName === 'width') terminarIntro()
                  }}
                />
              </div>
            </div>
            <div
              className="pointer-events-none absolute inset-0 bg-black"
              style={{ opacity: saindo ? 1 : 0, transition: `opacity ${SAIDA_MS}ms ease-in-out` }}
            />
          </EtchedAccretion>
        </div>
      </div>
    )
  }

  return (
    <main
      className="flex min-h-svh flex-col items-center justify-between bg-[#05040a] px-7 py-12 text-center text-white"
      style={{ animation: 'entrar 1s ease-out' }}
    >
      <style>{`@keyframes entrar { from { opacity: 0; } to { opacity: 1; } }`}</style>

      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-purple-300/80">
        EJUVV · controle de horas
      </p>

      <div className="w-full max-w-sm">
        <LogoInfinito className="mx-auto -mb-4 w-full max-w-md" />
        <h1 className="text-5xl font-light tracking-tight">
          Astro<span className="italic text-[#a855f7]">Clock</span>
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-white/65">
          Registre suas horas na EJUVV e acompanhe a meta da semana.
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <button
          type="button"
          onClick={entrar}
          className="min-h-14 rounded-2xl bg-[#f3e8ff] font-semibold text-[#1a1033] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a855f7]"
        >
          Entrar com Google
        </button>
        {erro && (
          <p role="alert" className="text-center text-sm text-[#FFB4B4]">
            {erro}
          </p>
        )}
        <p className="text-center text-sm text-white/65">Use sua conta @ejuvv.com. Sem senha nova.</p>
      </div>
    </main>
  )
}

export default TelaLogin