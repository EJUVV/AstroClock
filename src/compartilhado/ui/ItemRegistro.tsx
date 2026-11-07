import { BuildingIcon, EllipsisVerticalIcon, LaptopIcon, LockIcon, PencilIcon, TimerIcon, Trash2Icon } from 'lucide-react'
import { diaSemanaMes, dataEmBrasilia, duracaoEmHoras, horaDe } from '@/compartilhado/datas'
import type { Registro } from '@/compartilhado/tipos'
import { Horas } from '@/compartilhado/ui/Horas'
import { Button } from '@/compartilhado/ui/shadcn/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/compartilhado/ui/shadcn/dropdown-menu'
import { StatusPill } from '@/compartilhado/ui/StatusPill'
import { cn } from '@/compartilhado/ui/utils'

// Um registro na lista: data, horário, duração, local, origem e situação.
export function ItemRegistro({
  registro,
  cancelado,
  bloqueado,
  textoBloqueio = 'Passou de 7 dias, procure o RH',
  onEditar,
  onCancelar,
}: {
  registro: Registro
  cancelado?: boolean
  bloqueado?: boolean
  textoBloqueio?: string
  onEditar?: () => void
  onCancelar?: () => void
}) {
  const ativo = registro.fim === null
  const horas = duracaoEmHoras(registro.inicio, registro.fim)
  const semAcoes = cancelado || ativo || (!onEditar && !onCancelar)

  return (
    <li
      className={cn(
        'flex items-start gap-3 rounded-[20px] border bg-card p-4',
        cancelado && 'opacity-60',
        registro.precisaRevisao && 'border-alerta/40',
      )}
    >
      <span
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-[14px]',
          registro.local === 'sede' ? 'bg-sede text-primary-foreground' : 'bg-online text-roxo-escuro',
        )}
      >
        {registro.local === 'sede' ? <BuildingIcon className="size-5" /> : <LaptopIcon className="size-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('line-clamp-3 font-semibold break-words', cancelado && 'line-through')} title={registro.descricao}>
          {registro.descricao}
        </p>
        <p className={cn('text-xs text-muted-foreground', cancelado && 'line-through')}>
          {diaSemanaMes(dataEmBrasilia(registro.inicio))} · {horaDe(registro.inicio)}–{registro.fim ? horaDe(registro.fim) : 'agora'} ·{' '}
          {registro.local === 'sede' ? 'Sede' : 'Online'}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {registro.origem === 'cronometro' && (
            <StatusPill tom="roxo">
              <TimerIcon /> Cronômetro
            </StatusPill>
          )}
          {ativo && <StatusPill tom="sucesso">Contando agora</StatusPill>}
          {registro.precisaRevisao && <StatusPill tom="alerta">Em revisão · não conta na meta</StatusPill>}
          {cancelado && <StatusPill tom="perigo">Cancelado</StatusPill>}
          {bloqueado && !cancelado && (
            <StatusPill tom="neutro">
              <LockIcon /> {textoBloqueio}
            </StatusPill>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <Horas valor={horas} className={cn('text-lg', cancelado && 'line-through')} />
        {!semAcoes && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Ações do registro">
                <EllipsisVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl">
              {bloqueado && <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{textoBloqueio}</DropdownMenuLabel>}
              <DropdownMenuGroup>
                <DropdownMenuItem disabled={bloqueado} onSelect={onEditar}>
                  <PencilIcon /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" disabled={bloqueado} onSelect={onCancelar}>
                  <Trash2Icon /> Cancelar registro
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </li>
  )
}
