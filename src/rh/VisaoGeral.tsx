import { lazy, Suspense, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRightIcon,
  BuildingIcon,
  CalendarDaysIcon,
  CircleAlertIcon,
  FileTextIcon,
  ShieldCheckIcon,
  TimerIcon,
  TriangleAlertIcon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react'
import {
  abaixoDaMeta,
  cronometrosEmRevisao,
  listarRequerimentos,
  mediasDaSemana,
  percentualDaSemana,
  progressoDeMembro,
  resumoDaSemana,
  semanasSeguidasAbaixo,
} from '@/compartilhado/api/rh'
import { listarMembros, listarSetores } from '@/compartilhado/api/membros'
import { veRequerimentos } from '@/compartilhado/perfis'
import type { Perfil } from '@/compartilhado/tipos'
import { diaMes, formatarHoras, rotuloSemana, semanaAtual, somarDias } from '@/compartilhado/datas'
import { AvatarMembro } from '@/compartilhado/ui/AvatarMembro'
import { Carregavel, useCarregar } from '@/compartilhado/ui/demo'
import { Horas } from '@/compartilhado/ui/Horas'
import { KpiCard } from '@/compartilhado/ui/KpiCard'
import { useSessao } from '@/compartilhado/ui/RotaProtegida'
import { useEhDesktop } from '@/compartilhado/ui/useEhDesktop'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/compartilhado/ui/shadcn/select'
import { Button } from '@/compartilhado/ui/shadcn/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/compartilhado/ui/shadcn/card'
import { Skeleton } from '@/compartilhado/ui/shadcn/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/compartilhado/ui/shadcn/table'
import { StatusPill } from '@/compartilhado/ui/StatusPill'
import { cn } from '@/compartilhado/ui/utils'
import { SeletorSemana } from './SeletorSemana'

// Os gráficos (recharts) são o pacote mais pesado do site: só são baixados no computador, quando aparecem.
const AreaChartCard = lazy(() => import('@/compartilhado/ui/AreaChartCard').then((m) => ({ default: m.AreaChartCard })))
const DonutCard = lazy(() => import('@/compartilhado/ui/DonutCard').then((m) => ({ default: m.DonutCard })))
const esqueletoGrafico = <Skeleton className="h-80 rounded-[24px]" />

const SEMANAS_NO_GRAFICO = 8

// Sem setor, a EJ toda. Para o diretor de setor, a API já limita ao setor dele.
async function resumoGeral(semana: string, setor?: string) {
  const anterior = somarDias(semana, -7)
  const [pct, pctAnterior, resumo, resumoAnterior, membros, medias, mediasAnteriores] = await Promise.all([
    percentualDaSemana(semana, setor),
    percentualDaSemana(anterior, setor),
    resumoDaSemana(semana, setor),
    resumoDaSemana(anterior, setor),
    listarMembros(),
    mediasDaSemana(semana, setor),
    mediasDaSemana(anterior, setor),
  ])
  const contar = (r: typeof resumo) => ({
    cumpriu: r.filter((x) => x.cumpriu).length,
    dispensados: r.filter((x) => x.dispensada).length,
    abaixo: r.filter((x) => !x.cumpriu && !x.dispensada).length,
  })
  // Cadastrados durante a semana ainda não contam (a meta começa na semana seguinte).
  const novos = membros.filter(
    (m) => m.ativo && (!setor || m.setor === setor) && m.dataEntrada >= semana && m.dataEntrada <= somarDias(semana, 6),
  ).length
  return { pct, pctAnterior, ...contar(resumo), anterior: contar(resumoAnterior), novos, medias, mediasAnteriores }
}

async function serieDePercentuais(semana: string, setor?: string) {
  const semanas = Array.from({ length: SEMANAS_NO_GRAFICO }, (_, i) => somarDias(semana, -7 * (SEMANAS_NO_GRAFICO - 1 - i)))
  const [atuais, anteriores] = await Promise.all([
    Promise.all(semanas.map((s) => percentualDaSemana(s, setor))),
    Promise.all(semanas.map((s) => percentualDaSemana(somarDias(s, -7 * SEMANAS_NO_GRAFICO), setor))),
  ])
  return semanas.map((s, i) => ({ rotulo: diaMes(s), valor: atuais[i], comparacao: anteriores[i] }))
}

async function quemFicouAbaixo(semana: string, setor?: string) {
  const [abaixo, seguidos] = await Promise.all([abaixoDaMeta(semana, setor), semanasSeguidasAbaixo(semana)])
  const seguidasPorId = new Map(seguidos.map((s) => [s.membro.id, s.semanasSeguidas]))
  // A meta de cada um na semana (pedido de só remoto aprovado zera a de sede).
  const progressos = await Promise.all(abaixo.map((r) => progressoDeMembro(r.membro.id, semana)))
  return {
    linhas: abaixo
      .map((r, i) => ({ ...r, meta: progressos[i], semanasSeguidas: seguidasPorId.get(r.membro.id) ?? 1 }))
      .sort((a, b) => b.semanasSeguidas - a.semanasSeguidas || a.membro.nome.localeCompare(b.membro.nome)),
  }
}

// O diretor de setor não vê requerimentos.
async function pendencias(perfil: Perfil) {
  const [requerimentos, cronometros] = await Promise.all([
    veRequerimentos(perfil) ? listarRequerimentos('pendente') : Promise.resolve([]),
    cronometrosEmRevisao(),
  ])
  return { requerimentos, cronometros }
}

function variacaoDeHoras(atual: number, anterior: number) {
  const diferenca = Math.round((atual - anterior) * 10) / 10
  return { texto: formatarHoras(Math.abs(diferenca)), positiva: diferenca >= 0 }
}

function VisaoGeral() {
  const { perfil } = useSessao()
  const ehDesktop = useEhDesktop()
  const navigate = useNavigate()
  // Padrão: a última semana encerrada. A semana atual ainda está em andamento.
  const [semana, setSemana] = useState(somarDias(semanaAtual(), -7))
  // RH e presidente: a EJ toda ou um setor. O diretor de setor já vê só o dele.
  const [setor, setSetor] = useState('todos')
  const filtro = setor === 'todos' ? undefined : setor
  const escolheSetor = perfil !== 'diretor_setor'
  const setores = useCarregar(() => listarSetores(), [])
  const resumo = useCarregar(() => resumoGeral(semana, filtro), [semana, filtro])
  const serie = useCarregar(() => serieDePercentuais(semana, filtro), [semana, filtro])
  const abaixo = useCarregar(() => quemFicouAbaixo(semana, filtro), [semana, filtro])
  const pend = useCarregar(() => pendencias(perfil), [perfil])
  const comRequerimentos = veRequerimentos(perfil)
  const emAndamento = semana === semanaAtual()

  const kpiEsqueleto = <Skeleton className="h-40 rounded-[24px]" />

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Semana de <strong className="text-foreground">{rotuloSemana(semana)}</strong>
          {emAndamento && ' · em andamento'}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {escolheSetor && (
            <Select value={setor} onValueChange={setSetor}>
              <SelectTrigger size="sm" aria-label="Setor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="todos">Toda a EJ</SelectItem>
                  {(setores.atual ?? []).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
          <SeletorSemana valor={semana} onMudar={setSemana} />
        </div>
      </div>

      {/* 4 cartões em telas largas; sem requerimentos (diretor de setor), 3. */}
      <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2', comRequerimentos ? '2xl:grid-cols-4' : 'xl:grid-cols-3')}>
        <Carregavel carga={resumo} esqueleto={kpiEsqueleto}>
          {(r) => {
            const diferenca = Math.round((r.pct - r.pctAnterior) * 10) / 10
            const pessoas = r.cumpriu - r.anterior.cumpriu
            return (
              <KpiCard
                titulo="Cumpriram a meta"
                valor={`${r.pct.toLocaleString('pt-BR')}%`}
                variacao={{ texto: `${Math.abs(diferenca).toLocaleString('pt-BR')} p.p.`, positiva: diferenca >= 0 }}
                comparacao={
                  pessoas === 0
                    ? 'Mesmo número de pessoas que a semana anterior'
                    : `${Math.abs(pessoas)} ${Math.abs(pessoas) === 1 ? 'pessoa' : 'pessoas'} a ${pessoas > 0 ? 'mais' : 'menos'} que a semana anterior`
                }
                linhas={[
                  { icone: CircleAlertIcon, texto: `${r.abaixo} abaixo da meta` },
                  { icone: ShieldCheckIcon, texto: `${r.dispensados} dispensados (fora da conta)` },
                  { icone: UserPlusIcon, texto: `${r.novos} novos (contam na próxima)` },
                ]}
              />
            )
          }}
        </Carregavel>

        <Carregavel carga={resumo} esqueleto={kpiEsqueleto}>
          {(r) => (
            <KpiCard
              titulo="Média de horas por membro"
              valor={formatarHoras(r.medias.mediaTotal)}
              variacao={variacaoDeHoras(r.medias.mediaTotal, r.mediasAnteriores.mediaTotal)}
              comparacao="Total da semana, sem contar os dispensados"
              linhas={[
                { icone: BuildingIcon, texto: `${formatarHoras(r.medias.mediaSede)} na sede, em média` },
                { icone: CalendarDaysIcon, texto: `${formatarHoras(r.medias.mediaDiaria)} por dia útil (÷ 5)` },
              ]}
            />
          )}
        </Carregavel>

        {comRequerimentos && (
        <Carregavel carga={pend} esqueleto={kpiEsqueleto}>
          {(p) => (
            <KpiCard
              titulo="Requerimentos pendentes"
              valor={p.requerimentos.length}
              comparacao={p.requerimentos.length ? `O mais antigo é de ${p.requerimentos[p.requerimentos.length - 1].nomeMembro}` : 'Nada para responder'}
              linhas={[
                { icone: FileTextIcon, texto: `${p.requerimentos.filter((q) => q.tipo === 'so_remoto').length} só remoto` },
                { icone: UsersIcon, texto: `${p.requerimentos.filter((q) => q.tipo === 'ausencia_total').length} ausência total` },
              ]}
              acao={
                <Button variant="outline" size="sm" asChild>
                  <Link to="/rh/requerimentos">
                    {perfil === 'diretor_rh' ? 'Responder' : 'Ver'} <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
              }
            />
          )}
        </Carregavel>
        )}

        {/* Com 2 colunas e 3 cartões, o último ocupa a linha inteira em vez de ficar sozinho. */}
        <div className={cn(!comRequerimentos && 'md:col-span-2 xl:col-span-1')}>
        <Carregavel carga={pend} esqueleto={kpiEsqueleto}>
          {(p) => (
            <KpiCard
              titulo="Cronômetros em revisão"
              valor={p.cronometros.length}
              comparacao="Pararam sozinhos após 10h e não contam na meta até a revisão"
              linhas={[{ icone: TimerIcon, texto: `${formatarHoras(p.cronometros.length * 10)} aguardando` }]}
              acao={
                <Button variant="outline" size="sm" asChild>
                  <Link to="/rh/cronometros">
                    Revisar <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
              }
            />
          )}
        </Carregavel>
        </div>
      </div>

      {/* Gráficos: só no computador. No celular, o painel fica com KPIs, pendências e a lista. */}
      {ehDesktop && (
        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <Carregavel carga={serie} esqueleto={esqueletoGrafico}>
            {(dados) => (
              <Suspense fallback={esqueletoGrafico}>
                <AreaChartCard
                  titulo="% que cumpriu a meta, por semana"
                  descricao={`Últimas ${SEMANAS_NO_GRAFICO} semanas até ${rotuloSemana(semana)}`}
                  dados={dados}
                  formatar={(v) => `${Math.round(v)}%`}
                  rotuloSerie="Período atual"
                  rotuloComparacao={`${SEMANAS_NO_GRAFICO} semanas anteriores`}
                  destaque={dados.length - 1}
                  dominio={[0, 100]}
                />
              </Suspense>
            )}
          </Carregavel>
          <Carregavel carga={resumo} esqueleto={esqueletoGrafico}>
            {(r) => (
              <Suspense fallback={esqueletoGrafico}>
                <DonutCard
                  titulo="Situação da semana"
                  descricao="Membros elegíveis"
                  fatias={[
                    { nome: 'Cumpriu', valor: r.cumpriu, cor: 'var(--sede)' },
                    { nome: 'Abaixo', valor: r.abaixo, cor: 'var(--online)' },
                    { nome: 'Dispensado', valor: r.dispensados, cor: 'var(--muted-foreground)' },
                  ]}
                  valorCentro={`${Math.round(r.pct)}%`}
                  rotuloCentro="cumpriram"
                />
              </Suspense>
            )}
          </Carregavel>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quem ficou abaixo da meta</CardTitle>
          <CardDescription>
            Em vermelho, quem está abaixo há 2 semanas seguidas ou mais. A decisão sobre advertência é do RH ou da diretoria, fora do sistema.
          </CardDescription>
          {abaixo.status === 'conteudo' && (
            <CardAction>
              <StatusPill tom="perigo">
                <TriangleAlertIcon />
                {abaixo.dados.linhas.filter((l) => l.semanasSeguidas >= 2).length} há 2+ semanas
              </StatusPill>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          <Carregavel
            carga={abaixo}
            esqueleto={<Skeleton className="h-64 rounded-2xl" />}
            vazio={{ titulo: 'Todo mundo bateu a meta nesta semana', descricao: 'Ninguém ficou abaixo. Bom trabalho, EJ!' }}
            ehVazio={(d) => d.linhas.length === 0}
          >
            {({ linhas }) => (
              <>
                {/* Celular: cartões */}
                <ul className="flex flex-col gap-2 md:hidden">
                  {linhas.map((l) => (
                    <li key={l.membro.id}>
                      <Link
                        to={`/rh/membros/${l.membro.id}`}
                        className={cn(
                          'flex items-center gap-3 rounded-[20px] border p-3',
                          l.semanasSeguidas >= 2 && 'border-perigo/40 bg-perigo-fundo/50',
                        )}
                      >
                        <AvatarMembro nome={l.membro.nome} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{l.membro.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            Sede {formatarHoras(l.horasSede)}/{formatarHoras(l.meta.metaSede)} · Total {formatarHoras(l.horasTotal)}/
                            {formatarHoras(l.meta.metaTotal)}
                          </p>
                        </div>
                        {l.semanasSeguidas >= 2 && <StatusPill tom="perigo">{l.semanasSeguidas} sem.</StatusPill>}
                      </Link>
                    </li>
                  ))}
                </ul>
                {/* Computador: tabela */}
                <Table className="hidden md:table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Membro</TableHead>
                      <TableHead className="hidden xl:table-cell">Setor</TableHead>
                      <TableHead className="text-right">Sede</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Situação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linhas.map((l) => (
                      <TableRow
                        key={l.membro.id}
                        className={cn('cursor-pointer', l.semanasSeguidas >= 2 && 'bg-perigo-fundo/50 hover:bg-perigo-fundo')}
                        onClick={() => navigate(`/rh/membros/${l.membro.id}`)}
                      >
                        <TableCell>
                          <span className="flex items-center gap-3">
                            <AvatarMembro nome={l.membro.nome} className="size-9" />
                            <span className="font-semibold">{l.membro.nome}</span>
                          </span>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground xl:table-cell">{l.membro.setor}</TableCell>
                        <TableCell className="text-right">
                          <Horas valor={l.horasSede} className={cn(l.horasSede < l.meta.metaSede && 'text-perigo')} />
                          <span className="text-muted-foreground"> / {l.meta.metaSede === 0 ? 'não exigida' : formatarHoras(l.meta.metaSede)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Horas valor={l.horasTotal} className={cn(l.horasTotal < l.meta.metaTotal && 'text-perigo')} />
                          <span className="text-muted-foreground"> / {formatarHoras(l.meta.metaTotal)}</span>
                        </TableCell>
                        <TableCell>
                          {l.semanasSeguidas >= 2 ? (
                            <StatusPill tom="perigo">
                              <TriangleAlertIcon /> {l.semanasSeguidas} semanas seguidas
                            </StatusPill>
                          ) : (
                            <StatusPill tom="alerta">Abaixo nesta semana</StatusPill>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </Carregavel>
        </CardContent>
      </Card>
    </>
  )
}

export default VisaoGeral
