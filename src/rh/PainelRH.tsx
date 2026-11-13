import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BellIcon, ClockIcon, FileTextIcon, LayoutDashboardIcon, MapPinIcon, SearchIcon, TargetIcon, TimerIcon, TrophyIcon, UsersIcon } from 'lucide-react'
import { cronometrosEmRevisao, listarRequerimentos } from '@/compartilhado/api/rh'
import { veRequerimentos } from '@/compartilhado/perfis'
import type { Membro, Perfil } from '@/compartilhado/tipos'
import { BotaoSedeTopo, ProvedorPresenca } from '@/membro/usePresenca'
import { LayoutPainel, type ItemMenu, type TituloPagina } from '@/compartilhado/ui/LayoutPainel'
import { useSessao } from '@/compartilhado/ui/RotaProtegida'
import { Button } from '@/compartilhado/ui/shadcn/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/compartilhado/ui/shadcn/popover'

// O diretor de setor vê só o próprio setor; o presidente e o RH veem a EJ toda.
function titulos(perfil: Perfil, eu: Membro): TituloPagina[] {
  const alvo = perfil === 'diretor_setor' ? `o setor ${eu.setor}` : 'a EJ'
  const membros =
    perfil === 'diretor_rh' ? 'Cadastre, encontre e desative membros.'
    : perfil === 'rh' ? 'Encontre e desative membros.'
    : perfil === 'diretor_setor' ? `Os membros de ${eu.setor}.`
    : 'Encontre os membros da EJ.'
  return [
    { prefixo: '/rh/membros/', titulo: 'Detalhe do membro', subtitulo: 'Semanas, registros e requerimentos de uma pessoa.' },
    { prefixo: '/rh/membros', titulo: 'Membros', subtitulo: membros },
    { prefixo: '/rh/requerimentos', titulo: 'Requerimentos', subtitulo: 'Pedidos de só remoto e de ausência total.' },
    { prefixo: '/rh/cronometros', titulo: 'Revisão de cronômetros', subtitulo: 'Cronômetros que pararam sozinhos após 10h.' },
    { prefixo: '/rh/ranking', titulo: 'Ranking mensal', subtitulo: 'Horas totais, com desempate pelas horas na sede.' },
    { prefixo: '/rh/metas', titulo: 'Metas', subtitulo: 'Meta semanal de horas, igual para todos.' },
    { prefixo: '/rh/configuracoes', titulo: 'Configurações', subtitulo: 'Sua foto, aparência e preferências.' },
    { prefixo: '/rh/sede', titulo: 'Sede', subtitulo: 'Veja quem está lá agora e avise quando você chegar.' },
    { prefixo: '/rh', titulo: 'Visão geral', subtitulo: `Como ${alvo} está indo na meta semanal.` },
  ]
}

const SECAO: Record<Perfil, string> = {
  membro: '',
  rh: 'Painel do RH',
  diretor_rh: 'Painel do RH',
  presidente: 'Presidência',
  diretor_setor: 'Painel do setor',
}

function PainelRH() {
  const { perfil, eu } = useSessao()
  const location = useLocation()
  const navigate = useNavigate()
  const [pendentes, setPendentes] = useState(0)
  const [emRevisao, setEmRevisao] = useState(0)

  useEffect(() => {
    if (veRequerimentos(perfil)) listarRequerimentos('pendente').then((l) => setPendentes(l.length)).catch(() => {})
    cronometrosEmRevisao().then((l) => setEmRevisao(l.length)).catch(() => {})
  }, [location.pathname, perfil])

  const itens: ItemMenu[] = [
    { para: '/rh', rotulo: 'Visão geral', icone: LayoutDashboardIcon, fim: true },
    { para: '/rh/membros', rotulo: 'Membros', icone: UsersIcon },
    ...(veRequerimentos(perfil) ? [{ para: '/rh/requerimentos', rotulo: 'Requerimentos', icone: FileTextIcon, contador: pendentes }] : []),
    { para: '/rh/cronometros', rotulo: 'Revisão de cronômetros', icone: TimerIcon, contador: emRevisao },
    { para: '/rh/ranking', rotulo: 'Ranking', icone: TrophyIcon },
    ...(perfil === 'diretor_rh' ? [{ para: '/rh/metas', rotulo: 'Metas', icone: TargetIcon }] : []),
    { para: '/rh/sede', rotulo: 'Sede', icone: MapPinIcon },
  ]

  return (
    <ProvedorPresenca>
    <LayoutPainel
      secao={SECAO[perfil]}
      inicio="/rh"
      itens={itens}
      itensRodape={perfil === 'rh' ? [{ para: '/membro', rotulo: 'Minhas horas', icone: ClockIcon }] : []}
      titulos={titulos(perfil, eu)}
      acoesTopo={
        <>
          <BotaoSedeTopo />
          <Button variant="outline" size="icon" className="hidden sm:flex" aria-label="Buscar membro" onClick={() => navigate('/rh/membros?busca=1')}>
            <SearchIcon />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Notificações" className="relative">
                <BellIcon />
                {pendentes + emRevisao > 0 && <span className="absolute top-2 right-2.5 size-2 rounded-full bg-perigo ring-2 ring-card" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 rounded-2xl">
              <p className="mb-2 text-sm font-semibold">Pendências</p>
              <ul className="flex flex-col gap-1 text-sm">
                {veRequerimentos(perfil) && (
                  <li>
                    <Link to="/rh/requerimentos" className="flex items-center justify-between rounded-xl px-2 py-2 hover:bg-muted">
                      Requerimentos pendentes <strong>{pendentes}</strong>
                    </Link>
                  </li>
                )}
                <li>
                  <Link to="/rh/cronometros" className="flex items-center justify-between rounded-xl px-2 py-2 hover:bg-muted">
                    Cronômetros em revisão <strong>{emRevisao}</strong>
                  </Link>
                </li>
              </ul>
            </PopoverContent>
          </Popover>
        </>
      }
    >
      <Outlet />
    </LayoutPainel>
    </ProvedorPresenca>
  )
}

export default PainelRH
