import { useState } from 'react'
import { CheckIcon, ExternalLinkIcon, HouseIcon, InfoIcon, LockIcon, PaperclipIcon, PlaneIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { listarMembros } from '@/compartilhado/api/membros'
import { linkDoAnexo } from '@/compartilhado/api/requerimentos'
import { listarRequerimentos, responderRequerimento } from '@/compartilhado/api/rh'
import { diaMes, rotuloSemana, segundaDaSemana, somarDias } from '@/compartilhado/datas'
import type { Membro, Requerimento } from '@/compartilhado/tipos'
import { AvatarMembro } from '@/compartilhado/ui/AvatarMembro'
import { ConfirmDialog } from '@/compartilhado/ui/ConfirmDialog'
import { veRequerimentos } from '@/compartilhado/perfis'
import { Carregavel, useCarregar } from '@/compartilhado/ui/demo'
import { EstadoVazio } from '@/compartilhado/ui/EstadoVazio'
import { NOME_TIPO, PilulaRequerimento } from '@/compartilhado/ui/ItemRequerimento'
import { ReasonDialog } from '@/compartilhado/ui/ReasonDialog'
import { useSessao } from '@/compartilhado/ui/RotaProtegida'
import { Button } from '@/compartilhado/ui/shadcn/button'
import { Card, CardContent } from '@/compartilhado/ui/shadcn/card'
import { Skeleton } from '@/compartilhado/ui/shadcn/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/compartilhado/ui/shadcn/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/compartilhado/ui/shadcn/tabs'
import { StatusPill } from '@/compartilhado/ui/StatusPill'

// Cada semana tocada pelo requerimento vale inteira.
function semanasAfetadas(q: Requerimento): string[] {
  const lista: string[] = []
  for (let s = segundaDaSemana(q.inicio); s <= segundaDaSemana(q.fim); s = somarDias(s, 7)) lista.push(s)
  return lista
}

async function abrirAnexo(id: string) {
  try {
    window.open(await linkDoAnexo(id), '_blank', 'noopener')
  } catch (e) {
    toast.error((e as Error).message)
  }
}

function CartaoPendente({
  q,
  membro,
  podeResponder,
  onResponder,
}: {
  q: Requerimento
  membro?: Membro
  podeResponder: boolean
  onResponder: (aprovar: boolean) => void
}) {
  const Icone = q.tipo === 'so_remoto' ? HouseIcon : PlaneIcon
  const semanas = semanasAfetadas(q)
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <AvatarMembro nome={q.nomeMembro} className="size-11" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{q.nomeMembro}</p>
            <p className="text-xs text-muted-foreground">
              {membro?.setor ?? '–'} · enviado em {new Date(q.criadoEm).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <StatusPill tom="roxo">
            <Icone /> {NOME_TIPO[q.tipo]}
          </StatusPill>
        </div>
        <div className="grid grid-cols-1 gap-3 rounded-[20px] bg-muted p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Datas</p>
            <p className="font-semibold">{q.inicio === q.fim ? diaMes(q.inicio) : `${diaMes(q.inicio)} a ${diaMes(q.fim)}`}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Semanas afetadas (inteiras)</p>
            <p className="font-semibold">{semanas.map(rotuloSemana).join(' · ')}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">Motivo</p>
            <p>{q.motivo}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {q.anexoNome ? (
            <Button variant="outline" size="sm" onClick={() => void abrirAnexo(q.id)}>
              <PaperclipIcon data-icon="inline-start" /> {q.anexoNome} <ExternalLinkIcon data-icon="inline-end" />
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">Sem anexo</span>
          )}
          {podeResponder ? (
            <div className="ml-auto flex gap-2">
              <Button variant="destructive" onClick={() => onResponder(false)}>
                <XIcon data-icon="inline-start" /> Reprovar
              </Button>
              <Button onClick={() => onResponder(true)}>
                <CheckIcon data-icon="inline-start" /> Aprovar
              </Button>
            </div>
          ) : (
            <span className="ml-auto text-xs text-muted-foreground">Aguardando o diretor do RH</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function RequerimentosRH() {
  const { perfil } = useSessao()
  const podeResponder = perfil === 'diretor_rh'
  const [versao, setVersao] = useState(0)
  const carga = useCarregar(() => Promise.all([listarRequerimentos(), listarMembros()]), [versao])
  const [respondendo, setRespondendo] = useState<{ q: Requerimento; aprovar: boolean } | null>(null)

  // Os anexos podem ter dado de saúde: o diretor de setor não vê os requerimentos.
  if (!veRequerimentos(perfil)) {
    return <EstadoVazio icone={LockIcon} titulo="Você não vê os requerimentos" descricao="Só o RH e a presidência acompanham os pedidos de ausência." />
  }

  return (
    <>
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <InfoIcon className="mt-0.5 size-4 shrink-0" />
        {podeResponder
          ? 'O membro recebe um e-mail com a resposta. A reprovação pede um motivo, que vai no e-mail. Ao aprovar, o anexo é apagado.'
          : 'Só o diretor do RH aprova ou reprova. Você pode acompanhar os pedidos aqui.'}
      </p>
      <Carregavel carga={carga} esqueleto={<Skeleton className="h-96 rounded-[24px]" />}>
        {([lista, membros]) => {
          const porId = new Map(membros.map((m) => [m.id, m]))
          const pendentes = lista.filter((q) => q.situacao === 'pendente')
          const respondidos = lista.filter((q) => q.situacao !== 'pendente')
          return (
            <Tabs defaultValue="pendentes" className="gap-4">
              <TabsList>
                <TabsTrigger value="pendentes">Pendentes ({pendentes.length})</TabsTrigger>
                <TabsTrigger value="respondidos">Respondidos ({respondidos.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="pendentes">
                {pendentes.length === 0 ? (
                  <Card>
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhum requerimento esperando resposta.</CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {pendentes.map((q) => (
                      <CartaoPendente
                        key={q.id}
                        q={q}
                        membro={porId.get(q.membroId)}
                        podeResponder={podeResponder}
                        onResponder={(aprovar) => setRespondendo({ q, aprovar })}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="respondidos">
                <Card>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Membro</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Datas</TableHead>
                          <TableHead className="hidden lg:table-cell">Motivo</TableHead>
                          <TableHead>Resposta</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {respondidos.map((q) => (
                          <TableRow key={q.id}>
                            <TableCell>
                              <span className="flex items-center gap-3">
                                <AvatarMembro nome={q.nomeMembro} className="size-8" />
                                <span className="font-semibold">{q.nomeMembro}</span>
                              </span>
                            </TableCell>
                            <TableCell>{NOME_TIPO[q.tipo]}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {diaMes(q.inicio)} a {diaMes(q.fim)}
                            </TableCell>
                            <TableCell className="hidden max-w-80 truncate text-muted-foreground lg:table-cell">{q.motivo}</TableCell>
                            <TableCell>
                              <span className="flex flex-col items-start gap-1">
                                <PilulaRequerimento situacao={q.situacao} />
                                {q.motivoResposta && <span className="max-w-60 truncate text-xs text-muted-foreground">{q.motivoResposta}</span>}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )
        }}
      </Carregavel>

      <ConfirmDialog
        aberto={respondendo?.aprovar === true}
        onAbertoChange={(a) => !a && setRespondendo(null)}
        titulo="Aprovar requerimento?"
        descricao={
          respondendo?.q.tipo === 'so_remoto'
            ? `A exigência de sede some nas semanas afetadas de ${respondendo.q.nomeMembro}. O total continua. Ele recebe um e-mail e o anexo é apagado.`
            : `As semanas afetadas de ${respondendo?.q.nomeMembro} ficam dispensadas e fora do cálculo. Ele recebe um e-mail e o anexo é apagado.`
        }
        confirmar="Aprovar"
        onConfirmar={async () => {
          if (!respondendo) return
          try {
            await responderRequerimento(respondendo.q.id, true)
            toast.success('Requerimento aprovado', { description: 'O membro vai receber um e-mail.' })
            setVersao((v) => v + 1)
          } catch (e) {
            toast.error((e as Error).message)
          }
        }}
      />

      <ReasonDialog
        aberto={respondendo?.aprovar === false}
        onAbertoChange={(a) => !a && setRespondendo(null)}
        titulo="Reprovar requerimento"
        descricao="A meta continua a mesma para este membro. O motivo vai no e-mail que ele recebe."
        confirmar="Reprovar"
        perigoso
        onConfirmar={async (motivo) => {
          if (!respondendo) return
          await responderRequerimento(respondendo.q.id, false, motivo)
          toast.success('Requerimento reprovado', { description: 'O membro vai receber um e-mail com o motivo.' })
          setVersao((v) => v + 1)
        }}
      />
    </>
  )
}

export default RequerimentosRH
