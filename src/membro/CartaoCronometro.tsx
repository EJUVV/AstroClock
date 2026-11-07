import { useEffect, useState } from 'react'
import { BuildingIcon, LaptopIcon, PlayIcon, SquareIcon, TimerIcon } from 'lucide-react'
import { toast } from 'sonner'
import { cronometroAtivo, iniciarCronometro, pararCronometro } from '@/compartilhado/api/cronometro'
import { horaDe } from '@/compartilhado/datas'
import type { Local, Registro } from '@/compartilhado/tipos'
import { useCarregar } from '@/compartilhado/ui/demo'
import { EstadoErro } from '@/compartilhado/ui/EstadoErro'
import { Skeleton } from '@/compartilhado/ui/shadcn/skeleton'
import { cn } from '@/compartilhado/ui/utils'

function relogio(desde: string, agora: number): string {
  const s = Math.max(0, Math.floor((agora - Date.parse(desde)) / 1000))
  const hh = String(Math.floor(s / 3600)).padStart(2, '0')
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

// Cartão de destaque em degradê roxo, como os cartões de crédito do Dutch Bank.
export function CartaoCronometro({ onMudou, preencher }: { onMudou?: () => void; preencher?: boolean }) {
  const carga = useCarregar(() => cronometroAtivo(), [])
  const [ativo, setAtivo] = useState<Registro | null | undefined>(undefined)
  const [local, setLocal] = useState<Local>('sede')
  const [descricao, setDescricao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [agora, setAgora] = useState(() => Date.now())

  const atual = ativo === undefined ? (carga.status === 'conteudo' ? carga.dados : null) : ativo

  useEffect(() => {
    if (!atual) return
    const id = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [atual])

  if (carga.status === 'carregando') return <Skeleton className="h-56 rounded-[24px]" />
  if (carga.status === 'erro') return <EstadoErro mensagem={carga.erro} onTentar={carga.recarregar} />

  async function iniciar() {
    setErro(null)
    if (!descricao.trim()) {
      setErro('Escreva o que você vai fazer')
      return
    }
    setEnviando(true)
    try {
      const novo = await iniciarCronometro(local, descricao)
      setAtivo(novo)
      setAgora(Date.now())
      setDescricao('')
      toast.success('Cronômetro iniciado')
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  async function parar() {
    setEnviando(true)
    try {
      await pararCronometro()
      setAtivo(null)
      toast.success('Registro salvo')
      onMudou?.()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className={cn('cartao-roxo relative overflow-hidden rounded-[24px] p-5 shadow-[0_12px_30px_rgb(123_92_245/0.35)]', preencher && 'h-full')}>
      <div className="pointer-events-none absolute -top-20 -right-14 size-56 rounded-full border-[26px] border-white/10" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 size-48 rounded-full bg-white/8" />
      {/* No computador, o cartão ocupa a altura do gráfico ao lado: a linha do botão vai para baixo. */}
      <div className={cn('relative flex flex-col gap-4', preencher && 'h-full')}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold text-white/85">
            <TimerIcon className="size-4" /> Cronômetro
          </span>
          {atual && (
            <span className="flex items-center gap-1.5 rounded-full bg-white/18 px-2.5 py-1 text-xs font-semibold">
              <span className="size-2 animate-pulse rounded-full bg-[#7CFFB2]" /> Contando
            </span>
          )}
        </div>

        {atual ? (
          <>
            <div>
              <p className="font-mono text-5xl font-bold tracking-tight tabular-nums">{relogio(atual.inicio, agora)}</p>
              <p className="mt-1 truncate text-sm text-white/80">{atual.descricao}</p>
            </div>
            <div className="mt-auto flex items-center justify-between gap-3">
              <span className="text-xs text-white/75">
                Desde {horaDe(atual.inicio)} · {atual.local === 'sede' ? 'Na sede' : 'Online'}
              </span>
              <button
                type="button"
                onClick={() => void parar()}
                disabled={enviando}
                className="flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-[#5B3FD9] shadow-md transition-transform active:scale-95 disabled:opacity-60"
              >
                <SquareIcon className="size-4 fill-current" /> Parar
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-4">
            <div className="flex gap-2" role="radiogroup" aria-label="Local">
              {(['sede', 'online'] as const).map((opcao) => (
                <button
                  key={opcao}
                  type="button"
                  role="radio"
                  aria-checked={local === opcao}
                  onClick={() => setLocal(opcao)}
                  className={cn(
                    'flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors',
                    local === opcao ? 'bg-white text-[#5B3FD9]' : 'bg-white/15 text-white hover:bg-white/25',
                  )}
                >
                  {opcao === 'sede' ? <BuildingIcon className="size-4" /> : <LaptopIcon className="size-4" />}
                  {opcao === 'sede' ? 'Sede' : 'Online'}
                </button>
              ))}
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="sr-only">O que você vai fazer?</span>
              <input
                value={descricao}
                onChange={(e) => {
                  setDescricao(e.target.value)
                  setErro(null)
                }}
                placeholder="O que você vai fazer?"
                className="h-11 rounded-full border border-white/25 bg-white/12 px-4 text-sm text-white placeholder:text-white/65 focus:border-white focus:outline-none"
                aria-invalid={erro ? true : undefined}
              />
              {erro && <span className="px-2 text-xs font-semibold text-[#FFE1E1]">{erro}</span>}
            </label>
            </div>
            <div className="mt-auto flex items-center justify-between gap-3">
              <span className="text-xs text-white/75">Para sozinho após 10h e vai para revisão do RH.</span>
              <button
                type="button"
                onClick={() => void iniciar()}
                disabled={enviando}
                className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-[#5B3FD9] shadow-md transition-transform active:scale-95 disabled:opacity-60"
              >
                <PlayIcon className="size-4 fill-current" /> Iniciar
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
