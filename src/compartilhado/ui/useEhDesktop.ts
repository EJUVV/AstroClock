import { useEffect, useState } from 'react'

const CONSULTA = '(min-width: 1024px)' // mesmo ponto do "lg" do Tailwind

// true no computador: o painel do membro troca a barra inferior pela sidebar.
export function useEhDesktop(): boolean {
  const [ehDesktop, setEhDesktop] = useState(() => window.matchMedia(CONSULTA).matches)
  useEffect(() => {
    const midia = window.matchMedia(CONSULTA)
    const mudou = () => setEhDesktop(midia.matches)
    midia.addEventListener('change', mudou)
    return () => midia.removeEventListener('change', mudou)
  }, [])
  return ehDesktop
}
