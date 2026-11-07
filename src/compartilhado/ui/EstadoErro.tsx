import { RotateCwIcon, TriangleAlertIcon } from 'lucide-react'
import { Button } from '@/compartilhado/ui/shadcn/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/compartilhado/ui/shadcn/empty'

export function EstadoErro({ mensagem, onTentar }: { mensagem: string; onTentar?: () => void }) {
  return (
    <Empty className="rounded-[24px] border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-perigo-fundo text-perigo">
          <TriangleAlertIcon />
        </EmptyMedia>
        <EmptyTitle>Algo deu errado</EmptyTitle>
        <EmptyDescription>{mensagem}</EmptyDescription>
      </EmptyHeader>
      {onTentar && (
        <EmptyContent>
          <Button variant="outline" onClick={onTentar}>
            <RotateCwIcon data-icon="inline-start" />
            Tentar novamente
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}
