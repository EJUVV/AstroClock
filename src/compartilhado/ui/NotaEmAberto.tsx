import type { ReactNode } from 'react'
import { MessageCircleQuestionIcon } from 'lucide-react'
import { cn } from '@/compartilhado/ui/utils'

// Nota visível do protótipo: regra ainda não decidida com a diretora de RH.
export function NotaEmAberto({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'flex items-start gap-2 rounded-2xl border border-dashed border-alerta/40 bg-alerta-fundo px-3 py-2 text-xs text-alerta',
        className,
      )}
    >
      <MessageCircleQuestionIcon className="mt-px size-4 shrink-0" />
      <span>
        <strong className="font-semibold">Em aberto:</strong> {children}
      </span>
    </p>
  )
}
