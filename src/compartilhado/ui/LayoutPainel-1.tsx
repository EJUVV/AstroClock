import { useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { LifeBuoyIcon, LogOutIcon, MenuIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, SettingsIcon, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { sair } from '@/compartilhado/api/auth'
import { AvatarMembro } from '@/compartilhado/ui/AvatarMembro'
import { BotaoInstalarApp } from '@/compartilhado/ui/instalarApp'
import { Logo } from '@/compartilhado/ui/Logo'
import { useMinhaFoto } from '@/compartilhado/ui/preferencias'
import { useSessao } from '@/compartilhado/ui/RotaProtegida'
import { Button } from '@/compartilhado/ui/shadcn/button'
import { Drawer, DrawerContent, DrawerTitle } from '@/compartilhado/ui/shadcn/drawer'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/compartilhado/ui/shadcn/tooltip'
import { cn } from '@/compartilhado/ui/utils'

export interface ItemMenu {
  para: string
  rotulo: string
  icone: LucideIcon
  fim?: boolean
  contador?: number
}

export interface TituloPagina {
  prefixo: string
  titulo: string
  subtitulo: string
}

function Menu({ itens, recolhido, onNavegar }: { itens: ItemMenu[]; recolhido: boolean; onNavegar?: () => void }) {
  return (
    <ul className="flex flex-col gap-1">
      {itens.map(({ para, rotulo, icone: Icone, fim, contador }) => {
        const link = (
          <NavLink
            to={para}
            end={fim}
            onClick={onNavegar}
            className={({ isActive }) =>
              cn(
                'flex h-11 items-center gap-3 rounded-full px-4 text-sm font-semibold text-muted-foreground transition-colors',
                isActive ? 'bg-primary text-primary-foreground shadow-[0_6px_16px_rgb(123_92_245/0.35)]' : 'hover:bg-muted hover:text-foreground',
                recolhido && 'justify-center px-0',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icone className="size-5 shrink-0" />
                {!recolhido && <span className="flex-1 truncate">{rotulo}</span>}
                {!recolhido && contador !== undefined && contador > 0 && (
                  <span
                    className={cn(
                      'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold',
                      isActive ? 'bg-white/25 text-white' : 'bg-secondary text-secondary-foreground',
                    )}
                  >
                    {contador}
                  </span>
                )}
              </>
            )}
          </NavLink>
        )
        return (
          <li key={para}>
            {recolhido ? (
              <Tooltip>
                {/* O span é o gatilho: com asChild direto no NavLink, o Tooltip juntava a classe dele com a
                    função de classe do NavLink, e o link perdia o estilo e o ícone. */}
                <TooltipTrigger asChild>
                  <span className="block">{link}</span>
                </TooltipTrigger>
                <TooltipContent side="right">{rotulo}</TooltipContent>
              </Tooltip>
            ) : (
              link
            )}
          </li>
        )
      })}
    </ul>
  )
}

// Sidebar, topo e menu do celular no estilo FinSet, usados pelo painel do RH e pelo do membro no computador.
export function LayoutPainel({
  secao,
  inicio,
  itens,
  itensRodape,
  titulos,
  acoesTopo,
  children,
}: {
  secao: string
  inicio: string
  itens: ItemMenu[]
  itensRodape: ItemMenu[]
  titulos: TituloPagina[]
  acoesTopo?: ReactNode
  children: ReactNode
}) {
  const { eu } = useSessao()
  const foto = useMinhaFoto(eu.email)
  const location = useLocation()
  const [recolhido, setRecolhido] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const pagina = titulos.find((t) => location.pathname.startsWith(t.prefixo)) ?? titulos[titulos.length - 1]

  const rodapeMenu = (recolher: boolean, onNavegar?: () => void) => (
    <div className="flex flex-col gap-1">
      <Menu itens={[...itensRodape, { para: `${inicio}/configuracoes`, rotulo: 'Configurações', icone: SettingsIcon }]} recolhido={recolher} onNavegar={onNavegar} />
      <BotaoInstalarApp compacto={recolher} />
      <button
        type="button"
        className={cn(
          'flex h-11 items-center gap-3 rounded-full px-4 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground',
          recolher && 'justify-center px-0',
        )}
        onClick={() => toast('Precisa de ajuda?', { description: 'Fale com o líder do projeto no grupo da EJ.' })}
      >
        <LifeBuoyIcon className="size-5" />
        {!recolher && 'Ajuda'}
      </button>
      <button
        type="button"
        className={cn(
          'flex h-11 items-center gap-3 rounded-full px-4 text-sm font-semibold text-muted-foreground hover:bg-perigo-fundo hover:text-perigo',
          recolher && 'justify-center px-0',
        )}
        onClick={() => void sair()}
      >
        <LogOutIcon className="size-5" />
        {!recolher && 'Sair'}
      </button>
    </div>
  )

  return (
    <div className="flex min-h-svh">
      <aside
        className={cn(
          'sticky top-0 hidden h-svh shrink-0 flex-col gap-6 border-r bg-sidebar p-4 lg:flex',
          recolhido ? 'w-[88px]' : 'w-[268px]',
        )}
      >
        <div className={cn('flex items-center justify-between px-1 pt-1', recolhido && 'justify-center')}>
          <Link to={inicio} aria-label="AstroClock, início">
            <Logo compacto={recolhido} />
          </Link>
        </div>
        <nav aria-label={secao} className="flex flex-1 flex-col justify-between gap-6 overflow-x-hidden overflow-y-auto [scrollbar-width:thin]">
          <div className="flex flex-col gap-2">
            {!recolhido && <p className="px-4 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{secao}</p>}
            <Menu itens={itens} recolhido={recolhido} />
          </div>
          <div className="flex flex-col gap-3">
            {rodapeMenu(recolhido)}
            <div className={cn('flex items-center', recolhido ? 'justify-center' : 'justify-end px-1')}>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={recolhido ? 'Expandir menu' : 'Recolher menu'}
                onClick={() => setRecolhido(!recolhido)}
              >
                {recolhido ? <PanelLeftOpenIcon /> : <PanelLeftCloseIcon />}
              </Button>
            </div>
          </div>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-3 px-4 pt-4 pb-2 lg:px-8 lg:pt-7">
          <Button variant="outline" size="icon" className="lg:hidden" aria-label="Abrir menu" onClick={() => setMenuAberto(true)}>
            <MenuIcon />
          </Button>
          {/* No celular, o título ganha uma linha só dele, abaixo do menu e das ações, para não virar "Requerim...". */}
          <div className="order-last min-w-0 basis-full sm:order-none sm:flex-1 sm:basis-auto">
            <h1 className="text-2xl font-bold tracking-tight text-balance sm:truncate lg:text-3xl">{pagina.titulo}</h1>
            <p className="hidden text-sm text-muted-foreground sm:block">{pagina.subtitulo}</p>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:ml-0">
            {acoesTopo}
            {/* Clicar na foto abre as Configurações (foto, tema e fundo). */}
            <Link
              to={`${inicio}/configuracoes`}
              aria-label="Abrir configurações"
              title="Configurações"
              className="flex items-center gap-2.5 rounded-full border bg-card py-1 pr-4 pl-1 transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <AvatarMembro nome={eu.nome} foto={foto} className="size-9" />
              <div className="hidden leading-tight md:block">
                <p className="text-sm font-semibold">{eu.nome}</p>
                <p className="text-xs text-muted-foreground">{eu.email}</p>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-5 px-4 pt-4 pb-10 lg:px-8">{children}</main>
      </div>

      <Drawer open={menuAberto} onOpenChange={setMenuAberto} direction="left">
        <DrawerContent className="flex flex-col gap-6 p-4">
          <DrawerTitle className="sr-only">Menu: {secao}</DrawerTitle>
          <Logo />
          <nav aria-label={secao} className="flex flex-1 flex-col justify-between gap-6">
            <Menu itens={itens} recolhido={false} onNavegar={() => setMenuAberto(false)} />
            <div className="flex flex-col gap-3">
              {rodapeMenu(false, () => setMenuAberto(false))}
            </div>
          </nav>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
