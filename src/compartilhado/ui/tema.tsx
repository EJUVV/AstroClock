import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { MoonIcon, SunIcon } from 'lucide-react'
import { cn } from '@/compartilhado/ui/utils'

export type Tema = 'claro' | 'escuro'

const ContextoTema = createContext<{ tema: Tema; trocar: (tema: Tema) => void }>({
  tema: 'escuro',
  trocar: () => {},
})

function temaInicial(): Tema {
  try {
    const salvo = localStorage.getItem('tema')
    if (salvo === 'claro' || salvo === 'escuro') return salvo
  } catch {
    // Sem localStorage: usa o padrão.
  }
  return 'escuro' // o visual padrão é o espacial (roxo escuro)
}

export function ProvedorTema({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(temaInicial)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'escuro')
    // Barra do navegador no celular e da janela do app instalado na cor do fundo.
    const fundo = getComputedStyle(document.documentElement).getPropertyValue('--background').trim()
    if (fundo) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', fundo)
  }, [tema])

  const trocar = useCallback((novo: Tema) => {
    setTema(novo)
    try {
      localStorage.setItem('tema', novo)
    } catch {
      // Sem localStorage: vale só nesta visita.
    }
  }, [])

  return <ContextoTema.Provider value={{ tema, trocar }}>{children}</ContextoTema.Provider>
}

export function useTema() {
  return useContext(ContextoTema)
}

// Seletor sol/lua em pílula, como o do FinSet.
export function SeletorTema({ className }: { className?: string }) {
  const { tema, trocar } = useTema()
  const opcoes = [
    { valor: 'claro' as const, Icone: SunIcon, rotulo: 'Modo claro' },
    { valor: 'escuro' as const, Icone: MoonIcon, rotulo: 'Modo escuro' },
  ]
  return (
    <div className={cn('inline-flex rounded-full border bg-muted p-1', className)} role="radiogroup" aria-label="Tema">
      {opcoes.map(({ valor, Icone, rotulo }) => (
        <button
          key={valor}
          type="button"
          role="radio"
          aria-checked={tema === valor}
          aria-label={rotulo}
          onClick={() => trocar(valor)}
          className={cn(
            'flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors',
            tema === valor && 'bg-card text-primary shadow-sm',
          )}
        >
          <Icone className="size-4" />
        </button>
      ))}
    </div>
  )
}
