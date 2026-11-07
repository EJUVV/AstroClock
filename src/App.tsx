import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PainelDemo } from './compartilhado/ui/demo.tsx'
import { RotaProtegida } from './compartilhado/ui/RotaProtegida.tsx'
import Inicio from './membro/Inicio.tsx'
import InicioMembro from './membro/InicioMembro.tsx'
import PainelMembro from './membro/PainelMembro.tsx'
import RegistrosMembro from './membro/RegistrosMembro.tsx'
import RequerimentosMembro from './membro/RequerimentosMembro.tsx'
import SedeMembro from './membro/SedeMembro.tsx'
import TelaLogin from './membro/TelaLogin.tsx'
import DetalheMembro from './rh/DetalheMembro.tsx'
import Membros from './rh/Membros.tsx'
import Metas from './rh/Metas.tsx'
import PainelRH from './rh/PainelRH.tsx'
import Ranking from './rh/Ranking.tsx'
import RequerimentosRH from './rh/RequerimentosRH.tsx'
import RevisaoCronometros from './rh/RevisaoCronometros.tsx'
import VisaoGeral from './rh/VisaoGeral.tsx'

function App() {
  return (
    <BrowserRouter>
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
      <PainelDemo />
    </BrowserRouter>
  )
}

export default App
