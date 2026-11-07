import { useState } from 'react'
import { BuildingIcon, CalendarClockIcon, LockIcon, SigmaIcon } from 'lucide-react'
import { toast } from 'sonner'
import { alterarMetas, listarMetas, metasAtuais } from '@/compartilhado/api/rh'
import { formatarHoras, rotuloSemana, semanaAtual, somarDias } from '@/compartilhado/datas'
import { Carregavel, useCarregar } from '@/compartilhado/ui/demo'
import { EstadoVazio } from '@/compartilhado/ui/EstadoVazio'
import { useSessao } from '@/compartilhado/ui/RotaProtegida'
import { Button } from '@/compartilhado/ui/shadcn/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/compartilhado/ui/shadcn/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/compartilhado/ui/shadcn/field'
import { Input } from '@/compartilhado/ui/shadcn/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/compartilhado/ui/shadcn/select'
import { Skeleton } from '@/compartilhado/ui/shadcn/skeleton'
import { StatusPill } from '@/compartilhado/ui/StatusPill'

function Metas() {
  const { perfil } = useSessao()
  const [versao, setVersao] = useState(0)
  const atual = useCarregar(() => metasAtuais(), [versao])
  const historico = useCarregar(() => listarMetas(), [versao])
  const proximas = Array.from({ length: 16 }, (_, i) => somarDias(semanaAtual(), 7 * (i + 1)))
  const [total, setTotal] = useState('10')
  const [sede, setSede] = useState('5')
  const [inicio, setInicio] = useState(proximas[0])
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (perfil !== 'diretor_rh') {
    return <EstadoVazio icone={LockIcon} titulo="Só o diretor do RH altera as metas" descricao="Peça ao diretor do RH se precisar mudar a meta." />
  }

  async function programar() {
    setErro(null)
    setEnviando(true)
    try {
      await alterarMetas(Number(total), Number(sede), inicio)
      toast.success('Meta programada', { description: `Vale a partir da semana de ${rotuloSemana(inicio)}.` })
      setVersao((v) => v + 1)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  const hojeSemana = semanaAtual()

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_420px]">
      <div className="flex flex-col gap-4">
        <Carregavel carga={atual} esqueleto={<Skeleton className="h-36 rounded-[24px]" />}>
          {(m) => (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card className="cartao-roxo border-transparent">
                <CardContent className="flex flex-col gap-2">
                  <span className="flex items-center gap-2 text-sm text-white/80">
                    <SigmaIcon className="size-4" /> Meta total desta semana
                  </span>
                  <span className="text-4xl font-bold">{formatarHoras(m.horasTotal)}</span>
                  <span className="text-xs text-white/75">Sede + online</span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col gap-2">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BuildingIcon className="size-4" /> Meta de sede desta semana
                  </span>
                  <span className="text-4xl font-bold">{m.horasSede === 0 ? 'Sem exigência' : formatarHoras(m.horasSede)}</span>
                  <span className="text-xs text-muted-foreground">Horas online não compensam a sede</span>
                </CardContent>
              </Card>
            </div>
          )}
        </Carregavel>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Histórico e programadas</CardTitle>
            <CardDescription>Cada semana usa a meta vigente nela. Nada é aplicado para trás.</CardDescription>
          </CardHeader>
          <CardContent>
            <Carregavel carga={historico} esqueleto={<Skeleton className="h-40 rounded-2xl" />}>
              {(lista) => {
                const vigente = lista.find((m) => m.vigenteDesde <= hojeSemana)
                return (
                  <ol className="relative flex flex-col gap-1 border-l-2 border-dashed border-border pl-6">
                    {lista.map((m) => {
                      const futura = m.vigenteDesde > hojeSemana
                      const ehAtual = m === vigente
                      return (
                        <li key={m.vigenteDesde} className="relative py-2">
                          <span
                            className={
                              'absolute top-4 -left-[33px] size-4 rounded-full border-4 border-card ' +
                              (ehAtual ? 'bg-primary' : futura ? 'bg-online' : 'bg-muted-foreground/40')
                            }
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">
                              {formatarHoras(m.horasTotal)} no total · {m.horasSede === 0 ? 'sem sede' : `${formatarHoras(m.horasSede)} na sede`}
                            </span>
                            {ehAtual && <StatusPill tom="sucesso">Vigente</StatusPill>}
                            {futura && (
                              <StatusPill tom="roxo">
                                <CalendarClockIcon /> Programada
                              </StatusPill>
                            )}
                            {!ehAtual && !futura && <StatusPill tom="neutro">Anterior</StatusPill>}
                          </div>
                          <p className="text-xs text-muted-foreground">A partir da semana de {rotuloSemana(m.vigenteDesde)}</p>
                        </li>
                      )
                    })}
                  </ol>
                )
              }}
            </Carregavel>
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-lg">Programar nova meta</CardTitle>
          <CardDescription>Vale para todos os membros, a partir da semana escolhida, até a próxima alteração.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="meta-total">Total (horas)</FieldLabel>
                <Input id="meta-total" type="number" min={1} step={0.5} value={total} onChange={(e) => setTotal(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="meta-sede">Na sede (horas)</FieldLabel>
                <Input id="meta-sede" type="number" min={0} step={0.5} value={sede} onChange={(e) => setSede(e.target.value)} />
              </Field>
            </div>
            <FieldDescription>Use 0 na sede para as férias (ex.: 5h no total e 0h na sede).</FieldDescription>
            <Field>
              <FieldLabel>Começa na semana de</FieldLabel>
              <Select value={inicio} onValueChange={setInicio}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {proximas.map((s, i) => (
                      <SelectItem key={s} value={s}>
                        {rotuloSemana(s)}
                        {i === 0 ? ' (semana que vem)' : ''}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>Só semanas futuras: a atual e as passadas mantêm a meta delas.</FieldDescription>
            </Field>
            {erro && <FieldError>{erro}</FieldError>}
            <Button size="lg" onClick={() => void programar()} disabled={enviando}>
              {enviando ? 'Programando...' : 'Programar meta'}
            </Button>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  )
}

export default Metas
