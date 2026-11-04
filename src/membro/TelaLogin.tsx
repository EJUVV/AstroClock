import { useState } from 'react'
import { entrarComGoogle } from '../compartilhado/api/auth.ts'

function TelaLogin() {
  const [erro, setErro] = useState<string | null>(null)

  function entrar() {
    setErro(null)
    entrarComGoogle().catch((e: Error) => setErro(e.message))
  }

  return (
    <main className="flex min-h-screen flex-col justify-between bg-[#0F1B33] px-7 py-8 text-white">
      <div className="flex flex-1 flex-col justify-center gap-5">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" role="img" aria-label="AstroClock">
          <circle cx="32" cy="32" r="26" stroke="#F5B12E" strokeWidth="5" />
          <path d="M32 18v15l9 6" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
          <circle cx="52" cy="12" r="4" fill="#F5B12E" />
        </svg>
        <h1 className="text-4xl font-bold tracking-tight">AstroClock</h1>
        <p className="max-w-xs text-lg leading-relaxed text-[#C9D2E8]">
          Registre suas horas na EJUVV e acompanhe a meta da semana.
        </p>
      </div>
      <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
        <button
          type="button"
          onClick={entrar}
          className="min-h-13 rounded-xl bg-white font-semibold text-[#0F1B33] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5B12E]"
        >
          Entrar com Google
        </button>
        {erro && (
          <p role="alert" className="text-center text-sm text-[#FFB4B4]">
            {erro}
          </p>
        )}
        <p className="text-center text-sm text-[#C9D2E8]">Use sua conta @ejuvv.com. Sem senha nova.</p>
      </div>
    </main>
  )
}

export default TelaLogin