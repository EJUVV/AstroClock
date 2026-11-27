import { CircleCheckIcon, CircleXIcon, ClockIcon, ExternalLinkIcon, HouseIcon, PaperclipIcon, PlaneIcon } from 'lucide-react'
import { diaMes } from '@/compartilhado/datas'
import type { Requerimento, SituacaoRequerimento } from '@/compartilhado/tipos'
import { Button } from '@/compartilhado/ui/shadcn/button'
import { StatusPill } from '@/compartilhado/ui/StatusPill'

export function PilulaRequerimento({ situacao }: { situacao: SituacaoRequerimento }) {
  if (situacao === 'aprovado') return <StatusPill tom="sucesso"><CircleCheckIcon />Aprovado</StatusPill>
  if (situacao === 'reprovado') return <StatusPill tom="perigo"><CircleXIcon />Reprovado</StatusPill>
  return <StatusPill tom="alerta"><ClockIcon />Pendente</StatusPill>
}

export const NOME_TIPO = { so_remoto: 'Só remoto', ausencia_total: 'Ausência total' } as const

// onAbrirAnexo: com ele, o nome do anexo vira um botão que abre o arquivo (tela do membro).
export function ItemRequerimento({ requerimento: q, onAbrirAnexo }: { requerimento: Requerimento; onAbrirAnexo?: (id: string) => void }) {
  const Icone = q.tipo === 'so_remoto' ? HouseIcon : PlaneIcon
  return (
    <li className="flex items-start gap-3 rounded-[20px] border bg-card p-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-secondary text-secondary-foreground">
        <Icone className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold">{NOME_TIPO[q.tipo]}</p>
          <PilulaRequerimento situacao={q.situacao} />
        </div>
        <p className="text-xs text-muted-foreground">
          {q.inicio === q.fim ? diaMes(q.inicio) : `${diaMes(q.inicio)} a ${diaMes(q.fim)}`}
        </p>
        <p className="mt-2 text-sm">{q.motivo}</p>
        {q.motivoResposta && (
          <p className="mt-2 rounded-[14px] bg-perigo-fundo px-3 py-2 text-xs text-perigo">
            <strong>Motivo da reprovação:</strong> {q.motivoResposta}
          </p>
        )}
        {q.anexoNome && onAbrirAnexo && (
          <Button variant="outline" size="sm" className="mt-2 max-w-full" onClick={() => onAbrirAnexo(q.id)}>
            <PaperclipIcon data-icon="inline-start" /> <span className="truncate">Abrir anexo: {q.anexoNome}</span>{' '}
            <ExternalLinkIcon data-icon="inline-end" />
          </Button>
        )}
        {q.anexoNome && !onAbrirAnexo && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <PaperclipIcon className="size-3.5" /> {q.anexoNome}
          </p>
        )}
      </div>
    </li>
  )
}
