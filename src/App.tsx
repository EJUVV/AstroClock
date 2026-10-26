import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Inicio from './membro/Inicio.tsx'
import PainelMembro from './membro/PainelMembro.tsx'
import TelaLogin from './membro/TelaLogin.tsx'
import PainelRH from './rh/PainelRH.tsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TelaLogin />} />
        <Route path="/inicio" element={<Inicio />} />
        <Route path="/membro" element={<PainelMembro />} />
        <Route path="/rh" element={<PainelRH />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
