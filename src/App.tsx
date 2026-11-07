import { lazy, Suspense, type ComponentType } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PainelDemo } from './compartilhado/ui/demo.tsx'
import { RotaProtegida, TelaCarregando } from './compartilhado/ui/RotaProtegida.tsx'
import Inicio from './membro/Inicio.tsx'
import TelaLogin from './membro/TelaLogin.tsx'

// Cada painel é baixado só quando é aberto: a tela de login fica leve, e o membro
// nunca baixa o painel do RH. Todas as páginas de um painel vêm no mesmo arquivo.
type Paginas = Record<string, ComponentType>
function paginaDe<P extends Paginas>(carregar: () => Promise<P>, nome: keyof P) {
  return lazy(() => carregar().then((m) => ({ default: m[nome] })))
}
const membro = () => import('./membro/paginas.ts')
const rh = () => import('./rh/paginas.ts')

const PainelMembro = paginaDe(membro, 'PainelMembro')
const InicioMembro = paginaDe(membro, 'InicioMembro')
const RegistrosMembro = paginaDe(membro, 'RegistrosMembro')
const RequerimentosMembro = paginaDe(membro, 'RequerimentosMembro')
const SedeMembro = paginaDe(membro, 'SedeMembro')
const PainelRH = paginaDe(rh, 'PainelRH')
const VisaoGeral = paginaDe(rh, 'VisaoGeral')
const Membros = paginaDe(rh, 'Membros')
const DetalheMembro = paginaDe(rh, 'DetalheMembro')
const RequerimentosRH = paginaDe(rh, 'RequerimentosRH')
const RevisaoCronometros = paginaDe(rh, 'RevisaoCronometros')
const Ranking = paginaDe(rh, 'Ranking')
const Metas = paginaDe(rh, 'Metas')

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<TelaCarregando />}>
        <Routes>
          <Route path="/" element={<TelaLogin />} />
          <Route path="/inicio" element={<Inicio />} />
          {/* O RH também registra as próprias horas, então entra em /membro. Diretores não contabilizam horas. */}
          <Route
            path="/membro"
            element={
              <RotaProtegida perfis={['membro', 'rh']}>
                <PainelMembro />
              </RotaProtegida>
            }
          >
            <Route index element={<InicioMembro />} />
            <Route path="registros" element={<RegistrosMembro />} />
            <Route path="requerimentos" element={<RequerimentosMembro />} />
            <Route path="sede" element={<SedeMembro />} />
          </Route>
          <Route
            path="/rh"
            element={
              <RotaProtegida perfis={['rh', 'diretor_rh', 'diretor_setor', 'presidente']}>
                <PainelRH />
              </RotaProtegida>
            }
          >
            <Route index element={<VisaoGeral />} />
            <Route path="membros" element={<Membros />} />
            <Route path="membros/:id" element={<DetalheMembro />} />
            <Route path="requerimentos" element={<RequerimentosRH />} />
            <Route path="cronometros" element={<RevisaoCronometros />} />
            <Route path="ranking" element={<Ranking />} />
            <Route path="metas" element={<Metas />} />
            <Route path="sede" element={<SedeMembro />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <PainelDemo />
    </BrowserRouter>
  )
}

export default App
