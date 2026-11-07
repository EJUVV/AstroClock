import { rotuloSemana, semanaAtual, somarDias } from '@/compartilhado/datas'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/compartilhado/ui/shadcn/select'

// Seletor em pílula ("Esta semana ▾"), com as últimas semanas.
export function SeletorSemana({ valor, onMudar, quantas = 10 }: { valor: string; onMudar: (s: string) => void; quantas?: number }) {
  const atual = semanaAtual()
  const semanas = Array.from({ length: quantas }, (_, i) => somarDias(atual, -7 * i))
  return (
    <Select value={valor} onValueChange={onMudar}>
      <SelectTrigger size="sm" aria-label="Semana">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectGroup>
          {semanas.map((s, i) => (
            <SelectItem key={s} value={s}>
              {i === 0 ? `Esta semana (${rotuloSemana(s)})` : i === 1 ? `Semana passada (${rotuloSemana(s)})` : rotuloSemana(s)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
