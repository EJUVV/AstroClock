import { useState } from 'react'
import { entrarComGoogle } from '../compartilhado/api/auth.ts'

function TelaLogin() {
  const [erro, setErro] = useState<string | null>(null)

  function entrar() {
    setErro(null)
    entrarComGoogle().catch((e: Error) => setErro(e.message))
  }

  return (
    <main>
      <h1>AstroClock</h1>
      <button type="button" onClick={entrar}>
        Entrar com Google
      </button>
      {erro && <p>{erro}</p>}
    </main>
  )
}

export default TelaLogin
