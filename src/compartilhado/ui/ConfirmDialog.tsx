import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/compartilhado/ui/shadcn/alert-dialog'

export function ConfirmDialog({
  aberto,
  onAbertoChange,
  titulo,
  descricao,
  confirmar,
  perigoso,
  onConfirmar,
}: {
  aberto: boolean
  onAbertoChange: (aberto: boolean) => void
  titulo: string
  descricao: string
  confirmar: string
  perigoso?: boolean
  onConfirmar: () => Promise<void>
}) {
  const [enviando, setEnviando] = useState(false)

  async function confirmarAcao() {
    setEnviando(true)
    try {
      await onConfirmar()
      onAbertoChange(false)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AlertDialog open={aberto} onOpenChange={onAbertoChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descricao}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={enviando}>Voltar</AlertDialogCancel>
          <AlertDialogAction
            variant={perigoso ? 'destructive' : 'default'}
            disabled={enviando}
            onClick={(e) => {
              e.preventDefault()
              void confirmarAcao()
            }}
          >
            {enviando ? 'Aguarde...' : confirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
