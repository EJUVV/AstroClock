import { NavLink } from 'react-router-dom'
import { EllipsisIcon } from 'lucide-react'
import type { ItemMenu } from '@/compartilhado/ui/LayoutPainel'
import { cn } from '@/compartilhado/ui/utils'

const BOTAO = 'relative flex h-11 min-w-0 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors'

function Contador({ valor }: { valor?: number }) {
  if (!valor) return null
  return (
    <span className="absolute -top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-perigo px-1 text-[10px] font-bold text-white">
      {valor}
    </span>
  )
}

// Barra flutuante do celular e do tablet. A aba ativa mostra o nome; as outras, só o ícone.
// Com onMais, ganha um último botão "Mais" para as abas que não cabem (painel do RH).
export function BarraInferior({
  itens,
  onMais,
  maisAtivo = false,
  maisAlerta = false,
}: {
  itens: ItemMenu[]
  onMais?: () => void
  maisAtivo?: boolean
  maisAlerta?: boolean
}) {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 mx-auto flex w-[calc(100%-2rem)] max-w-md items-center justify-between gap-1 rounded-full border bg-popover p-1.5 shadow-[0_10px_30px_rgb(30_27_57/0.18)]"
    >
      {itens.map(({ para, rotulo, icone: Icone, fim, contador }) => (
        <NavLink
          key={para}
          to={para}
          end={fim}
          className={({ isActive }) =>
            cn(BOTAO, isActive ? 'bg-primary px-4 text-primary-foreground' : 'text-muted-foreground hover:text-foreground')
          }
        >
          {({ isActive }) => (
            <>
              <Icone className="size-5 shrink-0" />
              <span className={cn('truncate', !isActive && 'sr-only')}>{rotulo}</span>
              {!isActive && <Contador valor={contador} />}
            </>
          )}
        </NavLink>
      ))}
      {onMais && (
        <button
          type="button"
          onClick={onMais}
          className={cn(BOTAO, maisAtivo ? 'bg-primary px-4 text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
        >
          <EllipsisIcon className="size-5 shrink-0" />
          <span className={cn(!maisAtivo && 'sr-only')}>Mais</span>
          {maisAlerta && !maisAtivo && <span className="absolute top-1.5 right-2 size-2 rounded-full bg-perigo" />}
        </button>
      )}
    </nav>
  )
}
