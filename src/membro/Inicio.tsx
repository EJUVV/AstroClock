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

  if (estado === 'carregando') return <p>Carregando...</p>

  return (
    <main>
      <p>{estado === 'negado' ? 'Acesso negado. Procure o RH.' : erro}</p>
      <button type="button" onClick={() => void sair()}>
        Voltar
      </button>
    </main>
  )
}

export default Inicio
