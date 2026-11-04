import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { meuPerfil, sair } from '../compartilhado/api/auth.ts'

function Inicio() {
  const navigate = useNavigate()
  const [estado, setEstado] = useState<'carregando' | 'negado' | 'erro'>('carregando')
  const [erro, setErro] = useState('')

  useEffect(() => {
    meuPerfil()
      .then((perfil) => {
        if (perfil === 'membro') navigate('/membro', { replace: true })
        else if (perfil === 'rh' || perfil === 'diretor_rh') navigate('/rh', { replace: true })
        else setEstado('negado')
      })
      .catch((e: Error) => {
        setErro(e.message)
        setEstado('erro')
      })
  }, [navigate])

  if (estado === 'carregando') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F6F7FB] px-8 text-center">
        <div
          role="status"
          aria-label="Carregando"
          className="size-14 animate-spin rounded-full border-[6px] border-[#E6EAF3] border-t-[#0F1B33]"
        />
        <h1 className="text-xl font-semibold text-[#0F1B33]">Entrando…</h1>
        <p className="text-sm text-[#5A6580]">Conferindo seu acesso. Você será levado ao painel certo.</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F6F7FB] px-8 text-center">
      <h1 className="text-2xl font-semibold text-[#0F1B33]">
        {estado === 'negado' ? 'Acesso negado' : 'Não foi possível entrar'}
      </h1>
      <p role="alert" className="max-w-xs leading-relaxed text-[#3B4660]">
        {estado === 'negado' ? 'Acesso negado. Procure o RH.' : erro}
      </p>
      <button
        type="button"
        onClick={() => void sair()}
        className="mt-3 min-h-12 w-full max-w-xs rounded-xl bg-[#0F1B33] font-semibold text-white"
      >
        Voltar
      </button>
    </main>
  )
}

export default Inicio