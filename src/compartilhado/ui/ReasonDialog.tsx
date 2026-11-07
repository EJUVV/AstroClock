import { useState } from 'react'
import { Button } from '@/compartilhado/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/compartilhado/ui/shadcn/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/compartilhado/ui/shadcn/field'
import { Textarea } from '@/compartilhado/ui/shadcn/textarea'

// Toda alteração do RH em registro de outra pessoa pede um motivo (docs/regras-de-negocio.md, seção 3).
export function ReasonDialog({
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
  onConfirmar: (motivo: string) => Promise<void>
}) {
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  function mudarAberto(valor: boolean) {
    if (!valor) {
      setMotivo('')
      setErro(null)
    }
    onAbertoChange(valor)
  }

  async function enviar() {
    if (!motivo.trim()) {
      setErro('O motivo é obrigatório')
      return
    }
    setEnviando(true)
    try {
      await onConfirmar(motivo)
      mudarAberto(false)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={mudarAberto}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>
        <Field data-invalid={erro ? true : undefined}>
          <FieldLabel htmlFor="motivo-rh">Motivo</FieldLabel>
          <Textarea
            id="motivo-rh"
            value={motivo}
            onChange={(e) => {
              setMotivo(e.target.value)
              setErro(null)
            }}
            placeholder="Ex.: o membro esqueceu de lançar e avisou o RH"
            aria-invalid={erro ? true : undefined}
          />
          {erro ? <FieldError>{erro}</FieldError> : <FieldDescription>O membro não é avisado desta alteração.</FieldDescription>}
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={() => mudarAberto(false)} disabled={enviando}>
            Voltar
          </Button>
          <Button variant={perigoso ? 'destructive' : 'default'} onClick={() => void enviar()} disabled={enviando}>
            {enviando ? 'Salvando...' : confirmar}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
