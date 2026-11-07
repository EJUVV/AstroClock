import type { ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/compartilhado/ui/utils'

const variantes = cva(
  'inline-flex h-6 w-fit shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap [&>svg]:size-3.5',
  {
    variants: {
      tom: {
        sucesso: 'bg-sucesso-fundo text-sucesso',
        alerta: 'bg-alerta-fundo text-alerta',
        perigo: 'bg-perigo-fundo text-perigo',
        roxo: 'bg-secondary text-secondary-foreground',
        neutro: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: { tom: 'neutro' },
  },
)

// Pílula de status, como o "↑ 12.1%" do FinSet.
export function StatusPill({
  tom,
  children,
  className,
}: VariantProps<typeof variantes> & { children: ReactNode; className?: string }) {
  return <span className={cn(variantes({ tom }), className)}>{children}</span>
}
