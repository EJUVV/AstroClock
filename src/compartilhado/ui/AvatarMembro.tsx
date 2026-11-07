import { Avatar, AvatarFallback } from '@/compartilhado/ui/shadcn/avatar'
import { cn } from '@/compartilhado/ui/utils'

// A foto real vem da conta Google. No protótipo, iniciais com um tom fixo por pessoa.
const TONS = [
  'bg-[#EFEAFF] text-[#5B3FD9]',
  'bg-[#E0F2FE] text-[#0369A1]',
  'bg-[#FCE7F3] text-[#BE185D]',
  'bg-[#DCFCE7] text-[#15803D]',
  'bg-[#FEF3C7] text-[#B45309]',
  'bg-[#E0E7FF] text-[#4338CA]',
]

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/)
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase()
}

function tom(nome: string): string {
  let soma = 0
  for (const letra of nome) soma += letra.charCodeAt(0)
  return TONS[soma % TONS.length]
}

export function AvatarMembro({ nome, className }: { nome: string; className?: string }) {
  return (
    <Avatar className={cn('size-10', className)}>
      <AvatarFallback className={cn('font-semibold', tom(nome))}>{iniciais(nome)}</AvatarFallback>
    </Avatar>
  )
}
