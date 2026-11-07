import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { MapPinIcon, MapPinOffIcon } from 'lucide-react'
import { toast } from 'sonner'
import { desmarcarNaSede, estouNaSede, marcarNaSede } from '@/compartilhado/api/presenca'
import { Button } from '@/compartilhado/ui/shadcn/button'

interface Presenca {
  naSede: boolean | null
  enviando: boolean
  alternar: () => Promise<void>
}

const ContextoPresenca = createContext<Presenca | null>(null)

// Presença na sede em tempo real: não registra horas, só avisa os outros membros.
// Fica num contexto para o botão do topo e a aba Sede mostrarem o mesmo estado.
export function ProvedorPresenca({ children }: { children: ReactNode }) {
  const [naSede, setNaSede] = useState<boolean | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    estouNaSede()
      .then(setNaSede)
      .catch(() => setNaSede(false))
  }, [])

  const alternar = useCallback(async () => {
    setEnviando(true)
    try {
      if (naSede) {
        await desmarcarNaSede()
        setNaSede(false)
        toast.success('Você saiu da sede')
      } else {
        await marcarNaSede()
        setNaSede(true)
        toast.success('Agora todos veem que você está na sede')
      }
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }, [naSede])

  return <ContextoPresenca.Provider value={{ naSede, enviando, alternar }}>{children}</ContextoPresenca.Provider>
}

export function usePresenca(): Presenca {
  const presenca = useContext(ContextoPresenca)
  if (!presenca) throw new Error('usePresenca fora de ProvedorPresenca')
  return presenca
}

export function BotaoSedeTopo() {
  const { naSede, enviando, alternar } = usePresenca()
  return (
    <Button
      variant={naSede ? 'outline' : 'default'}
      onClick={() => void alternar()}
      disabled={enviando || naSede === null}
      aria-label={naSede ? 'Saí da sede' : 'Estou na sede'}
    >
      {naSede ? <MapPinOffIcon data-icon="inline-start" /> : <MapPinIcon data-icon="inline-start" />}
      {/* No celular, só o ícone, para o título do topo caber. */}
      <span className="hidden sm:inline">{naSede ? 'Saí da sede' : 'Estou na sede'}</span>
    </Button>
  )
}
