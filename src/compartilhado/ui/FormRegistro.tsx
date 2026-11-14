import { lazy, Suspense, useEffect, useState } from 'react'
import { BuildingIcon, CalendarDaysIcon, ClockIcon, LaptopIcon, MegaphoneOffIcon, MoonStarIcon } from 'lucide-react'
import { dataEmBrasilia, diaSemanaMes, formatarHoras, hoje, horaDe, instante, somarDias } from '@/compartilhado/datas'
import type { Local, NovoRegistro, Registro } from '@/compartilhado/tipos'
import { BottomSheet } from '@/compartilhado/ui/BottomSheet'
import { Button } from '@/compartilhado/ui/shadcn/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/compartilhado/ui/shadcn/field'
import { Input } from '@/compartilhado/ui/shadcn/input'
import { Textarea } from '@/compartilhado/ui/shadcn/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/compartilhado/ui/shadcn/toggle-group'

// O calendário só é baixado quando alguém precisa dele (fica fora do carregamento inicial).
const carregarCalendario = () => import('./CalendarioData')
const CalendarioData = lazy(() => carregarCalendario().then((m) => ({ default: m.CalendarioData })))

// "09:00" e "12:30" -> 210 minutos. Fim antes do início = passa da meia-noite.
function minutosEntre(das: string, ate: string): number {
  const [h1, m1] = das.split(':').map(Number)
  const [h2, m2] = ate.split(':').map(Number)
  const diferenca = h2 * 60 + m2 - (h1 * 60 + m1)
  return diferenca > 0 ? diferenca : diferenca + 24 * 60
}

// Formulário de registro manual: sempre com início e fim (docs/regras-de-negocio.md, seção 2).
export function FormRegistro({
  aberto,
  onAbertoChange,
  editando,
  limiteDias = 7,
  onSalvar,
}: {
  aberto: boolean
  onAbertoChange: (aberto: boolean) => void
  editando?: Registro | null
  // Membro: só lança de até 7 dias atrás. RH: null (sem limite).
  limiteDias?: number | null
  onSalvar: (dados: NovoRegistro) => Promise<void>
}) {
  const [data, setData] = useState(hoje())
  const [das, setDas] = useState('09:00')
  const [ate, setAte] = useState('12:00')
  const [local, setLocal] = useState<Local>('sede')
  const [descricao, setDescricao] = useState('')
  const [erros, setErros] = useState<{ descricao?: string; geral?: string }>({})
  const [enviando, setEnviando] = useState(false)
  const [calendarioAberto, setCalendarioAberto] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setErros({})
    setCalendarioAberto(false)
    void carregarCalendario() // já vai baixando, para abrir sem espera
    if (editando) {
      setData(dataEmBrasilia(editando.inicio))
      setDas(horaDe(editando.inicio))
      setAte(editando.fim ? horaDe(editando.fim) : '12:00')
      setLocal(editando.local)
      setDescricao(editando.descricao)
    } else {
      setData(hoje())
      setDas('09:00')
      setAte('12:00')
      setLocal('sede')
      setDescricao('')
    }
  }, [aberto, editando])

  const passaMeiaNoite = ate <= das && ate !== ''
  const duracao = das && ate ? minutosEntre(das, ate) : null
  const diaDeHoje = hoje()
  const ontem = somarDias(diaDeHoje, -1)
  const dataMinima = limiteDias ? somarDias(diaDeHoje, -limiteDias) : undefined
  const outroDia = data !== diaDeHoje && data !== ontem
  // Com o calendário aberto, "Outro dia" fica marcado.
  const atalho = calendarioAberto || outroDia ? 'outro' : data === diaDeHoje ? 'hoje' : 'ontem'

  // Clicar no botão que já está marcado chega aqui vazio; esse caso é tratado no onClick de "Outro dia".
  function escolherAtalho(v: string) {
    if (!v) return
    if (v === 'outro') return setCalendarioAberto(true)
    setData(v === 'hoje' ? diaDeHoje : ontem)
    setCalendarioAberto(false)
  }

  async function salvar() {
    if (!descricao.trim()) {
      setErros({ descricao: 'A descrição é obrigatória' })
      return
    }
    setEnviando(true)
    setErros({})
    try {
      const fimData = passaMeiaNoite ? somarDias(data, 1) : data
      await onSalvar({ inicio: instante(data, das), fim: instante(fimData, ate), local, descricao })
      onAbertoChange(false)
    } catch (e) {
      setErros({ geral: (e as Error).message })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <BottomSheet
      aberto={aberto}
      onAbertoChange={onAbertoChange}
      titulo={editando ? 'Editar registro' : 'Lançar horas'}
      descricao={limiteDias ? `Você pode lançar horas dos últimos ${limiteDias} dias.` : 'Sem limite de data para o RH.'}
      rodape={
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onAbertoChange(false)} disabled={enviando}>
            Voltar
          </Button>
          <Button className="flex-1" onClick={() => void salvar()} disabled={enviando}>
            {enviando ? 'Salvando...' : 'Salvar registro'}
          </Button>
        </div>
      }
    >
      <FieldGroup className="gap-4">
        <p className="flex items-center gap-2 rounded-2xl bg-alerta-fundo px-3 py-2.5 text-sm font-semibold text-alerta">
          <MegaphoneOffIcon className="size-4 shrink-0" />
          Não registre reuniões e eventos.
        </p>

        <Field>
          <FieldLabel>Data</FieldLabel>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={2}
            className="w-full"
            value={atalho}
            onValueChange={escolherAtalho}
          >
            <ToggleGroupItem value="hoje" className="flex-1">
              Hoje
            </ToggleGroupItem>
            <ToggleGroupItem value="ontem" className="flex-1">
              Ontem
            </ToggleGroupItem>
            <ToggleGroupItem
              value="outro"
              className="flex-1"
              aria-expanded={calendarioAberto}
              onClick={() => atalho === 'outro' && setCalendarioAberto((a) => !a)}
            >
              <CalendarDaysIcon data-icon="inline-start" /> {outroDia ? diaSemanaMes(data) : 'Outro dia'}
            </ToggleGroupItem>
          </ToggleGroup>
          {calendarioAberto && (
            <Suspense fallback={<div className="h-80 animate-pulse rounded-[20px] border bg-card" />}>
              <CalendarioData
                valor={data}
                min={dataMinima}
                max={diaDeHoje}
                onEscolher={(d) => {
                  setData(d)
                  setCalendarioAberto(false)
                }}
              />
            </Suspense>
          )}
          {!calendarioAberto && !outroDia && <FieldDescription>{diaSemanaMes(data)}</FieldDescription>}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="reg-inicio">Início</FieldLabel>
            <Input id="reg-inicio" type="time" value={das} onChange={(e) => setDas(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="reg-fim">Fim</FieldLabel>
            <Input id="reg-fim" type="time" value={ate} onChange={(e) => setAte(e.target.value)} />
          </Field>
        </div>
        {duracao !== null && (
          <p className="-mt-2 flex items-center gap-1.5 text-sm text-muted-foreground" aria-live="polite">
            <ClockIcon className="size-4 shrink-0" />
            Duração: <strong className="font-semibold text-foreground">{formatarHoras(duracao / 60)}</strong>
          </p>
        )}
        {passaMeiaNoite && (
          <p className="flex items-start gap-2 rounded-2xl bg-secondary px-3 py-2.5 text-xs text-secondary-foreground">
            <MoonStarIcon className="mt-px size-4 shrink-0" />
            Este registro passa da meia-noite. Ele será salvo em duas partes, uma para cada dia.
          </p>
        )}

        <Field>
          <FieldLabel>Local</FieldLabel>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={2}
            value={local}
            onValueChange={(v) => v && setLocal(v as Local)}
          >
            <ToggleGroupItem value="sede">
              <BuildingIcon data-icon="inline-start" /> Sede
            </ToggleGroupItem>
            <ToggleGroupItem value="online">
              <LaptopIcon data-icon="inline-start" /> Online
            </ToggleGroupItem>
          </ToggleGroup>
          <FieldDescription>Horas online não compensam horas na sede.</FieldDescription>
        </Field>

        <Field data-invalid={erros.descricao ? true : undefined}>
          <FieldLabel htmlFor="reg-descricao">O que você fez?</FieldLabel>
          <Textarea
            id="reg-descricao"
            value={descricao}
            onChange={(e) => {
              setDescricao(e.target.value)
              setErros({})
            }}
            placeholder="Ex.: Proposta comercial para a Padaria Dona Lúcia"
            aria-invalid={erros.descricao ? true : undefined}
          />
          {erros.descricao && <FieldError>{erros.descricao}</FieldError>}
        </Field>

        {erros.geral && (
          <p role="alert" className="rounded-2xl bg-perigo-fundo px-3 py-2.5 text-sm font-medium text-perigo">
            {erros.geral}
          </p>
        )}
      </FieldGroup>
    </BottomSheet>
  )
}
