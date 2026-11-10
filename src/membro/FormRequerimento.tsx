import { useMemo, useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { ptBR } from 'react-day-picker/locale'
import { HouseIcon, PaperclipIcon, PlaneIcon, XIcon } from 'lucide-react'
import { rotuloSemana, segundaDaSemana, somarDias } from '@/compartilhado/datas'
import type { NovoRequerimento, TipoRequerimento } from '@/compartilhado/tipos'
import { BottomSheet } from '@/compartilhado/ui/BottomSheet'
import { Button } from '@/compartilhado/ui/shadcn/button'
import { Calendar } from '@/compartilhado/ui/shadcn/calendar'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/compartilhado/ui/shadcn/field'
import { Textarea } from '@/compartilhado/ui/shadcn/textarea'
import { cn } from '@/compartilhado/ui/utils'

function paraISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function paraData(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d)
}

const TIPOS: { valor: TipoRequerimento; titulo: string; texto: string; icone: typeof HouseIcon }[] = [
  {
    valor: 'so_remoto',
    titulo: 'Só remoto',
    texto: 'Não consigo ir à sede, mas consigo trabalhar. A meta de sede some e o total continua.',
    icone: HouseIcon,
  },
  {
    valor: 'ausencia_total',
    titulo: 'Ausência total',
    texto: 'Não consigo trabalhar. A meta da semana é dispensada.',
    icone: PlaneIcon,
  },
]

export function FormRequerimento({
  aberto,
  onAbertoChange,
  onEnviar,
}: {
  aberto: boolean
  onAbertoChange: (aberto: boolean) => void
  onEnviar: (dados: NovoRequerimento) => Promise<void>
}) {
  const [periodo, setPeriodo] = useState<DateRange | undefined>()
  const [tipo, setTipo] = useState<TipoRequerimento | null>(null)
  const [motivo, setMotivo] = useState('')
  const [anexo, setAnexo] = useState<File | null>(null)
  const [erros, setErros] = useState<{ datas?: string; tipo?: string; motivo?: string; geral?: string }>({})
  const [enviando, setEnviando] = useState(false)

  // O requerimento vale para a semana inteira, mesmo pegando só parte dela.
  const semanas = useMemo(() => {
    if (!periodo?.from) return []
    const inicio = segundaDaSemana(paraISO(periodo.from))
    const fim = segundaDaSemana(paraISO(periodo.to ?? periodo.from))
    const lista: string[] = []
    for (let s = inicio; s <= fim; s = somarDias(s, 7)) lista.push(s)
    return lista
  }, [periodo])

  const diasAfetados = useMemo(
    () => semanas.flatMap((s) => Array.from({ length: 7 }, (_, i) => paraData(somarDias(s, i)))),
    [semanas],
  )

  function limpar() {
    setPeriodo(undefined)
    setTipo(null)
    setMotivo('')
    setAnexo(null)
    setErros({})
  }

  async function enviar() {
    const novos: typeof erros = {}
    if (!periodo?.from) novos.datas = 'Escolha as datas no calendário'
    if (!tipo) novos.tipo = 'Escolha o tipo'
    if (!motivo.trim()) novos.motivo = 'O motivo é obrigatório'
    setErros(novos)
    if (Object.keys(novos).length || !periodo?.from || !tipo) return
    setEnviando(true)
    try {
      await onEnviar({
        tipo,
        inicio: paraISO(periodo.from),
        fim: paraISO(periodo.to ?? periodo.from),
        motivo,
        anexo: anexo ?? undefined,
      })
      limpar()
      onAbertoChange(false)
    } catch (e) {
      setErros({ geral: (e as Error).message })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <BottomSheet
      aberto={aberto}
      onAbertoChange={(a) => {
        if (!a) limpar()
        onAbertoChange(a)
      }}
      titulo="Novo requerimento"
      descricao="Todo o RH recebe um e-mail quando você envia."
      rodape={
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onAbertoChange(false)} disabled={enviando}>
            Voltar
          </Button>
          <Button className="flex-1" onClick={() => void enviar()} disabled={enviando}>
            {enviando ? 'Enviando...' : 'Enviar requerimento'}
          </Button>
        </div>
      }
    >
      <FieldGroup className="gap-5">
        <Field data-invalid={erros.datas ? true : undefined}>
          <FieldLabel>Datas</FieldLabel>
          <div className="flex justify-center rounded-[20px] border bg-card">
            <Calendar
              mode="range"
              locale={ptBR}
              selected={periodo}
              onSelect={(p) => {
                setPeriodo(p)
                setErros((e) => ({ ...e, datas: undefined }))
              }}
              modifiers={{ afetada: diasAfetados }}
              modifiersClassNames={{ afetada: 'bg-secondary/70 text-secondary-foreground' }}
              className="[--cell-size:--spacing(10)]"
            />
          </div>
          {erros.datas ? (
            <FieldError>{erros.datas}</FieldError>
          ) : semanas.length > 0 ? (
            <FieldDescription>
              Vale para {semanas.length === 1 ? 'a semana inteira' : `${semanas.length} semanas inteiras`}:{' '}
              {semanas.map(rotuloSemana).join(', ')}.
            </FieldDescription>
          ) : (
            <FieldDescription>Pode cobrir várias semanas. Cada semana tocada vale inteira.</FieldDescription>
          )}
        </Field>

        <Field data-invalid={erros.tipo ? true : undefined}>
          <FieldLabel>Tipo</FieldLabel>
          <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label="Tipo de requerimento">
            {TIPOS.map(({ valor, titulo, texto, icone: Icone }) => (
              <button
                key={valor}
                type="button"
                role="radio"
                aria-checked={tipo === valor}
                onClick={() => {
                  setTipo(valor)
                  setErros((e) => ({ ...e, tipo: undefined }))
                }}
                className={cn(
                  'flex items-start gap-3 rounded-[20px] border bg-card p-4 text-left transition-colors',
                  tipo === valor ? 'border-primary bg-secondary/60 ring-1 ring-primary' : 'hover:bg-muted',
                )}
              >
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-[12px]',
                    tipo === valor ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground',
                  )}
                >
                  <Icone className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold">{titulo}</span>
                  <span className="text-sm text-muted-foreground">{texto}</span>
                </span>
              </button>
            ))}
          </div>
          {erros.tipo && <FieldError>{erros.tipo}</FieldError>}
        </Field>

        <Field data-invalid={erros.motivo ? true : undefined}>
          <FieldLabel htmlFor="req-motivo">Motivo</FieldLabel>
          <Textarea
            id="req-motivo"
            value={motivo}
            onChange={(e) => {
              setMotivo(e.target.value)
              setErros((er) => ({ ...er, motivo: undefined }))
            }}
            placeholder="O que vai ter na semana que te impede de ir à sede ou de trabalhar?"
            aria-invalid={erros.motivo ? true : undefined}
          />
          {erros.motivo && <FieldError>{erros.motivo}</FieldError>}
        </Field>

        <Field>
          <FieldLabel htmlFor="req-anexo">Anexo (obrigatório em casos de saúde)</FieldLabel>
          {anexo ? (
            <div className="flex items-center gap-3 rounded-full border bg-card py-1.5 pr-1.5 pl-4 text-sm">
              <PaperclipIcon className="size-4 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{anexo.name}</span>
              <Button variant="ghost" size="icon-sm" aria-label="Remover anexo" onClick={() => setAnexo(null)}>
                <XIcon />
              </Button>
            </div>
          ) : (
            <label
              htmlFor="req-anexo"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-[20px] border border-dashed bg-card px-4 py-5 text-sm text-muted-foreground hover:bg-muted"
            >
              <PaperclipIcon className="size-4" /> Atestado ou comprovante
            </label>
          )}
          <input
            id="req-anexo"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            className="sr-only"
            onChange={(e) => setAnexo(e.target.files?.[0] ?? null)}
          />
          <FieldDescription>PDF, JPG ou PNG, até 5 MB. Só você, o RH e a presidência conseguem abrir. O arquivo é apagado quando o pedido é aprovado, ou um mês depois de reprovado.</FieldDescription>
        </Field>

        {erros.geral && (
          <p role="alert" className="rounded-2xl bg-perigo-fundo px-3 py-2.5 text-sm font-medium text-perigo">
            {erros.geral}
          </p>
        )}
      </FieldGroup>
    </BottomSheet>
  )
}
