import { useEffect, useState } from 'react'
import { ClockIcon, MapPinIcon, TrophyIcon } from 'lucide-react'
import { entrarComGoogle } from '@/compartilhado/api/auth'
import LogoInfinito from '@/compartilhado/ui/LogoInfinito'
import { Button } from '@/compartilhado/ui/shadcn/button'
import { SeletorTema } from '@/compartilhado/ui/tema'
import { BotaoInstalarApp } from '@/compartilhado/ui/instalarApp'

function IconeGoogle() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7H2.1a11 11 0 0 0 0 9.9l3.7-2.8Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7l3.7 2.9C6.7 7.3 9.1 5.4 12 5.4Z" />
    </svg>
  )
}

const DESTAQUES = [
  { icone: ClockIcon, texto: 'Cronômetro ou lançamento manual' },
  { icone: MapPinIcon, texto: 'Veja quem está na sede agora' },
  { icone: TrophyIcon, texto: 'Acompanhe sua meta da semana' },
]

function TelaLogin() {
  const [erro, setErro] = useState<string | null>(null)
  const [entrando, setEntrando] = useState(false)

  // Ao voltar do Google pelo botão "voltar", o navegador restaura a página como estava,
  // com o botão travado em "Entrando...". Destrava quando a página volta assim.
  useEffect(() => {
    function aoVoltar(e: PageTransitionEvent) {
      if (e.persisted) setEntrando(false)
    }
    window.addEventListener('pageshow', aoVoltar)
    return () => window.removeEventListener('pageshow', aoVoltar)
  }, [])

  function entrar() {
    setErro(null)
    setEntrando(true)
    entrarComGoogle().catch((e: Error) => {
      setErro(e.message)
      setEntrando(false)
    })
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center p-4">
      <SeletorTema className="absolute top-4 right-4" />
      <div className="grid w-full max-w-4xl min-w-0 overflow-hidden rounded-[32px] border bg-card shadow-[0_8px_40px_rgb(91_63_217/0.08)] md:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-8 p-8 sm:p-10">
          <LogoInfinito className="mx-auto -mt-10 -mb-12 w-full max-w-[320px]" />
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Suas horas na EJ, sem complicação.</h1>
            <p className="text-muted-foreground">Registre o que você fez, acompanhe a meta da semana e veja quem está na sede.</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button size="lg" variant="outline" className="w-full" onClick={entrar} disabled={entrando}>
              <IconeGoogle />
              {entrando ? 'Entrando...' : 'Entrar com Google'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Use sua conta <span className="font-semibold text-foreground">@ejuvv.com</span>
            </p>
            {erro && <p className="text-center text-sm text-perigo">{erro}</p>}
            <BotaoInstalarApp className="self-center" />
          </div>
        </section>
        <section className="cartao-roxo relative hidden flex-col justify-end gap-4 overflow-hidden p-10 md:flex">
          <div className="absolute -top-16 -right-16 size-64 rounded-full border-[28px] border-white/10" />
          <div className="absolute top-24 right-20 size-6 rounded-full bg-white/30" />
          <p className="text-sm font-medium text-white/70">EJUVV · Controle de horas</p>
          <ul className="flex flex-col gap-3">
            {DESTAQUES.map(({ icone: Icone, texto }) => (
              <li key={texto} className="flex items-center gap-3 rounded-2xl bg-white/12 px-4 py-3 text-sm font-medium backdrop-blur">
                <span className="flex size-8 items-center justify-center rounded-[12px] bg-white/20">
                  <Icone className="size-4" />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}

export default TelaLogin
