import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { FundoParticulas } from './compartilhado/ui/FundoParticulas.tsx'
import { ProvedorDemo } from './compartilhado/ui/demo.tsx'
import { registrarServiceWorker } from './compartilhado/ui/instalarApp.tsx'
import { Toaster } from './compartilhado/ui/shadcn/sonner.tsx'
import { TooltipProvider } from './compartilhado/ui/shadcn/tooltip.tsx'
import { ProvedorTema } from './compartilhado/ui/tema.tsx'

registrarServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProvedorTema>
      <ProvedorDemo>
        <TooltipProvider>
          <FundoParticulas />
          <App />
          <Toaster position="top-center" />
        </TooltipProvider>
      </ProvedorDemo>
    </ProvedorTema>
  </StrictMode>,
)
