import { useSyncExternalStore } from 'react'
import { DownloadIcon } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/compartilhado/ui/utils'

// Evento que Chrome e Edge disparam quando o site pode ser instalado como app.
interface EventoInstalar extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// O evento pode chegar antes de qualquer tela montar, então fica guardado aqui.
let eventoGuardado: EventoInstalar | null = null
const ouvintes = new Set<() => void>()
const avisar = () => ouvintes.forEach((o) => o())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // o próprio site mostra o botão "Instalar app"
    eventoGuardado = e as EventoInstalar
    avisar()
  })
  window.addEventListener('appinstalled', () => {
    eventoGuardado = null
    avisar()
  })
}

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte)
  return () => ouvintes.delete(ouvinte)
}

// Registra o service worker, que os navegadores exigem para oferecer a instalação.
// Só no site publicado: no npm run dev ele atrapalharia as atualizações.
export function registrarServiceWorker() {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Sem service worker o site funciona igual; só não oferece instalar.
      })
    })
  }
}

function jaInstalado(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return window.matchMedia('(display-mode: standalone)').matches || iosStandalone
}

// iPhone e iPad não têm o evento: a instalação é pelo menu Compartilhar do Safari.
function ehIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function useInstalarApp(): { podeInstalar: boolean; instalar: () => void } {
  const evento = useSyncExternalStore(assinar, () => eventoGuardado, () => null)
  const ios = typeof window !== 'undefined' && ehIOS() && !jaInstalado()

  function instalar() {
    if (evento) {
      void evento.prompt()
      void evento.userChoice.then(({ outcome }) => {
        if (outcome === 'accepted') toast.success('AstroClock instalado')
        eventoGuardado = null
        avisar()
      })
    } else if (ios) {
      toast('Instalar no iPhone', {
        description: 'No Safari, toque em Compartilhar e depois em "Adicionar à Tela de Início".',
        duration: 10_000,
      })
    }
  }

  return { podeInstalar: !!evento || ios, instalar }
}

// Botão que só aparece quando dá para instalar (e some depois de instalado).
export function BotaoInstalarApp({ className, compacto = false }: { className?: string; compacto?: boolean }) {
  const { podeInstalar, instalar } = useInstalarApp()
  if (!podeInstalar) return null
  return (
    <button
      type="button"
      onClick={instalar}
      aria-label="Instalar app"
      className={cn(
        'flex h-11 items-center gap-3 rounded-full px-4 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground',
        compacto && 'justify-center px-0',
        className,
      )}
    >
      <DownloadIcon className="size-5" />
      {!compacto && 'Instalar app'}
    </button>
  )
}
