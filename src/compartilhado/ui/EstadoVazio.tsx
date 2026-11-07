import type { ReactNode } from 'react'
import { InboxIcon, type LucideIcon } from 'lucide-react'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/compartilhado/ui/shadcn/empty'

export function EstadoVazio({
  titulo,
  descricao,
  acao,
  icone: Icone = InboxIcon,
}: {
  titulo: string
  descricao?: string
  acao?: ReactNode
  icone?: LucideIcon
}) {
  return (
    <Empty className="rounded-[24px] border border-dashed bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-secondary text-secondary-foreground">
          <Icone />
        </EmptyMedia>
        <EmptyTitle>{titulo}</EmptyTitle>
        {descricao && <EmptyDescription>{descricao}</EmptyDescription>}
      </EmptyHeader>
      {acao && <EmptyContent>{acao}</EmptyContent>}
    </Empty>
  )
}
