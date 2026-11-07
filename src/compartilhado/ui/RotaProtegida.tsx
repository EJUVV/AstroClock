import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { meusDados, meuPerfil } from '@/compartilhado/api/auth'
import type { Membro, Perfil } from '@/compartilhado/tipos'
import { LogoIcone } from '@/compartilhado/ui/Logo'

interface Sessao {
  perfil: Perfil
  eu: Membro
}

const ContextoSessao = createContext<Sessao | null>(null)

export function useSessao(): Sessao {
  const sessao = useContext(ContextoSessao)
  if (!sessao) throw new Error('useSessao fora de RotaProtegida')
  return sessao
}

export function TelaCarregando() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4">
      <LogoIcone className="size-12 animate-pulse" />
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </main>
  )
}

// Experiência apenas: quem protege os dados é o RLS (docs/arquitetura.md, seção 2).
export function RotaProtegida({ perfis, children }: { perfis: Perfil[]; children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null | 'negado'>(null)
  const permitidos = perfis.join(',')

  useEffect(() => {
    meuPerfil()
      .then(async (perfil) => {
        if (!perfil || !permitidos.split(',').includes(perfil)) return setSessao('negado')
        setSessao({ perfil, eu: await meusDados() })
      })
      .catch(() => setSessao('negado'))
  }, [permitidos])

  if (sessao === null) return <TelaCarregando />
  if (sessao === 'negado') return <Navigate to="/inicio" replace />
  return <ContextoSessao.Provider value={sessao}>{children}</ContextoSessao.Provider>
}
