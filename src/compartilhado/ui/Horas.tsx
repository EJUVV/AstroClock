import { partesDeHoras } from '@/compartilhado/datas'
import { cn } from '@/compartilhado/ui/utils'

// Número grande no estilo "$15,700.00" do FinSet: "7h" forte e os minutos esmaecidos.
export function Horas({ valor, className }: { valor: number; className?: string }) {
  const { horas, minutos } = partesDeHoras(valor)
  return (
    <span className={cn('font-bold tracking-tight tabular-nums', className)}>
      {horas}h<span className="opacity-45">{String(minutos).padStart(2, '0')}</span>
    </span>
  )
}
