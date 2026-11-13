import { NavLink, Outlet } from 'react-router-dom'
import { FileTextIcon, HouseIcon, LayoutDashboardIcon, ListIcon, LogOutIcon, MapPinIcon, SettingsIcon } from 'lucide-react'
import { sair } from '@/compartilhado/api/auth'
import { AvatarMembro } from '@/compartilhado/ui/AvatarMembro'
import { LayoutPainel, type ItemMenu, type TituloPagina } from '@/compartilhado/ui/LayoutPainel'
import { LogoIcone } from '@/compartilhado/ui/Logo'
import { useMinhaFoto } from '@/compartilhado/ui/preferencias'
import { useSessao } from '@/compartilhado/ui/RotaProtegida'
import { Button } from '@/compartilhado/ui/shadcn/button'
import { SeletorTema } from '@/compartilhado/ui/tema'
import { BotaoInstalarApp } from '@/compartilhado/ui/instalarApp'
import { useEhDesktop } from '@/compartilhado/ui/useEhDesktop'
import { cn } from '@/compartilhado/ui/utils'
import { BotaoSedeTopo, ProvedorPresenca } from './usePresenca'

const ABAS: ItemMenu[] = [
  { para: '/membro', rotulo: 'Início', icone: HouseIcon, fim: true },
  { para: '/membro/registros', rotulo: 'Registros', icone: ListIcon },
  { para: '/membro/requerimentos', rotulo: 'Requerimentos', icone: FileTextIcon },
  { para: '/membro/sede', rotulo: 'Sede', icone: MapPinIcon },
]

// Computador: mesma sidebar e topo do painel do RH.
function PainelMembroDesktop({ primeiroNome, ehRH }: { primeiroNome: string; ehRH: boolean }) {
  const titulos: TituloPagina[] = [
    { prefixo: '/membro/registros', titulo: 'Registros', subtitulo: 'Suas horas, semana a semana.' },
    { prefixo: '/membro/requerimentos', titulo: 'Requerimentos', subtitulo: 'Peça para ficar só remoto ou ausente.' },
    { prefixo: '/membro/configuracoes', titulo: 'Configurações', subtitulo: 'Sua foto, aparência e preferências.' },
    { prefixo: '/membro/sede', titulo: 'Sede', subtitulo: 'Veja quem está lá agora e avise quando você chegar.' },
    { prefixo: '/membro', titulo: `Olá, ${primeiroNome}`, subtitulo: 'Bem-vindo de volta. Veja como está sua semana.' },
  ]
  return (
    <LayoutPainel
      secao="Minhas horas"
      inicio="/membro"
      itens={ABAS}
      itensRodape={ehRH ? [{ para: '/rh', rotulo: 'Painel do RH', icone: LayoutDashboardIcon }] : []}
      titulos={titulos}
      acoesTopo={<BotaoSedeTopo />}
    >
      <Outlet />
    </LayoutPainel>
  )
}

// Celular: cabeçalho simples e barra inferior flutuante.
function PainelMembroCelular({ nome, email, primeiroNome, ehRH }: { nome: string; email: string; primeiroNome: string; ehRH: boolean }) {
  const foto = useMinhaFoto(email)
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-xl flex-col px-4 pt-4 pb-32 md:max-w-3xl md:px-6">
      <header className="flex items-center gap-3 pb-5">
        <AvatarMembro nome={nome} foto={foto} className="size-11" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Bem-vindo de volta</p>
          <p className="truncate text-lg font-bold">Olá, {primeiroNome}</p>
        </div>
        <SeletorTema className="hidden sm:inline-flex" />
        <Button asChild variant="outline" size="icon">
          <NavLink to="/membro/configuracoes" aria-label="Configurações">
            <SettingsIcon />
          </NavLink>
        </Button>
        <Button variant="outline" size="icon" aria-label="Sair" onClick={() => void sair()}>
          <LogOutIcon />
        </Button>
      </header>

      {ehRH && (
        <NavLink
          to="/rh"
          className="mb-4 flex items-center justify-between gap-3 rounded-full border bg-card py-1.5 pr-1.5 pl-4 text-sm"
        >
          <span className="text-muted-foreground">Você está em <strong className="text-foreground">Minhas horas</strong></span>
          <span className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 font-semibold text-primary-foreground">
            <LayoutDashboardIcon className="size-4" /> Painel do RH
          </span>
        </NavLink>
      )}

      <main className="flex flex-1 flex-col gap-4">
        <Outlet />
      </main>

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-4 z-30 mx-auto flex w-[calc(100%-2rem)] max-w-md items-center justify-between rounded-full border bg-card p-1.5 shadow-[0_10px_30px_rgb(30_27_57/0.12)]"
      >
        {ABAS.map(({ para, rotulo, icone: Icone, fim }) => (
          <NavLink
            key={para}
            to={para}
            end={fim}
            className={({ isActive }) =>
              cn(
                'flex h-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold text-muted-foreground transition-colors',
                isActive ? 'bg-primary px-4 text-primary-foreground' : 'hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icone className="size-5" />
                <span className={cn(!isActive && 'sr-only')}>{rotulo}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-6 flex flex-col items-center gap-2 text-xs text-muted-foreground sm:hidden">
        <BotaoInstalarApp />
        <span className="flex items-center gap-2">
          <LogoIcone className="size-5" /> AstroClock · <SeletorTema />
        </span>
      </div>
    </div>
  )
}

function PainelMembro() {
  const { eu, perfil } = useSessao()
  const ehDesktop = useEhDesktop()
  const primeiroNome = eu.nome.split(' ')[0]
  const ehRH = perfil === 'rh'

  return (
    <ProvedorPresenca>
      {ehDesktop ? (
        <PainelMembroDesktop primeiroNome={primeiroNome} ehRH={ehRH} />
      ) : (
        <PainelMembroCelular nome={eu.nome} email={eu.email} primeiroNome={primeiroNome} ehRH={ehRH} />
      )}
    </ProvedorPresenca>
  )
}

export default PainelMembro
