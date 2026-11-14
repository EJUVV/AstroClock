import { ptBR } from 'react-day-picker/locale'
import { Calendar } from '@/compartilhado/ui/shadcn/calendar'

// Calendário de um dia só, com datas no formato 'AAAA-MM-DD'.
// Fica num arquivo próprio para ser carregado só quando alguém abre o calendário.
function paraDate(data: string): Date {
  const [a, m, d] = data.split('-').map(Number)
  return new Date(a, m - 1, d)
}

function paraTexto(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function CalendarioData({
  valor,
  min,
  max,
  onEscolher,
}: {
  valor: string
  min?: string
  max: string
  onEscolher: (data: string) => void
}) {
  const fim = paraDate(max)
  const inicio = min ? paraDate(min) : undefined
  return (
    <div className="flex justify-center rounded-[20px] border bg-card">
      <Calendar
        mode="single"
        locale={ptBR}
        required
        selected={paraDate(valor)}
        defaultMonth={paraDate(valor)}
        onSelect={(d) => d && onEscolher(paraTexto(d))}
        disabled={inicio ? [{ before: inicio }, { after: fim }] : { after: fim }}
        startMonth={inicio}
        endMonth={fim}
        className="bg-transparent [--cell-size:--spacing(10)]"
      />
    </div>
  )
}
