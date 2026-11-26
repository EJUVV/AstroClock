import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { meusDados, meuPerfil } from '@/compartilhado/api/auth'
import { minhasDiretorias } from '@/compartilhado/api/diretorias'
import { perfilEfetivo } from '@/compartilhado/perfis'
import type { Diretoria, Membro, Perfil } from '@/compartilhado/tipos'
import { LogoIcone } from '@/compartilhado/ui/Logo'

interface Sessao {
  perfil: Perfil // efetivo: quem dirige o setor RH conta como diretor_rh
  cargo: Perfil // o perfil do cadastro
  diretorias: Diretoria[]
  setoresQueDirijo: string[]
  eu: Membro
  recarregarSessao: () => Promise<void> // depois de mudar as próprias diretorias
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

type DadosSessao = Omit<Sessao, 'recarregarSessao'>

async function carregarSessao(permitidos: string): Promise<DadosSessao | 'negado'> {
  const perfil = await meuPerfil()
  if (!perfil || !permitidos.split(',').includes(perfil)) return 'negado'
  const [eu, diretorias] = await Promise.all([meusDados(), minhasDiretorias()])
  return { perfil: perfilEfetivo(perfil, diretorias), cargo: perfil, diretorias, setoresQueDirijo: diretorias.map((d) => d.setor), eu }
}

// Experiência apenas: quem protege os dados é o RLS (docs/arquitetura.md, seção 2).
export function RotaProtegida({ perfis, children }: { perfis: Perfil[]; children: ReactNode }) {
  const [sessao, setSessao] = useState<DadosSessao | null | 'negado'>(null)
  const permitidos = perfis.join(',')

  useEffect(() => {
    carregarSessao(permitidos).then(setSessao).catch(() => setSessao('negado'))
  }, [permitidos])

  // Sem tela de carregando: a tela atual continua até os dados novos chegarem.
  const recarregarSessao = async () => {
    setSessao(await carregarSessao(permitidos).catch(() => 'negado' as const))
  }

  if (sessao === null) return <TelaCarregando />
  if (sessao === 'negado') return <Navigate to="/inicio" replace />
  return <ContextoSessao.Provider value={{ ...sessao, recarregarSessao }}>{children}</ContextoSessao.Provider>
}
