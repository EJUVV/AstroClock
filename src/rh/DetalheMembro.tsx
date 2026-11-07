import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, MailIcon, PlusIcon } from 'lucide-react'
import { toast } from 'sonner'
import { listarMembros } from '@/compartilhado/api/membros'
import {
  buscarRegistrosDoMembro,
  cancelarRegistroDeMembro,
  criarRegistroDeMembro,
  editarRegistroDeMembro,
  listarRequerimentos,
  progressoDeMembro,
} from '@/compartilhado/api/rh'
import { diaMes, formatarHoras, rotuloSemana, semanaAtual, somarDias } from '@/compartilhado/datas'
import type { NovoRegistro, Registro } from '@/compartilhado/tipos'
import { AvatarMembro } from '@/compartilhado/ui/AvatarMembro'
import { CapsuleBarChart } from '@/compartilhado/ui/CapsuleBarChart'
import { Carregavel, useCarregar } from '@/compartilhado/ui/demo'
import { EstadoVazio } from '@/compartilhado/ui/EstadoVazio'
import { ReasonDialog } from '@/compartilhado/ui/ReasonDialog'
import { Button } from '@/compartilhado/ui/shadcn/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/compartilhado/ui/shadcn/card'
import { Skeleton } from '@/compartilhado/ui/shadcn/skeleton'
import { StatusPill } from '@/compartilhado/ui/StatusPill'
import { CartaoSemana, situacaoDaSemana } from '@/compartilhado/ui/CartaoSemana'
import { FormRegistro } from '@/compartilhado/ui/FormRegistro'
import { ItemRegistro } from '@/compartilhado/ui/ItemRegistro'
import { ItemRequerimento } from '@/compartilhado/ui/ItemRequerimento'
import { corrigeRegistros, ehDiretor, NOME_PERFIL } from '@/compartilhado/perfis'
import { useSessao } from '@/compartilhado/ui/RotaProtegida'

const SEMANAS = 8

type Acao =
  | { tipo: 'criar'; dados: NovoRegistro }
  | { tipo: 'editar'; registro: Registro; dados: NovoRegistro }
  | { tipo: 'cancelar'; registro: Registro }

function DetalheMembro() {
  const { perfil } = useSessao()
  const podeCorrigir = corrigeRegistros(perfil)
  const veRequerimentosDoMembro = perfil !== 'diretor_setor'
  const { id = '' } = useParams()
  const [semana, setSemana] = useState(semanaAtual())
  const [versao, setVersao] = useState(0)
  const membro = useCarregar(() => listarMembros().then((l) => l.find((m) => m.id === id) ?? null), [id])
  const historico = useCarregar(
    () => Promise.all(Array.from({ length: SEMANAS }, (_, i) => progressoDeMembro(id, somarDias(semanaAtual(), -7 * (SEMANAS - 1 - i))))),
    [id, versao],
  )
  const progresso = useCarregar(() => progressoDeMembro(id, semana), [id, semana, versao])
  const registros = useCarregar(() => buscarRegistrosDoMembro(id, semana), [id, semana, versao])
  const requerimentos = useCarregar(
    () => (veRequerimentosDoMembro ? listarRequerimentos().then((l) => l.filter((q) => q.membroId === id)) : Promise.resolve([])),
    [id, veRequerimentosDoMembro],
  )
  const [formAberto, setFormAberto] = useState(false)
  const [editando, setEditando] = useState<Registro | null>(null)
  const [acao, setAcao] = useState<Acao | null>(null)

  if (membro.status === 'conteudo' && membro.dados === null) {
    return <EstadoVazio titulo="Membro não encontrado" acao={<Button asChild variant="outline"><Link to="/rh/membros">Voltar para membros</Link></Button>} />
  }

  async function confirmar(motivo: string) {
    if (!acao) return
    if (acao.tipo === 'criar') await criarRegistroDeMembro(id, acao.dados, motivo)
    if (acao.tipo === 'editar') await editarRegistroDeMembro(acao.registro.id, acao.dados, motivo)
    if (acao.tipo === 'cancelar') await cancelarRegistroDeMembro(acao.registro.id, motivo)
    toast.success(acao.tipo === 'cancelar' ? 'Registro cancelado' : 'Registro salvo')
    setVersao((v) => v + 1)
  }

  return (
    <>
      <Button variant="link" size="sm" className="self-start px-0" asChild>
        <Link to="/rh/membros">
          <ArrowLeftIcon data-icon="inline-start" /> Membros
        </Link>
      </Button>

      <Carregavel carga={membro} esqueleto={<Skeleton className="h-28 rounded-[24px]" />}>
        {(m) =>
          m && (
            <Card>
              <CardContent className="flex flex-wrap items-center gap-4">
                <AvatarMembro nome={m.nome} className="size-16 text-lg" />
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-bold">{m.nome}</p>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MailIcon className="size-3.5" /> {m.email}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill tom="roxo">{m.setor}</StatusPill>
                  <StatusPill tom="neutro">{NOME_PERFIL[m.perfil]}</StatusPill>
                  {m.ativo ? <StatusPill tom="sucesso">Ativo</StatusPill> : <StatusPill tom="neutro">Desativado</StatusPill>}
                </div>
              </CardContent>
            </Card>
          )
        }
      </Carregavel>

      {membro.status === 'conteudo' && membro.dados && ehDiretor(membro.dados.perfil) ? (
        <EstadoVazio titulo="Diretores não contabilizam horas" descricao="Esta pessoa não tem meta e fica fora do ranking e das métricas." />
      ) : (
      <>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Últimas {SEMANAS} semanas</CardTitle>
            <CardDescription>Horas na sede e online. Semanas abaixo da meta aparecem hachuradas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Carregavel carga={historico} esqueleto={<Skeleton className="h-56 rounded-2xl" />}>
              {(semanas) => (
                <CapsuleBarChart
                  altura={200}
                  dias={semanas.map((p) => {
                    const s = situacaoDaSemana(p)
                    const falta = Math.max(p.metaSede - p.horasSede, 0) > 0 ? `−${formatarHoras(p.metaSede - p.horasSede)} sede` : `−${formatarHoras(Math.max(p.metaTotal - p.horasTotal, 0))} total`
                    return {
                      rotulo: diaMes(p.semana),
                      sede: p.horasSede,
                      online: Math.max(0, p.horasTotal - p.horasSede),
                      ativo: p.semana === semana,
                      balao: s === 'naoCumpriu' ? falta : s === 'dispensada' ? 'Dispensada' : undefined,
                      hachura: s === 'naoCumpriu',
                    }
                  })}
                />
              )}
            </Carregavel>
          </CardContent>
        </Card>
        <Carregavel carga={progresso} esqueleto={<Skeleton className="h-64 rounded-[24px]" />}>
          {(p) => <CartaoSemana progresso={p} titulo={semana === semanaAtual() ? 'Esta semana' : 'Semana'} />}
        </Carregavel>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registros</CardTitle>
          <CardDescription className="max-sm:col-span-full max-sm:row-start-2">
            {podeCorrigir
              ? 'O RH pode editar, cancelar e lançar horas de qualquer data. Toda alteração pede um motivo.'
              : 'Você vê os registros, mas só o RH corrige.'}
          </CardDescription>
          {/* No celular, o seletor de semana e o botão descem para uma linha própria, abaixo do texto. */}
          <CardAction className="col-span-full col-start-1 row-span-1 row-start-3 mt-2 flex flex-wrap items-center gap-2 justify-self-start sm:col-span-1 sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-0 sm:justify-self-end">
            <div className="flex items-center gap-1 rounded-full border p-1">
              <Button variant="ghost" size="icon-sm" aria-label="Semana anterior" onClick={() => setSemana(somarDias(semana, -7))}>
                <ChevronLeftIcon />
              </Button>
              <span className="px-1 text-xs font-semibold whitespace-nowrap">{rotuloSemana(semana)}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Próxima semana"
                disabled={semana === semanaAtual()}
                onClick={() => setSemana(somarDias(semana, 7))}
              >
                <ChevronRightIcon />
              </Button>
            </div>
            {podeCorrigir && (
              <Button
                size="sm"
                onClick={() => {
                  setEditando(null)
                  setFormAberto(true)
                }}
              >
                <PlusIcon data-icon="inline-start" /> Lançar horas
              </Button>
            )}
          </CardAction>
        </CardHeader>
        <CardContent>
          <Carregavel
            carga={registros}
            esqueleto={<Skeleton className="h-40 rounded-2xl" />}
            vazio={{ titulo: 'Nenhum registro nesta semana' }}
            ehVazio={(d) => d.length === 0}
          >
            {(lista) => (
              <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {lista.map((r) => (
                  <ItemRegistro
                    key={r.id}
                    registro={r}
                    onEditar={
                      podeCorrigir
                        ? () => {
                            setEditando(r)
                            setFormAberto(true)
                          }
                        : undefined
                    }
                    onCancelar={podeCorrigir ? () => setAcao({ tipo: 'cancelar', registro: r }) : undefined}
                  />
                ))}
              </ul>
            )}
          </Carregavel>
        </CardContent>
      </Card>

      {veRequerimentosDoMembro && (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Requerimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Carregavel
            carga={requerimentos}
            esqueleto={<Skeleton className="h-28 rounded-2xl" />}
            vazio={{ titulo: 'Nenhum requerimento' }}
            ehVazio={(d) => d.length === 0}
          >
            {(lista) => (
              <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {lista.map((q) => (
                  <ItemRequerimento key={q.id} requerimento={q} />
                ))}
              </ul>
            )}
          </Carregavel>
        </CardContent>
      </Card>
      )}
      </>
      )}

      <FormRegistro
        aberto={formAberto}
        onAbertoChange={setFormAberto}
        editando={editando}
        limiteDias={null}
        onSalvar={async (dados) => {
          setAcao(editando ? { tipo: 'editar', registro: editando, dados } : { tipo: 'criar', dados })
        }}
      />

      <ReasonDialog
        aberto={acao !== null}
        onAbertoChange={(a) => !a && setAcao(null)}
        titulo={acao?.tipo === 'cancelar' ? 'Cancelar registro' : acao?.tipo === 'editar' ? 'Salvar alteração' : 'Lançar horas'}
        descricao="Informe por que o RH está fazendo esta alteração."
        confirmar={acao?.tipo === 'cancelar' ? 'Cancelar registro' : 'Salvar'}
        perigoso={acao?.tipo === 'cancelar'}
        onConfirmar={confirmar}
      />
    </>
  )
}

export default DetalheMembro
