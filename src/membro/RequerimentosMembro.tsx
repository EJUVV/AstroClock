import { lazy, Suspense, useState } from 'react'
import { FileTextIcon, PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { enviarRequerimento, meusRequerimentos } from '@/compartilhado/api/requerimentos'
import { Carregavel, useCarregar } from '@/compartilhado/ui/demo'
import { Button } from '@/compartilhado/ui/shadcn/button'
import { Skeleton } from '@/compartilhado/ui/shadcn/skeleton'
import { ItemRequerimento } from '@/compartilhado/ui/ItemRequerimento'

// O formulário traz o calendário e o date-fns (cerca de 70 kB): só é baixado na primeira vez que abre.
const FormRequerimento = lazy(() => import('./FormRequerimento').then((m) => ({ default: m.FormRequerimento })))

function RequerimentosMembro() {
  const [versao, setVersao] = useState(0)
  const carga = useCarregar(() => meusRequerimentos(), [versao])
  const [aberto, setAberto] = useState(false)
  // Depois de aberto uma vez, o formulário fica montado, para a animação de fechar funcionar.
  const [jaAbriu, setJaAbriu] = useState(false)
  function abrir() {
    setJaAbriu(true)
    setAberto(true)
  }

  return (
    <>
      {/* No computador, o título já aparece no topo do painel. */}
      <div className="flex items-end justify-between gap-3 lg:justify-end">
        <div className="lg:hidden">
          <h1 className="text-2xl font-bold tracking-tight">Requerimentos</h1>
          <p className="text-sm text-muted-foreground">Peça para ficar só remoto ou ausente.</p>
        </div>
        <Button onClick={abrir}>
          <PlusIcon data-icon="inline-start" /> Novo
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-[20px] border bg-card p-4">
          <p className="font-semibold">Só remoto</p>
          <p className="text-xs text-muted-foreground">Sem exigência de sede; o total continua (10h).</p>
        </div>
        <div className="rounded-[20px] border bg-card p-4">
          <p className="font-semibold">Ausência total</p>
          <p className="text-xs text-muted-foreground">A semana é dispensada e não conta na meta.</p>
        </div>
      </div>

      <Carregavel
        carga={carga}
        esqueleto={
          <div className="flex flex-col gap-3">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-28 rounded-[20px]" />
            ))}
          </div>
        }
        vazio={{
          titulo: 'Você ainda não fez nenhum requerimento',
          descricao: 'Se algo na semana te impede de ir à sede ou de trabalhar, avise o RH por aqui.',
          acao: (
            <Button onClick={abrir}>
              <FileTextIcon data-icon="inline-start" /> Fazer requerimento
            </Button>
          ),
        }}
        ehVazio={(d) => d.length === 0}
      >
        {(lista) => (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {lista.map((q) => (
              <ItemRequerimento key={q.id} requerimento={q} />
            ))}
          </ul>
        )}
      </Carregavel>

      <p className="text-sm text-muted-foreground">Você recebe um e-mail quando o diretor do RH responder. Se ele reprovar, o e-mail traz o motivo.</p>

      {jaAbriu && (
        <Suspense fallback={null}>
          <FormRequerimento
            aberto={aberto}
            onAbertoChange={setAberto}
            onEnviar={async (dados) => {
              await enviarRequerimento(dados)
              toast.success('Requerimento enviado', { description: 'O RH foi avisado por e-mail.' })
              setVersao((v) => v + 1)
            }}
          />
        </Suspense>
      )}
    </>
  )
}

export default RequerimentosMembro
