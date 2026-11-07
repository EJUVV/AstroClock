import { CircleCheckIcon, CircleDashedIcon, CircleXIcon, ShieldCheckIcon, CalendarClockIcon } from 'lucide-react'
import { formatarHoras, rotuloSemana, semanaAtual } from '@/compartilhado/datas'
import type { ProgressoSemana } from '@/compartilhado/tipos'
import { MetaBar } from '@/compartilhado/ui/MetaBar'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/compartilhado/ui/shadcn/card'
import { StatusPill } from '@/compartilhado/ui/StatusPill'
import { cn } from '@/compartilhado/ui/utils'

export type SituacaoSemana = 'cumpriu' | 'andamento' | 'naoCumpriu' | 'dispensada' | 'futura'

// docs/regras-de-negocio.md, seção 11: encerrada sem a meta = vermelho; em andamento = "ainda não cumpriu".
export function situacaoDaSemana(p: ProgressoSemana): SituacaoSemana {
  const atual = semanaAtual()
  if (p.semana > atual) return 'futura'
  if (p.dispensada) return 'dispensada'
  if (p.cumpriu) return 'cumpriu'
  return p.semana === atual ? 'andamento' : 'naoCumpriu'
}

export function PilulaSituacao({ situacao }: { situacao: SituacaoSemana }) {
  switch (situacao) {
    case 'cumpriu':
      return <StatusPill tom="sucesso"><CircleCheckIcon />Cumpriu</StatusPill>
    case 'andamento':
      return <StatusPill tom="alerta"><CircleDashedIcon />Ainda não cumpriu</StatusPill>
    case 'naoCumpriu':
      return <StatusPill tom="perigo"><CircleXIcon />Não cumpriu</StatusPill>
    case 'dispensada':
      return <StatusPill tom="roxo"><ShieldCheckIcon />Dispensada</StatusPill>
    case 'futura':
      return <StatusPill tom="neutro"><CalendarClockIcon />Ainda não começou</StatusPill>
  }
}

function frase(p: ProgressoSemana, s: SituacaoSemana): string {
  const faltaTotal = Math.max(0, p.metaTotal - p.horasTotal)
  const faltaSede = Math.max(0, p.metaSede - p.horasSede)
  if (s === 'dispensada') return 'Ausência total aprovada: esta semana não conta na meta. Você pode continuar registrando.'
  if (s === 'cumpriu') return 'Meta da semana batida. As horas extras entram no total do mês.'
  if (s === 'futura') return `Meta desta semana: ${formatarHoras(p.metaTotal)} no total${p.metaSede > 0 ? ` e ${formatarHoras(p.metaSede)} na sede` : ', sem exigência de sede'}.`
  const partes = []
  if (faltaTotal > 0) partes.push(`${formatarHoras(faltaTotal)} no total`)
  if (faltaSede > 0) partes.push(`${formatarHoras(faltaSede)} na sede`)
  const falta = partes.length ? `Faltam ${partes.join(' e ')}.` : ''
  return s === 'andamento' ? `${falta} Horas online não compensam horas na sede.` : `A semana fechou abaixo da meta. ${falta.replace('Faltam', 'Faltaram')}`
}

export function CartaoSemana({ progresso, titulo }: { progresso: ProgressoSemana; titulo?: string }) {
  const situacao = situacaoDaSemana(progresso)
  return (
    <Card className={cn(situacao === 'naoCumpriu' && 'border-perigo/40 bg-perigo-fundo/40')}>
      <CardHeader>
        <CardTitle className="text-lg">{titulo ?? (progresso.semana === semanaAtual() ? 'Sua semana' : 'Semana')}</CardTitle>
        <CardDescription>{rotuloSemana(progresso.semana)}</CardDescription>
        <CardAction>
          <PilulaSituacao situacao={situacao} />
        </CardAction>
      </CardHeader>
      <CardContent className={cn('flex flex-col gap-4', situacao === 'dispensada' && 'opacity-70')}>
        <MetaBar
          rotulo="Sede"
          cor="sede"
          valor={progresso.horasSede}
          meta={progresso.metaSede}
          textoSemMeta="Sede não exigida nesta semana (férias ou pedido de só remoto aprovado)"
        />
        <MetaBar rotulo="Total (sede + online)" cor="total" valor={progresso.horasTotal} meta={progresso.metaTotal} />
        <p className={cn('text-sm text-muted-foreground', situacao === 'naoCumpriu' && 'font-medium text-perigo')}>
          {frase(progresso, situacao)}
        </p>
      </CardContent>
    </Card>
  )
}
