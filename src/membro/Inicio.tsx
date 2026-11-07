import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldXIcon } from 'lucide-react'
import { meuPerfil, sair } from '@/compartilhado/api/auth'
import { Button } from '@/compartilhado/ui/shadcn/button'
import { TelaCarregando } from '@/compartilhado/ui/RotaProtegida'

function Inicio() {
  const navigate = useNavigate()
  const [estado, setEstado] = useState<'carregando' | 'negado' | 'erro'>('carregando')
  const [erro, setErro] = useState('')

  useEffect(() => {
    meuPerfil()
      .then((perfil) => {
        if (perfil === 'membro') navigate('/membro', { replace: true })
        else if (perfil) navigate('/rh', { replace: true })
        else setEstado('negado')
      })
      .catch((e: Error) => {
        setErro(e.message)
        setEstado('erro')
      })
  }, [navigate])

  if (estado === 'carregando') return <TelaCarregando />

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-5 rounded-[32px] border bg-card p-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-perigo-fundo text-perigo">
          <ShieldXIcon className="size-7" />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold">{estado === 'negado' ? 'Acesso negado. Procure o RH.' : 'Não foi possível entrar'}</h1>
          <p className="text-sm text-muted-foreground">
            {estado === 'negado'
              ? 'Sua conta não está cadastrada ou foi desativada. O RH pode liberar seu acesso.'
              : erro}
          </p>
        </div>
        <Button className="w-full" variant="outline" onClick={() => void sair()}>
          Voltar
        </Button>
      </div>
    </main>
  )
}

export default Inicio
