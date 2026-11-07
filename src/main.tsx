import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ProvedorDemo } from './compartilhado/ui/demo.tsx'
import { Toaster } from './compartilhado/ui/shadcn/sonner.tsx'
import { TooltipProvider } from './compartilhado/ui/shadcn/tooltip.tsx'
import { ProvedorTema } from './compartilhado/ui/tema.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProvedorTema>
      <ProvedorDemo>
        <TooltipProvider>
          <App />
          <Toaster position="top-center" />
        </TooltipProvider>
      </ProvedorDemo>
    </ProvedorTema>
  </StrictMode>,
)
