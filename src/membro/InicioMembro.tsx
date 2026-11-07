import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BuildingIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LaptopIcon,
  MapPinIcon,
  MapPinOffIcon,
  SigmaIcon,
  TrophyIcon,
  UsersIcon,
} from 'lucide-react'
import { horasPorDia, minhaPosicaoNoRanking, progressoDaSemana, progressoDoMes } from '@/compartilhado/api/progresso'
import { quemEstaNaSede } from '@/compartilhado/api/presenca'
import {
  diasCurtos,
  formatarHoras,
  hoje,
  mesAtual,
  rotuloMes,
  rotuloSemana,
  semanaAtual,
  somarDias,
  somarMeses,
  tempoDecorrido,
} from '@/compartilhado/datas'
import type { HorasDoDia, PosicaoRanking, ProgressoSemana } from '@/compartilhado/tipos'
import { AvatarMembro } from '@/compartilhado/ui/AvatarMembro'
import { CapsuleBarChart } from '@/compartilhado/ui/CapsuleBarChart'
import { CartaoSemana, PilulaSituacao, situacaoDaSemana } from '@/compartilhado/ui/CartaoSemana'
import { Carregavel, useCarregar, type Carregamento } from '@/compartilhado/ui/demo'
import { Horas } from '@/compartilhado/ui/Horas'
import { KpiCard } from '@/compartilhado/ui/KpiCard'
import { Button } from '@/compartilhado/ui/shadcn/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/compartilhado/ui/shadcn/card'
import { Skeleton } from '@/compartilhado/ui/shadcn/skeleton'
import { useEhDesktop } from '@/compartilhado/ui/useEhDesktop'
import { cn } from '@/compartilhado/ui/utils'
import { CartaoCronometro } from './CartaoCronometro'
import { usePresenca } from './usePresenca'

type Carga<T> = Carregamento<T> & { recarregar: () => void }

const COR_SITUACAO = {
  cumpriu: 'bg-sucesso-fundo text-sucesso border-sucesso/30',
  andamento: 'bg-alerta-fundo text-alerta border-alerta/30',
  naoCumpriu: 'bg-perigo-fundo text-perigo border-perigo/30',
  dispensada: 'bg-secondary text-secondary-foreground border-primary/20',
  futura: 'bg-muted text-muted-foreground border-transparent',
}

function BarrasDeTempo({ progresso }: { progresso?: ProgressoSemana }) {
  const t = tempoDecorrido()
  const pctMeta = progresso && progresso.metaTotal > 0 ? Math.min(100, Math.round((progresso.horasTotal / progresso.metaTotal) * 100)) : null
  const linhas = [
    { rotulo: 'Dia', valor: t.dia },
    { rotulo: 'Semana', valor: t.semana },
    { rotulo: 'Mês', valor: t.mes },
    { rotulo: 'Ano', valor: t.ano },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quanto do tempo já passou</CardTitle>
        <CardDescription>Compare com o quanto você já fez da meta.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {linhas.map((l) => (
          <div key={l.rotulo} className="grid grid-cols-[56px_1fr_40px] items-center gap-3 text-sm">
            <span className="text-muted-foreground">{l.rotulo}</span>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-online" style={{ width: `${l.valor}%` }} />
            </div>
            <span className="text-right font-semibold tabular-nums">{l.valor}%</span>
          </div>
        ))}
        {pctMeta !== null && (
          <p className="rounded-2xl bg-secondary px-3 py-2 text-xs text-secondary-foreground">
            Já passou <strong>{t.semana}%</strong> da semana e você fez <strong>{pctMeta}%</strong> da meta total.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function GradeDoMes({ selecionada, onSelecionar, dica }: { selecionada: string; onSelecionar: (s: string) => void; dica: string }) {
  const [mes, setMes] = useState(mesAtual())
  const carga = useCarregar(() => progressoDoMes(mes), [mes])
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Semanas do mês</CardTitle>
        <CardDescription>{rotuloMes(mes)}</CardDescription>
        <CardAction className="flex gap-1">
          <Button variant="outline" size="icon-sm" aria-label="Mês anterior" onClick={() => setMes(somarMeses(mes, -1))}>
            <ChevronLeftIcon />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Próximo mês" onClick={() => setMes(somarMeses(mes, 1))}>
            <ChevronRightIcon />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Carregavel
          carga={carga}
          esqueleto={<Skeleton className="h-20 rounded-2xl" />}
          vazio={{ titulo: 'Nenhuma semana neste mês' }}
          ehVazio={(d) => d.length === 0}
        >
          {(semanas) => (
            <div className="grid grid-cols-5 gap-2">
              {semanas.map((s) => {
                const situacao = situacaoDaSemana(s)
                return (
                  <button
                    key={s.semana}
                    type="button"
                    onClick={() => onSelecionar(s.semana)}
                    aria-pressed={s.semana === selecionada}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-2xl border px-1 py-2.5 text-xs font-semibold transition-all',
                      COR_SITUACAO[situacao],
                      s.semana === selecionada && 'ring-2 ring-primary ring-offset-2 ring-offset-card',
                    )}
                    title={rotuloSemana(s.semana)}
                  >
                    <span className="text-[10px] font-medium opacity-75">{rotuloSemana(s.semana).split(' – ')[0]}</span>
                    <span className="tabular-nums">{Math.round(s.horasTotal)}h</span>
                  </button>
                )
              })}
            </div>
          )}
        </Carregavel>
        <p className="mt-3 text-xs text-muted-foreground">{dica}</p>
      </CardContent>
    </Card>
  )
}

function CartaoSede({ comBotao = true }: { comBotao?: boolean }) {
  const { naSede, enviando, alternar } = usePresenca()
  const carga = useCarregar(() => quemEstaNaSede(), [naSede])
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quem está na sede agora</CardTitle>
        <CardAction>
          <Button variant="link" size="sm" asChild>
            <Link to="/membro/sede">Ver todos</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Carregavel
          carga={carga}
          esqueleto={<Skeleton className="h-14 rounded-2xl" />}
          vazio={{ titulo: 'Ninguém na sede agora' }}
          ehVazio={(d) => d.length === 0}
        >
          {(lista) => (
            <div className="flex flex-wrap items-center gap-3">
              {lista.slice(0, 6).map((p) => (
                <div key={p.membroId} className="flex w-14 shrink-0 flex-col items-center gap-1">
                  <AvatarMembro nome={p.nome} className="size-12" />
                  <span className="w-full truncate text-center text-[11px] text-muted-foreground">{p.nome.split(' ')[0]}</span>
                </div>
              ))}
              {lista.length > 6 && (
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                  +{lista.length - 6}
                </span>
              )}
            </div>
          )}
        </Carregavel>
        {comBotao && (
          <Button size="lg" variant={naSede ? 'outline' : 'default'} onClick={() => void alternar()} disabled={enviando || naSede === null}>
            {naSede ? <MapPinOffIcon data-icon="inline-start" /> : <MapPinIcon data-icon="inline-start" />}
            {naSede ? 'Saí da sede' : 'Estou na sede'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function CartaoHorasPorDia({
  semana,
  progresso,
  porDia,
  altura,
}: {
  semana: string
  progresso: Carga<ProgressoSemana>
  porDia: Carga<HorasDoDia[]>
  altura?: number
}) {
  const hojeData = hoje()
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Horas por dia</CardTitle>
        <CardDescription>{rotuloSemana(semana)}</CardDescription>
        {progresso.status === 'conteudo' && (
          <CardAction>
            <PilulaSituacao situacao={situacaoDaSemana(progresso.dados)} />
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        <Carregavel
          carga={porDia}
          esqueleto={<Skeleton className="h-48 rounded-2xl" />}
          vazio={{ titulo: 'Nenhuma hora nesta semana', descricao: 'Use o cronômetro ou lance horas na aba Registros.' }}
          ehVazio={(d) => d.every((x) => x.horasTotal === 0)}
        >
          {(dias) => (
            <CapsuleBarChart
              altura={altura}
              dias={dias.map((d, i) => ({
                rotulo: diasCurtos[i],
                sede: d.horasSede,
                online: Math.max(0, d.horasTotal - d.horasSede),
                ativo: d.dia === hojeData,
                balao: d.dia === hojeData ? 'Hoje' : undefined,
              }))}
            />
          )}
        </Carregavel>
      </CardContent>
    </Card>
  )
}

function CartaoRanking({ posicao }: { posicao: Carga<PosicaoRanking> }) {
  return (
    <Carregavel carga={posicao} esqueleto={<Skeleton className="h-32 rounded-[24px]" />}>
      {(p) => (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sua posição no ranking</CardTitle>
            <CardDescription>{rotuloMes(mesAtual())} · por horas totais</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 rounded-2xl bg-secondary p-4">
              <span className="flex items-center gap-1.5 text-xs font-medium text-secondary-foreground">
                <TrophyIcon className="size-3.5" /> Na EJ
              </span>
              <span className="text-2xl font-bold">
                {p.posicaoEJ}º <span className="text-sm font-medium text-muted-foreground">de {p.totalEJ}</span>
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-2xl bg-muted p-4">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <UsersIcon className="size-3.5" /> No setor
              </span>
              <span className="text-2xl font-bold">
                {p.posicaoSetor}º <span className="text-sm font-medium text-muted-foreground">de {p.totalSetor}</span>
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </Carregavel>
  )
}

// Variação em horas contra a semana anterior, para a pílula do KPI.
function variacao(atual: number, anterior?: number) {
  if (anterior === undefined) return undefined
  const dif = atual - anterior
  return { texto: `${formatarHoras(Math.abs(dif))} vs. anterior`, positiva: dif >= 0 }
}

function frasePara(valor: number, meta: number, nome: string): string {
  if (meta === 0) return `Sem exigência de ${nome} nesta semana`
  if (valor >= meta) return `Meta de ${nome} batida`
  return `Faltam ${formatarHoras(meta - valor)} para a meta de ${nome}`
}

function pctDaMeta(valor: number, meta: number): string {
  return meta > 0 ? `${Math.min(100, Math.round((valor / meta) * 100))}% da meta` : 'Não exigida'
}

function InicioMembro() {
  const ehDesktop = useEhDesktop()
  const [semana, setSemana] = useState(semanaAtual())
  const [versao, setVersao] = useState(0)
  const progresso = useCarregar(() => progressoDaSemana(semana), [semana, versao])
  const anterior = useCarregar(() => progressoDaSemana(somarDias(semana, -7)), [semana, versao])
  const porDia = useCarregar(() => horasPorDia(semana), [semana, versao])
  const posicao = useCarregar(() => minhaPosicaoNoRanking(mesAtual()), [versao])
  const ehAtual = semana === semanaAtual()
  const tempo = <BarrasDeTempo progresso={progresso.status === 'conteudo' && ehAtual ? progresso.dados : undefined} />
  const cronometro = <CartaoCronometro preencher={ehDesktop} onMudou={() => setVersao((v) => v + 1)} />

  // Computador: dashboard no estilo da Visão geral do RH.
  if (ehDesktop) {
    const kpiEsqueleto = <Skeleton className="h-40 rounded-[24px]" />
    const ant = anterior.status === 'conteudo' ? anterior.dados : undefined
    return (
      <>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            Semana de <strong className="text-foreground">{rotuloSemana(semana)}</strong>
            {progresso.status === 'conteudo' && <PilulaSituacao situacao={situacaoDaSemana(progresso.dados)} />}
          </p>
          {!ehAtual && (
            <Button variant="outline" size="sm" onClick={() => setSemana(semanaAtual())}>
              Voltar para a semana atual
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <Carregavel carga={progresso} esqueleto={kpiEsqueleto}>
            {(p) => (
              <KpiCard
                titulo="Horas na sede"
                valor={
                  <>
                    <Horas valor={p.horasSede} />
                    {p.metaSede > 0 && <span className="text-lg font-semibold text-muted-foreground"> / {formatarHoras(p.metaSede)}</span>}
                  </>
                }
                variacao={variacao(p.horasSede, ant?.horasSede)}
                comparacao={frasePara(p.horasSede, p.metaSede, 'sede')}
                linhas={[
                  { icone: BuildingIcon, texto: pctDaMeta(p.horasSede, p.metaSede) },
                  { icone: LaptopIcon, texto: 'Online não compensa a sede' },
                ]}
              />
            )}
          </Carregavel>
          <Carregavel carga={progresso} esqueleto={kpiEsqueleto}>
            {(p) => (
              <KpiCard
                titulo="Horas no total"
                valor={
                  <>
                    <Horas valor={p.horasTotal} />
                    <span className="text-lg font-semibold text-muted-foreground"> / {formatarHoras(p.metaTotal)}</span>
                  </>
                }
                variacao={variacao(p.horasTotal, ant?.horasTotal)}
                comparacao={frasePara(p.horasTotal, p.metaTotal, 'total')}
                linhas={[
                  { icone: SigmaIcon, texto: pctDaMeta(p.horasTotal, p.metaTotal) },
                  { icone: LaptopIcon, texto: `${formatarHoras(Math.max(0, p.horasTotal - p.horasSede))} online` },
                ]}
              />
            )}
          </Carregavel>
          <div className="lg:col-span-2 xl:col-span-1">
          <Carregavel carga={posicao} esqueleto={kpiEsqueleto}>
            {(p) => (
              <KpiCard
                titulo="Posição no ranking"
                valor={
                  <>
                    {p.posicaoEJ}º<span className="text-lg font-semibold text-muted-foreground"> de {p.totalEJ}</span>
                  </>
                }
                comparacao={`Na EJ, em ${rotuloMes(mesAtual()).toLowerCase()}`}
                linhas={[
                  { icone: UsersIcon, texto: `${p.posicaoSetor}º de ${p.totalSetor} no setor` },
                  { icone: TrophyIcon, texto: 'Por horas totais' },
                ]}
              />
            )}
          </Carregavel>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_400px]">
          <CartaoHorasPorDia semana={semana} progresso={progresso} porDia={porDia} altura={220} />
          {cronometro}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <GradeDoMes selecionada={semana} onSelecionar={setSemana} dica="Clique numa semana para ver os números dela acima." />
          {tempo}
          <div className="lg:col-span-2 xl:col-span-1">
            <CartaoSede comBotao={false} />
          </div>
        </div>
      </>
    )
  }

  // Celular: cartões empilhados. No tablet, em duas colunas.
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Carregavel carga={progresso} esqueleto={<Skeleton className="h-64 rounded-[24px]" />}>
        {(p) => (
          <div className="flex flex-col gap-2">
            <CartaoSemana progresso={p} />
            {!ehAtual && (
              <Button variant="link" size="sm" className="self-center" onClick={() => setSemana(semanaAtual())}>
                Voltar para a semana atual
              </Button>
            )}
          </div>
        )}
      </Carregavel>
      {cronometro}
      <CartaoHorasPorDia semana={semana} progresso={progresso} porDia={porDia} />
      <GradeDoMes selecionada={semana} onSelecionar={setSemana} dica="Toque numa semana para ver o detalhe dela no cartão acima." />
      <CartaoRanking posicao={posicao} />
      {tempo}
      <div className="md:col-span-2">
        <CartaoSede />
      </div>
    </div>
  )
}

export default InicioMembro
