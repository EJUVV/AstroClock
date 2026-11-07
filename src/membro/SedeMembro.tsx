import { useLocation } from 'react-router-dom'
import { MapPinIcon, MapPinOffIcon } from 'lucide-react'
import { quemEstaNaSede } from '@/compartilhado/api/presenca'
import { horaDe } from '@/compartilhado/datas'
import { AvatarMembro } from '@/compartilhado/ui/AvatarMembro'
import { Carregavel, useCarregar } from '@/compartilhado/ui/demo'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/compartilhado/ui/shadcn/card'
import { Skeleton } from '@/compartilhado/ui/shadcn/skeleton'
import { usePresenca } from './usePresenca'

function SedeMembro() {
  const { naSede, enviando, alternar } = usePresenca()
  const carga = useCarregar(() => quemEstaNaSede(), [naSede])
  // No painel do RH, o topo já mostra o título em todos os tamanhos de tela.
  const noPainelRH = useLocation().pathname.startsWith('/rh')

  return (
    <>
      <div className={noPainelRH ? 'hidden' : 'lg:hidden'}>
        <h1 className="text-2xl font-bold tracking-tight">Sede</h1>
        <p className="text-sm text-muted-foreground">Veja quem está lá agora e avise quando você chegar.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr] lg:items-start">
      <section className="cartao-roxo relative overflow-hidden rounded-[24px] p-5">
        <div className="pointer-events-none absolute -top-16 -right-12 size-48 rounded-full border-[22px] border-white/10" />
        <div className="relative flex flex-col gap-4">
          <div>
            <p className="text-sm text-white/80">Você está</p>
            <p className="text-2xl font-bold">{naSede === null ? '...' : naSede ? 'Na sede' : 'Fora da sede'}</p>
          </div>
          <button
            type="button"
            onClick={() => void alternar()}
            disabled={enviando || naSede === null}
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-white text-sm font-bold text-[#5B3FD9] shadow-md transition-transform active:scale-95 disabled:opacity-60"
          >
            {naSede ? <MapPinOffIcon className="size-4" /> : <MapPinIcon className="size-4" />}
            {naSede ? 'Saí da sede' : 'Estou na sede'}
          </button>
          <p className="text-xs text-white/80">Isto não registra horas. Para contar na meta, use o cronômetro ou lance as horas.</p>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quem está na sede agora</CardTitle>
          {carga.status === 'conteudo' && (
            <CardDescription>
              {carga.dados.length} {carga.dados.length === 1 ? 'pessoa' : 'pessoas'}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <Carregavel
            carga={carga}
            esqueleto={
              <div className="flex flex-col gap-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-14 rounded-2xl" />
                ))}
              </div>
            }
            vazio={{ titulo: 'Ninguém na sede agora', descricao: 'Seja o primeiro a avisar que chegou.' }}
            ehVazio={(d) => d.length === 0}
          >
            {(lista) => (
              <div className="flex flex-col gap-4">
                <div className="flex items-center -space-x-3">
                  {lista.slice(0, 7).map((p) => (
                    <AvatarMembro key={p.membroId} nome={p.nome} className="size-11 ring-3 ring-card" />
                  ))}
                  {lista.length > 7 && (
                    <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground ring-3 ring-card">
                      +{lista.length - 7}
                    </span>
                  )}
                </div>
                <ul className="flex flex-col divide-y">
                  {lista.map((p) => (
                    <li key={p.membroId} className="flex items-center gap-3 py-3">
                      <AvatarMembro nome={p.nome} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{p.nome}</p>
                        <p className="text-xs text-muted-foreground">{p.setor}</p>
                      </div>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        desde {horaDe(p.desde)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Carregavel>
        </CardContent>
      </Card>

      </div>

      <p className="text-sm text-muted-foreground">Esqueceu de avisar que saiu? O sistema desmarca sozinho às 23h.</p>
    </>
  )
}

export default SedeMembro
